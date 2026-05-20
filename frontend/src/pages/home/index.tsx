import { useState } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import type { ActivityRes, ActivityDetailRes, RegStatus } from '../../types/api'
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
  win: '#22c55e',
  draw: '#ffb700',
  lose: '#ff4d5a',
}

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

// Hero card for the next upcoming activity — shows roster + RSVP buttons
function FeaturedCard({
  a,
  detail,
  onPress,
  onRsvp,
}: {
  a: ActivityRes
  detail: ActivityDetailRes | null
  onPress: () => void
  onRsvp: (status: RegStatus) => void
}) {
  const d = new Date(a.startTime)
  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日 周${WEEK[d.getDay()]}`
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  const joined = detail?.registrations.filter(r => r.status === 'JOINED') ?? []
  const MAX_AV = 6
  const extra = Math.max(0, joined.length - MAX_AV)
  const visibleAv = joined.slice(0, MAX_AV)

  const rsvpBtns: { status: RegStatus; label: string; color: string; dimBg: string }[] = [
    { status: 'JOINED',    label: '参加', color: C.win,  dimBg: 'rgba(34,197,94,0.14)' },
    { status: 'TENTATIVE', label: '观望', color: C.draw, dimBg: 'rgba(255,183,0,0.14)' },
    { status: 'ABSENT',    label: '不去', color: C.lose, dimBg: 'rgba(255,77,90,0.12)' },
  ]

  return (
    <View
      onClick={onPress}
      style={{
        background: 'linear-gradient(150deg, #0b2a10 0%, #0c2212 55%, #0f1010 100%)',
        borderRadius: px(22),
        marginBottom: px(14),
        border: `1px solid rgba(34,197,94,0.22)`,
        overflow: 'hidden',
      }}
    >
      {/* ── Top info section ── */}
      <View style={{ padding: `${px(18)} ${px(18)} ${px(14)}` }}>
        {/* Meta row */}
        <View style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: px(14),
        }}>
          <View style={{ display: 'flex', alignItems: 'center', gap: px(8) }}>
            <View style={{
              width: px(7), height: px(7), borderRadius: '50%',
              background: C.primary,
              boxShadow: `0 0 6px ${C.primary}`,
            }} />
            <Text style={{ fontSize: px(26), color: C.text2, fontWeight: '500' }}>
              {dateStr} · {timeStr}
            </Text>
          </View>
          <Text style={{
            fontSize: px(24), color: C.primary, fontWeight: '700',
            background: C.primaryDim, borderRadius: '9999px', padding: '3px 12px',
            border: '1px solid rgba(34,197,94,0.25)',
          }}>
            报名中
          </Text>
        </View>

        {/* Title */}
        <Text style={{
          fontSize: px(48), fontWeight: '900', color: C.text,
          display: 'block', letterSpacing: '-0.02em', lineHeight: '1.25',
          marginBottom: px(10),
        }}>
          {a.title}
        </Text>

        {/* Location + capacity */}
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Text style={{ fontSize: px(28), color: C.text2, flex: 1 }} numberOfLines={1}>
            📍 {a.location}
          </Text>
          <Text style={{ fontSize: px(26), color: C.text3, flexShrink: 0, marginLeft: px(10) }}>
            {a.registeredCount}{a.maxPlayers ? `/${a.maxPlayers}` : ''} 人
          </Text>
        </View>
      </View>

      {/* ── Roster strip ── */}
      <View style={{
        borderTop: `1px solid rgba(255,255,255,0.06)`,
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
        padding: `${px(12)} ${px(18)}`,
        display: 'flex', alignItems: 'center', gap: px(10),
      }}>
        <Text style={{ fontSize: px(24), color: C.text3, flexShrink: 0 }}>已报名</Text>

        {/* Avatar stack */}
        {visibleAv.length > 0 ? (
          <View style={{ display: 'flex', flexDirection: 'row', flexShrink: 0 }}>
            {visibleAv.map((r, i) => (
              <View key={r.userId} style={{ marginLeft: i > 0 ? px(-12) : 0, zIndex: MAX_AV - i }}>
                {r.avatarUrl ? (
                  <Image src={r.avatarUrl} style={{
                    width: px(40), height: px(40), borderRadius: '50%',
                    border: '2px solid #0f1010', display: 'block',
                  }} />
                ) : (
                  <View style={{
                    width: px(40), height: px(40), borderRadius: '50%',
                    background: `hsl(${(r.userId * 137) % 360}, 40%, 22%)`,
                    border: '2px solid #0f1010',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: px(26), color: C.text2, fontWeight: '700' }}>
                      {r.nickname.charAt(0)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            {extra > 0 && (
              <View style={{
                marginLeft: px(-12),
                width: px(40), height: px(40), borderRadius: '50%',
                background: C.surface2, border: '2px solid #0f1010',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: px(22), color: C.text2, fontWeight: '700' }}>+{extra}</Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ fontSize: px(26), color: C.text3 }}>还没有人报名</Text>
        )}
      </View>

      {/* ── RSVP buttons ── */}
      <View
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', padding: `${px(12)} ${px(14)}`, gap: px(8) }}
      >
        {rsvpBtns.map(btn => {
          const active = a.myStatus === btn.status
          return (
            <View
              key={btn.status}
              onClick={(e) => { e.stopPropagation(); onRsvp(btn.status) }}
              style={{
                flex: 1, textAlign: 'center',
                padding: `${px(12)} 0`,
                borderRadius: px(14),
                background: active ? btn.dimBg : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? btn.color + '50' : C.border}`,
              }}
            >
              <Text style={{
                fontSize: px(30), fontWeight: active ? '800' : '500',
                color: active ? btn.color : C.text3,
              }}>
                {btn.label}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

