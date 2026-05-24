import { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, Image, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { teamApi } from '../../api/team'
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

const RSVP_BTNS: { status: RegStatus; label: string; color: string; dimBg: string }[] = [
  { status: 'JOINED',    label: '参加', color: C.win,  dimBg: 'rgba(34,197,94,0.14)' },
  { status: 'TENTATIVE', label: '观望', color: C.draw, dimBg: 'rgba(255,183,0,0.14)' },
  { status: 'ABSENT',    label: '不去', color: C.lose, dimBg: 'rgba(255,77,90,0.12)' },
]

function RsvpRow({ myStatus, onRsvp }: { myStatus: RegStatus | null; onRsvp: (s: RegStatus) => void }) {
  return (
    <View
      onClick={e => e.stopPropagation()}
      style={{ display: 'flex', padding: `${px(10)} ${px(14)} ${px(14)}`, gap: px(8) }}
    >
      {RSVP_BTNS.map(btn => {
        const active = myStatus === btn.status
        return (
          <View
            key={btn.status}
            onClick={e => { e.stopPropagation(); onRsvp(btn.status) }}
            style={{
              flex: 1, textAlign: 'center', padding: `${px(11)} 0`,
              borderRadius: px(12),
              background: active ? btn.dimBg : 'rgba(255,255,255,0.04)',
              border: `1px solid ${active ? btn.color + '50' : C.border}`,
            }}
          >
            <Text style={{ fontSize: px(28), fontWeight: active ? '800' : '500',
                           color: active ? btn.color : C.text3 }}>
              {btn.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function RegPill({ r }: { r: { userId: number; nickname: string; avatarUrl: string } }) {
  return (
    <View style={{
      display: 'flex', alignItems: 'center', gap: px(5),
      background: C.surface2, borderRadius: '9999px',
      padding: `${px(4)} ${px(10)} ${px(4)} ${px(5)}`,
      border: `1px solid rgba(255,255,255,0.06)`,
    }}>
      {r.avatarUrl
        ? <Image src={r.avatarUrl} style={{ width: px(28), height: px(28), borderRadius: '50%' }} />
        : <View style={{
            width: px(28), height: px(28), borderRadius: '50%',
            background: `hsl(${(r.userId * 137) % 360}, 35%, 22%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: px(20), color: C.text2, fontWeight: '700' }}>
              {r.nickname.charAt(0)}
            </Text>
          </View>
      }
      <Text style={{ fontSize: px(24), color: C.text }}>{r.nickname}</Text>
    </View>
  )
}

// Hero card — first open activity, shows full roster
function FeaturedCard({
  a, detail, onPress, onRsvp,
}: {
  a: ActivityRes
  detail: ActivityDetailRes | null
  onPress: () => void
  onRsvp: (status: RegStatus) => void
}) {
  const d = new Date(a.startTime)
  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日 周${WEEK[d.getDay()]}`
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  const joined    = detail?.registrations.filter(r => r.status === 'JOINED')    ?? []
  const tentative = detail?.registrations.filter(r => r.status === 'TENTATIVE') ?? []
  const absent    = detail?.registrations.filter(r => r.status === 'ABSENT')    ?? []
  const hasAny = joined.length + tentative.length + absent.length > 0

  const RosterGroup = ({ list, label, color }: { list: typeof joined; label: string; color: string }) => {
    if (list.length === 0) return null
    return (
      <View style={{ marginBottom: px(12) }}>
        <View style={{ display: 'flex', alignItems: 'center', gap: px(5), marginBottom: px(7) }}>
          <View style={{ width: px(5), height: px(5), borderRadius: '50%', background: color }} />
          <Text style={{ fontSize: px(22), fontWeight: '700', color }}>
            {label} · {list.length}人
          </Text>
        </View>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: px(6) }}>
          {list.map(r => <RegPill key={r.userId} r={r} />)}
        </View>
      </View>
    )
  }

  return (
    <View onClick={onPress} style={{
      background: 'linear-gradient(150deg, #0b2a10 0%, #0c2212 55%, #0f1010 100%)',
      borderRadius: px(22), marginBottom: px(14),
      border: `1px solid rgba(34,197,94,0.22)`, overflow: 'hidden',
    }}>
      {/* Top info */}
      <View style={{ padding: `${px(18)} ${px(18)} ${px(14)}` }}>
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: px(14) }}>
          <View style={{ display: 'flex', alignItems: 'center', gap: px(8) }}>
            <View style={{ width: px(7), height: px(7), borderRadius: '50%', background: C.primary, boxShadow: `0 0 6px ${C.primary}` }} />
            <Text style={{ fontSize: px(26), color: C.text2, fontWeight: '500' }}>
              {dateStr} · {timeStr}
            </Text>
          </View>
          <Text style={{
            fontSize: px(24), color: C.primary, fontWeight: '700',
            background: C.primaryDim, borderRadius: '9999px', padding: '3px 12px',
            border: '1px solid rgba(34,197,94,0.25)',
          }}>报名中</Text>
        </View>

        <Text style={{
          fontSize: px(48), fontWeight: '900', color: C.text,
          display: 'block', letterSpacing: '-0.02em', lineHeight: '1.25', marginBottom: px(10),
        }}>
          {a.title}
        </Text>

        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Text style={{ fontSize: px(28), color: C.text2, flex: 1 }} numberOfLines={1}>
            📍 {a.location}
          </Text>
          <Text style={{ fontSize: px(26), color: C.text3, flexShrink: 0, marginLeft: px(10) }}>
            {a.registeredCount}{a.maxPlayers ? `/${a.maxPlayers}` : ''} 人
          </Text>
        </View>
      </View>

      {/* Full roster */}
      <View style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, padding: `${px(14)} ${px(18)} ${px(6)}` }}>
        {hasAny ? (
          <>
            <RosterGroup list={joined}    label="报名" color={C.win}  />
            <RosterGroup list={tentative} label="待定" color={C.draw} />
            <RosterGroup list={absent}    label="不去" color={C.lose} />
          </>
        ) : (
          <Text style={{ fontSize: px(26), color: C.text3, paddingBottom: px(8) }}>
            还没有人报名
          </Text>
        )}
      </View>

      {/* RSVP */}
      <View style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <RsvpRow myStatus={a.myStatus} onRsvp={onRsvp} />
      </View>
    </View>
  )
}

// Medium card for other open activities
function OpenCard({ a, onPress, onRsvp }: { a: ActivityRes; onPress: () => void; onRsvp: (s: RegStatus) => void }) {
  const d = new Date(a.startTime)
  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日 周${WEEK[d.getDay()]}`
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  return (
    <View onClick={onPress} style={{
      background: C.surface, borderRadius: px(18), marginBottom: px(10),
      border: `1px solid rgba(34,197,94,0.14)`, overflow: 'hidden',
    }}>
      <View style={{ padding: `${px(14)} ${px(16)} ${px(12)}` }}>
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: px(8) }}>
          <Text style={{ fontSize: px(24), color: C.text2 }}>{dateStr} · {timeStr}</Text>
          <Text style={{
            fontSize: px(22), color: C.primary, fontWeight: '600',
            background: C.primaryDim, borderRadius: '9999px', padding: '2px 10px',
          }}>报名中</Text>
        </View>
        <Text style={{ fontSize: px(36), fontWeight: '800', color: C.text, display: 'block',
                       letterSpacing: '-0.01em', marginBottom: px(6) }}>
          {a.title}
        </Text>
        <View style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: px(26), color: C.text2, flex: 1 }} numberOfLines={1}>
            📍 {a.location}
          </Text>
          <Text style={{ fontSize: px(24), color: C.text3, flexShrink: 0, marginLeft: px(8) }}>
            {a.registeredCount}{a.maxPlayers ? `/${a.maxPlayers}` : ''} 人
          </Text>
        </View>
      </View>
      <View style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <RsvpRow myStatus={a.myStatus} onRsvp={onRsvp} />
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
  const { currentTeamId, isCaptainOrAdmin, teams, token } = useAuthStore()
  // 用 state 存储邀请信息，支持 tab bar 页面背景→前台切换时更新（router.params 不会自动更新）
  const [pendingInvite, setPendingInvite] = useState<{ code: string; teamId: number | null } | null>(() => {
    // 初始化：优先 getEnterOptionsSync（兼容前台切换），其次 router.params（兼容首次冷启动）
    try {
      const q = (Taro.getEnterOptionsSync()?.query ?? {}) as Record<string, string>
      if (q.inviteCode) return { code: q.inviteCode, teamId: q.teamId ? Number(q.teamId) : null }
    } catch {}
    const p = Taro.getCurrentInstance().router?.params ?? {}
    if (p.inviteCode) return { code: p.inviteCode as string, teamId: p.teamId ? Number(p.teamId) : null }
    return null
  })
  const joinModalShown = useRef(false)

  // 分享链接进入时弹框询问是否加入（已登录直接弹框；未登录保存邀请码，登录后由 login 页处理）
  useEffect(() => {
    if (!pendingInvite?.code || joinModalShown.current) return
    if (pendingInvite.teamId && teams.some(t => t.teamId === pendingInvite.teamId)) return
    joinModalShown.current = true

    if (!token) {
      Taro.setStorageSync('pending_invite_code', pendingInvite.code)
      return
    }

    Taro.removeStorageSync('pending_invite_code')
    teamApi.getByInviteCode(pendingInvite.code)
      .then(teamInfo => {
        Taro.showModal({
          title: '加入球队',
          content: `检测到邀请，是否申请加入「${teamInfo.name}」？`,
          success: async ({ confirm }) => {
            if (!confirm) return
            try {
              await teamApi.join(pendingInvite.code)
              Taro.showToast({ title: '申请已发送，等待管理员审核', icon: 'success' })
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : ''
              if (!msg.includes('已是') && !msg.includes('审核中')) {
                Taro.showToast({ title: msg || '申请失败', icon: 'none' })
              }
            }
          },
        })
      })
      .catch(() => {})
  }, [pendingInvite, teams, token])

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

  useDidShow(() => {
    // tab bar 页每次显示时重检邀请参数（背景→前台切换时 router.params 不更新，需用 getEnterOptionsSync）
    try {
      const q = (Taro.getEnterOptionsSync()?.query ?? {}) as Record<string, string>
      if (q.inviteCode) {
        setPendingInvite(prev => {
          if (prev?.code === q.inviteCode) return prev  // 相同邀请码，不重复触发
          joinModalShown.current = false                 // 新邀请码，重置弹框标志
          return { code: q.inviteCode, teamId: q.teamId ? Number(q.teamId) : null }
        })
      }
    } catch {}
    load()
  })

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

  if (!token) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f1010', display: 'flex', flexDirection: 'column',
                     alignItems: 'center', justifyContent: 'center', padding: px(40) }}>
        <Text style={{ fontSize: px(120), display: 'block', textAlign: 'center', marginBottom: px(24) }}>⚽</Text>
        <Text style={{ fontSize: px(48), fontWeight: '900', color: '#e8ede8', textAlign: 'center',
                       display: 'block', marginBottom: px(12) }}>
          足球队
        </Text>
        <Text style={{ fontSize: px(28), color: '#8a9e8a', textAlign: 'center', display: 'block',
                       marginBottom: px(48) }}>
          管理你的球队，记录每一场比赛
        </Text>
        <Button
          style={{
            backgroundColor: '#22c55e', color: '#0f1010', borderRadius: px(16),
            fontSize: px(34), fontWeight: '800', border: 'none',
            padding: `${px(18)} ${px(60)}`,
          }}
          onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}
        >
          登录 / 注册
        </Button>
      </View>
    )
  }

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
                    <OpenCard
                      key={a.id}
                      a={a}
                      onPress={() => Taro.navigateTo({ url: `/pages/activity-detail/index?id=${a.id}` })}
                      onRsvp={(status) => handleRsvp(a.id, status)}
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
        <View style={{ height: px(192) }} />
      </ScrollView>
    </View>
  )
}
