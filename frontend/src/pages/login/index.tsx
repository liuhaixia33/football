import { useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/auth'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { setAuth, setTeams } = useAuthStore()

  const handleLogin = async () => {
    if (loading) return
    setLoading(true)
    try {
      const { code } = await Taro.login()

      let nickname: string | undefined
      let avatarUrl: string | undefined
      try {
        const profile = await Taro.getUserProfile({ desc: '用于完善队员信息' })
        nickname = profile.userInfo.nickName
        avatarUrl = profile.userInfo.avatarUrl
      } catch {
        // user declined, continue without profile
      }

      const res = await authApi.login(code, nickname, avatarUrl)
      setAuth(res.token, res.userId, res.nickname, avatarUrl ?? '')
      setTeams(res.teams)

      if (res.teams.length === 0) {
        Taro.reLaunch({ url: '/pages/onboard/index' })
      } else if (res.teams.length === 1) {
        const t = res.teams[0]
        useAuthStore.getState().setCurrentTeam(t.teamId, t.role)
        Taro.reLaunch({ url: '/pages/home/index' })
      } else {
        Taro.reLaunch({ url: '/pages/team-select/index' })
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '登录失败，请重试'
      Taro.showToast({ title: msg, icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                   justifyContent: 'center', height: '100vh', background: '#f5f5f5' }}>
      <Text style={{ fontSize: '48px', marginBottom: '16px' }}>⚽</Text>
      <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#333',
                     marginBottom: '8px' }}>足球队管理</Text>
      <Text style={{ fontSize: '14px', color: '#999', marginBottom: '60px' }}>
        管理你的球队，记录每一场比赛
      </Text>
      <Button
        style={{ background: '#4CAF50', color: '#fff', borderRadius: '24px',
                 padding: '12px 48px', fontSize: '16px', border: 'none' }}
        loading={loading}
        onClick={handleLogin}
      >
        微信一键登录
      </Button>
    </View>
  )
}
