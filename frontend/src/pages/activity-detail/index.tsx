import { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'
import type { ActivityDetailRes } from '../../types/api'
import { useT } from '../../i18n/useT'

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
    activityApi
      .detail(activityId)
      .then(setDetail)
      .catch(() => Taro.showToast({ title: t('act.load_fail'), icon: 'none' }))
  }, [activityId])

  if (!detail) {
    return (
      <View style={{ padding: '32px', textAlign: 'center' }}>
        <Text style={{ color: '#999' }}>{t('common.loading')}</Text>
      </View>
    )
  }

  const a = detail.activity
  const isOpen = a.status === 'OPEN' && !(a.deadline && new Date(a.deadline) < new Date())

  const handleRegister = async () => {
    try {
      if (a.iJoined) {
        await activityApi.cancelRegister(activityId)
        Taro.showToast({ title: '已取消报名', icon: 'success' })
      } else {
        await activityApi.register(activityId)
        Taro.showToast({ title: '报名成功', icon: 'success' })
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
      const updated = await activityApi.detail(activityId)
      setDetail(updated)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : t('common.error'), icon: 'none' })
    }
  }

  return (
    <ScrollView scrollY style={{ height: '100vh' }}>
      <View style={{ padding: '16px' }}>
        {/* 基本信息 */}
        <View
          style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
          }}
        >
          <Text
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            {a.title}
          </Text>
          {a.opponent && (
            <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px' }}>
              {t('act.vs')}{a.opponent}
            </Text>
          )}
          <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px' }}>
            {t('act.location')}{a.location}
          </Text>
          <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px' }}>
            {t('act.start')}{new Date(a.startTime).toLocaleString('zh-CN')}
          </Text>
          {a.deadline && (
            <Text style={{ fontSize: '14px', color: '#999', display: 'block' }}>
              {t('act.deadline')}{new Date(a.deadline).toLocaleString('zh-CN')}
            </Text>
          )}
        </View>

        {/* 比赛结果 */}
        {detail.result && (
          <View
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            <Text
              style={{
                fontSize: '14px',
                color: '#666',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              {t('act.result')}
            </Text>
            <Text style={{ fontSize: '36px', fontWeight: 'bold' }}>
              {detail.result.ourScore} : {detail.result.oppScore}
            </Text>
            <Text
              style={{
                fontSize: '16px',
                color:
                  detail.result.outcome === 'WIN'
                    ? '#4CAF50'
                    : detail.result.outcome === 'LOSE'
                      ? '#f44336'
                      : '#FF9800',
                display: 'block',
                marginTop: '4px',
              }}
            >
              {detail.result.outcome === 'WIN'
                ? t('act.win')
                : detail.result.outcome === 'LOSE'
                  ? t('act.lose')
                  : t('act.draw')}
            </Text>
          </View>
        )}

        {/* 报名名单 */}
        <View
          style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
          }}
        >
          <Text style={{ fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>
            {t('act.registrations')}（{a.registeredCount}
            {a.maxPlayers ? `/${a.maxPlayers}` : ''}人）
          </Text>
          {detail.registrations.map(r => (
            <View
              key={r.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <Text style={{ fontSize: '24px', marginRight: '8px' }}>👤</Text>
              <Text style={{ fontSize: '14px' }}>{r.nickname}</Text>
            </View>
          ))}
          {detail.registrations.length === 0 && (
            <Text style={{ color: '#999', fontSize: '14px' }}>{t('act.no_regs')}</Text>
          )}
        </View>

        {/* 操作按钮 */}
        {isOpen && (
          <Button
            style={{
              background: a.iJoined ? '#fff' : '#4CAF50',
              color: a.iJoined ? '#f44336' : '#fff',
              border: a.iJoined ? '1px solid #f44336' : 'none',
              borderRadius: '8px',
              fontSize: '16px',
            }}
            onClick={handleRegister}
          >
            {a.iJoined ? t('act.cancel_join') : t('act.join')}
          </Button>
        )}
        {isCaptainOrAdmin() && isOpen && (
          <Button
            style={{
              background: '#fff',
              color: '#999',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              marginTop: '8px',
              fontSize: '14px',
            }}
            onClick={handleClose}
          >
            {t('act.close')}
          </Button>
        )}
        {isCaptainOrAdmin() && a.status === 'OPEN' && (
          <Button
            style={{
              background: '#2196F3',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              marginTop: '8px',
              fontSize: '14px',
            }}
            onClick={() =>
              Taro.navigateTo({
                url: `/pages/activity-create/index?editId=${activityId}`,
              })
            }
          >
            {t('act.edit')}
          </Button>
        )}
        {isCaptainOrAdmin() && a.type === 'MATCH' && a.status !== 'OPEN' && !detail.result && (
          <Button
            style={{
              background: '#FF9800',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              marginTop: '8px',
              fontSize: '14px',
            }}
            onClick={() =>
              Taro.navigateTo({
                url: `/pages/activity-create/index?resultFor=${activityId}`,
              })
            }
          >
            {t('act.record')}
          </Button>
        )}
        <Button
          openType='share'
          style={{
            background: '#fff',
            color: '#07C160',
            border: '1px solid #07C160',
            borderRadius: '8px',
            marginTop: '8px',
            fontSize: '14px',
          }}
        >
          {t('act.share')}
        </Button>
      </View>
    </ScrollView>
  )
}
