import { useState } from 'react'
import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import type { MemberRes } from '../../types/api'
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
  lose: '#ff4d5a',
}

function roleBadge(role: string) {
  if (role === 'CAPTAIN') return { label: '队长', color: '#ffb700', dot: '#ffb700' }
  if (role === 'ADMIN')   return { label: '管理员', color: '#4da6ff', dot: '#4da6ff' }
  return { label: '球员', color: C.text3, dot: C.text3 }
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRes[]>([])
  const [tab, setTab] = useState<'active' | 'pending'>('active')
  const t = useT()
  const { currentTeamId, userId, currentRole, isCaptainOrAdmin } = useAuthStore()

  const load = async () => {
    if (!currentTeamId) return
    try {
      const data = await teamApi.listMembers(currentTeamId)
      setMembers(data)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
    }
  }

  useDidShow(load)

  const active = members.filter(m => m.status === 'ACTIVE')
  const pending = members.filter(m => m.status === 'PENDING')

  const reviewApply = async (memberId: number, approve: boolean) => {
    if (!currentTeamId) return
    try {
      await teamApi.reviewApply(currentTeamId, memberId, approve)
      Taro.showToast({ title: approve ? '已通过' : '已拒绝', icon: 'success' })
      load()
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
    }
  }

  const removeMember = (targetUserId: number) => {
    if (!currentTeamId) return
    Taro.showModal({
      title: '确认移除',
      content: '确定要移除该队员吗？',
      success: async ({ confirm }) => {
        if (!confirm) return
        try {
          await teamApi.removeMember(currentTeamId, targetUserId)
          Taro.showToast({ title: '已移除', icon: 'success' })
          load()
        } catch (e: unknown) {
          Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
        }
      }
    })
  }

  const toggleAdmin = async (targetUserId: number, memberRole: string) => {
    if (!currentTeamId) return
    const newRole = memberRole === 'ADMIN' ? 'PLAYER' : 'ADMIN'
    try {
      await teamApi.setRole(currentTeamId, targetUserId, newRole)
      Taro.showToast({ title: newRole === 'ADMIN' ? '已设为管理员' : '已取消管理员', icon: 'success' })
      load()
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
    }
  }

  const list = tab === 'active' ? active : pending

  return (
    <View style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg }}>
      {/* Header — title + tab switcher in one compact bar */}
      <View style={{ borderBottom: `1px solid ${C.border}` }}>
        <View style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: `${px(16)} ${px(16)} ${px(12)}`,
        }}>
          <Text style={{ fontSize: px(44), fontWeight: '800', color: C.text, letterSpacing: '-0.02em' }}>
            队员
          </Text>
          <Text style={{ fontSize: px(26), color: C.text3, fontWeight: '500' }}>
            共 {active.length} 人
          </Text>
        </View>

        {/* Tabs — pending tab only visible to captain/admin */}
        {isCaptainOrAdmin() && (
        <View style={{ display: 'flex', padding: `0 ${px(14)} ${px(12)}`, gap: px(8) }}>
          {[
            { key: 'active' as const, label: t('members.active'), count: active.length },
            { key: 'pending' as const, label: t('members.pending'), count: pending.length },
          ].map(item => (
            <View
              key={item.key}
              onClick={() => setTab(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: px(6),
                padding: `${px(7)} ${px(14)}`, borderRadius: '9999px',
                background: tab === item.key ? C.primaryDim : 'rgba(255,255,255,0.04)',
                border: `1px solid ${tab === item.key ? 'rgba(0,228,114,0.3)' : C.border}`,
              }}
            >
              <Text style={{
                fontSize: px(26), fontWeight: tab === item.key ? '700' : '400',
                color: tab === item.key ? C.primary : C.text2,
              }}>
                {item.label}
              </Text>
              {item.count > 0 && (
                <View style={{
                  background: tab === item.key ? C.primary : 'rgba(255,255,255,0.1)',
                  borderRadius: '9999px', minWidth: px(18), height: px(18),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  <Text style={{ fontSize: px(22), fontWeight: '700',
                                 color: tab === item.key ? '#0b0f18' : C.text2 }}>
                    {item.count}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
        )}
      </View>

      <ScrollView scrollY style={{ flex: 1, padding: `${px(12)} ${px(14)}` }}>
        {list.length === 0 ? (
          <View style={{
            background: C.surface, borderRadius: px(16),
            padding: `${px(48)} ${px(24)}`, textAlign: 'center',
            border: `1px solid ${C.border}`,
          }}>
            <Text style={{ fontSize: px(64), display: 'block', marginBottom: px(10) }}>👥</Text>
            <Text style={{ fontSize: px(28), color: C.text3 }}>{t('members.empty')}</Text>
          </View>
        ) : (
          // All rows in ONE container — flat list with dividers
          <View style={{
            background: C.surface, borderRadius: px(16),
            border: `1px solid ${C.border}`, overflow: 'hidden',
          }}>
            {list.map((m, idx) => {
              const rb = roleBadge(m.role)
              const isLast = idx === list.length - 1
              return (
                <View key={m.memberId}>
                  <View style={{
                    display: 'flex', alignItems: 'center',
                    padding: `${px(13)} ${px(14)}`,
                    gap: px(12),
                  }}>
                    {/* Avatar */}
                    {m.avatarUrl
                      ? <Image src={m.avatarUrl} style={{
                          width: px(42), height: px(42), borderRadius: '50%', flexShrink: 0,
                          border: `2px solid rgba(255,255,255,0.07)`,
                        }} />
                      : <View style={{
                          width: px(42), height: px(42), borderRadius: '50%',
                          background: `hsl(${((m.userId * 137) % 360)}, 35%, 22%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Text style={{ fontSize: px(32) }}>⚽</Text>
                        </View>
                    }

                    {/* Name + role */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ display: 'flex', alignItems: 'center', gap: px(7), marginBottom: px(2) }}>
                        <Text style={{ fontSize: px(30), fontWeight: '600', color: C.text }}>
                          {m.nickname}
                        </Text>
                        {m.userId === userId && (
                          <Text style={{ fontSize: px(22), color: C.primary, fontWeight: '600',
                                         background: C.primaryDim, borderRadius: '9999px',
                                         padding: '1px 6px' }}>我</Text>
                        )}
                      </View>
                      <View style={{ display: 'flex', alignItems: 'center', gap: px(4) }}>
                        <View style={{
                          width: px(5), height: px(5), borderRadius: '50%',
                          background: rb.dot,
                        }} />
                        <Text style={{ fontSize: px(24), color: rb.color, fontWeight: '500' }}>
                          {rb.label}
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    {tab === 'pending' && isCaptainOrAdmin() && (
                      <View style={{ display: 'flex', gap: px(8), flexShrink: 0 }}>
                        <Button
                          size='mini'
                          style={{
                            background: C.primaryDim, color: C.primary,
                            border: `1px solid rgba(0,228,114,0.3)`,
                            borderRadius: px(8), fontSize: px(24), fontWeight: '700',
                            padding: `${px(5)} ${px(12)}`,
                          }}
                          onClick={() => reviewApply(m.memberId, true)}
                        >
                          {t('members.approve')}
                        </Button>
                        <Button
                          size='mini'
                          style={{
                            background: 'rgba(255,255,255,0.05)', color: C.text3,
                            border: `1px solid ${C.border}`,
                            borderRadius: px(8), fontSize: px(24),
                            padding: `${px(5)} ${px(12)}`,
                          }}
                          onClick={() => reviewApply(m.memberId, false)}
                        >
                          {t('members.reject')}
                        </Button>
                      </View>
                    )}

                    {tab === 'active' && currentRole === 'CAPTAIN' &&
                      m.userId !== userId && m.role !== 'CAPTAIN' && (
                      <View style={{ display: 'flex', gap: px(6), flexShrink: 0 }}>
                        <Button
                          size='mini'
                          style={{
                            background: 'rgba(77,166,255,0.1)', color: '#4da6ff',
                            border: '1px solid rgba(77,166,255,0.2)',
                            borderRadius: px(8), fontSize: px(22),
                            padding: `${px(4)} ${px(10)}`,
                          }}
                          onClick={() => toggleAdmin(m.userId, m.role)}
                        >
                          {m.role === 'ADMIN' ? t('members.remove_admin') : t('members.set_admin')}
                        </Button>
                        <Button
                          size='mini'
                          style={{
                            background: 'rgba(255,77,90,0.1)', color: C.lose,
                            border: '1px solid rgba(255,77,90,0.2)',
                            borderRadius: px(8), fontSize: px(22),
                            padding: `${px(4)} ${px(10)}`,
                          }}
                          onClick={() => removeMember(m.userId)}
                        >
                          {t('members.remove')}
                        </Button>
                      </View>
                    )}
                  </View>

                  {/* Separator — not on last item */}
                  {!isLast && (
                    <View style={{ height: '1px', background: C.border, marginLeft: px(14 + 42 + 12) }} />
                  )}
                </View>
              )
            })}
          </View>
        )}
        <View style={{ height: px(160) }} />
      </ScrollView>
    </View>
  )
}
