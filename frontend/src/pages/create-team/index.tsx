import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
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

  return (
    <View style={{ padding: px(16), background: C.bg, minHeight: '100%' }}>
      <View style={{
        background: C.surface, borderRadius: px(16), padding: px(24),
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <Text style={{
          fontSize: px(18), fontWeight: '700', color: C.text, marginBottom: px(8), display: 'block',
        }}>
          {t('create_team.title')}
        </Text>
        <Text style={{
          fontSize: px(13), color: C.text3, marginBottom: px(20), display: 'block',
        }}>
          创建属于你的球队，邀请好友加入
        </Text>

        <Text style={{
          fontSize: px(13), fontWeight: '500', color: C.text2, marginBottom: px(8), display: 'block',
        }}>
          {t('create_team.name')}
        </Text>
        <Input
          value={name}
          onInput={e => setName(e.detail.value)}
          placeholder='例如：胜利FC'
          style={{
            border: '1.5px solid #e5e7eb', borderRadius: px(12), padding: '12px 14px',
            marginBottom: px(16), fontSize: px(15), background: C.bg, color: C.text,
          }}
        />

        <Text style={{
          fontSize: px(13), fontWeight: '500', color: C.text2, marginBottom: px(8), display: 'block',
        }}>
          {t('create_team.desc')}
        </Text>
        <Input
          value={description}
          onInput={e => setDescription(e.detail.value)}
          placeholder='可选，描述你的球队'
          style={{
            border: '1.5px solid #e5e7eb', borderRadius: px(12), padding: '12px 14px',
            marginBottom: px(32), fontSize: px(15), background: C.bg, color: C.text,
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
          {t('create_team.submit')}
        </Button>
      </View>
    </View>
  )
}
