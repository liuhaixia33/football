import { useState, useEffect } from 'react'
import { View, Text, Button, Canvas } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'
import type { ActivityDetailRes } from '../../types/api'

const CANVAS_ID = 'activity-poster'
const W = 375
const H = 520
const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawBg(ctx: any) {
  ctx.setFillStyle('#080e09')
  ctx.fillRect(0, 0, W, H)

  // Decorative concentric circles (stadium atmosphere) in title zone
  for (let i = 0; i < 5; i++) {
    ctx.setStrokeStyle(`rgba(34,197,94,${(0.05 - i * 0.008).toFixed(3)})`)
    ctx.setLineWidth(1)
    ctx.beginPath()
    ctx.arc(W / 2, 148, 32 + i * 36, 0, 2 * Math.PI)
    ctx.stroke()
  }

  // Top accent bar
  ctx.setFillStyle('#22c55e')
  ctx.fillRect(0, 0, W, 5)
  // Bottom accent bar
  ctx.fillRect(0, H - 5, W, 5)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawHeader(ctx: any, teamName: string, type: string, startTime: string) {
  ctx.setFillStyle('#0b1a0c')
  ctx.fillRect(0, 5, W, 80)
  ctx.setFillStyle('rgba(34,197,94,0.14)')
  ctx.fillRect(0, 84, W, 1)

  // Team name
  ctx.setFillStyle('rgba(255,255,255,0.85)')
  ctx.setFontSize(15)
  ctx.setTextAlign('left')
  const displayName = teamName.length > 12 ? teamName.slice(0, 12) + '…' : teamName
  ctx.fillText(displayName, 20, 36)

  // Date string below team name
  const d = new Date(startTime)
  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日  周${WEEK_CN[d.getDay()]}`
  ctx.setFillStyle('rgba(255,255,255,0.32)')
  ctx.setFontSize(11)
  ctx.fillText(dateStr, 20, 60)

  // Type badge (right side)
  const isMatch = type === 'MATCH'
  const badgeW = 52
  const badgeX = W - 20 - badgeW
  ctx.setFillStyle(isMatch ? 'rgba(255,183,0,0.15)' : 'rgba(34,197,94,0.14)')
  ctx.fillRect(badgeX, 22, badgeW, 22)
  ctx.setStrokeStyle(isMatch ? 'rgba(255,183,0,0.35)' : 'rgba(34,197,94,0.35)')
  ctx.setLineWidth(1)
  ctx.strokeRect(badgeX, 22, badgeW, 22)
  ctx.setFillStyle(isMatch ? '#ffb700' : '#22c55e')
  ctx.setFontSize(11)
  ctx.setTextAlign('center')
  ctx.fillText(isMatch ? '比  赛' : '训  练', badgeX + badgeW / 2, 37)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawTitle(ctx: any, title: string) {
  ctx.setFillStyle('rgba(255,255,255,0.95)')
  ctx.setTextAlign('center')

  // Adaptive font size + line splitting
  if (title.length <= 8) {
    ctx.setFontSize(title.length <= 5 ? 28 : 24)
    ctx.fillText(title, W / 2, 158)
  } else if (title.length <= 14) {
    ctx.setFontSize(20)
    const half = Math.ceil(title.length / 2)
    ctx.fillText(title.slice(0, half), W / 2, 142)
    ctx.fillText(title.slice(half), W / 2, 168)
  } else {
    ctx.setFontSize(17)
    const lineLen = 14
    const line1 = title.slice(0, lineLen)
    const rest = title.slice(lineLen)
    const line2 = rest.length > lineLen ? rest.slice(0, lineLen - 1) + '…' : rest
    ctx.fillText(line1, W / 2, 136)
    ctx.fillText(line2, W / 2, 160)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawDivider(ctx: any) {
  // Short centered green ornament between title and details
  ctx.setFillStyle('rgba(34,197,94,0.55)')
  ctx.fillRect(W / 2 - 24, 207, 48, 2)
  ctx.beginPath()
  ctx.arc(W / 2, 208, 3.5, 0, 2 * Math.PI)
  ctx.fill()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawDetails(ctx: any, startTime: string, location: string, registeredCount: number) {
  const d = new Date(startTime)
  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`
  const weekStr = `周${WEEK_CN[d.getDay()]}`
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  ctx.setTextAlign('center')

  // Date · weekday · time
  ctx.setFillStyle('rgba(255,255,255,0.72)')
  ctx.setFontSize(14)
  ctx.fillText(`${dateStr}  ${weekStr}  ${timeStr}`, W / 2, 244)

  // Location
  if (location) {
    const loc = location.length > 22 ? location.slice(0, 22) + '…' : location
    ctx.setFillStyle('rgba(255,255,255,0.42)')
    ctx.setFontSize(12)
    ctx.fillText(loc, W / 2, 270)
  }

  // Registration dot + count
  ctx.setFillStyle('rgba(34,197,94,0.8)')
  ctx.beginPath()
  ctx.arc(W / 2 - 46, 290, 3, 0, 2 * Math.PI)
  ctx.fill()
  ctx.setFontSize(12)
  ctx.fillText(`已报名 ${registeredCount} 人`, W / 2 + 4, 294)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawTagline(ctx: any) {
  // Green-tinted band
  ctx.setFillStyle('rgba(34,197,94,0.055)')
  ctx.fillRect(0, 312, W, 108)
  ctx.setFillStyle('rgba(34,197,94,0.18)')
  ctx.fillRect(0, 312, W, 1)
  ctx.fillRect(0, 419, W, 1)

  ctx.setFillStyle('#22c55e')
  ctx.setTextAlign('center')
  ctx.setFontSize(22)
  ctx.fillText('每周一场球', W / 2, 357)
  ctx.fillText('同销万古愁！', W / 2, 397)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawFooter(ctx: any, inviteCode: string) {
  ctx.setFillStyle('#0b1a0c')
  ctx.fillRect(0, 420, W, 95)

  if (!inviteCode) return

  ctx.setTextAlign('center')

  ctx.setFillStyle('rgba(255,255,255,0.28)')
  ctx.setFontSize(10)
  ctx.fillText('球队邀请码', W / 2, 449)

  ctx.setFillStyle('rgba(255,255,255,0.78)')
  ctx.setFontSize(15)
  ctx.fillText(inviteCode, W / 2, 474)

  ctx.setFillStyle('rgba(34,197,94,0.5)')
  ctx.setFontSize(10)
  ctx.fillText('长按转发  邀请朋友加入球队', W / 2, 497)
}

export default function ActivityPosterPage() {
  const params = Taro.getCurrentInstance().router?.params ?? {}
  const activityId = Number(params.activityId)

  const { currentTeamId, currentTeamInviteCode, teams } = useAuthStore()
  const teamName = teams.find(t => t.teamId === currentTeamId)?.teamName ?? '足球队'
  const inviteCode = currentTeamInviteCode()

  const [detail, setDetail] = useState<ActivityDetailRes | null>(null)
  const [tempFilePath, setTempFilePath] = useState<string | null>(null)
  const [drawing, setDrawing] = useState(true)

  useShareAppMessage(() => ({
    title: detail?.activity.title ?? '球队活动',
    path: `/pages/activity-detail/index?id=${activityId}&teamId=${currentTeamId}&inviteCode=${inviteCode}`,
  }))

  useDidShow(() => {
    Taro.showShareMenu({ withShareTicket: false, showShareItems: ['shareAppMessage'] })
  })

  useEffect(() => {
    if (!activityId) return
    activityApi.detail(activityId)
      .then(d => { setDetail(d); renderPoster(d) })
      .catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
  }, [activityId])

  function renderPoster(d: ActivityDetailRes) {
    setDrawing(true)
    setTempFilePath(null)
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx: any = Taro.createCanvasContext(CANVAS_ID)
      drawBg(ctx)
      drawHeader(ctx, teamName, d.activity.type, d.activity.startTime)
      drawTitle(ctx, d.activity.title)
      drawDivider(ctx)
      drawDetails(ctx, d.activity.startTime, d.activity.location, d.activity.registeredCount)
      drawTagline(ctx)
      drawFooter(ctx, inviteCode)
      ctx.draw(false, () => {
        Taro.canvasToTempFilePath({
          canvasId: CANVAS_ID,
          success: r => { setTempFilePath(r.tempFilePath); setDrawing(false) },
          fail: () => { setDrawing(false); Taro.showToast({ title: '生成失败', icon: 'none' }) },
        })
      })
    }, 300)
  }

  async function handleSave() {
    if (!tempFilePath) return
    try {
      await Taro.saveImageToPhotosAlbum({ filePath: tempFilePath })
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
    } catch {
      Taro.showToast({ title: '保存失败，请授权相册权限', icon: 'none' })
    }
  }

  function handleShare() {
    if (!tempFilePath) return
    Taro.showShareImageMenu({ path: tempFilePath })
  }

  return (
    <View style={{ padding: '16px', background: '#0f1010', minHeight: '100vh' }}>
      <Text style={{ fontSize: '14px', color: '#8a9e8a', display: 'block', marginBottom: '12px' }}>
        {drawing ? '海报生成中...' : '海报已生成，可保存或分享到群。'}
      </Text>

      <Canvas
        canvasId={CANVAS_ID}
        style={{ width: `${W}px`, height: `${H}px`, borderRadius: '10px', display: 'block' }}
      />

      {!drawing && tempFilePath && (
        <View style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <Button
            style={{ flex: '1', background: '#1a2e1a', color: '#4ade80',
                     border: '1px solid rgba(74,222,128,0.25)', borderRadius: '8px', fontSize: '14px' }}
            onClick={handleSave}
          >保存到相册</Button>
          <Button
            style={{ flex: '1', background: '#07c160', color: '#fff',
                     border: 'none', borderRadius: '8px', fontSize: '14px' }}
            onClick={handleShare}
          >分享到群</Button>
        </View>
      )}

      <Button
        style={{ marginTop: '10px', background: 'rgba(255,255,255,0.06)', color: '#8a9e8a',
                 border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '14px' }}
        onClick={() => detail && renderPoster(detail)}
      >重新生成</Button>
    </View>
  )
}
