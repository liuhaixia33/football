import { useState } from 'react'
import { View, Text, Button, Image, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { userApi } from '../../api/user'
import { uploadApi } from '../../api/upload'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import { useLangStore } from '../../store/lang'
import type { MyStatsRes, MemberRole } from '../../types/api'
import { px } from '../../utils/style'

// ============================================
// Color System (Brand: #4CAF50)
// ============================================
const C = {
  primary: '#4CAF50',
  primary600: '#3d8b40',
  primary50: '#e8f5e9',
  text: '#1f2937',
  text2: '#4b5563',
  text3: '#9ca3af',
  surface: '#ffffff',
  surface2: '#f9fafb',
  surface3: '#f3f4f6',
  border: '#e5e7eb',
  win: '#10b981',
  draw: '#f59e0b',
  lose: '#ef4444',
}

export default function MyPage() {
  const [stats, setStats] = useState<MyStatsRes | null>(null)
  const { nickname, avatarUrl, token, userId, currentTeamId, currentRole,
          teams, setCurrentTeam, setTeams, setAuth, clear } = useAuthStore()
  const t = useT()
  const { language, setLanguage } = useLangStore()

  const [editing, setEditing] = useState(false)
  const [draftAvatarTmp, setDraftAvatarTmp] = useState('')
  const [draftNickname, setDraftNickname] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!currentTeamId) return
    try {
      const s = await userApi.stats(currentTeamId)
      setStats(s)
    } catch { /* non-critical */ }
    try {
      const profile = await userApi.me()
      setTeams(profile.teams)
    } catch { /* non-critical */ }
  }

  useDidShow(load)

  const openEdit = () => {
    setDraftAvatarTmp('')
    setDraftNickname(nickname ?? '')
    setEditing(true)
  }

  const saveProfile = async () => {
    if (saving) return
    setSaving(true)
    try {
      let ossUrl: string | undefined
      if (draftAvatarTmp) {
        const { url } = await uploadApi.avatar(draftAvatarTmp)
        ossUrl = url
      }
      await userApi.updateProfile({
        nickname: draftNickname || undefined,
        avatarUrl: ossUrl,
      })
      setAuth(token!, userId!, draftNickname || nickname!, ossUrl ?? avatarUrl ?? '')
      setEditing(false)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const switchTeam = (teamId: number, role: MemberRole) => {
    setCurrentTeam(teamId, role)
    Taro.reLaunch({ url: '/pages/home/index' })
  }

  const roleLabel = (role: MemberRole) =>
    role === 'CAPTAIN' ? t('my.captain') : role === 'ADMIN' ? t('my.admin') : t('my.player')

  const roleBadgeColor = (role: MemberRole) => {
    if (role === 'CAPTAIN') return { bg: '#fef3c7', text: '#d97706' }
    if (role === 'ADMIN') return { bg: '#dbeafe', text: '#2563eb' }
    return { bg: '#f3f4f6', text: '#6b7280' }
  }

  const logout = () => {
    Taro.showModal({
      title: t('my.logout_title'),
      content: t('my.logout_content'),
      success: ({ confirm }) => {
        if (confirm) {
          clear()
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      },
    })
  }

  const leaveTeam = () => {
    if (currentRole === 'CAPTAIN') {
      Taro.showToast({ title: t('my.leave_captain'), icon: 'none' })
      return
    }
    if (!currentTeamId) return
    Taro.showModal({
      title: '确认移除',
      content: '确定要退出当前球队吗？',
      success: async ({ confirm }) => {
        if (!confirm) return
        try {
          const { teamApi } = await import('../../api/team')
          await teamApi.leave(currentTeamId)
          Taro.showToast({ title: '已退出球队', icon: 'success' })
          setTimeout(() => { clear(); Taro.reLaunch({ url: '/pages/login/index' }) }, 1000)
        } catch (e: unknown) {
          Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
        }
      },
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

  const draftAvatarDisplay = draftAvatarTmp || avatarUrl || ''

  return (
    <View style={{ minHeight: '100%', background: C.surface2, paddingBottom: px(48) }}>

      {/* ==========================================
          Profile Hero Card (Floating over background)
          ========================================== */}
      <View style={{ padding: '24px 20px 0' }}>
        <View style={{
          background: C.surface,
          borderRadius: px(20),
          padding: px(28),
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: px(20),
        }}>
          {/* Avatar with ring */}
          <View
            onClick={openEdit}
            style={{
              position: 'relative',
              width: px(72),
              height: px(72),
              borderRadius: '50%',
              border: `3px solid ${C.primary50}`,
              padding: px(3),
              flexShrink: 0,
            }}
          >
            {avatarUrl
              ? <Image src={avatarUrl} style={{ width: px(66), height: px(66), borderRadius: '50%' }} />
              : <View style={{ width: px(66), height: px(66), borderRadius: '50%', background: C.surface3,
                               display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: px(28) }}>👤</Text>
                </View>
            }
            {/* Edit badge */}
            <View style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: px(22),
              height: px(22),
              borderRadius: '50%',
              background: C.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${C.surface}`,
            }}>
              <Text style={{ color: '#fff', fontSize: px(11) }}>✎</Text>
            </View>
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: px(22), fontWeight: '700', color: C.text, lineHeight: 1.2,
                           letterSpacing: '-0.01em', display: 'block' }}>
              {nickname ?? '球员'}
            </Text>
            <View style={{ display: 'flex', alignItems: 'center', gap: px(8), marginTop: px(8) }}>
              <View style={{
                background: roleBadgeColor(currentRole ?? 'PLAYER').bg,
                padding: '3px 10px',
                borderRadius: '9999px',
              }}>
                <Text style={{ fontSize: px(12), fontWeight: '500',
                               color: roleBadgeColor(currentRole ?? 'PLAYER').text }}>
                  {roleLabel(currentRole ?? 'PLAYER')}
                </Text>
              </View>
              <Text style={{ fontSize: px(13), color: C.text3 }}>
                ID: {userId ?? '-'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ==========================================
          Stats Bento Grid
          ========================================== */}
      {stats && (
        <View style={{ padding: '16px 20px 0' }}>
          <Text style={{ fontSize: px(13), fontWeight: '600', color: C.text2,
                         marginBottom: px(12), letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {t('my.stats')}
          </Text>
          <View style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {[
              { label: t('my.matches'), value: stats.totalMatches, color: C.text,
                bg: '#f0fdf4', icon: '⚽' },
              { label: t('my.wins'), value: stats.wins, color: C.win,
                bg: '#ecfdf5', icon: '🏆' },
              { label: t('my.draws'), value: stats.draws, color: C.draw,
                bg: '#fffbeb', icon: '🤝' },
              { label: t('my.losses'), value: stats.losses, color: C.lose,
                bg: '#fef2f2', icon: '💔' },
            ].map(s => (
              <View key={s.label} style={{
                width: '48%',
                marginBottom: px(12),
                background: C.surface,
                borderRadius: px(16),
                padding: px(16),
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <Text style={{ fontSize: px(20), marginBottom: px(8) }}>{s.icon}</Text>
                <Text style={{ fontSize: px(28), fontWeight: '700', color: s.color,
                               display: 'block', lineHeight: 1.1 }}>
                  {s.value}
                </Text>
                <Text style={{ fontSize: px(13), color: C.text3, marginTop: px(4) }}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ==========================================
          Team List Card
          ========================================== */}
      <View style={{ padding: '16px 20px 0' }}>
        <Text style={{ fontSize: px(13), fontWeight: '600', color: C.text2,
                       marginBottom: px(12), letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {t('my.teams')}
        </Text>
        <View style={{
          background: C.surface,
          borderRadius: px(20),
          padding: '8px 8px 8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {teams.map((tm, idx) => (
            <View key={tm.teamId}>
              <View
                onClick={() => switchTeam(tm.teamId, tm.role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: px(12),
                  background: tm.teamId === currentTeamId ? C.primary50 : 'transparent',
                }}
              >
                {/* Team avatar placeholder */}
                <View style={{
                  width: px(44),
                  height: px(44),
                  borderRadius: px(12),
                  background: `hsl(${((tm.teamId * 137) % 360)}, 70%, 90%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: px(14),
                  flexShrink: 0,
                }}>
                  <Text style={{ fontSize: px(18) }}>⚽</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: px(15), fontWeight: '600', color: C.text, display: 'block' }}>
                    {tm.teamName}
                  </Text>
                  <View style={{ display: 'flex', alignItems: 'center', gap: px(6), marginTop: px(2) }}>
                    <View style={{
                      background: roleBadgeColor(tm.role).bg,
                      padding: '1px 8px',
                      borderRadius: '9999px',
                    }}>
                      <Text style={{ fontSize: px(11), fontWeight: '500',
                                     color: roleBadgeColor(tm.role).text }}>
                        {roleLabel(tm.role)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Current indicator or chevron */}
                {tm.teamId === currentTeamId ? (
                  <View style={{
                    background: C.primary,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                  }}>
                    <Text style={{ fontSize: px(12), color: '#fff', fontWeight: '500' }}>
                      {t('my.current')}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: px(14), color: C.text3 }}>›</Text>
                )}
              </View>
              {idx < teams.length - 1 && (
                <View style={{ height: '1px', background: C.surface3, margin: '0 16px' }} />
              )}
            </View>
          ))}

          {/* Add team row */}
          <View
            onClick={() => Taro.navigateTo({ url: '/pages/onboard/index' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: px(14),
              marginTop: px(4),
              borderRadius: px(12),
              border: `1px dashed ${C.border}`,
            }}
          >
            <Text style={{ fontSize: px(14), color: C.primary, fontWeight: '500' }}>
              + {t('my.join_create')}
            </Text>
          </View>
        </View>
      </View>

      {/* ==========================================
          Settings List
          ========================================== */}
      <View style={{ padding: '16px 20px 0' }}>
        <Text style={{ fontSize: px(13), fontWeight: '600', color: C.text2,
                       marginBottom: px(12), letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {language === 'zh' ? '设置' : 'Settings'}
        </Text>
        <View style={{
          background: C.surface,
          borderRadius: px(20),
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          {/* Language */}
          <View
            onClick={switchLanguage}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '18px 20px',
              minHeight: px(56),
            }}
          >
            <Text style={{ fontSize: px(22), marginRight: px(16) }}>🌐</Text>
            <Text style={{ flex: 1, fontSize: px(16), color: C.text, fontWeight: '500' }}>
              {t('my.language')}
            </Text>
            <Text style={{ fontSize: px(15), color: C.text3 }}>
              {language === 'zh' ? t('my.lang_zh') : t('my.lang_en')}
            </Text>
            <Text style={{ fontSize: px(16), color: C.text3, marginLeft: px(6) }}>›</Text>
          </View>

          <View style={{ height: '1px', background: C.surface3, margin: '0 20px' }} />

          {/* Leave team */}
          {currentRole !== 'CAPTAIN' && (
            <>
              <View
                onClick={leaveTeam}
                style={{ display: 'flex', alignItems: 'center', padding: '18px 20px', minHeight: px(56) }}
              >
                <Text style={{ fontSize: px(22), marginRight: px(16) }}>🚪</Text>
                <Text style={{ flex: 1, fontSize: px(16), color: C.lose, fontWeight: '500' }}>
                  {t('my.leave')}
                </Text>
                <Text style={{ fontSize: px(16), color: C.text3 }}>›</Text>
              </View>
              <View style={{ height: '1px', background: C.surface3, margin: '0 20px' }} />
            </>
          )}

          {/* Logout */}
          <View
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', padding: '18px 20px', minHeight: px(56) }}
          >
            <Text style={{ fontSize: px(22), marginRight: px(16) }}>↩️</Text>
            <Text style={{ flex: 1, fontSize: px(16), color: C.text2, fontWeight: '500' }}>
              {t('my.logout')}
            </Text>
          </View>
        </View>
      </View>

      {/* ==========================================
          Edit Profile Modal (Bottom Sheet)
          ========================================== */}
      {editing && (
        <View style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          zIndex: 100,
        }}>
          <View style={{
            background: C.surface,
            borderRadius: '24px 24px 0 0',
            padding: '24px 24px 32px',
          }}>
            {/* Handle bar */}
            <View style={{
              width: px(40),
              height: px(4),
              borderRadius: px(2),
              background: C.surface3,
              margin: '0 auto 24px',
            }} />

            <Text style={{
              fontSize: px(20),
              fontWeight: '700',
              color: C.text,
              textAlign: 'center',
              marginBottom: px(24),
            }}>
              {t('my.edit_profile')}
            </Text>

            {/* Avatar */}
            <View style={{ display: 'flex', justifyContent: 'center', marginBottom: px(24) }}>
              <Button
                openType="chooseAvatar"
                onChooseAvatar={(e) => setDraftAvatarTmp((e as unknown as { detail: { avatarUrl: string } }).detail.avatarUrl)}
                style={{ background: 'transparent', border: 'none', padding: 0,
                         width: px(96), height: px(96), borderRadius: '50%' }}
              >
                {draftAvatarDisplay
                  ? <Image src={draftAvatarDisplay} style={{
                      width: px(96), height: px(96), borderRadius: '50%',
                      border: `3px solid ${C.primary50}`,
                    }} />
                  : <View style={{ width: px(96), height: px(96), borderRadius: '50%',
                                   background: C.surface3, display: 'flex',
                                   alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: px(36) }}>👤</Text>
                    </View>
                }
              </Button>
            </View>

            {/* Nickname */}
            <View style={{ marginBottom: px(24) }}>
              <Text style={{ fontSize: px(13), fontWeight: '500', color: C.text2,
                             marginBottom: px(8), display: 'block' }}>
                昵称
              </Text>
              <Input
                type="nickname"
                value={draftNickname}
                onInput={(e) => setDraftNickname(e.detail.value)}
                placeholder={t('login.nickname_placeholder')}
                style={{
                  height: px(48),
                  border: `1px solid ${C.border}`,
                  borderRadius: px(12),
                  padding: '0 16px',
                  fontSize: px(16),
                  background: C.surface2,
                }}
              />
            </View>

            {/* Buttons */}
            <View style={{ display: 'flex', gap: px(12) }}>
              <Button
                style={{
                  flex: 1,
                  height: px(48),
                  lineHeight: px(48),
                  background: C.surface3,
                  color: C.text2,
                  border: 'none',
                  borderRadius: px(12),
                  fontSize: px(15),
                  fontWeight: '500',
                }}
                onClick={() => setEditing(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                style={{
                  flex: 1,
                  height: px(48),
                  lineHeight: px(48),
                  background: C.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: px(12),
                  fontSize: px(15),
                  fontWeight: '500',
                }}
                loading={saving}
                onClick={saveProfile}
              >
                {t('common.save')}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
