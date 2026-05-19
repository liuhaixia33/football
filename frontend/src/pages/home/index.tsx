import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import type { ActivityRes } from '../../types/api'

function ActivityCard({ a, onPress }: { a: ActivityRes; onPress: () => void }) {
  const t = useT()
  const statusLabel = (status: string) => {
    if (status === 'FINISHED') return t('home.finished')
    if (status === 'CLOSED')   return t('home.closed')
    return t('home.open')
  }
  const label = statusLabel(a.status)
  const openLabel = t('home.open')
  const labelColor = label === openLabel ? '#4CAF50' : '#999'

  return (
    <View
      onClick={onPress}
      style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      }}
    >
      <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <Text style={{ fontWeight: 'bold', fontSize: '16px' }}>{a.title}</Text>
        <Text style={{ fontSize: '12px', color: labelColor }}>{label}</Text>
      </View>
      <Text style={{ fontSize: '13px', color: '#666', display: 'block' }}>
        📍 {a.location}
      </Text>
      <Text style={{ fontSize: '13px', color: '#666', display: 'block', marginTop: '4px' }}>
        🕐{' '}
        {new Date(a.startTime).toLocaleString('zh-CN', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
      <View style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <Text style={{ fontSize: '12px', color: '#999' }}>
          已报名 {a.registeredCount}
          {a.maxPlayers ? `/${a.maxPlayers}` : ''}{t('home.players')}
        </Text>
        {a.iJoined && <Text style={{ fontSize: '12px', color: '#4CAF50' }}>✓ 已报名</Text>}
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
    <View style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <View
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>{t('tab.home')}</Text>
        {isCaptainOrAdmin() && (
          <Text
            style={{ fontSize: '14px', color: '#4CAF50' }}
            onClick={() => Taro.navigateTo({ url: '/pages/activity-create/index' })}
          >
            {t('home.create')}
          </Text>
        )}
      </View>
      <ScrollView scrollY style={{ flex: 1, padding: '12px 16px' }}>
        {loading ? (
          <Text
            style={{
              textAlign: 'center',
              color: '#999',
              padding: '32px',
              display: 'block',
            }}
          >
            {t('common.loading')}
          </Text>
        ) : activities.length === 0 ? (
          <Text
            style={{
              textAlign: 'center',
              color: '#999',
              padding: '32px',
              display: 'block',
            }}
          >
            {t('home.empty')}
          </Text>
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
