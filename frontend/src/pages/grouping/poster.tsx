import { useState, useEffect } from 'react'
import { View, Text, Button, Canvas } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { groupingApi } from '../../api/grouping'
import { useAuthStore } from '../../store/auth'
import type { GroupingRes, GroupDto } from '../../types/api'

const CANVAS_ID = 'grouping-poster'
const W = 375
const HEADER_H = 68   // outside-pitch title area
const PITCH_H = 520
const FOOTER_H = 44   // invite code footer
const CANVAS_H = HEADER_H + PITCH_H + FOOTER_H
const LINE_C = 'rgba(255,255,255,0.68)'
const GRASS_A = '#1d6030'
const GRASS_B = '#226835'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawHeader(ctx: any, title: string, startTime: string, location: string) {
  ctx.setFillStyle('#0d1117')
  ctx.fillRect(0, 0, W, HEADER_H)

  // Thin green accent line at bottom of header
  ctx.setFillStyle('#22c55e')
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

// 根据人数返回阵形行分布（从后卫到前锋，第一行始终是守门员）
function getFormation(n: number): number[] {
  const table: Record<number, number[]> = {
    1:  [1],
    2:  [1, 1],
    3:  [1, 2],
    4:  [1, 2, 1],
    5:  [1, 2, 2],
    6:  [1, 2, 2, 1],
    7:  [1, 2, 3, 1],
    8:  [1, 3, 3, 1],
    9:  [1, 3, 3, 2],
    10: [1, 3, 3, 3],
    11: [1, 4, 3, 3],
    12: [1, 4, 4, 3],
    13: [1, 4, 4, 4],
    14: [1, 4, 5, 4],
  }
  if (table[n]) return table[n]
  // 超出预设：GK单独一行，其余每行最多4人
  const rows: number[] = [1]
  let rest = n - 1
  while (rest > 0) { rows.push(Math.min(4, rest)); rest -= Math.min(4, rest) }
  return rows
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawGroupPlayers(ctx: any, group: GroupDto, yo: number, halfH: number, isTopTeam: boolean, color: string) {
  const members = group.members
  const n = members.length
  if (n === 0) return
  const DOT_R = 14

  // 球门侧留边（含角球弧线空间）、中线侧留边（避免双方球员紧贴中线）
  const GOAL_MARGIN   = 38
  const CENTER_MARGIN = 52

  // goalEdge = 靠近本方球门的内容边界，centerEdge = 靠近中线的内容边界
  const goalEdge   = isTopTeam ? yo + GOAL_MARGIN         : yo + halfH - GOAL_MARGIN
  const centerEdge = isTopTeam ? yo + halfH - CENTER_MARGIN : yo + CENTER_MARGIN

  const formation = getFormation(n)
  const numRows = formation.length

  let memberIdx = 0
  formation.forEach((count, rowIdx) => {
    // 行 0 = GK（靠球门），最后一行 = 前锋（靠中线）
    let rowY: number
    if (numRows === 1) {
      rowY = (goalEdge + centerEdge) / 2
    } else {
      const t = rowIdx / (numRows - 1)
      rowY = isTopTeam
        ? goalEdge + t * (centerEdge - goalEdge)   // 顶队：从上到下 GK→前锋
        : goalEdge - t * (goalEdge - centerEdge)   // 底队：从下到上 GK→前锋
    }

    for (let i = 0; i < count && memberIdx < n; i++, memberIdx++) {
      const x = W / (count + 1) * (i + 1)
      const m = members[memberIdx]

      ctx.setFillStyle('rgba(0,0,0,0.3)')
      ctx.beginPath(); ctx.arc(x + 1, rowY + 2, DOT_R, 0, 2 * Math.PI); ctx.fill()

      ctx.setFillStyle(color)
      ctx.beginPath(); ctx.arc(x, rowY, DOT_R, 0, 2 * Math.PI); ctx.fill()

      const name = m.nickname.length > 4 ? m.nickname.slice(0, 4) : m.nickname
      ctx.setFillStyle('#0a200a')
      ctx.setFontSize(9)
      ctx.setTextAlign('center')
      ctx.fillText(name, x, rowY + 4)
    }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawFooter(ctx: any, inviteCode: string) {
  const y = HEADER_H + PITCH_H
  ctx.setFillStyle('#0d1117')
  ctx.fillRect(0, y, W, FOOTER_H)
  ctx.setFillStyle('rgba(255,255,255,0.06)')
  ctx.fillRect(0, y, W, 1)
  if (!inviteCode) return
  ctx.setFillStyle('#22c55e')
  ctx.setFontSize(10)
  ctx.setTextAlign('center')
  ctx.fillText('球队邀请码', W / 2, y + 16)
  ctx.setFillStyle('rgba(255,255,255,0.65)')
  ctx.setFontSize(13)
  ctx.fillText(inviteCode, W / 2, y + 34)
}

export default function GroupingPosterPage() {
  const params = Taro.getCurrentInstance().router?.params ?? {}
  const activityId = Number(params.activityId)
  const title = decodeURIComponent(params.title ?? '')
  const startTime = decodeURIComponent(params.startTime ?? '')
  const location = decodeURIComponent(params.location ?? '')
  const { currentTeamId, currentTeamInviteCode } = useAuthStore()
  const inviteCode = currentTeamInviteCode()

  useShareAppMessage(() => ({
    title: `${title || '训练分组'} | 扫码加入球队`,
    path: `/pages/activity-detail/index?id=${activityId}&teamId=${currentTeamId}&inviteCode=${inviteCode}`,
  }))

  useDidShow(() => {
    Taro.showShareMenu({ withShareTicket: false, showShareItems: ['shareAppMessage'] })
  })

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

      // 4. Footer with invite code
      drawFooter(ctx, inviteCode)

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
    <View style={{ background: '#0f1010', minHeight: '100vh' }}>
      <View style={{ padding: '16px 16px 0' }}>
        <Text style={{ fontSize: '14px', color: '#8a9e8a', display: 'block', marginBottom: '12px' }}>
          {drawing ? '海报生成中...' : '海报已生成，可保存或分享到微信群。'}
        </Text>
      </View>
      <Canvas
        canvasId={CANVAS_ID}
        style={{ width: `${W}px`, height: `${CANVAS_H}px`, borderRadius: '8px', display: 'block' }}
      />
      <View style={{ padding: '0 16px 16px' }}>
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
          style={{ marginTop: '10px', background: 'rgba(255,255,255,0.07)', color: '#8a9e8a',
                   border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '14px' }}
          onClick={() => grouping && drawPoster(grouping)}
        >重新生成</Button>
      </View>
    </View>
  )
}
