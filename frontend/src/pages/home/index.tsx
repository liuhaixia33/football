import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import type { ActivityRes } from '../../types/api'
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

function ActivityCard({ a, onPress }: { a: ActivityRes; onPress: () => void }) {
  const t = useT()
  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    FINISHED: { label: t('home.finished'), color: C.text3, bg: '#f3f4f6' },
    CLOSED:   { label: t('home.closed'),   color: C.text3, bg: '#f3f4f6' },
    OPEN:     { label: t('home.open'),     color: C.primary, bg: C.primaryLight },
  }
  const s = statusMap[a.status] ?? statusMap.OPEN

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const statusBadge = (ms?: string) => {
    if (ms === 'JOINED')     return { text: t('act.badge_joined'), color: C.win, bg: '#ecfdf5' }
    if (ms === 'TENTATIVE')  return { text: t('act.badge_tentative'), color: C.draw, bg: '#fffbeb' }
    if (ms === 'ABSENT')     return { text: t('act.badge_absent'), color: C.text3, bg: '#f3f4f6' }
    return null
  }
  const sb = statusBadge(a.myStatus)

  return (
    <View
      onClick={onPress}
      style={{
        background: C.surface,
        borderRadius: px(16),
        padding: px(16),
        marginBottom: px(12),
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: px(12) }}>
        <Text style={{ fontWeight: '700', fontSize: px(16), color: C.text, lineHeight: '1.4', flex: 1, paddingRight: px(12) }}>
          {a.title}
        </Text>
        <View style={{ display: 'flex', gap: px(8), flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {sb && (
            <Text style={{
              fontSize: px(11), fontWeight: '500', color: sb.color, background: sb.bg,
              borderRadius: '9999px', padding: '3px 10px',
            }}>
              {sb.text}
            </Text>
          )}
          <Text style={{
            fontSize: px(11), fontWeight: '500', color: s.color, background: s.bg,
            borderRadius: '9999px', padding: '3px 10px',
          }}>
            {s.label}
          </Text>
        </View>
      </View>

      <View style={{ display: 'flex', alignItems: 'center', marginBottom: px(6) }}>
        <Text style={{ fontSize: px(13), color: C.text3, marginRight: px(4) }}>📍</Text>
        <Text style={{ fontSize: px(13), color: C.text2 }}>{a.location}</Text>
      </View>
      <View style={{ display: 'flex', alignItems: 'center', marginBottom: px(12) }}>
        <Text style={{ fontSize: px(13), color: C.text3, marginRight: px(4) }}>🕐</Text>
        <Text style={{ fontSize: px(13), color: C.text2 }}>{fmtDate(a.startTime)}</Text>
      </View>

      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ display: 'flex', alignItems: 'center' }}>
          <View style={{
            width: px(6), height: px(6), borderRadius: '50%', background: C.primary, marginRight: px(6)
          }} />
          <Text style={{ fontSize: px(12), color: C.text3 }}>
            已报名 {a.registeredCount}{a.maxPlayers ? `/${a.maxPlayers}` : ''} {t('home.players')}
          </Text>
        </View>
        <Text style={{ fontSize: px(12), color: C.primary, fontWeight: '500' }}>查看详情 ›</Text>
      </View>
    </View>
  )
}

export default function HomePage() {
  const [activities, setActivities] = useState<ActivityRes[]>([])
  const [loading, setLoading] = useState(false)
  const t = useT()
  const { currentTeamId, isCaptainOrAdmin } = useAuthStore()

  const load = async () => {
    if (!currentTeamId) return
    setLoading(true)
    try {
      const data = await activityApi.list(currentTeamId)
      setActivities(data)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useDidShow(load)

  return (
    <View style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg }}>
      {/* Header */}
      <View style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 16px 12px', background: C.surface,
        borderBottom: '1px solid #f0f0f0',
      }}>
        <Text style={{ fontSize: px(22), fontWeight: '700', color: C.text }}>{t('tab.home')}</Text>
        {isCaptainOrAdmin() && (
          <Text
            style={{
              fontSize: px(14), color: C.primary, fontWeight: '500',
              background: C.primaryLight, borderRadius: '9999px', padding: '6px 14px',
            }}
            onClick={() => Taro.navigateTo({ url: '/pages/activity-create/index' })}
          >
            + {t('home.create')}
          </Text>
        )}
      </View>

      <ScrollView scrollY style={{ flex: 1, padding: '12px 16px' }}>
        {loading ? (
          <Text style={{ textAlign: 'center', color: C.text3, padding: px(32), display: 'block' }}>
            {t('common.loading')}
          </Text>
        ) : activities.length === 0 ? (
          <View style={{
            background: C.surface, borderRadius: px(16), padding: '48px 24px',
            textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}>
            <Text style={{ fontSize: px(40), display: 'block', marginBottom: px(12) }}>⚽</Text>
            <Text style={{ fontSize: px(15), color: C.text2, fontWeight: '500', display: 'block', marginBottom: px(4) }}>
              暂无活动
            </Text>
            <Text style={{ fontSize: px(13), color: C.text3 }}>
              {t('home.empty')}
            </Text>
          </View>
        ) : (
          activities.map(a => (
            <ActivityCard
              key={a.id}
              a={a}
              onPress={() => Taro.navigateTo({ url: `/pages/activity-detail/index?id=${a.id}` })}
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}
