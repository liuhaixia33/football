import { useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { userApi } from '../../api/user'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import { useLangStore } from '../../store/lang'
import type { MyStatsRes, MemberRole } from '../../types/api'

export default function MyPage() {
  const [stats, setStats] = useState<MyStatsRes | null>(null)
  const { nickname, currentTeamId, currentRole, teams, setCurrentTeam, setTeams, clear } = useAuthStore()
  const t = useT()
  const { language, setLanguage } = useLangStore()

  const load = async () => {
    if (!currentTeamId) return
    try {
      const s = await userApi.stats(currentTeamId)
      setStats(s)
    } catch {
      // stats load failure is non-critical
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

  const roleLabel = (role: MemberRole) =>
    role === 'CAPTAIN' ? t('my.captain') : role === 'ADMIN' ? t('my.admin') : t('my.player')

  const logout = () => {
    Taro.showModal({
      title: t('my.logout_title'),
      content: t('my.logout_content'),
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
      Taro.showToast({ title: t('my.leave_captain'), icon: 'none' })
      return
    }
    if (!currentTeamId) return
    Taro.showModal({
      title: t('my.leave_title'),
      content: t('my.leave_content'),
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
          Taro.showToast({ title: e instanceof Error ? e.message : t('common.error'), icon: 'none' })
        }
      }
    })
  }

  const switchLanguage = () => {
    Taro.showActionSheet({
      itemList: [t('my.lang_zh'), t('my.lang_en')],
      success: ({ tapIndex }) => {
        const lang: 'zh' | 'en' = tapIndex === 0 ? 'zh' : 'en'
        setLanguage(lang)
        Taro.setNavigationBarTitle({ title: lang === 'zh' ? '我的' : 'My' })
      },
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
            {roleLabel(currentRole ?? 'PLAYER')}
          </Text>
        </View>
      </View>

      {/* Match stats */}
      {stats && (
        <View style={{ background: '#fff', margin: '12px 16px', borderRadius: '8px',
                       padding: '16px' }}>
          <Text style={{ fontSize: '15px', fontWeight: 'bold', display: 'block',
                         marginBottom: '12px' }}>{t('my.stats')}</Text>
          <View style={{ display: 'flex', textAlign: 'center' }}>
            {[
              { label: t('my.matches'), value: stats.totalMatches, color: '#333' },
              { label: t('my.wins'),    value: stats.wins,         color: '#4CAF50' },
              { label: t('my.draws'),   value: stats.draws,        color: '#FF9800' },
              { label: t('my.losses'),  value: stats.losses,       color: '#f44336' },
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
                       marginBottom: '12px' }}>{t('my.teams')}</Text>
        {teams.map(tm => (
          <View
            key={tm.teamId}
            onClick={() => switchTeam(tm.teamId, tm.role)}
            style={{ display: 'flex', alignItems: 'center', padding: '10px 0',
                     borderBottom: '1px solid #f5f5f5' }}
          >
            <Text style={{ fontSize: '24px', marginRight: '12px' }}>⚽</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: '14px', display: 'block' }}>{tm.teamName}</Text>
              <Text style={{ fontSize: '12px', color: '#999' }}>{roleLabel(tm.role)}</Text>
            </View>
            {tm.teamId === currentTeamId && (
              <Text style={{ fontSize: '12px', color: '#4CAF50' }}>{t('my.current')}</Text>
            )}
          </View>
        ))}
        <View
          onClick={() => Taro.navigateTo({ url: '/pages/onboard/index' })}
          style={{ textAlign: 'center', padding: '12px 0', color: '#4CAF50', fontSize: '14px' }}
        >
          {t('my.join_create')}
        </View>
      </View>

      {/* Language switcher */}
      <View
        onClick={switchLanguage}
        style={{ background: '#fff', margin: '0 16px 12px', borderRadius: '8px',
                 padding: '14px 16px', display: 'flex', alignItems: 'center' }}
      >
        <Text style={{ flex: 1, fontSize: '14px' }}>{t('my.language')}</Text>
        <Text style={{ fontSize: '14px', color: '#999' }}>
          {language === 'zh' ? t('my.lang_zh') : t('my.lang_en')} ›
        </Text>
      </View>

      {/* Action buttons */}
      <View style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Button
          style={{ background: '#fff', color: '#f44336', border: '1px solid #fecaca',
                   borderRadius: '8px', fontSize: '14px' }}
          onClick={leaveTeam}
        >
          {t('my.leave')}
        </Button>
        <Button
          style={{ background: '#f5f5f5', color: '#999', border: 'none',
                   borderRadius: '8px', fontSize: '14px' }}
          onClick={logout}
        >
          {t('my.logout')}
        </Button>
      </View>
    </View>
  )
}
