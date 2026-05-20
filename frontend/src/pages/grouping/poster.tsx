import { useState, useEffect } from 'react'
import { View, Text, Button, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { groupingApi } from '../../api/grouping'
import type { GroupingRes, GroupDto } from '../../types/api'

const CANVAS_ID = 'grouping-poster'
const W = 375
const HEADER_H = 68   // outside-pitch title area
const PITCH_H = 520
const CANVAS_H = HEADER_H + PITCH_H
const LINE_C = 'rgba(255,255,255,0.68)'
const GRASS_A = '#1d6030'
const GRASS_B = '#226835'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawHeader(ctx: any, title: string, startTime: string, location: string) {
  ctx.setFillStyle('#0d1117')
  ctx.fillRect(0, 0, W, HEADER_H)

  // Thin green accent line at bottom of header
  ctx.setFillStyle('#00e472')
  ctx.fillRect(0, HEADER_H - 2, W, 2)

  ctx.setFillStyle('#ffffff')
  ctx.setFontSize(16)
  ctx.setTextAlign('center')
  ctx.fillText(title || '训练分组', W / 2, 26)

  if (startTime || location) {
    const d = startTime ? new Date(startTime) : null
    const timeStr = d
      ? `${d.getMonth() + 1}月${d.getDate()}日  ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      : ''
    const infoStr = [timeStr, location].filter(Boolean).join('    ')
    ctx.setFontSize(11)
    ctx.setFillStyle('rgba(255,255,255,0.55)')
    ctx.fillText(infoStr, W / 2, 50)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawPitch(ctx: any, yo: number) {
  // Grass stripes
  for (let i = 0; i < 8; i++) {
    ctx.setFillStyle(i % 2 === 0 ? GRASS_A : GRASS_B)
    ctx.fillRect(0, yo + (i / 8) * PITCH_H, W, PITCH_H / 8 + 1)
  }

  ctx.setStrokeStyle(LINE_C)
  ctx.setLineWidth(1.5)
  ctx.strokeRect(16, yo + 16, W - 32, PITCH_H - 32)

  // Center line
  ctx.beginPath()
  ctx.moveTo(16, yo + PITCH_H / 2)
  ctx.lineTo(W - 16, yo + PITCH_H / 2)
  ctx.stroke()

  // Center circle
  ctx.beginPath()
  ctx.arc(W / 2, yo + PITCH_H / 2, 44, 0, 2 * Math.PI)
  ctx.stroke()

  ctx.setFillStyle(LINE_C)
  ctx.beginPath()
  ctx.arc(W / 2, yo + PITCH_H / 2, 3, 0, 2 * Math.PI)
  ctx.fill()

  const pw = (W - 32) * 0.56
  const penX = (W - pw) / 2
  const penH = PITCH_H * 0.165
  ctx.strokeRect(penX, yo + 16, pw, penH)
  ctx.strokeRect(penX, yo + PITCH_H - 16 - penH, pw, penH)

  const gw = (W - 32) * 0.26
  const goalX = (W - gw) / 2
  const goalH = PITCH_H * 0.075
  ctx.strokeRect(goalX, yo + 16, gw, goalH)
  ctx.strokeRect(goalX, yo + PITCH_H - 16 - goalH, gw, goalH)

  ctx.beginPath(); ctx.arc(W / 2, yo + 16 + penH * 0.72, 2.5, 0, 2 * Math.PI); ctx.fill()
  ctx.beginPath(); ctx.arc(W / 2, yo + PITCH_H - 16 - penH * 0.72, 2.5, 0, 2 * Math.PI); ctx.fill()

  ctx.setLineWidth(1)
  ;[
    [16, yo + 16, 0, Math.PI / 2],
    [W - 16, yo + 16, Math.PI / 2, Math.PI],
    [16, yo + PITCH_H - 16, (3 * Math.PI) / 2, 2 * Math.PI],
    [W - 16, yo + PITCH_H - 16, Math.PI, (3 * Math.PI) / 2],
  ].forEach(([x, y, s, e]) => {
    ctx.beginPath(); ctx.arc(x, y, 10, s, e); ctx.stroke()
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawGroupPlayers(ctx: any, group: GroupDto, yo: number, halfH: number, isTopTeam: boolean, color: string) {
  const members = group.members
  const n = members.length
  if (n === 0) return
  const DOT_R = 14

  // Content bounds within this half (leave room for corner labels)
  const contentY1 = isTopTeam ? yo + 46 : yo + 16
  const contentY2 = isTopTeam ? yo + halfH - 16 : yo + halfH - 46

  const colsPerRow = n <= 3 ? n : n <= 6 ? Math.ceil(n / 2) : n <= 9 ? Math.ceil(n / 3) : 4
  const rows = Math.ceil(n / colsPerRow)

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
      // Top team: row 0 nearest center (contentY2), rows go toward goal (up)
      // Bottom team: row 0 nearest center (contentY1), rows go toward goal (down)
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawGroupLabel(ctx: any, group: GroupDto, yo: number, halfH: number, isTopTeam: boolean, color: string) {
  if (isTopTeam) {
    // Top-left corner
    ctx.setFillStyle('rgba(0,0,0,0.55)')
    ctx.fillRect(16, yo + 16, 120, 28)
    ctx.setFillStyle(color)
    ctx.setFontSize(13)
    ctx.setTextAlign('left')
    ctx.fillText(`  ${group.name}`, 20, yo + 35)
  } else {
    // Bottom-right corner
    ctx.setFillStyle('rgba(0,0,0,0.55)')
    ctx.fillRect(W - 136, yo + halfH - 44, 120, 28)
    ctx.setFillStyle(color)
    ctx.setFontSize(13)
    ctx.setTextAlign('right')
    ctx.fillText(`${group.name}  `, W - 20, yo + halfH - 24)
  }
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

      // 1. Header (outside pitch)
      drawHeader(ctx, title, startTime, location)

      // 2. Pitch (starts at HEADER_H)
      drawPitch(ctx, HEADER_H)

      // 3. Players + corner labels per group
      const COLORS = ['#4effa8', '#ffd740', '#ff6e40', '#40d4ff']
      const n = res.groups.length
      const halfH = PITCH_H / Math.max(n, 1)

      res.groups.forEach((g, idx) => {
        const yo = HEADER_H + idx * halfH
        const isTopTeam = idx === 0
        const color = COLORS[idx % COLORS.length]
        drawGroupPlayers(ctx, g, yo, halfH, isTopTeam, color)
        drawGroupLabel(ctx, g, yo, halfH, isTopTeam, color)
      })

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
        style={{ width: `${W}px`, height: `${CANVAS_H}px`, borderRadius: '8px', display: 'block' }}
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
