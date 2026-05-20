import { useState, useEffect } from 'react'
import { View, Text, Button, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { groupingApi } from '../../api/grouping'
import type { GroupingRes, GroupDto } from '../../types/api'

const CANVAS_ID = 'grouping-poster'
const W = 375
const PITCH_H = 540
const LINE_C = 'rgba(255,255,255,0.68)'
const GRASS_A = '#1d6030'
const GRASS_B = '#226835'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawPitch(ctx: any) {
  for (let i = 0; i < 8; i++) {
    ctx.setFillStyle(i % 2 === 0 ? GRASS_A : GRASS_B)
    ctx.fillRect(0, (i / 8) * PITCH_H, W, PITCH_H / 8 + 1)
  }

  ctx.setStrokeStyle(LINE_C)
  ctx.setLineWidth(1.5)
  ctx.strokeRect(16, 16, W - 32, PITCH_H - 32)

  ctx.beginPath()
  ctx.moveTo(16, PITCH_H / 2)
  ctx.lineTo(W - 16, PITCH_H / 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(W / 2, PITCH_H / 2, 44, 0, 2 * Math.PI)
  ctx.stroke()

  ctx.setFillStyle(LINE_C)
  ctx.beginPath()
  ctx.arc(W / 2, PITCH_H / 2, 3, 0, 2 * Math.PI)
  ctx.fill()

  const pw = (W - 32) * 0.56
  const penX = (W - pw) / 2
  const penH = PITCH_H * 0.165
  ctx.strokeRect(penX, 16, pw, penH)
  ctx.strokeRect(penX, PITCH_H - 16 - penH, pw, penH)

  const gw = (W - 32) * 0.26
  const goalX = (W - gw) / 2
  const goalH = PITCH_H * 0.075
  ctx.strokeRect(goalX, 16, gw, goalH)
  ctx.strokeRect(goalX, PITCH_H - 16 - goalH, gw, goalH)

  ctx.beginPath(); ctx.arc(W / 2, 16 + penH * 0.72, 2.5, 0, 2 * Math.PI); ctx.fill()
  ctx.beginPath(); ctx.arc(W / 2, PITCH_H - 16 - penH * 0.72, 2.5, 0, 2 * Math.PI); ctx.fill()

  ctx.setLineWidth(1)
  ;[
    [16, 16, 0, Math.PI / 2],
    [W - 16, 16, Math.PI / 2, Math.PI],
    [16, PITCH_H - 16, (3 * Math.PI) / 2, 2 * Math.PI],
    [W - 16, PITCH_H - 16, Math.PI, (3 * Math.PI) / 2],
  ].forEach(([x, y, s, e]) => {
    ctx.beginPath(); ctx.arc(x, y, 10, s, e); ctx.stroke()
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawGroup(ctx: any, group: GroupDto, yTop: number, halfH: number, isTopTeam: boolean, color: string) {
  const members = group.members
  const n = members.length
  const DOT_R = 14

  // Content bounds — keep away from banner and center line
  const contentY1 = isTopTeam ? yTop + 54 : yTop + 22
  const contentY2 = isTopTeam ? yTop + halfH - 22 : yTop + halfH - 54

  const colsPerRow = n <= 3 ? n : n <= 6 ? Math.ceil(n / 2) : n <= 9 ? Math.ceil(n / 3) : 4
  const rows = colsPerRow > 0 ? Math.ceil(n / colsPerRow) : 0

  members.forEach((m, i) => {
    const rowIdx = Math.floor(i / colsPerRow)
    const colIdx = i % colsPerRow
    const totalInRow = Math.min(colsPerRow, n - rowIdx * colsPerRow)
    const xSpacing = W / (totalInRow + 1)
    const x = xSpacing * (colIdx + 1)

    let y: number
    if (rows <= 1) {
      y = (contentY1 + contentY2) / 2
    } else {
      const rowSpacing = (contentY2 - contentY1) / (rows - 1)
      // Top team: row 0 nearest center line (contentY2), last row near goal
      // Bottom team: row 0 nearest center line (contentY1), last row near goal
      y = isTopTeam
        ? contentY2 - rowIdx * rowSpacing
        : contentY1 + rowIdx * rowSpacing
    }

    // Shadow
    ctx.setFillStyle('rgba(0,0,0,0.3)')
    ctx.beginPath(); ctx.arc(x + 1, y + 2, DOT_R, 0, 2 * Math.PI); ctx.fill()

    // Dot
    ctx.setFillStyle(color)
    ctx.beginPath(); ctx.arc(x, y, DOT_R, 0, 2 * Math.PI); ctx.fill()

    // Name inside dot
    const name = m.nickname.length > 4 ? m.nickname.slice(0, 4) : m.nickname
    ctx.setFillStyle('#0a200a')
    ctx.setFontSize(9)
    ctx.setTextAlign('center')
    ctx.fillText(name, x, y + 4)
  })

  // Group name banner
  const bannerY = isTopTeam ? yTop + 14 : yTop + halfH - 46
  ctx.setFillStyle('rgba(0,0,0,0.6)')
  ctx.fillRect(16, bannerY, W - 32, 32)
  ctx.setFillStyle(color)
  ctx.setFontSize(14)
  ctx.setTextAlign('center')
  ctx.fillText(group.name, W / 2, bannerY + 22)
}

export default function GroupingPosterPage() {
  const params = Taro.getCurrentInstance().router?.params ?? {}
  const activityId = Number(params.activityId)
  const title = decodeURIComponent(params.title ?? '')
  const startTime = decodeURIComponent(params.startTime ?? '')
  const location = decodeURIComponent(params.location ?? '')

  const [grouping, setGrouping] = useState<GroupingRes | null>(null)
  const [tempFilePath, setTempFilePath] = useState<string | null>(null)
  const [drawing, setDrawing] = useState(true)

  useEffect(() => {
    groupingApi.getGrouping(activityId)
      .then(res => { setGrouping(res); drawPoster(res) })
      .catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
  }, [activityId])

  function drawPoster(res: GroupingRes) {
    setDrawing(true)
    setTempFilePath(null)

    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx: any = Taro.createCanvasContext(CANVAS_ID)

      drawPitch(ctx)

      const COLORS = ['#4effa8', '#ffd740', '#ff6e40', '#40d4ff']
      const n = res.groups.length
      const halfH = PITCH_H / Math.max(n, 1)

      res.groups.forEach((g, idx) => {
        drawGroup(ctx, g, idx * halfH, halfH, idx === 0, COLORS[idx % COLORS.length])
      })

      // Title overlay (drawn on top of pitch)
      const titleBarH = startTime || location ? 52 : 36
      ctx.setFillStyle('rgba(0,0,0,0.62)')
      ctx.fillRect(0, 0, W, titleBarH)
      ctx.setFillStyle('#ffffff')
      ctx.setFontSize(15)
      ctx.setTextAlign('center')
      ctx.fillText(title || '训练分组', W / 2, 22)
      if (startTime || location) {
        const d = startTime ? new Date(startTime) : null
        const timeStr = d
          ? `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
          : ''
        const infoStr = [timeStr, location].filter(Boolean).join('  ')
        ctx.setFontSize(11)
        ctx.setFillStyle('rgba(255,255,255,0.7)')
        ctx.fillText(infoStr, W / 2, 42)
      }

      ctx.draw(false, () => {
        Taro.canvasToTempFilePath({
          canvasId: CANVAS_ID,
          success: (r) => { setTempFilePath(r.tempFilePath); setDrawing(false) },
          fail: () => { setDrawing(false); Taro.showToast({ title: '生成失败', icon: 'none' }) },
        })
      })
    }, 300)
  }

  async function handleSaveToAlbum() {
    if (!tempFilePath) return
    try {
      await Taro.saveImageToPhotosAlbum({ filePath: tempFilePath })
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
    } catch {
      Taro.showToast({ title: '保存失败，请授权相册权限', icon: 'none' })
    }
  }

  function handleShareToGroup() {
    if (!tempFilePath) return
    Taro.showShareImageMenu({ path: tempFilePath })
  }

  return (
    <View style={{ padding: '16px', background: '#0b0f18', minHeight: '100vh' }}>
      <Text style={{ fontSize: '14px', color: '#7a8ca3', display: 'block', marginBottom: '12px' }}>
        {drawing ? '海报生成中...' : '海报已生成，可保存或分享到微信群。'}
      </Text>
      <Canvas
        canvasId={CANVAS_ID}
        style={{ width: `${W}px`, height: `${PITCH_H}px`, borderRadius: '8px', display: 'block' }}
      />
      {!drawing && tempFilePath && (
        <View style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <Button
            style={{ flex: '1', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px' }}
            onClick={handleSaveToAlbum}
          >保存到相册</Button>
          <Button
            style={{ flex: '1', background: '#07c160', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px' }}
            onClick={handleShareToGroup}
          >分享到群</Button>
        </View>
      )}
      <Button
        style={{ marginTop: '10px', background: 'rgba(255,255,255,0.07)', color: '#7a8ca3',
                 border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '14px' }}
        onClick={() => grouping && drawPoster(grouping)}
      >重新生成</Button>
    </View>
  )
}
