import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
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

export default function CreateTeamPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useT()

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: t('create_team.title') })
  }, [])

  const submit = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入球队名称', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const team = await teamApi.create(name.trim(), description.trim() || undefined)
      useAuthStore.getState().setCurrentTeam(team.id, 'CAPTAIN')
      const { userApi } = await import('../../api/user')
      const profile = await userApi.me()
      useAuthStore.getState().setTeams(profile.teams)
      Taro.showToast({ title: t('create_team.success'), icon: 'success' })
      setTimeout(() => Taro.reLaunch({ url: '/pages/home/index' }), 1000)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '创建失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const labelStyle = {
    fontSize: px(24), fontWeight: '600', color: C.text3,
    marginBottom: px(8), display: 'block',
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
  }
  const inputStyle = {
    border: `1px solid ${C.border}`, borderRadius: px(12),
    padding: `${px(14)} ${px(14)}`,
    fontSize: px(30), background: C.surface2, color: C.text,
  }

  return (
    <View style={{ padding: px(16), background: C.bg, minHeight: '100%' }}>
      <View style={{
        background: C.surface, borderRadius: px(16), padding: px(24),
        border: `1px solid ${C.border}`,
      }}>
        {/* Icon */}
        <View style={{
          width: px(56), height: px(56), borderRadius: px(16),
          background: C.primaryDim, border: `1px solid rgba(0,228,114,0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: px(16),
        }}>
          <Text style={{ fontSize: px(52) }}>⚽</Text>
        </View>

        <Text style={{
          fontSize: px(44), fontWeight: '800', color: C.text, marginBottom: px(6), display: 'block',
          letterSpacing: '-0.01em',
        }}>
          {t('create_team.title')}
        </Text>
        <Text style={{
          fontSize: px(28), color: C.text2, marginBottom: px(28), display: 'block',
        }}>
          创建属于你的球队，邀请好友加入
        </Text>

        <Text style={labelStyle}>{t('create_team.name')}</Text>
        <Input
          value={name}
          onInput={e => setName(e.detail.value)}
          placeholder='例如：胜利FC'
          style={{ ...inputStyle, marginBottom: px(20) }}
        />

        <Text style={labelStyle}>{t('create_team.desc')}</Text>
        <Input
          value={description}
          onInput={e => setDescription(e.detail.value)}
          placeholder='可选，描述你的球队'
          style={{ ...inputStyle, marginBottom: px(36) }}
        />

        <Button
          style={{
            background: C.primary, color: '#0b0f18', borderRadius: px(14),
            border: 'none', fontSize: px(32), fontWeight: '700',
            padding: `${px(14)} 0`,
          }}
          loading={loading}
          onClick={submit}
        >
          {t('create_team.submit')}
        </Button>
      </View>
    </View>
  )
}
