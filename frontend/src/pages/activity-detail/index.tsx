import { useState, useEffect, useRef } from 'react'
import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
import type { ActivityDetailRes } from '../../types/api'
import { useT } from '../../i18n/useT'
import { px } from '../../utils/style'

const C = {
  primary: '#22c55e',
  primaryDim: 'rgba(34,197,94,0.12)',
  bg: '#0f1010',
  surface: '#181c18',
  surface2: '#1e2420',
  border: 'rgba(255,255,255,0.07)',
  borderMed: 'rgba(255,255,255,0.12)',
  text: '#e8ede8',
  text2: '#8a9e8a',
  text3: '#4a5a4a',
  win: '#22c55e',
  draw: '#ffb700',
  lose: '#ff4d5a',
}


export default function ActivityDetailPage() {
  const [detail, setDetail] = useState<ActivityDetailRes | null>(null)
  const t = useT()
  const { isCaptainOrAdmin, currentTeamId, currentTeamInviteCode, teams } = useAuthStore()
  const routerParams = Taro.getCurrentInstance().router?.params ?? {}
  const activityId = Number(routerParams.id)
  const sharedTeamId = routerParams.teamId ? Number(routerParams.teamId) : null
  const sharedInviteCode = routerParams.inviteCode as string | undefined
  const joinModalShown = useRef(false)

  useShareAppMessage(() => ({
    title: detail?.activity.title ?? '球队活动',
    path: `/pages/activity-detail/index?id=${activityId}&teamId=${currentTeamId}&inviteCode=${currentTeamInviteCode()}`,
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

  // 检测邀请码并弹框询问是否加入
  useEffect(() => {
    if (!sharedInviteCode || joinModalShown.current) return
    if (sharedTeamId && teams.some(t => t.teamId === sharedTeamId)) return // 已是成员
    joinModalShown.current = true
    Taro.removeStorageSync('pending_invite_code')

    teamApi.getByInviteCode(sharedInviteCode)
      .then(teamInfo => {
        Taro.showModal({
          title: '加入球队',
          content: `检测到邀请，是否申请加入「${teamInfo.name}」？`,
          success: async ({ confirm }) => {
            if (!confirm) return
            try {
              await teamApi.join(sharedInviteCode)
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
      .catch(() => {}) // 无效邀请码静默忽略
  }, [sharedInviteCode, teams])

  if (!detail) {
    return (
      <View style={{ height: '100%', background: C.bg, display: 'flex',
                     alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.text3 }}>{t('common.loading')}</Text>
      </View>
    )
  }

  const a = detail.activity
  const deadlinePassed = !!(a.deadline && new Date(a.deadline) < new Date())
  const isOpen = a.status === 'OPEN' && !deadlinePassed

  const handleClose = async () => {
    try {
      await activityApi.close(activityId)
      Taro.showToast({ title: '活动已取消', icon: 'success' })
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
          background: `linear-gradient(160deg, ${isOpen ? '#162016' : '#181c18'} 0%, #0f1010 100%)`,
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
                {isOpen ? '报名中' : a.status === 'FINISHED' ? '已结束' : deadlinePassed ? '已截止' : '已关闭'}
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
                background: a.myStatus === 'JOINED' ? 'rgba(34,197,94,0.12)'
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

        {/* scroll 底部留白，给固定栏腾位置 */}
        <View style={{ height: px(isCaptainOrAdmin() ? 80 : deadlinePassed ? 72 : 0) }} />
      </ScrollView>

      {/* ══════════════════════════════════════════
          固定底栏：统一处理所有场景
          ══════════════════════════════════════════ */}

      {/* ── 场景 A：管理员 ── */}
      {isCaptainOrAdmin() && (
        <View style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: C.surface,
          borderTop: `1px solid ${C.borderMed}`,
          paddingBottom: px(16),
        }}>

          {/* 管理操作行：所有按钮等宽 flex:1 */}
          <View style={{ display: 'flex', gap: px(8), padding: `${px(12)} ${px(14)} 0`, alignItems: 'center' }}>

            {/* 关闭报名（OPEN） */}
            {a.status === 'OPEN' && (
              <Button onClick={handleClose} style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)', color: C.text2,
                border: `1px solid ${C.border}`, borderRadius: px(10),
                fontSize: px(26), padding: `${px(11)} 0`,
              }}>
                {t('act.close')}
              </Button>
            )}

            {/* 编辑（OPEN） */}
            {a.status === 'OPEN' && (
              <Button
                onClick={() => Taro.navigateTo({ url: `/pages/activity-create/index?editId=${activityId}` })}
                style={{
                  flex: 1,
                  background: 'rgba(77,166,255,0.12)', color: '#4da6ff',
                  border: '1px solid rgba(77,166,255,0.25)', borderRadius: px(10),
                  fontSize: px(26), fontWeight: '600', padding: `${px(11)} 0`,
                }}
              >
                {t('act.edit')}
              </Button>
            )}

            {/* 分组管理（TRAINING） */}
            {a.type === 'TRAINING' && (a.status === 'OPEN' || a.status === 'CLOSED') && (
              <Button
                onClick={() => Taro.navigateTo({
                  url: `/pages/grouping/index?activityId=${activityId}&title=${encodeURIComponent(a.title)}&startTime=${encodeURIComponent(a.startTime)}&location=${encodeURIComponent(a.location ?? '')}&status=${a.status}`,
                })}
                style={{
                  flex: 1,
                  background: 'rgba(34,197,94,0.10)', color: C.primary,
                  border: '1px solid rgba(34,197,94,0.22)', borderRadius: px(10),
                  fontSize: px(26), fontWeight: '600', padding: `${px(11)} 0`,
                }}
              >
                分组管理
              </Button>
            )}

            {/* 记录比赛（MATCH + 已关闭 + 无结果） */}
            {a.type === 'MATCH' && a.status !== 'OPEN' && !detail.result && (
              <Button
                onClick={() => Taro.navigateTo({ url: `/pages/activity-create/index?resultFor=${activityId}` })}
                style={{
                  flex: 1,
                  background: 'rgba(255,183,0,0.12)', color: C.draw,
                  border: '1px solid rgba(255,183,0,0.25)', borderRadius: px(10),
                  fontSize: px(26), fontWeight: '600', padding: `${px(11)} 0`,
                }}
              >
                {t('act.record')}
              </Button>
            )}

            {/* 分享海报 */}
            <Button
              onClick={() => Taro.navigateTo({
                url: `/pages/activity-poster/index?activityId=${activityId}`,
              })}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)', color: C.text3,
                border: `1px solid ${C.border}`, borderRadius: px(10),
                fontSize: px(26), padding: `${px(11)} 0`,
              }}
            >
              {t('act.share')}
            </Button>
          </View>
        </View>
      )}

      {/* ── 场景 C：截止时间已过（活动仍 OPEN）── */}
      {!isCaptainOrAdmin() && !isOpen && deadlinePassed && a.status === 'OPEN' && (
        <View style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(19,26,39,0.97)',
          borderTop: `1px solid rgba(255,183,0,0.20)`,
          padding: `${px(12)} ${px(18)} ${px(18)}`,
          display: 'flex', alignItems: 'center', gap: px(10),
        }}>
          <Text style={{ fontSize: px(26) }}>⏰</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: px(26), fontWeight: '700', color: C.draw, display: 'block' }}>
              报名已截止
            </Text>
            {a.deadline && (
              <Text style={{ fontSize: px(21), color: C.text3, marginTop: px(2) }}>
                {fmtDate(a.deadline)} 截止
              </Text>
            )}
          </View>
          {a.myStatus && (
            <Text style={{
              fontSize: px(22), fontWeight: '700', borderRadius: '9999px', padding: '3px 10px',
              color: a.myStatus === 'JOINED' ? C.win : a.myStatus === 'TENTATIVE' ? C.draw : C.text3,
              background: a.myStatus === 'JOINED' ? 'rgba(34,197,94,0.12)'
                : a.myStatus === 'TENTATIVE' ? 'rgba(255,183,0,0.12)' : 'rgba(255,255,255,0.05)',
            }}>
              {a.myStatus === 'JOINED' ? '已报名' : a.myStatus === 'TENTATIVE' ? '待定' : '未参加'}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}