// Compact row card for past/secondary activities
function CompactCard({ a, onPress }: { a: ActivityRes; onPress: () => void }) {
  const d = new Date(a.startTime)
  const isOpen = a.status === 'OPEN'

  return (
    <View
      onClick={onPress}
      style={{
        display: 'flex', alignItems: 'center', gap: px(12),
        padding: `${px(12)} ${px(14)}`,
        background: C.surface,
        borderRadius: px(12),
        marginBottom: px(8),
        border: `1px solid ${C.border}`,
      }}
    >
      {/* Date box */}
      <View style={{
        width: px(42), height: px(42), borderRadius: px(10),
        background: C.surface2, flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: px(32), fontWeight: '800', color: isOpen ? C.primary : C.text2,
                       display: 'block', lineHeight: '1.1' }}>
          {d.getDate()}
        </Text>
        <Text style={{ fontSize: px(22), color: C.text3 }}>
          {d.getMonth() + 1}月
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: px(28), fontWeight: '600', color: C.text,
                       display: 'block', marginBottom: px(2) }}>
          {a.title}
        </Text>
        <Text style={{ fontSize: px(24), color: C.text3 }} numberOfLines={1}>
          📍 {a.location}
        </Text>
      </View>

      {/* Status badge */}
      <Text style={{
        fontSize: px(22), fontWeight: '600', flexShrink: 0,
        color: isOpen ? C.primary : C.text3,
        background: isOpen ? C.primaryDim : 'rgba(255,255,255,0.05)',
        borderRadius: '9999px', padding: '3px 9px',
      }}>
        {isOpen ? '报名中' : a.status === 'FINISHED' ? '已结束' : '已关闭'}
      </Text>
    </View>
  )
}

