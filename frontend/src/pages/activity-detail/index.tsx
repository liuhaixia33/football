import { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'
import type { ActivityDetailRes, RegStatus } from '../../types/api'
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
      const updated = await activityApi.detail(activityId)
      setDetail(updated)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : t('common.error'), icon: 'none' })
    }
  }

  const joined = detail.registrations.filter(r => r.status === 'JOINED')
  const tentative = detail.registrations.filter(r => r.status === 'TENTATIVE')
  const absent = detail.registrations.filter(r => r.status === 'ABSENT')

  const btnStyle = (active: boolean) => ({
    flex: '1',
    background: active ? '#4CAF50' : '#fff',
    color: active ? '#fff' : '#666',
    border: active ? 'none' : '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    marginRight: '8px',
  })

  return (
    <ScrollView scrollY style={{ height: '100vh' }}>
      <View style={{ padding: '16px' }}>
        {/* 基本信息 */}
        <View style={{ background: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
          <Text style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>
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
          <View style={{ background: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '12px', textAlign: 'center' }}>
            <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '8px' }}>
              {t('act.result')}
            </Text>
            <Text style={{ fontSize: '36px', fontWeight: 'bold' }}>
              {detail.result.ourScore} : {detail.result.oppScore}
            </Text>
            <Text
              style={{
                fontSize: '16px',
                color: detail.result.outcome === 'WIN' ? '#4CAF50' : detail.result.outcome === 'LOSE' ? '#f44336' : '#FF9800',
                display: 'block',
                marginTop: '4px',
              }}
            >
              {detail.result.outcome === 'WIN' ? t('act.win') : detail.result.outcome === 'LOSE' ? t('act.lose') : t('act.draw')}
            </Text>
          </View>
        )}

        {/* 三档报名按钮 */}
        {isOpen && (
          <View style={{ display: 'flex', marginBottom: '12px' }}>
            <Button style={btnStyle(a.myStatus === 'JOINED')} onClick={() => handleRegister('JOINED')}>
              {t('act.status_joined')}
            </Button>
            <Button style={btnStyle(a.myStatus === 'TENTATIVE')} onClick={() => handleRegister('TENTATIVE')}>
              {t('act.status_tentative')}
            </Button>
            <Button style={{ ...btnStyle(a.myStatus === 'ABSENT'), marginRight: '0' }} onClick={() => handleRegister('ABSENT')}>
              {t('act.status_absent')}
            </Button>
          </View>
        )}

        {/* 报名名单（分组） */}
        <View style={{ background: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>
            {t('act.registrations')}（{a.registeredCount}{a.maxPlayers ? `/${a.maxPlayers}` : ''}人）
          </Text>

          {/* JOINED 组 */}
          {joined.length > 0 && (
            <View style={{ marginBottom: '12px' }}>
              <Text style={{ fontSize: '13px', color: '#4CAF50', display: 'block', marginBottom: '6px' }}>
                {t('act.joined_count')}（{joined.length}人）
              </Text>
              {joined.map(r => (
                <View key={r.userId} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                  {r.avatarUrl
                    ? <Image src={r.avatarUrl} style={{ width: '28px', height: '28px', borderRadius: '50%', marginRight: '8px' }} />
                    : <Text style={{ fontSize: '20px', marginRight: '8px' }}>👤</Text>
                  }
                  <Text style={{ fontSize: '14px' }}>{r.nickname}</Text>
                </View>
              ))}
            </View>
          )}

          {/* TENTATIVE 组 */}
          {tentative.length > 0 && (
            <View style={{ marginBottom: '12px' }}>
              <Text style={{ fontSize: '13px', color: '#FF9800', display: 'block', marginBottom: '6px' }}>
                {t('act.tentative_count')}（{tentative.length}人）
              </Text>
              {tentative.map(r => (
                <View key={r.userId} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                  {r.avatarUrl
                    ? <Image src={r.avatarUrl} style={{ width: '28px', height: '28px', borderRadius: '50%', marginRight: '8px' }} />
                    : <Text style={{ fontSize: '20px', marginRight: '8px' }}>👤</Text>
                  }
                  <Text style={{ fontSize: '14px' }}>{r.nickname}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ABSENT 组 */}
          {absent.length > 0 && (
            <View>
              <Text style={{ fontSize: '13px', color: '#999', display: 'block', marginBottom: '6px' }}>
                {t('act.absent_count')}（{absent.length}人）
              </Text>
              {absent.map(r => (
                <View key={r.userId} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                  {r.avatarUrl
                    ? <Image src={r.avatarUrl} style={{ width: '28px', height: '28px', borderRadius: '50%', marginRight: '8px' }} />
                    : <Text style={{ fontSize: '20px', marginRight: '8px' }}>👤</Text>
                  }
                  <Text style={{ fontSize: '14px' }}>{r.nickname}</Text>
                </View>
              ))}
            </View>
          )}

          {detail.registrations.length === 0 && (
            <Text style={{ color: '#999', fontSize: '14px' }}>{t('act.no_regs')}</Text>
          )}
        </View>

        {/* 管理员操作按钮 */}
        {isCaptainOrAdmin() && isOpen && (
          <Button
            style={{ background: '#fff', color: '#999', border: '1px solid #e0e0e0', borderRadius: '8px', marginTop: '8px', fontSize: '14px' }}
            onClick={handleClose}
          >
            {t('act.close')}
          </Button>
        )}
        {isCaptainOrAdmin() && a.status === 'OPEN' && (
          <Button
            style={{ background: '#2196F3', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '8px', fontSize: '14px' }}
            onClick={() => Taro.navigateTo({ url: `/pages/activity-create/index?editId=${activityId}` })}
          >
            {t('act.edit')}
          </Button>
        )}
        {isCaptainOrAdmin() && a.type === 'MATCH' && a.status !== 'OPEN' && !detail.result && (
          <Button
            style={{ background: '#FF9800', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '8px', fontSize: '14px' }}
            onClick={() => Taro.navigateTo({ url: `/pages/activity-create/index?resultFor=${activityId}` })}
          >
            {t('act.record')}
          </Button>
        )}
        <Button
          openType='share'
          style={{ background: '#fff', color: '#07C160', border: '1px solid #07C160', borderRadius: '8px', marginTop: '8px', fontSize: '14px' }}
        >
          {t('act.share')}
        </Button>
      </View>
    </ScrollView>
  )
}
