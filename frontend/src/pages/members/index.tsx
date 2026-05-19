import { useState } from 'react'
import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import type { MemberRes } from '../../types/api'
import { px } from '../../utils/style'

const C = {
  primary: '#4CAF50',
  primaryLight: '#f0fdf4',
  surface: '#ffffff',
  bg: '#f9fafb',
  text: '#1f2937',
  text2: '#4b5563',
  text3: '#9ca3af',
  win: '#10b981',
  draw: '#f59e0b',
  lose: '#ef4444',
}

function roleBadge(role: string) {
  if (role === 'CAPTAIN') return { label: '队长', color: '#FF9800', bg: '#fff8e1' }
  if (role === 'ADMIN')   return { label: '管理员', color: '#2196F3', bg: '#e3f2fd' }
  return { label: '球员', color: C.text3, bg: '#f3f4f6' }
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
      {/* Header */}
      <View style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 16px 12px', background: C.surface,
        borderBottom: '1px solid #f0f0f0',
      }}>
        <Text style={{ fontSize: px(22), fontWeight: '700', color: C.text }}>队员</Text>
        <Text style={{ fontSize: px(13), color: C.text3 }}>
          共 {active.length} 人
        </Text>
      </View>

      {/* Tab switcher */}
      <View style={{
        display: 'flex', background: C.surface, padding: '12px 16px 0', gap: px(8),
      }}>
        {[
          { key: 'active' as const, label: `${t('members.active')} ${active.length}` },
          { key: 'pending' as const, label: `${t('members.pending')} ${pending.length}` },
        ].map(item => (
          <View
            key={item.key}
            onClick={() => setTab(item.key)}
            style={{
              padding: '8px 16px', borderRadius: '9999px',
              background: tab === item.key ? C.primary : '#f3f4f6',
            }}
          >
            <Text style={{
              fontSize: px(14), fontWeight: tab === item.key ? '600' : '400',
              color: tab === item.key ? '#fff' : C.text2,
            }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY style={{ flex: 1, padding: '12px 16px' }}>
        {list.map(m => {
          const rb = roleBadge(m.role)
          return (
            <View
              key={m.memberId}
              style={{
                background: C.surface, borderRadius: px(16), padding: '14px 16px',
                marginBottom: px(10), display: 'flex', alignItems: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}
            >
              {m.avatarUrl
                ? <Image src={m.avatarUrl} style={{
                    width: px(44), height: px(44), borderRadius: '50%', marginRight: px(12),
                    border: '2px solid #f3f4f6',
                  }} />
                : <View style={{
                    width: px(44), height: px(44), borderRadius: '50%', marginRight: px(12),
                    background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: px(18) }}>⚽</Text>
                  </View>
              }
              <View style={{ flex: 1 }}>
                <View style={{ display: 'flex', alignItems: 'center', gap: px(6), marginBottom: px(4) }}>
                  <Text style={{ fontSize: px(15), fontWeight: '600', color: C.text }}>{m.nickname}</Text>
                  <Text style={{
                    fontSize: px(11), fontWeight: '500', color: rb.color, background: rb.bg,
                    borderRadius: '9999px', padding: '2px 8px',
                  }}>
                    {rb.label}
                  </Text>
                </View>
                {m.userId === userId && (
                  <Text style={{ fontSize: px(12), color: C.text3 }}>我</Text>
                )}
              </View>

              {/* Pending approval actions */}
              {tab === 'pending' && isCaptainOrAdmin() && (
                <View style={{ display: 'flex', gap: px(8) }}>
                  <Button
                    size='mini'
                    style={{
                      background: C.primary, color: '#fff', border: 'none',
                      borderRadius: '9999px', fontSize: px(12), padding: '4px 14px',
                    }}
                    onClick={() => reviewApply(m.memberId, true)}
                  >{t('members.approve')}</Button>
                  <Button
                    size='mini'
                    style={{
                      background: '#f3f4f6', color: C.text3, border: 'none',
                      borderRadius: '9999px', fontSize: px(12), padding: '4px 14px',
                    }}
                    onClick={() => reviewApply(m.memberId, false)}
                  >{t('members.reject')}</Button>
                </View>
              )}

              {/* Active member actions (captain only, not self, not other captain) */}
              {tab === 'active' && currentRole === 'CAPTAIN' &&
                m.userId !== userId && m.role !== 'CAPTAIN' && (
                <View style={{ display: 'flex', gap: px(6) }}>
                  <Button
                    size='mini'
                    style={{
                      background: '#e3f2fd', color: '#1565C0', border: 'none',
                      borderRadius: '9999px', fontSize: px(11), padding: '4px 10px',
                    }}
                    onClick={() => toggleAdmin(m.userId, m.role)}
                  >
                    {m.role === 'ADMIN' ? t('members.remove_admin') : t('members.set_admin')}
                  </Button>
                  <Button
                    size='mini'
                    style={{
                      background: '#fee2e2', color: '#dc2626', border: 'none',
                      borderRadius: '9999px', fontSize: px(11), padding: '4px 10px',
                    }}
                    onClick={() => removeMember(m.userId)}
                  >{t('members.remove')}</Button>
                </View>
              )}
            </View>
          )
        })}
        {list.length === 0 && (
          <View style={{
            background: C.surface, borderRadius: px(16), padding: '48px 24px',
            textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}>
            <Text style={{ fontSize: px(32), display: 'block', marginBottom: px(8) }}>👥</Text>
            <Text style={{ fontSize: px(14), color: C.text3 }}>{t('members.empty')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
