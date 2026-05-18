import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/auth'
import type { MemberRole } from '../../types/api'

export default function TeamSelectPage() {
  const { teams, setCurrentTeam } = useAuthStore()

  const select = (teamId: number, role: MemberRole) => {
    setCurrentTeam(teamId, role)
    Taro.reLaunch({ url: '/pages/home/index' })
  }

  return (
    <View style={{ padding: '16px' }}>
      <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px',
                     display: 'block' }}>选择球队</Text>
      {teams.map(t => (
        <View
          key={t.teamId}
          onClick={() => select(t.teamId, t.role)}
          style={{ background: '#fff', borderRadius: '8px', padding: '16px',
                   marginBottom: '12px', display: 'flex', alignItems: 'center',
                   boxShadow: '0 1px 4px rgba(0,0,0,.1)' }}
        >
          <Text style={{ fontSize: '32px', marginRight: '12px' }}>⚽</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', display: 'block' }}>
              {t.teamName}
            </Text>
            <Text style={{ fontSize: '12px', color: '#999' }}>
              {t.role === 'CAPTAIN' ? '队长' : t.role === 'ADMIN' ? '管理员' : '队员'}
            </Text>
          </View>
          <Text style={{ color: '#ccc' }}>›</Text>
        </View>
      ))}
      <View
        onClick={() => Taro.navigateTo({ url: '/pages/onboard/index' })}
        style={{ textAlign: 'center', padding: '16px', color: '#4CAF50', fontSize: '14px' }}
      >
        + 加入或创建新球队
      </View>
    </View>
  )
}
