import { useState, useEffect } from 'react'
import { View, Text, Button, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { groupingApi } from '../../api/grouping'
import type { GroupingRes } from '../../types/api'

const CANVAS_ID = 'grouping-poster'
const W = 350
const LINE_H = 20

export default function GroupingPosterPage() {
  const params = Taro.getCurrentInstance().router?.params ?? {}
  const activityId = Number(params.activityId)
  const title = decodeURIComponent(params.title ?? '')
  const startTime = decodeURIComponent(params.startTime ?? '')
  const location = decodeURIComponent(params.location ?? '')

  const [grouping, setGrouping] = useState<GroupingRes | null>(null)
  const [canvasH, setCanvasH] = useState(500)

  useEffect(() => {
    groupingApi.getGrouping(activityId)
      .then(res => { setGrouping(res); drawPoster(res) })
      .catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
  }, [activityId])

  function calcHeight(res: GroupingRes) {
    let h = 100 // header + time/location
    res.groups.forEach(g => {
      h += 32 // group name row
      h += Math.ceil(g.members.length / 4) * LINE_H + 10 // member rows
    })
    return Math.max(h + 20, 300)
  }

  function drawPoster(res: GroupingRes) {
    const h = calcHeight(res)
    setCanvasH(h)

    setTimeout(() => {
      const ctx = Taro.createCanvasContext(CANVAS_ID)
      ctx.setFillStyle('#ffffff')
      ctx.fillRect(0, 0, W, h)

      // 顶部绿色条
      ctx.setFillStyle('#4CAF50')
      ctx.fillRect(0, 0, W, 56)
      ctx.setFillStyle('#ffffff')
      ctx.setFontSize(16)
      ctx.setTextAlign('center')
      ctx.fillText(title || '训练分组', W / 2, 34)

      // 时间 & 地点
      ctx.setFillStyle('#333333')
      ctx.setFontSize(12)
      ctx.setTextAlign('left')
      ctx.fillText(`时间：${new Date(startTime).toLocaleString('zh-CN')}`, 14, 74)
      ctx.fillText(`地点：${location}`, 14, 92)

      let y = 110
      res.groups.forEach((g) => {
        // 组名背景
        ctx.setFillStyle('#f0f9f0')
        ctx.fillRect(10, y, W - 20, 26)
        ctx.setFillStyle('#2e7d32')
        ctx.setFontSize(13)
        ctx.setTextAlign('left')
        ctx.fillText(`${g.name}（${g.members.length}人）`, 16, y + 17)
        y += 30

        // 成员名字（每行最多4人）
        ctx.setFillStyle('#555555')
        ctx.setFontSize(12)
        g.members.forEach((m, mi) => {
          const col = mi % 4
          const row = Math.floor(mi / 4)
          ctx.fillText(m.nickname, 14 + col * 82, y + row * LINE_H + 14)
        })
        y += Math.ceil(g.members.length / 4) * LINE_H + 12
      })

      ctx.draw(false, () => {
        Taro.canvasToTempFilePath({
          canvasId: CANVAS_ID,
          success: (res) => {
            Taro.previewImage({ urls: [res.tempFilePath] })
          },
          fail: () => Taro.showToast({ title: '生成失败', icon: 'none' }),
        })
      })
    }, 300)
  }

  return (
    <View style={{ padding: '16px' }}>
      <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '12px' }}>
        海报生成中，请稍候...长按图片可保存或转发到微信群。
      </Text>
      <Canvas
        canvasId={CANVAS_ID}
        style={{ width: `${W}px`, height: `${canvasH}px`, border: '1px solid #e0e0e0', borderRadius: '8px' }}
      />
      <Button
        style={{ marginTop: '16px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '8px' }}
        onClick={() => grouping && drawPoster(grouping)}
      >重新生成</Button>
    </View>
  )
}
