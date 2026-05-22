import { useState, useEffect } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
import { px } from '../../utils/style'

const C = {
  bg: '#0f1010', surface: '#181c18', border: 'rgba(255,255,255,0.07)',
  text: '#e8ede8', text2: '#8a9e8a', primary: '#22c55e',
}

export default function TeamPosterPage() {
  const [posterUrl, setPosterUrl] = useState('')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { currentTeamId } = useAuthStore()

  const loadPoster = (refresh = false) => {
    if (!currentTeamId) return
    if (refresh) setRefreshing(true); else setLoading(true)
    teamApi.getPoster(currentTeamId, refresh)
      .then(res => setPosterUrl(res.posterUrl))
      .catch(e => Taro.showToast({ title: e.message || '生成失败', icon: 'none' }))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => { loadPoster() }, [currentTeamId])

  const saveToAlbum = async () => {
    if (!posterUrl) return
    setSaving(true)
    try {
      const { tempFilePath } = await Taro.downloadFile({ url: posterUrl })
      await Taro.saveImageToPhotosAlbum({ filePath: tempFilePath })
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '保存失败'
      if (msg.includes('auth deny') || msg.includes('authorize')) {
        Taro.showModal({
          title: '需要相册权限',
          content: '请在设置中开启相册访问权限',
          confirmText: '去设置',
          success: ({ confirm }) => {
            if (confirm) Taro.openSetting()
          },
        })
      } else {
        Taro.showToast({ title: msg, icon: 'none' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ padding: px(20), background: C.bg, minHeight: '100%' }}>
      {loading ? (
        <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: px(600) }}>
          <Text style={{ color: C.text2, fontSize: px(28) }}>生成中…</Text>
        </View>
      ) : posterUrl ? (
        <>
          <Image
            src={posterUrl}
            style={{
              width: '100%', borderRadius: px(16),
              border: `1px solid ${C.border}`, display: 'block',
              marginBottom: px(24),
            }}
            mode='widthFix'
          />
          <Button
            style={{
              background: C.primary, color: '#0f1010',
              borderRadius: px(14), border: 'none',
              fontSize: px(32), fontWeight: '700', padding: `${px(14)} 0`,
              marginBottom: px(12),
            }}
            loading={saving}
            onClick={saveToAlbum}
          >
            保存到相册
          </Button>
          <Button
            style={{
              background: 'rgba(255,255,255,0.06)', color: C.text2,
              borderRadius: px(14), border: 'none',
              fontSize: px(28), fontWeight: '500', padding: `${px(12)} 0`,
            }}
            loading={refreshing}
            onClick={() => loadPoster(true)}
          >
            重新生成（含小程序码）
          </Button>
          <Text style={{ fontSize: px(24), color: C.text2, textAlign: 'center', display: 'block', marginTop: px(16) }}>
            保存后可分享到朋友圈或微信群
          </Text>
        </>
      ) : (
        <Text style={{ color: C.text2, fontSize: px(28), textAlign: 'center', display: 'block', marginTop: px(100) }}>
          生成失败，请返回重试
        </Text>
      )}
    </View>
  )
}
