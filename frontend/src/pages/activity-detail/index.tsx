import { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'
import type { ActivityDetailRes, RegStatus } from '../../types/api'
import { useT } from '../../i18n/useT'
import { px } from '../../utils/style'

const C = {
  primary: '#00e472',
  primaryDim: 'rgba(0,228,114,0.12)',
  bg: '#0b0f18',
  surface: '#131a27',
  surface2: '#1a2235',
  border: 'rgba(255,255,255,0.07)',
  borderMed: 'rgba(255,255,255,0.12)',
  text: '#e8f0fb',
  text2: '#7a8ca3',
  text3: '#364a60',
  win: '#00e472',
  draw: '#ffb700',
  lose: '#ff4d5a',
}

// RSVP_BAR_HEIGHT — reserve this space at the bottom of the scroll area
const RSVP_H = 80

export default function ActivityDetailPage() {
  const [detail, setDetail] = useState<ActivityDetailRes | null>(null)
  const t = useT()
  const { isCaptainOrAdmin, currentTeamId } = useAuthStore()
  const activityId = Number(Taro.getCurrentInstance().router?.params?.id)

  useShareAppMessage(() => ({
    title: detail?.activity.title ?? '球队活动',
    path: `/pages/activity-detail/index?id=${activityId}&teamId=${currentTeamId}`,
    imageUrl: '/assets/images/share-cover.png',
  }))

  useDidShow(() => {
    Taro.showShareMenu({ withShareTicket: false, showShareItems: ['shareAppMessage'] })
  })

  useEffect(() => {
    if (!activityId) return
    activityApi.detail(activityId)
      .then(setDetail)
      .catch(() => Taro.showToast({ title: t('act.load_fail'), icon: 'none' }))
  }, [activityId])

  if (!detail) {
    return (
      <View style={{ height: '100%', background: C.bg, display: 'flex',
                     alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.text3 }}>{t('common.loading')}</Text>
      </View>
    )
  }

  const a = detail.activity
  const isOpen = a.status === 'OPEN' && !(a.deadline && new Date(a.deadline) < new Date())

  const handleRegister = async (status: RegStatus) => {
    try {
      if (a.myStatus === status) {
        await activityApi.cancelRegister(activityId)
      } else {
        await activityApi.register(activityId, status)
      }
      const updated = await activityApi.detail(activityId)
      setDetail(updated)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : t('common.error'), icon: 'none' })
    }
  }

  const handleClose = async () => {
    try {
      await activityApi.close(activityId)
      Taro.showToast({ title: '已关闭报名', icon: 'success' })
      setDetail(await activityApi.detail(activityId))
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : t('common.error'), icon: 'none' })
    }
  }

  const joined    = detail.registrations.filter(r => r.status === 'JOINED')
  const tentative = detail.registrations.filter(r => r.status === 'TENTATIVE')
  const absent    = detail.registrations.filter(r => r.status === 'ABSENT')

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const outcomeColor = detail.result?.outcome === 'WIN' ? C.win
    : detail.result?.outcome === 'LOSE' ? C.lose : C.draw

  // Who is in: hero color for open, muted for closed
  const heroAccent = isOpen ? C.primary : C.text3

  const RegGroup = ({ label, list, color }: { label: string; list: typeof joined; color: string }) => {
    if (list.length === 0) return null
    return (
      <View style={{ marginBottom: px(16) }}>
        <View style={{ display: 'flex', alignItems: 'center', gap: px(6), marginBottom: px(10) }}>
          <View style={{ width: px(6), height: px(6), borderRadius: '50%', background: color }} />
          <Text style={{ fontSize: px(26), fontWeight: '700', color }}>
            {label} · {list.length}人
          </Text>
        </View>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: px(8) }}>
          {list.map(r => (
            <View key={r.userId} style={{
              display: 'flex', alignItems: 'center', gap: px(6),
              background: C.surface2, borderRadius: '9999px',
              padding: `${px(5)} ${px(10)} ${px(5)} ${px(6)}`,
              border: `1px solid ${C.border}`,
            }}>
              {r.avatarUrl
                ? <Image src={r.avatarUrl} style={{ width: px(22), height: px(22), borderRadius: '50%' }} />
                : <View style={{ width: px(22), height: px(22), borderRadius: '50%', background: C.surface2,
                                 display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: px(22) }}>👤</Text>
                  </View>
              }
              <Text style={{ fontSize: px(24), color: C.text }}>{r.nickname}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <View style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg }}>

      {/* Scrollable body */}
      <ScrollView scrollY style={{ flex: 1 }}>

        {/* ── Hero title section — no card, part of the page itself ── */}
        <View style={{
          background: `linear-gradient(160deg, ${isOpen ? '#0e2d1e' : '#131a27'} 0%, #0b0f18 100%)`,
          padding: `${px(20)} ${px(18)} ${px(22)}`,
          borderBottom: `1px solid ${C.border}`,
        }}>
          {/* Status chip + type */}
          <View style={{ display: 'flex', alignItems: 'center', gap: px(8), marginBottom: px(12) }}>
            <View style={{ display: 'flex', alignItems: 'center', gap: px(5) }}>
              {isOpen && <View style={{ width: px(6), height: px(6), borderRadius: '50%', background: C.primary }} />}
              <Text style={{
                fontSize: px(22), fontWeight: '700',
                color: isOpen ? C.primary : C.text3,
                background: isOpen ? C.primaryDim : 'rgba(255,255,255,0.05)',
                borderRadius: '9999px', padding: '3px 10px',
                letterSpacing: '0.05em',
              }}>
                {isOpen ? '报名中' : a.status === 'FINISHED' ? '已结束' : '已关闭'}
              </Text>
            </View>
            <Text style={{
              fontSize: px(22), color: C.text3, background: 'rgba(255,255,255,0.05)',
              borderRadius: '9999px', padding: '3px 10px', fontWeight: '500',
            }}>
              {a.type === 'MATCH' ? '⚽ 比赛' : '🏃 训练'}
            </Text>
            {a.myStatus && (
              <Text style={{
                fontSize: px(22), fontWeight: '700',
                color: a.myStatus === 'JOINED' ? C.win : a.myStatus === 'TENTATIVE' ? C.draw : C.text3,
                background: a.myStatus === 'JOINED' ? 'rgba(0,228,114,0.12)'
                  : a.myStatus === 'TENTATIVE' ? 'rgba(255,183,0,0.12)' : 'rgba(255,255,255,0.05)',
                borderRadius: '9999px', padding: '3px 10px',
              }}>
                {a.myStatus === 'JOINED' ? t('act.badge_joined') : a.myStatus === 'TENTATIVE'
                  ? t('act.badge_tentative') : t('act.badge_absent')}
              </Text>
            )}
          </View>

          {/* Title — the biggest element */}
          <Text style={{
            fontSize: px(44), fontWeight: '900', color: C.text,
            display: 'block', lineHeight: '1.3', letterSpacing: '-0.02em',
            marginBottom: a.opponent ? px(6) : px(16),
          }}>
            {a.title}
          </Text>

          {a.opponent && (
            <Text style={{ fontSize: px(30), color: C.text2, display: 'block', marginBottom: px(16) }}>
              ⚔️ vs {a.opponent}
            </Text>
          )}

          {/* Meta strip — horizontal layout */}
          <View style={{ display: 'flex', gap: px(16) }}>
            <View style={{ display: 'flex', alignItems: 'center', gap: px(6), flex: 1 }}>
              <Text style={{ fontSize: px(24), color: heroAccent }}>📍</Text>
              <Text style={{ fontSize: px(26), color: C.text2, flex: 1 }} numberOfLines={1}>
                {a.location}
              </Text>
            </View>
            <View style={{ display: 'flex', alignItems: 'center', gap: px(6) }}>
              <Text style={{ fontSize: px(24), color: heroAccent }}>🕐</Text>
              <Text style={{ fontSize: px(26), color: C.text2 }}>{fmtDate(a.startTime)}</Text>
            </View>
          </View>

          {a.deadline && (
            <Text style={{ fontSize: px(24), color: C.text3, marginTop: px(8), display: 'block' }}>
              ⏰ 报名截止 {fmtDate(a.deadline)}
            </Text>
          )}
        </View>

        {/* ── Match result — centred, large numbers ── */}
        {detail.result && (
          <View style={{
            padding: `${px(28)} ${px(18)}`,
            textAlign: 'center',
            borderBottom: `1px solid ${C.border}`,
            background: `linear-gradient(180deg, ${outcomeColor}08 0%, transparent 100%)`,
          }}>
            <Text style={{ fontSize: px(22), color: C.text3, display: 'block',
                           marginBottom: px(12), letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {t('act.result')}
            </Text>

            {/* Score */}
            <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: px(16) }}>
              <Text style={{ fontSize: px(100), fontWeight: '900', color: C.text,
                             letterSpacing: '-0.04em', lineHeight: '1' }}>
                {detail.result.ourScore}
              </Text>
              <Text style={{ fontSize: px(44), color: C.text3, fontWeight: '300' }}>:</Text>
              <Text style={{ fontSize: px(100), fontWeight: '900', color: C.text3,
                             letterSpacing: '-0.04em', lineHeight: '1' }}>
                {detail.result.oppScore}
              </Text>
            </View>

            {/* Outcome badge */}
            <View style={{ display: 'flex', justifyContent: 'center', marginTop: px(14) }}>
              <Text style={{
                fontSize: px(28), fontWeight: '800', color: outcomeColor,
                background: `${outcomeColor}18`,
                border: `1px solid ${outcomeColor}33`,
                borderRadius: '9999px', padding: `${px(6)} ${px(20)}`,
                letterSpacing: '0.05em',
              }}>
                {detail.result.outcome === 'WIN' ? t('act.win')
                  : detail.result.outcome === 'LOSE' ? t('act.lose') : t('act.draw')}
              </Text>
            </View>
          </View>
        )}

        {/* ── Registrations ── */}
        <View style={{ padding: `${px(20)} ${px(18)}`, borderBottom: `1px solid ${C.border}` }}>
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                         marginBottom: px(16) }}>
            <Text style={{ fontSize: px(30), fontWeight: '800', color: C.text }}>
              {t('act.registrations')}
            </Text>
            <Text style={{ fontSize: px(26), color: C.text3, fontWeight: '500' }}>
              {a.registeredCount}{a.maxPlayers ? `/${a.maxPlayers}` : ''} 人
            </Text>
          </View>

          <RegGroup label={t('act.joined_count')}    list={joined}    color={C.win} />
          <RegGroup label={t('act.tentative_count')} list={tentative} color={C.draw} />
          <RegGroup label={t('act.absent_count')}    list={absent}    color={C.text3} />

          {detail.registrations.length === 0 && (
            <Text style={{ color: C.text3, fontSize: px(28), textAlign: 'center',
                           padding: `${px(20)} 0`, display: 'block' }}>
              {t('act.no_regs')}
            </Text>
          )}
        </View>

        {/* ── Admin actions ── */}
        {(isCaptainOrAdmin()) && (
          <View style={{ padding: `${px(16)} ${px(18)} ${isOpen ? px(16 + RSVP_H) : px(40)}` }}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: px(10) }}>
              {isCaptainOrAdmin() && isOpen && (
                <Button
                  style={{
                    background: 'rgba(255,255,255,0.05)', color: C.text2,
                    border: `1px solid ${C.border}`, borderRadius: px(12),
                    fontSize: px(28), padding: `${px(13)} 0`,
                  }}
                  onClick={handleClose}
                >
                  {t('act.close')}
                </Button>
              )}
              {isCaptainOrAdmin() && a.status === 'OPEN' && (
                <Button
                  style={{
                    background: 'rgba(77,166,255,0.12)', color: '#4da6ff',
                    border: '1px solid rgba(77,166,255,0.25)', borderRadius: px(12),
                    fontSize: px(28), padding: `${px(13)} 0`,
                  }}
                  onClick={() => Taro.navigateTo({ url: `/pages/activity-create/index?editId=${activityId}` })}
                >
                  {t('act.edit')}
                </Button>
              )}
              {isCaptainOrAdmin() && a.type === 'MATCH' && a.status !== 'OPEN' && !detail.result && (
                <Button
                  style={{
                    background: 'rgba(255,183,0,0.12)', color: C.draw,
                    border: '1px solid rgba(255,183,0,0.25)', borderRadius: px(12),
                    fontSize: px(28), padding: `${px(13)} 0`,
                  }}
                  onClick={() => Taro.navigateTo({ url: `/pages/activity-create/index?resultFor=${activityId}` })}
                >
                  {t('act.record')}
                </Button>
              )}
              {isCaptainOrAdmin() && a.type === 'TRAINING' && (a.status === 'OPEN' || a.status === 'CLOSED') && (
                <Button
                  style={{
                    background: 'rgba(0,228,114,0.12)', color: '#00e472',
                    border: '1px solid rgba(0,228,114,0.25)', borderRadius: px(12),
                    fontSize: px(28), padding: `${px(13)} 0`,
                  }}
                  onClick={() =>
                    Taro.navigateTo({
                      url: `/pages/grouping/index?activityId=${activityId}&title=${encodeURIComponent(a.title)}&startTime=${encodeURIComponent(a.startTime)}&location=${encodeURIComponent(a.location ?? '')}&status=${a.status}`,
                    })
                  }
                >
                  分组管理
                </Button>
              )}
              <Button
                openType='share'
                style={{
                  background: C.primaryDim, color: C.primary,
                  border: `1px solid rgba(0,228,114,0.18)`, borderRadius: px(12),
                  fontSize: px(28), padding: `${px(13)} 0`,
                }}
              >
                {t('act.share')}
              </Button>
            </View>
          </View>
        )}

        {/* Bottom padding when RSVP bar is showing and there are no admin actions */}
        {isOpen && !isCaptainOrAdmin() && (
          <View style={{ height: px(RSVP_H + 16) }} />
        )}
      </ScrollView>

      {/* ── Sticky RSVP bar — only when activity is open ── */}
      {isOpen && (
        <View style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: C.surface,
          borderTop: `1px solid ${C.borderMed}`,
          padding: `${px(12)} ${px(14)} ${px(20)}`,
          display: 'flex',
          gap: px(8),
        }}>
          {([
            { status: 'JOINED'    as RegStatus, label: t('act.status_joined'),    active: C.win,  activeBg: 'rgba(0,228,114,0.12)' },
            { status: 'TENTATIVE' as RegStatus, label: t('act.status_tentative'), active: C.draw, activeBg: 'rgba(255,183,0,0.12)' },
            { status: 'ABSENT'    as RegStatus, label: t('act.status_absent'),    active: C.lose, activeBg: 'rgba(255,77,90,0.12)' },
          ]).map(btn => {
            const isActive = a.myStatus === btn.status
            return (
              <Button
                key={btn.status}
                style={{
                  flex: 1,
                  background: isActive ? btn.activeBg : 'rgba(255,255,255,0.05)',
                  color: isActive ? btn.active : C.text2,
                  border: `1px solid ${isActive ? btn.active + '44' : C.border}`,
                  borderRadius: px(10),
                  fontSize: px(26),
                  fontWeight: isActive ? '700' : '400',
                  padding: `${px(10)} 0`,
                }}
                onClick={() => handleRegister(btn.status)}
              >
                {btn.label}
              </Button>
            )
          })}
        </View>
      )}
    </View>
  )
}
