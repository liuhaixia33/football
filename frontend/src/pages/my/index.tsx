import { useState } from 'react'
import { View, Text, Button, Image, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { userApi } from '../../api/user'
import { uploadApi } from '../../api/upload'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import type { MyStatsRes, MemberRole } from '../../types/api'
import { px } from '../../utils/style'

const C = {
  primary: '#22c55e',
  primaryDim: 'rgba(34,197,94,0.12)',
  bg: '#0f1010',
  surface: '#181c18',
  surface2: '#1e2420',
  surface3: '#162016',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8ede8',
  text2: '#8a9e8a',
  text3: '#4a5a4a',
  win: '#22c55e',
  draw: '#ffb700',
  lose: '#ff4d5a',
}

function SectionTitle({ label }: { label: string }) {
  return (
    <Text style={{
      fontSize: px(20), fontWeight: '700', color: C.text3,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      display: 'block', marginBottom: px(8),
    }}>
      {label}
    </Text>
  )
}

export default function MyPage() {
  const [stats, setStats] = useState<MyStatsRes | null>(null)
  const { nickname, avatarUrl, token, userId, currentTeamId, currentRole,
          teams, setCurrentTeam, setTeams, setAuth, clear, currentTeamInviteCode } = useAuthStore()
  const currentTeamName = teams.find(t => t.teamId === currentTeamId)?.teamName ?? '球队'

  useShareAppMessage(() => ({
    title: `「${currentTeamName}」邀请您加入，一起驰骋绿茵！`,
    path: `/pages/home/index?inviteCode=${currentTeamInviteCode()}&teamId=${currentTeamId}`,
    imageUrl: '/assets/images/share-cover.png',
  }))
  const t = useT()

  const [editing, setEditing] = useState(false)
  const [draftAvatarTmp, setDraftAvatarTmp] = useState('')
  const [draftNickname, setDraftNickname] = useState('')
  const [saving, setSaving] = useState(false)

  const [editingTeam, setEditingTeam] = useState(false)
  const [draftTeamName, setDraftTeamName] = useState('')
  const [draftTeamDesc, setDraftTeamDesc] = useState('')
  const [draftTeamLogoTmp, setDraftTeamLogoTmp] = useState('')
  const [currentTeamLogoUrl, setCurrentTeamLogoUrl] = useState('')
  const [savingTeam, setSavingTeam] = useState(false)

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
      await userApi.updateProfile({ nickname: draftNickname || undefined, avatarUrl: ossUrl })
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

  const roleBadgeStyle = (role: MemberRole) => {
    if (role === 'CAPTAIN') return { bg: 'rgba(255,183,0,0.18)', text: '#ffb700' }
    if (role === 'ADMIN')   return { bg: 'rgba(77,166,255,0.18)', text: '#4da6ff' }
    return { bg: 'rgba(255,255,255,0.07)', text: C.text2 }
  }

  const logout = () => {
    Taro.showModal({
      title: t('my.logout_title'), content: t('my.logout_content'),
      success: ({ confirm }) => {
        if (confirm) { clear(); Taro.reLaunch({ url: '/pages/login/index' }) }
      },
    })
  }

  const leaveTeam = () => {
    if (!currentTeamId) return
    Taro.showModal({
      title: '确认退出', content: '确定要退出当前球队吗？',
      success: async ({ confirm }) => {
        if (!confirm) return
        try {
          await teamApi.leave(currentTeamId)
          Taro.showToast({ title: '已退出球队', icon: 'success' })
          setTimeout(() => { clear(); Taro.reLaunch({ url: '/pages/login/index' }) }, 1000)
        } catch (e: unknown) {
          Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
        }
      },
    })
  }

  const transferCaptain = async () => {
    if (!currentTeamId) return
    try {
      const members = await teamApi.listMembers(currentTeamId)
      const candidates = members.filter(m => m.status === 'ACTIVE' && m.userId !== userId)
      if (candidates.length === 0) {
        Taro.showToast({ title: '队内暂无其他队员', icon: 'none' }); return
      }
      Taro.showActionSheet({
        itemList: candidates.map(m => m.nickname),
        success: ({ tapIndex }) => {
          const target = candidates[tapIndex]
          Taro.showModal({
            title: '确认转让队长',
            content: `确定将队长身份转让给「${target.nickname}」吗？转让后你将成为普通队员。`,
            success: async ({ confirm }) => {
              if (!confirm) return
              try {
                await teamApi.setRole(currentTeamId, target.userId, 'CAPTAIN')
                Taro.showToast({ title: '已转让队长', icon: 'success' })
                setTimeout(() => { clear(); Taro.reLaunch({ url: '/pages/login/index' }) }, 1500)
              } catch (e: unknown) {
                Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
              }
            },
          })
        },
      })
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
    }
  }

  const openTeamEdit = async () => {
    if (!currentTeamId) return
    try {
      const team = await teamApi.getTeam(currentTeamId)
      setDraftTeamName(team.name)
      setDraftTeamDesc(team.description ?? '')
      setDraftTeamLogoTmp('')
      setCurrentTeamLogoUrl(team.logoUrl ?? '')
      setEditingTeam(true)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
    }
  }

  const pickTeamLogo = () => {
    Taro.chooseImage({
      count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: (res) => setDraftTeamLogoTmp(res.tempFilePaths[0]),
    })
  }

  const saveTeamInfo = async () => {
    if (savingTeam || !currentTeamId) return
    setSavingTeam(true)
    try {
      let logoUrl: string | undefined
      if (draftTeamLogoTmp) {
        const { url } = await uploadApi.avatar(draftTeamLogoTmp)
        logoUrl = url
      }
      await teamApi.updateTeam(currentTeamId, {
        name: draftTeamName.trim() || undefined,
        description: draftTeamDesc.trim() || undefined,
        logoUrl,
      })
      Taro.showToast({ title: '已保存', icon: 'success' })
      setEditingTeam(false)
      load()
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
    } finally {
      setSavingTeam(false)
    }
  }

  const draftAvatarDisplay = draftAvatarTmp || avatarUrl || ''

  return (
    <View style={{ minHeight: '100%', background: C.bg }}>
      <ScrollView scrollY style={{ minHeight: '100%' }}>

        {/* ── Profile Banner ── edge-to-edge, no card wrapper */}
        <View style={{
          background: 'linear-gradient(160deg, #162016 0%, #111410 50%, #0f1010 100%)',
          padding: `${px(22)} ${px(20)} ${px(18)}`,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <View style={{ display: 'flex', alignItems: 'center', gap: px(16) }}>
            {/* Avatar */}
            <View onClick={openEdit} style={{ position: 'relative', flexShrink: 0 }}>
              {avatarUrl
                ? <Image src={avatarUrl} style={{
                    width: px(88), height: px(88), borderRadius: '50%',
                    border: `2.5px solid rgba(34,197,94,0.5)`,
                  }} />
                : <View style={{
                    width: px(88), height: px(88), borderRadius: '50%',
                    background: C.surface2, border: `2.5px solid rgba(34,197,94,0.3)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: px(60) }}>👤</Text>
                  </View>
              }
              <View style={{
                position: 'absolute', bottom: px(0), right: px(0),
                width: px(26), height: px(26), borderRadius: '50%',
                background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid #0f1010`,
              }}>
                <Text style={{ color: '#0f1010', fontSize: px(18), fontWeight: '700' }}>✎</Text>
              </View>
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: px(36), fontWeight: '800', color: C.text,
                letterSpacing: '-0.01em', display: 'block', marginBottom: px(8),
              }}>
                {nickname ?? '球员'}
              </Text>
              <View style={{ display: 'flex', alignItems: 'center', gap: px(8), flexWrap: 'wrap' }}>
                <View style={{
                  background: roleBadgeStyle(currentRole ?? 'PLAYER').bg,
                  padding: `${px(3)} ${px(10)}`, borderRadius: '9999px',
                }}>
                  <Text style={{ fontSize: px(22), fontWeight: '700',
                                 color: roleBadgeStyle(currentRole ?? 'PLAYER').text }}>
                    {roleLabel(currentRole ?? 'PLAYER')}
                  </Text>
                </View>
                <Text style={{ fontSize: px(22), color: C.text3 }}>ID {userId ?? '-'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Teams ── */}
        <View style={{ padding: `${px(16)} ${px(16)} 0` }}>
          <SectionTitle label={t('my.teams')} />
          <View style={{ background: C.surface, borderRadius: px(16), border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {teams.map((tm, idx) => (
              <View key={tm.teamId}>
                <View
                  onClick={() => switchTeam(tm.teamId, tm.role)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: px(12),
                    padding: `${px(12)} ${px(16)}`,
                    background: tm.teamId === currentTeamId ? C.primaryDim : 'transparent',
                  }}
                >
                  <View style={{
                    width: px(38), height: px(38), borderRadius: px(10), flexShrink: 0,
                    background: `hsl(${((tm.teamId * 137) % 360)}, 40%, 18%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: px(32) }}>⚽</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: px(30), fontWeight: '600', color: C.text, display: 'block' }}>
                      {tm.teamName}
                    </Text>
                    <Text style={{ fontSize: px(24), color: roleBadgeStyle(tm.role).text, marginTop: px(1) }}>
                      {roleLabel(tm.role)}
                    </Text>
                  </View>
                  {tm.teamId === currentTeamId
                    ? <Text style={{ fontSize: px(22), color: C.primary, fontWeight: '700',
                                     background: C.primaryDim, borderRadius: '9999px', padding: '3px 9px' }}>
                        当前
                      </Text>
                    : <Text style={{ fontSize: px(32), color: C.text3 }}>›</Text>
                  }
                </View>
                {idx < teams.length - 1 && <View style={{ height: '1px', background: C.border, marginLeft: px(16) }} />}
              </View>
            ))}
            <View style={{ height: '1px', background: C.border }} />
            <View
              onClick={() => Taro.navigateTo({ url: '/pages/onboard/index' })}
              style={{ padding: `${px(12)} ${px(16)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: px(28), color: C.primary, fontWeight: '700' }}>
                + {t('my.join_create')}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Stats ── ratio bar */}
        {stats && (() => {
          const total = stats.totalMatches || 1
          const winPct  = Math.round(stats.wins   / total * 100)
          const drawPct = Math.round(stats.draws  / total * 100)
          const losePct = 100 - winPct - drawPct
          return (
            <View style={{ padding: `${px(14)} ${px(16)} 0` }}>
              <SectionTitle label={t('my.stats')} />
              <View style={{
                background: C.surface, borderRadius: px(16),
                border: `1px solid ${C.border}`, overflow: 'hidden',
              }}>
                {/* total matches */}
                <View style={{
                  padding: `${px(14)} ${px(16)} ${px(10)}`,
                  display: 'flex', alignItems: 'baseline', gap: px(6),
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <Text style={{ fontSize: px(46), fontWeight: '900', color: C.text, lineHeight: '1', letterSpacing: '-0.03em' }}>
                    {stats.totalMatches}
                  </Text>
                  <Text style={{ fontSize: px(22), color: C.text3, fontWeight: '600' }}>场</Text>
                  <Text style={{ fontSize: px(20), color: C.text3, marginLeft: 'auto' }}>本队出场</Text>
                </View>

                {/* proportion bar */}
                <View style={{ padding: `${px(12)} ${px(16)} 0` }}>
                  <View style={{
                    display: 'flex', height: px(10), borderRadius: px(5), overflow: 'hidden',
                    gap: '2px',
                  }}>
                    {winPct > 0 && (
                      <View style={{ flex: winPct, background: C.win, borderRadius: `${px(5)} 0 0 ${px(5)}` }} />
                    )}
                    {drawPct > 0 && (
                      <View style={{ flex: drawPct, background: C.draw }} />
                    )}
                    {losePct > 0 && (
                      <View style={{ flex: losePct, background: C.lose, borderRadius: `0 ${px(5)} ${px(5)} 0` }} />
                    )}
                  </View>
                </View>

                {/* W / D / L columns */}
                <View style={{ display: 'flex', padding: `${px(12)} ${px(8)} ${px(14)}` }}>
                  {[
                    { label: '胜', value: stats.wins,   pct: winPct,  color: C.win  },
                    { label: '平', value: stats.draws,  pct: drawPct, color: C.draw },
                    { label: '负', value: stats.losses, pct: losePct, color: C.lose },
                  ].map((item, idx) => (
                    <View key={idx} style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center',
                      borderLeft: idx > 0 ? `1px solid ${C.border}` : 'none',
                    }}>
                      <View style={{
                        width: px(7), height: px(7), borderRadius: '50%',
                        background: item.color, marginBottom: px(5),
                      }} />
                      <Text style={{ fontSize: px(40), fontWeight: '900', color: item.color,
                                     lineHeight: '1', letterSpacing: '-0.02em' }}>
                        {item.value}
                      </Text>
                      <Text style={{ fontSize: px(20), color: C.text3, marginTop: px(3) }}>
                        {item.label} {item.pct}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )
        })()}

        {/* ── Settings ── */}
        <View style={{ padding: `${px(14)} ${px(16)} 0` }}>
          <SectionTitle label='设置' />
          <View style={{ background: C.surface, borderRadius: px(16), border: `1px solid ${C.border}`, overflow: 'hidden' }}>

            {/* Invite teammates — all members */}
            <Button
              openType='share'
              style={{
                display: 'flex', flexDirection: 'row', alignItems: 'center', gap: px(14),
                padding: `${px(13)} ${px(16)}`,
                background: 'transparent', border: 'none', margin: 0,
                width: '100%', textAlign: 'left', lineHeight: 'normal', borderRadius: 0,
              }}
            >
              <Text style={{ fontSize: px(32), width: px(40), textAlign: 'center' }}>👥</Text>
              <Text style={{ flex: 1, fontSize: px(30), color: C.text, fontWeight: '500' }}>邀请队友</Text>
              <Text style={{ fontSize: px(28), color: C.text3 }}>›</Text>
            </Button>

            {/* Captain-only settings */}
            {currentRole === 'CAPTAIN' && (
              <>
                <View style={{ height: '1px', background: C.border, marginLeft: px(54) }} />
                <View onClick={transferCaptain}
                  style={{ display: 'flex', alignItems: 'center', gap: px(14), padding: `${px(13)} ${px(16)}` }}>
                  <Text style={{ fontSize: px(32), width: px(40), textAlign: 'center' }}>👑</Text>
                  <Text style={{ flex: 1, fontSize: px(30), color: '#ffb700', fontWeight: '500' }}>转让队长</Text>
                  <Text style={{ fontSize: px(28), color: C.text3 }}>›</Text>
                </View>
                <View style={{ height: '1px', background: C.border, marginLeft: px(54) }} />
                <View onClick={openTeamEdit}
                  style={{ display: 'flex', alignItems: 'center', gap: px(14), padding: `${px(13)} ${px(16)}` }}>
                  <Text style={{ fontSize: px(32), width: px(40), textAlign: 'center' }}>🛡️</Text>
                  <Text style={{ flex: 1, fontSize: px(30), color: C.text, fontWeight: '500' }}>编辑球队信息</Text>
                  <Text style={{ fontSize: px(28), color: C.text3 }}>›</Text>
                </View>
              </>
            )}
            {(currentRole === 'CAPTAIN' || currentRole === 'ADMIN') && (
              <>
                <View style={{ height: '1px', background: C.border, marginLeft: px(54) }} />
                <View onClick={() => Taro.navigateTo({ url: '/pages/team-poster/index' })}
                  style={{ display: 'flex', alignItems: 'center', gap: px(14), padding: `${px(13)} ${px(16)}` }}>
                  <Text style={{ fontSize: px(32), width: px(40), textAlign: 'center' }}>🪪</Text>
                  <Text style={{ flex: 1, fontSize: px(30), color: C.primary, fontWeight: '500' }}>生成球队名片</Text>
                  <Text style={{ fontSize: px(28), color: C.text3 }}>›</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── Exit actions — side by side ── */}
        <View style={{ padding: `${px(12)} ${px(16)} ${px(24)}`, display: 'flex', gap: px(10) }}>
          {currentRole !== 'CAPTAIN' && (
            <View
              onClick={leaveTeam}
              style={{
                flex: 1, display: 'flex', flexDirection: 'row',
                alignItems: 'center', justifyContent: 'center', gap: px(10),
                background: C.surface, borderRadius: px(14), padding: `${px(16)} 0`,
                border: `1px solid ${C.border}`,
              }}
            >
              <Text style={{ fontSize: px(34) }}>🚪</Text>
              <Text style={{ fontSize: px(28), color: C.lose, fontWeight: '600' }}>{t('my.leave')}</Text>
            </View>
          )}
          <View
            onClick={logout}
            style={{
              flex: 1, display: 'flex', flexDirection: 'row',
              alignItems: 'center', justifyContent: 'center', gap: px(10),
              background: C.surface, borderRadius: px(14), padding: `${px(16)} 0`,
              border: `1px solid ${C.border}`,
            }}
          >
            <Text style={{ fontSize: px(34) }}>↩️</Text>
            <Text style={{ fontSize: px(28), color: C.text2, fontWeight: '500' }}>{t('my.logout')}</Text>
          </View>
        </View>

        <View style={{ height: px(80) }} />
      </ScrollView>

      {/* ── Edit Team Sheet ── */}
      {editingTeam && (
        <View style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', display: 'flex',
          flexDirection: 'column', justifyContent: 'flex-end', zIndex: 100,
        }}>
          <View style={{
            background: C.surface2, borderRadius: `${px(24)} ${px(24)} 0 0`,
            padding: `${px(20)} ${px(24)} ${px(40)}`,
            border: `1px solid ${C.border}`, borderBottom: 'none',
          }}>
            <View style={{ width: px(36), height: px(4), borderRadius: px(2),
                           background: C.border, margin: '0 auto', marginBottom: px(24) }} />
            <Text style={{ fontSize: px(36), fontWeight: '800', color: C.text,
                           textAlign: 'center', display: 'block', marginBottom: px(24) }}>
              编辑球队信息
            </Text>

            {/* Logo picker */}
            <View style={{ display: 'flex', justifyContent: 'center', marginBottom: px(24) }}>
              <View onClick={pickTeamLogo} style={{ position: 'relative' }}>
                {(draftTeamLogoTmp || currentTeamLogoUrl)
                  ? <Image src={draftTeamLogoTmp || currentTeamLogoUrl} style={{
                      width: px(88), height: px(88), borderRadius: px(20),
                      border: `3px solid ${C.primary}`,
                    }} />
                  : <View style={{
                      width: px(88), height: px(88), borderRadius: px(20),
                      background: C.surface3, border: `2px dashed rgba(34,197,94,0.3)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: px(56) }}>🛡️</Text>
                    </View>
                }
                <View style={{
                  position: 'absolute', bottom: px(0), right: px(0),
                  width: px(24), height: px(24), borderRadius: '50%',
                  background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid #1e2420`,
                }}>
                  <Text style={{ color: '#0f1010', fontSize: px(20), fontWeight: '700' }}>✎</Text>
                </View>
              </View>
            </View>

            {/* Team name */}
            <Text style={{ fontSize: px(24), fontWeight: '600', color: C.text3,
                           marginBottom: px(8), display: 'block',
                           letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              球队名称
            </Text>
            <Input
              value={draftTeamName}
              onInput={(e) => setDraftTeamName(e.detail.value)}
              placeholder='请输入球队名称'
              style={{
                height: px(48), border: `1px solid ${C.border}`, borderRadius: px(12),
                padding: '0 16px', fontSize: px(32), background: C.surface, color: C.text,
                marginBottom: px(16),
              }}
            />

            {/* Description */}
            <Text style={{ fontSize: px(24), fontWeight: '600', color: C.text3,
                           marginBottom: px(8), display: 'block',
                           letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              一句话介绍
            </Text>
            <Input
              value={draftTeamDesc}
              onInput={(e) => setDraftTeamDesc(e.detail.value)}
              placeholder='球队的一句话简介（选填）'
              style={{
                height: px(48), border: `1px solid ${C.border}`, borderRadius: px(12),
                padding: '0 16px', fontSize: px(32), background: C.surface, color: C.text,
                marginBottom: px(24),
              }}
            />

            <View style={{ display: 'flex', gap: px(12) }}>
              <Button
                style={{ flex: 1, height: px(50), lineHeight: px(50), background: 'rgba(255,255,255,0.06)',
                         color: C.text2, border: 'none', borderRadius: px(12), fontSize: px(30), fontWeight: '500' }}
                onClick={() => setEditingTeam(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                style={{ flex: 1, height: px(50), lineHeight: px(50), background: C.primary,
                         color: '#0f1010', border: 'none', borderRadius: px(12), fontSize: px(30), fontWeight: '700' }}
                loading={savingTeam}
                onClick={saveTeamInfo}
              >
                {t('common.save')}
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* ── Edit Profile Sheet ── */}
      {editing && (
        <View style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', display: 'flex',
          flexDirection: 'column', justifyContent: 'flex-end', zIndex: 100,
        }}>
          <View style={{
            background: C.surface2, borderRadius: `${px(24)} ${px(24)} 0 0`,
            padding: `${px(20)} ${px(24)} ${px(40)}`,
            border: `1px solid ${C.border}`, borderBottom: 'none',
          }}>
            <View style={{ width: px(36), height: px(4), borderRadius: px(2),
                           background: C.border, margin: '0 auto', marginBottom: px(24) }} />
            <Text style={{ fontSize: px(36), fontWeight: '800', color: C.text,
                           textAlign: 'center', display: 'block', marginBottom: px(24) }}>
              {t('my.edit_profile')}
            </Text>

            {/* Avatar picker */}
            <View style={{ display: 'flex', justifyContent: 'center', marginBottom: px(24) }}>
              <Button
                openType="chooseAvatar"
                onChooseAvatar={(e) => setDraftAvatarTmp((e as unknown as { detail: { avatarUrl: string } }).detail.avatarUrl)}
                style={{ background: 'transparent', border: 'none', padding: 0,
                         width: px(88), height: px(88), borderRadius: '50%' }}
              >
                {draftAvatarDisplay
                  ? <Image src={draftAvatarDisplay} style={{
                      width: px(88), height: px(88), borderRadius: '50%',
                      border: `3px solid ${C.primary}`,
                    }} />
                  : <View style={{ width: px(88), height: px(88), borderRadius: '50%',
                                   background: C.surface3, display: 'flex', alignItems: 'center',
                                   justifyContent: 'center', border: `2px dashed rgba(34,197,94,0.3)` }}>
                      <Text style={{ fontSize: px(60) }}>👤</Text>
                    </View>
                }
              </Button>
            </View>

            {/* Nickname */}
            <Text style={{ fontSize: px(24), fontWeight: '600', color: C.text3,
                           marginBottom: px(8), display: 'block',
                           letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              昵称
            </Text>
            <Input
              type="nickname"
              value={draftNickname}
              onInput={(e) => setDraftNickname(e.detail.value)}
              placeholder={t('login.nickname_placeholder')}
              style={{
                height: px(48), border: `1px solid ${C.border}`, borderRadius: px(12),
                padding: '0 16px', fontSize: px(32), background: C.surface, color: C.text,
                marginBottom: px(24),
              }}
            />

            <View style={{ display: 'flex', gap: px(12) }}>
              <Button
                style={{ flex: 1, height: px(50), lineHeight: px(50), background: 'rgba(255,255,255,0.06)',
                         color: C.text2, border: 'none', borderRadius: px(12), fontSize: px(30), fontWeight: '500' }}
                onClick={() => setEditing(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                style={{ flex: 1, height: px(50), lineHeight: px(50), background: C.primary,
                         color: '#0f1010', border: 'none', borderRadius: px(12), fontSize: px(30), fontWeight: '700' }}
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
