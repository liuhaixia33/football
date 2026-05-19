import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useT } from '../../i18n/useT'
import { px } from '../../utils/style'

const C = {
  primary: '#00e472',
  primaryDim: 'rgba(0,228,114,0.12)',
  bg: '#0b0f18',
  surface: '#131a27',
  surface2: '#1a2235',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8f0fb',
  text2: '#7a8ca3',
  text3: '#364a60',
}

export default function OnboardPage() {
  const t = useT()
  return (
    <View style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', padding: px(24), background: C.bg,
    }}>
      <View style={{
        background: C.surface,
        borderRadius: px(24),
        padding: `${px(40)} ${px(28)}`,
        width: '100%',
        textAlign: 'center',
        border: `1px solid ${C.border}`,
      }}>
        {/* Icon */}
        <View style={{
          width: px(88), height: px(88), borderRadius: '50%',
          background: C.primaryDim,
          border: `2px solid rgba(0,228,114,0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto',
          marginBottom: px(20),
        }}>
          <Text style={{ fontSize: px(80) }}>⚽</Text>
        </View>

        <Text style={{
          fontSize: px(46), fontWeight: '800', color: C.text,
          marginBottom: px(10), display: 'block',
          letterSpacing: '-0.02em',
        }}>
          欢迎加入足球队
        </Text>
        <Text style={{
          fontSize: px(28), color: C.text2, marginBottom: px(36),
          display: 'block', lineHeight: '1.7',
        }}>
          创建新球队或通过邀请码加入已有球队
        </Text>

        <Button
          style={{
            background: C.primary, color: '#0b0f18', borderRadius: px(14),
            width: '100%', marginBottom: px(12), border: 'none',
            fontSize: px(32), fontWeight: '700', padding: `${px(14)} 0`,
          }}
          onClick={() => Taro.navigateTo({ url: '/pages/create-team/index' })}
        >
          {t('onboard.create')}
        </Button>
        <Button
          style={{
            background: 'transparent', color: C.primary,
            border: `1.5px solid rgba(0,228,114,0.4)`,
            borderRadius: px(14), width: '100%', fontSize: px(32),
            fontWeight: '600', padding: `${px(14)} 0`,
          }}
          onClick={() => Taro.navigateTo({ url: '/pages/join-team/index' })}
        >
          {t('onboard.join')}
        </Button>
      </View>
    </View>
  )
}
