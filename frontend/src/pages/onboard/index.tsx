import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useT } from '../../i18n/useT'
import { px } from '../../utils/style'

const C = {
  primary: '#4CAF50',
  primaryLight: '#f0fdf4',
  surface: '#ffffff',
  bg: '#f9fafb',
  text: '#1f2937',
  text2: '#4b5563',
  text3: '#9ca3af',
}

export default function OnboardPage() {
  const t = useT()
  return (
    <View style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', padding: px(32), background: C.bg,
    }}>
      <View style={{
        background: C.surface, borderRadius: px(20), padding: '40px 32px',
        width: '100%', maxWidth: px(360), textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
      }}>
        <View style={{
          width: px(80), height: px(80), borderRadius: px(20),
          background: C.primaryLight, display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <Text style={{ fontSize: px(40) }}>⚽</Text>
        </View>
        <Text style={{
          fontSize: px(20), fontWeight: '700', color: C.text, marginBottom: px(8), display: 'block',
        }}>
          欢迎加入足球队
        </Text>
        <Text style={{
          fontSize: px(14), color: C.text3, marginBottom: px(32),
          display: 'block', lineHeight: '1.6',
        }}>
          你还没有加入任何球队，创建新球队或通过邀请码加入已有球队
        </Text>
        <Button
          style={{
            background: C.primary, color: '#fff', borderRadius: '9999px',
            width: '100%', marginBottom: px(12), border: 'none',
            fontSize: px(16), fontWeight: '600', padding: '10px 0',
          }}
          onClick={() => Taro.navigateTo({ url: '/pages/create-team/index' })}
        >
          {t('onboard.create')}
        </Button>
        <Button
          style={{
            background: C.surface, color: C.primary, border: `1.5px solid ${C.primary}`,
            borderRadius: '9999px', width: '100%', fontSize: px(16),
            fontWeight: '600', padding: '10px 0',
          }}
          onClick={() => Taro.navigateTo({ url: '/pages/join-team/index' })}
        >
          {t('onboard.join')}
        </Button>
      </View>
    </View>
  )
}
