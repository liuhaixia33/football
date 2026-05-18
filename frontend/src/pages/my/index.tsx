import { useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { userApi } from '../../api/user'
import { useAuthStore } from '../../store/auth'
import type { MyStatsRes, MemberRole } from '../../types/api'

export default function MyPage() {
  const [stats, setStats] = useState<MyStatsRes | null>(null)
  const { nickname, currentTeamId, currentRole, teams, setCurrentTeam, setTeams, clear } = useAuthStore()

  const load = async () => {
    if (!currentTeamId) return
    try {
      const s = await userApi.stats(currentTeamId)
      setStats(s)
    } catch {
      // stats load failure is non-critical, silently ignore
    }
    try {
      const profile = await userApi.me()
      setTeams(profile.teams)
    } catch {
      // profile refresh failure is non-critical
    }
  }

  useDidShow(load)

  const switchTeam = (teamId: number, role: MemberRole) => {
    setCurrentTeam(teamId, role)
    Taro.reLaunch({ url: '/pages/home/index' })
  }

  const logout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: ({ confirm }) => {
        if (confirm) {
          clear()
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      }
    })
  }

  const leaveTeam = () => {
    if (currentRole === 'CAPTAIN') {
      Taro.showToast({ title: '队长请先转让队长身份', icon: 'none' })
      return
    }
    if (!currentTeamId) return
    Taro.showModal({
      title: '退出球队',
      content: '确定要退出当前球队吗？',
      success: async ({ confirm }) => {
        if (!confirm) return
        try {
          const { teamApi } = await import('../../api/team')
          await teamApi.leave(currentTeamId)
          Taro.showToast({ title: '已退出球队', icon: 'success' })
          setTimeout(() => {
            clear()
            Taro.reLaunch({ url: '/pages/login/index' })
          }, 1000)
        } catch (e: unknown) {
          Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
        }
      }
    })
  }

  return (
    <View style={{ height: '100vh', overflow: 'auto' }}>
      {/* Profile header */}
      <View style={{ background: '#4CAF50', padding: '32px 16px 24px',
                     display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Text style={{ fontSize: '56px' }}>👤</Text>
        <View>
          <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', display: 'block' }}>
            {nickname ?? '球员'}
          </Text>
          <Text style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)' }}>
            {currentRole === 'CAPTAIN' ? '队长' :
             currentRole === 'ADMIN' ? '管理员' : '队员'}
          </Text>
        </View>
      </View>

      {/* Match stats */}
      {stats && (
        <View style={{ background: '#fff', margin: '12px 16px', borderRadius: '8px',
                       padding: '16px' }}>
          <Text style={{ fontSize: '15px', fontWeight: 'bold', display: 'block',
                         marginBottom: '12px' }}>本队战绩</Text>
          <View style={{ display: 'flex', textAlign: 'center' }}>
            {[
              { label: '场数', value: stats.totalMatches, color: '#333' },
              { label: '胜', value: stats.wins, color: '#4CAF50' },
              { label: '平', value: stats.draws, color: '#FF9800' },
              { label: '负', value: stats.losses, color: '#f44336' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1 }}>
                <Text style={{ fontSize: '24px', fontWeight: 'bold', color: s.color,
                               display: 'block' }}>
                  {s.value}
                </Text>
                <Text style={{ fontSize: '12px', color: '#999' }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Team list */}
      <View style={{ background: '#fff', margin: '0 16px 12px', borderRadius: '8px',
                     padding: '16px' }}>
        <Text style={{ fontSize: '15px', fontWeight: 'bold', display: 'block',
                       marginBottom: '12px' }}>我的球队</Text>
        {teams.map(t => (
          <View
            key={t.teamId}
            onClick={() => switchTeam(t.teamId, t.role)}
            style={{ display: 'flex', alignItems: 'center', padding: '10px 0',
                     borderBottom: '1px solid #f5f5f5' }}
          >
            <Text style={{ fontSize: '24px', marginRight: '12px' }}>⚽</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: '14px', display: 'block' }}>{t.teamName}</Text>
              <Text style={{ fontSize: '12px', color: '#999' }}>
                {t.role === 'CAPTAIN' ? '队长' : t.role === 'ADMIN' ? '管理员' : '队员'}
              </Text>
            </View>
            {t.teamId === currentTeamId && (
              <Text style={{ fontSize: '12px', color: '#4CAF50' }}>当前</Text>
            )}
          </View>
        ))}
        <View
          onClick={() => Taro.navigateTo({ url: '/pages/onboard/index' })}
          style={{ textAlign: 'center', padding: '12px 0', color: '#4CAF50', fontSize: '14px' }}
        >
          + 加入或创建新球队
        </View>
      </View>

      {/* Action buttons */}
      <View style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Button
          style={{ background: '#fff', color: '#f44336', border: '1px solid #fecaca',
                   borderRadius: '8px', fontSize: '14px' }}
          onClick={leaveTeam}
        >
          退出当前球队
        </Button>
        <Button
          style={{ background: '#f5f5f5', color: '#999', border: 'none',
                   borderRadius: '8px', fontSize: '14px' }}
          onClick={logout}
        >
          退出登录
        </Button>
      </View>
    </View>
  )
}
