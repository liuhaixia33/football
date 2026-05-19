import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/auth'
import type { MemberRole } from '../../types/api'
import { useT } from '../../i18n/useT'
import { px } from '../../utils/style'

const C = {
  primary: '#00e472',
  primaryDim: 'rgba(0,228,114,0.12)',
  bg: '#0b0f18',
  surface: '#131a27',
  surface2: '#1a2235',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8f0fb',
  text2: '#7a8ca3',
  text3: '#364a60',
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
    if (role === 'CAPTAIN') return { color: '#ffb700', bg: 'rgba(255,183,0,0.15)' }
    if (role === 'ADMIN')   return { color: '#4da6ff', bg: 'rgba(77,166,255,0.15)' }
    return { color: C.text3, bg: 'rgba(255,255,255,0.05)' }
  }

  return (
    <View style={{ padding: px(20), background: C.bg, minHeight: '100%' }}>
      <Text style={{
        fontSize: px(50), fontWeight: '800', color: C.text,
        marginBottom: px(6), display: 'block', letterSpacing: '-0.02em',
      }}>
        {i18n('team_select.title')}
      </Text>
      <Text style={{
        fontSize: px(28), color: C.text2, marginBottom: px(24), display: 'block',
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
              background: C.surface, borderRadius: px(16), padding: `${px(16)} ${px(18)}`,
              marginBottom: px(10), display: 'flex', alignItems: 'center',
              border: `1px solid ${C.border}`,
            }}
          >
            <View style={{
              width: px(46), height: px(46), borderRadius: px(12),
              background: `hsl(${((team.teamId * 137) % 360)}, 40%, 18%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginRight: px(14), flexShrink: 0,
              border: `1px solid rgba(255,255,255,0.07)`,
            }}>
              <Text style={{ fontSize: px(44) }}>⚽</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: px(32), fontWeight: '600', color: C.text,
                display: 'block', marginBottom: px(6),
              }}>
                {team.teamName}
              </Text>
              <Text style={{
                fontSize: px(22), fontWeight: '600', color: rc.color, background: rc.bg,
                borderRadius: '9999px', padding: '2px 10px', display: 'inline-block',
              }}>
                {roleLabel(team.role)}
              </Text>
            </View>
            <Text style={{ color: C.text3, fontSize: px(40), fontWeight: '300' }}>›</Text>
          </View>
        )
      })}

      <View
        onClick={() => Taro.navigateTo({ url: '/pages/onboard/index' })}
        style={{
          textAlign: 'center', padding: px(16), color: C.primary, fontSize: px(28),
          fontWeight: '600', background: C.primaryDim, borderRadius: px(16),
          marginTop: px(8), border: `1px solid rgba(0,228,114,0.15)`,
        }}
      >
        + {i18n('my.join_create')}
      </View>
    </View>
  )
}
