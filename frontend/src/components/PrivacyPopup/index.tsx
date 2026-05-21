import { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { px } from '../../utils/style'

const AGREED_KEY = 'privacy_agreed'

const C = {
  overlay: 'rgba(0,0,0,0.7)', surface: '#181c18',
  text: '#e8ede8', text2: '#8a9e8a', primary: '#22c55e',
  border: 'rgba(255,255,255,0.09)',
}

export default function PrivacyPopup() {
  const [visible, setVisible] = useState(false)
  const [resolver, setResolver] = useState<((agreed: boolean) => void) | null>(null)

  useEffect(() => {
    const wx = (Taro as unknown as { $global?: { wx?: Record<string, unknown> } }).$global?.wx
    if (!wx || typeof wx['onNeedPrivacyAuthorization'] !== 'function') return

    ;(wx['onNeedPrivacyAuthorization'] as (cb: (resolve: (info: { event: string }) => void) => void) => void)(
      (resolve) => {
        const agreed = Taro.getStorageSync(AGREED_KEY)
        if (agreed) {
          resolve({ event: 'agree' })
          return
        }
        setVisible(true)
        setResolver(() => (agree: boolean) => {
          Taro.setStorageSync(AGREED_KEY, agree ? '1' : '')
          resolve({ event: agree ? 'agree' : 'disagree' })
          setVisible(false)
        })
      }
    )
  }, [])

  if (!visible) return null

  return (
    <View style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: C.overlay, zIndex: 9999,
      display: 'flex', alignItems: 'flex-end',
    }}>
      <View style={{
        backgroundColor: C.surface, borderRadius: `${px(24)} ${px(24)} 0 0`,
        padding: px(32), width: '100%', boxSizing: 'border-box',
        border: `1px solid ${C.border}`,
      }}>
        <Text style={{ fontSize: px(34), fontWeight: '800', color: C.text, display: 'block', marginBottom: px(16) }}>
          用户隐私保护提示
        </Text>
        <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44), display: 'block', marginBottom: px(28) }}>
          感谢您使用「足球队」小程序。在使用前，请阅读并同意我们的
          <Text
            style={{ color: C.primary }}
            onClick={() => Taro.navigateTo({ url: '/pages/privacy/index' })}
          >《隐私政策》</Text>
          ，了解我们如何收集和使用您的信息。
        </Text>
        <View style={{ display: 'flex', gap: px(16) }}>
          <Button
            style={{
              flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', color: C.text2,
              borderRadius: px(12), border: `1px solid ${C.border}`,
              fontSize: px(30), fontWeight: '600',
            }}
            onClick={() => resolver?.(false)}
          >
            不同意
          </Button>
          <Button
            style={{
              flex: 2, backgroundColor: C.primary, color: '#0f1010',
              borderRadius: px(12), border: 'none',
              fontSize: px(30), fontWeight: '700',
            }}
            onClick={() => resolver?.(true)}
          >
            同意并继续
          </Button>
        </View>
      </View>
    </View>
  )
}
