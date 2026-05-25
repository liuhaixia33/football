import { useState } from 'react'
import { View, Text, Button, ScrollView, Image, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import type { MemberRes } from '../../types/api'
import { px } from '../../utils/style'

const C = {
  primary: '#22c55e',
  primaryDim: 'rgba(34,197,94,0.12)',
  bg: '#0f1010',
  surface: '#181c18',
  surface2: '#1e2420',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8ede8',
  text2: '#8a9e8a',
  text3: '#4a5a4a',
  lose: '#ff4d5a',
}

const PRESET_TAGS = ['队宠', '球王', '饮水机管理员', '鸽子王', '东斜', '西摇', '南转', '北杵']

function RoleIcon({ role }: { role: string }) {
  if (role === 'CAPTAIN') return (
    <Text style={{ fontSize: px(20), color: '#ffb700', fontWeight: '800',
                   background: 'rgba(255,183,0,0.18)', borderRadius: px(6),
                   padding: `${px(2)} ${px(8)}` }}>C</Text>
  )
  if (role === 'ADMIN') return (
    <Text style={{ fontSize: px(20), color: '#4da6ff', fontWeight: '800',
                   background: 'rgba(77,166,255,0.18)', borderRadius: px(6),
                   padding: `${px(2)} ${px(8)}` }}>A</Text>
  )
  return null
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
      Taro.showToast({ title: newRole === 'ADMIN' ? '已设为队副' : '已取消队副', icon: 'success' })
      load()
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
    }
  }

  const [tagModal, setTagModal] = useState<{ userId: number; nickname: string; current: string } | null>(null)
  const [tagInput, setTagInput] = useState('')

  const openTagModal = (m: MemberRes) => {
    setTagInput(m.tag ?? '')
    setTagModal({ userId: m.userId, nickname: m.nickname, current: m.tag ?? '' })
  }

  const submitTag = async (tag: string) => {
    if (!currentTeamId || !tagModal) return
    try {
      await teamApi.setTag(currentTeamId, tagModal.userId, tag)
      setTagModal(null)
      load()
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '设置失败', icon: 'none' })
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
                border: `1px solid ${tab === item.key ? 'rgba(34,197,94,0.3)' : C.border}`,
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
                                 color: tab === item.key ? '#0f1010' : C.text2 }}>
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

                    {/* Name + role icon + tag */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ display: 'flex', alignItems: 'center', gap: px(7) }}>
                        <Text style={{ fontSize: px(30), fontWeight: '600', color: C.text }}>
                          {m.nickname}
                        </Text>
                        <RoleIcon role={m.role} />
                        {m.userId === userId && (
                          <Text style={{ fontSize: px(22), color: C.primary, fontWeight: '600',
                                         background: C.primaryDim, borderRadius: '9999px',
                                         padding: '1px 6px' }}>我</Text>
                        )}
                      </View>
                      {m.tag ? (
                        <Text style={{ fontSize: px(22), color: '#f59e0b', fontWeight: '500',
                                       marginTop: px(3) }}>
                          {m.tag}
                        </Text>
                      ) : null}
                    </View>

                    {/* Actions */}
                    {tab === 'pending' && isCaptainOrAdmin() && (
                      <View style={{ display: 'flex', gap: px(8), flexShrink: 0 }}>
                        <Button
                          size='mini'
                          style={{
                            background: C.primaryDim, color: C.primary,
                            border: `1px solid rgba(34,197,94,0.3)`,
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

                    {tab === 'active' && isCaptainOrAdmin() && (
                      <View style={{ display: 'flex', gap: px(6), flexShrink: 0 }}>
                        {/* 标签按钮：队长和队副均可 */}
                        <Button
                          size='mini'
                          style={{
                            background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
                            border: '1px solid rgba(245,158,11,0.25)',
                            borderRadius: px(8), fontSize: px(22),
                            padding: `${px(4)} ${px(10)}`,
                          }}
                          onClick={() => openTagModal(m)}
                        >
                          标签
                        </Button>
                        {/* 设副 + 移除：仅队长，且非自身、非队长 */}
                        {currentRole === 'CAPTAIN' && m.userId !== userId && m.role !== 'CAPTAIN' && (
                          <>
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
                          </>
                        )}
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
        <View style={{ height: px(192) }} />
      </ScrollView>

      {/* 标签编辑弹层 */}
      {tagModal && (
        <View style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-end',
        }} onClick={() => setTagModal(null)}>
          <View
            style={{
              width: '100%', background: '#1a201a',
              borderRadius: `${px(24)} ${px(24)} 0 0`,
              padding: `${px(24)} ${px(20)} ${px(48)}`,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 标题 */}
            <Text style={{ fontSize: px(32), fontWeight: '700', color: C.text,
                           display: 'block', marginBottom: px(6) }}>
              设置标签
            </Text>
            <Text style={{ fontSize: px(24), color: C.text2, display: 'block', marginBottom: px(20) }}>
              {tagModal.nickname}
            </Text>

            {/* 预设标签 */}
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: px(10), marginBottom: px(20) }}>
              {PRESET_TAGS.map(tag => {
                const active = tagInput === tag
                return (
                  <View
                    key={tag}
                    onClick={() => setTagInput(active ? '' : tag)}
                    style={{
                      padding: `${px(8)} ${px(16)}`,
                      borderRadius: '9999px',
                      background: active ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${active ? 'rgba(245,158,11,0.5)' : C.border}`,
                    }}
                  >
                    <Text style={{ fontSize: px(26), color: active ? '#f59e0b' : C.text2,
                                   fontWeight: active ? '600' : '400' }}>
                      {tag}
                    </Text>
                  </View>
                )
              })}
            </View>

            {/* 自定义输入 */}
            <View style={{
              display: 'flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${C.border}`, borderRadius: px(12),
              padding: `${px(10)} ${px(14)}`, marginBottom: px(24),
            }}>
              <Input
                value={tagInput}
                onInput={e => setTagInput(e.detail.value.slice(0, 6))}
                placeholder='自定义标签（最多6字）'
                placeholderStyle={`color:${C.text3};font-size:${px(26)}px`}
                maxlength={6}
                style={{ flex: 1, fontSize: px(28), color: C.text }}
              />
              {tagInput ? (
                <Text style={{ fontSize: px(24), color: C.text3, marginLeft: px(8) }}>
                  {tagInput.length}/6
                </Text>
              ) : null}
            </View>

            {/* 操作按钮 */}
            <View style={{ display: 'flex', gap: px(12) }}>
              {tagModal.current && (
                <Button
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)', color: C.text3,
                    border: `1px solid ${C.border}`, borderRadius: px(14),
                    fontSize: px(28), fontWeight: '500',
                  }}
                  onClick={() => submitTag('')}
                >
                  清除标签
                </Button>
              )}
              <Button
                style={{
                  flex: 2, background: tagInput ? '#22c55e' : 'rgba(34,197,94,0.2)',
                  color: tagInput ? '#0f1010' : C.text3,
                  border: 'none', borderRadius: px(14),
                  fontSize: px(28), fontWeight: '700',
                }}
                onClick={() => tagInput && submitTag(tagInput)}
              >
                确认
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
