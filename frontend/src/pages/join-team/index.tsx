import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { teamApi } from '../../api/team'
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
    <View style={{ padding: px(16), background: C.bg, minHeight: '100%' }}>
      <View style={{
        background: C.surface, borderRadius: px(16), padding: px(24),
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        <Text style={{
          fontSize: px(18), fontWeight: '700', color: C.text, marginBottom: px(8), display: 'block',
        }}>
          {t('join_team.title')}
        </Text>
        <Text style={{
          fontSize: px(13), color: C.text3, marginBottom: px(20), display: 'block',
        }}>
          向球队管理员索取邀请码，输入后即可申请加入
        </Text>

        <Text style={{
          fontSize: px(13), fontWeight: '500', color: C.text2, marginBottom: px(8), display: 'block',
        }}>
          {t('join_team.code')}
        </Text>
        <Input
          value={code}
          onInput={e => setCode(e.detail.value)}
          placeholder='请输入 8 位邀请码'
          maxlength={8}
          style={{
            border: '1.5px solid #e5e7eb', borderRadius: px(12), padding: px(14),
            marginBottom: px(24), fontSize: px(22), letterSpacing: px(6),
            textAlign: 'center', background: C.bg, color: C.text,
            fontWeight: '600',
          }}
        />
        <Button
          style={{
            background: C.primary, color: '#fff', borderRadius: '9999px',
            border: 'none', fontSize: px(16), fontWeight: '600', padding: '10px 0',
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
