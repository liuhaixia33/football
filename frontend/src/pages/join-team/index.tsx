import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useT } from '../../i18n/useT'
import { px } from '../../utils/style'

const C = {
  primary: '#00e472',
  primaryDim: 'rgba(0,228,114,0.12)',
  bg: '#0b0f18',
  surface: '#131a27',
  surface2: '#1a2235',
  border: 'rgba(255,255,255,0.09)',
  text: '#e8f0fb',
  text2: '#7a8ca3',
  text3: '#364a60',
}

export default function JoinTeamPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useT()

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: t('join_team.title') })
  }, [])

  const submit = async () => {
    if (!code.trim()) {
      Taro.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      await teamApi.join(code.trim().toUpperCase())
      Taro.showToast({ title: t('join_team.success'), icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '加入失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ padding: px(20), background: C.bg, minHeight: '100%' }}>
      <View style={{
        background: C.surface, borderRadius: px(20), padding: px(24),
        border: `1px solid ${C.border}`,
      }}>
        {/* Icon */}
        <View style={{
          width: px(56), height: px(56), borderRadius: px(16),
          background: C.primaryDim, border: `1px solid rgba(0,228,114,0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: px(16),
        }}>
          <Text style={{ fontSize: px(52) }}>🔑</Text>
        </View>

        <Text style={{
          fontSize: px(44), fontWeight: '800', color: C.text, marginBottom: px(6), display: 'block',
          letterSpacing: '-0.01em',
        }}>
          {t('join_team.title')}
        </Text>
        <Text style={{
          fontSize: px(28), color: C.text2, marginBottom: px(32), display: 'block',
        }}>
          向球队管理员索取邀请码，输入后即可申请加入
        </Text>

        <Text style={{
          fontSize: px(24), fontWeight: '600', color: C.text3,
          marginBottom: px(10), display: 'block',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {t('join_team.code')}
        </Text>
        <Input
          value={code}
          onInput={e => setCode(e.detail.value)}
          placeholder='请输入 8 位邀请码'
          maxlength={8}
          style={{
            border: `1.5px solid ${code ? 'rgba(0,228,114,0.4)' : C.border}`,
            borderRadius: px(14), padding: `${px(18)} ${px(14)}`,
            marginBottom: px(32), fontSize: px(52), letterSpacing: px(8),
            textAlign: 'center', background: C.surface2, color: C.primary,
            fontWeight: '800',
          }}
        />
        <Button
          style={{
            background: code.trim().length > 0 ? C.primary : 'rgba(255,255,255,0.07)',
            color: code.trim().length > 0 ? '#0b0f18' : C.text3,
            borderRadius: px(14), border: 'none',
            fontSize: px(32), fontWeight: '700', padding: `${px(14)} 0`,
          }}
          loading={loading}
          onClick={submit}
        >
          {t('join_team.submit')}
        </Button>
      </View>
    </View>
  )
}
