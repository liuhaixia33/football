import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/auth'
import type { MemberRole } from '../../types/api'
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

export default function TeamSelectPage() {
  const { teams, setCurrentTeam } = useAuthStore()
  const i18n = useT()

  const select = (teamId: number, role: MemberRole) => {
    setCurrentTeam(teamId, role)
    Taro.reLaunch({ url: '/pages/home/index' })
  }

  const roleLabel = (role: MemberRole) => {
    if (role === 'CAPTAIN') return i18n('my.captain')
    if (role === 'ADMIN') return i18n('my.admin')
    return i18n('my.player')
  }

  const roleColor = (role: MemberRole) => {
    if (role === 'CAPTAIN') return { color: '#FF9800', bg: '#fff8e1' }
    if (role === 'ADMIN') return { color: '#2196F3', bg: '#e3f2fd' }
    return { color: C.text3, bg: '#f3f4f6' }
  }

  return (
    <View style={{ padding: px(16), background: C.bg, minHeight: '100%' }}>
      <Text style={{
        fontSize: px(22), fontWeight: '700', color: C.text,
        marginBottom: px(8), display: 'block',
      }}>
        {i18n('team_select.title')}
      </Text>
      <Text style={{
        fontSize: px(14), color: C.text3, marginBottom: px(20), display: 'block',
      }}>
        选择你要管理的球队
      </Text>

      {teams.map(team => {
        const rc = roleColor(team.role)
        return (
          <View
            key={team.teamId}
            onClick={() => select(team.teamId, team.role)}
            style={{
              background: C.surface, borderRadius: px(16), padding: '16px 20px',
              marginBottom: px(12), display: 'flex', alignItems: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            <View style={{
              width: px(48), height: px(48), borderRadius: px(14),
              background: C.primaryLight, display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginRight: px(14), flexShrink: 0,
            }}>
              <Text style={{ fontSize: px(24) }}>⚽</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: px(16), fontWeight: '600', color: C.text, display: 'block', marginBottom: px(4),
              }}>
                {team.teamName}
              </Text>
              <Text style={{
                fontSize: px(12), fontWeight: '500', color: rc.color, background: rc.bg,
                borderRadius: '9999px', padding: '2px 10px', display: 'inline-block',
              }}>
                {roleLabel(team.role)}
              </Text>
            </View>
            <Text style={{ color: '#d1d5db', fontSize: px(20), fontWeight: '300' }}>›</Text>
          </View>
        )
      })}

      <View
        onClick={() => Taro.navigateTo({ url: '/pages/onboard/index' })}
        style={{
          textAlign: 'center', padding: px(16), color: C.primary, fontSize: px(14),
          fontWeight: '500', background: C.primaryLight, borderRadius: px(16),
          marginTop: px(8),
        }}
      >
        + {i18n('my.join_create')}
      </View>
    </View>
  )
}