function SectionLabel({ dot, label }: { dot?: string; label: string }) {
  return (
    <View style={{ display: 'flex', alignItems: 'center', marginBottom: px(10), gap: px(7) }}>
      {dot && <View style={{ width: px(6), height: px(6), borderRadius: '50%', background: dot }} />}
      <Text style={{
        fontSize: px(22), fontWeight: '700', color: dot ? dot : C.text3,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        {label}
      </Text>
    </View>
  )
}

export default function HomePage() {
  const [activities, setActivities] = useState<ActivityRes[]>([])
  const [featuredDetail, setFeaturedDetail] = useState<ActivityDetailRes | null>(null)
  const [loading, setLoading] = useState(false)
  const t = useT()
  const { currentTeamId, isCaptainOrAdmin } = useAuthStore()

  const load = async () => {
    if (!currentTeamId) return
    setLoading(true)
    try {
      const data = await activityApi.list(currentTeamId)
      setActivities(data)
      const first = data.find(a => a.status === 'OPEN')
      if (first) {
        const detail = await activityApi.detail(first.id)
        setFeaturedDetail(detail)
      } else {
        setFeaturedDetail(null)
      }
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useDidShow(load)

  const handleRsvp = async (activityId: number, status: RegStatus) => {
    const currentStatus = activities.find(a => a.id === activityId)?.myStatus
    try {
      if (currentStatus === status) {
        await activityApi.cancelRegister(activityId)
      } else {
        await activityApi.register(activityId, status)
      }
      await load()
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
    }
  }

  const upcoming = activities.filter(a => a.status === 'OPEN')
  const past = activities.filter(a => a.status !== 'OPEN')
  const [featured, ...restUpcoming] = upcoming

  return (
    <View style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg }}>
      {/* Header */}
      <View style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${px(16)} ${px(16)} ${px(14)}`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <Text style={{ fontSize: px(44), fontWeight: '800', color: C.text, letterSpacing: '-0.02em' }}>
          {t('tab.home')}
        </Text>
        {isCaptainOrAdmin() && (
          <View
            onClick={() => Taro.navigateTo({ url: '/pages/activity-create/index' })}
            style={{
              background: C.primary, borderRadius: '9999px',
              padding: `${px(7)} ${px(16)}`,
            }}
          >
            <Text style={{ fontSize: px(26), color: '#0f1010', fontWeight: '700' }}>
              + {t('home.create')}
            </Text>
          </View>
        )}
      </View>

      <ScrollView scrollY style={{ flex: 1 }}>
        <View style={{ padding: `${px(14)} ${px(14)} ${px(32)}` }}>
          {loading ? (
            <View style={{ padding: `${px(48)} 0`, textAlign: 'center' }}>
              <Text style={{ color: C.text3 }}>{t('common.loading')}</Text>
            </View>
          ) : activities.length === 0 ? (
            <View style={{
              marginTop: px(24),
              background: C.surface, borderRadius: px(20),
              padding: `${px(56)} ${px(24)}`,
              textAlign: 'center', border: `1px solid ${C.border}`,
            }}>
              <Text style={{ fontSize: px(94), display: 'block', marginBottom: px(16) }}>⚽</Text>
              <Text style={{ fontSize: px(34), color: C.text, fontWeight: '800', display: 'block',
                             marginBottom: px(8), letterSpacing: '-0.01em' }}>
                暂无活动
              </Text>
              <Text style={{ fontSize: px(26), color: C.text3 }}>{t('home.empty')}</Text>
            </View>
          ) : (
            <>
              {/* Upcoming section */}
              {upcoming.length > 0 && (
                <View style={{ marginBottom: past.length > 0 ? px(6) : 0 }}>
                  <SectionLabel dot={C.primary} label="即将开始" />
                  {featured && (
                    <FeaturedCard
                      a={featured}
                      detail={featuredDetail}
                      onPress={() => Taro.navigateTo({ url: `/pages/activity-detail/index?id=${featured.id}` })}
                      onRsvp={(status) => handleRsvp(featured.id, status)}
                    />
                  )}
                  {restUpcoming.map(a => (
                    <CompactCard
                      key={a.id}
                      a={a}
                      onPress={() => Taro.navigateTo({ url: `/pages/activity-detail/index?id=${a.id}` })}
                    />
                  ))}
                </View>
              )}

              {/* Divider between sections */}
              {upcoming.length > 0 && past.length > 0 && (
                <View style={{
                  display: 'flex', alignItems: 'center', gap: px(10),
                  margin: `${px(8)} 0 ${px(16)}`,
                }}>
                  <View style={{ flex: 1, height: '1px', background: C.border }} />
                  <Text style={{ fontSize: px(22), color: C.text3, letterSpacing: '0.08em',
                                 textTransform: 'uppercase', fontWeight: '600' }}>
                    历史活动
                  </Text>
                  <View style={{ flex: 1, height: '1px', background: C.border }} />
                </View>
              )}

              {/* Past section */}
              {past.length > 0 && (
                <View>
                  {upcoming.length === 0 && <SectionLabel label="历史活动" />}
                  {past.map(a => (
                    <CompactCard
                      key={a.id}
                      a={a}
                      onPress={() => Taro.navigateTo({ url: `/pages/activity-detail/index?id=${a.id}` })}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
        <View style={{ height: px(160) }} />
      </ScrollView>
    </View>
  )
}
