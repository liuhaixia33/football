import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'

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
      // Refresh teams list
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
    <View style={{ padding: '16px' }}>
      <Text style={{ fontSize: '14px', color: '#666', marginBottom: '8px',
                     display: 'block' }}>{t('create_team.name')}</Text>
      <Input
        value={name}
        onInput={e => setName(e.detail.value)}
        placeholder='例如：胜利FC'
        style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px',
                 marginBottom: '16px', fontSize: '16px' }}
      />
      <Text style={{ fontSize: '14px', color: '#666', marginBottom: '8px',
                     display: 'block' }}>{t('create_team.desc')}</Text>
      <Input
        value={description}
        onInput={e => setDescription(e.detail.value)}
        placeholder='可选，描述你的球队'
        style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px',
                 marginBottom: '32px', fontSize: '16px' }}
      />
      <Button
        style={{ background: '#4CAF50', color: '#fff', borderRadius: '8px',
                 border: 'none', fontSize: '16px' }}
        loading={loading}
        onClick={submit}
      >
        {t('create_team.submit')}
      </Button>
    </View>
  )
}
