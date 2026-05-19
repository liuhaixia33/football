import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/auth'
import type { MemberRole } from '../../types/api'
import { useT } from '../../i18n/useT'

export default function TeamSelectPage() {
  const { teams, setCurrentTeam } = useAuthStore()
  const i18n = useT()

  const select = (teamId: number, role: MemberRole) => {
    setCurrentTeam(teamId, role)
    Taro.reLaunch({ url: '/pages/home/index' })
  }

  return (
    <View style={{ padding: '16px' }}>
      <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px',
                     display: 'block' }}>{i18n('team_select.title')}</Text>
      {teams.map(team => (
        <View
          key={team.teamId}
          onClick={() => select(team.teamId, team.role)}
          style={{ background: '#fff', borderRadius: '8px', padding: '16px',
                   marginBottom: '12px', display: 'flex', alignItems: 'center',
                   boxShadow: '0 1px 4px rgba(0,0,0,.1)' }}
        >
          <Text style={{ fontSize: '32px', marginRight: '12px' }}>⚽</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', display: 'block' }}>
              {team.teamName}
            </Text>
            <Text style={{ fontSize: '12px', color: '#999' }}>
              {team.role === 'CAPTAIN' ? i18n('my.captain') : team.role === 'ADMIN' ? i18n('my.admin') : i18n('my.player')}
            </Text>
          </View>
          <Text style={{ color: '#ccc' }}>›</Text>
        </View>
      ))}
      <View
        onClick={() => Taro.navigateTo({ url: '/pages/onboard/index' })}
        style={{ textAlign: 'center', padding: '16px', color: '#4CAF50', fontSize: '14px' }}
      >
        {i18n('my.join_create')}
      </View>
    </View>
  )
}
