import { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'
import type { ActivityDetailRes, RegStatus } from '../../types/api'
import { useT } from '../../i18n/useT'
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
      <View style={{ padding: px(32), textAlign: 'center' }}>
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
      const updated = await activityApi.detail(activityId)
      setDetail(updated)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : t('common.error'), icon: 'none' })
    }
  }

  const joined = detail.registrations.filter(r => r.status === 'JOINED')
  const tentative = detail.registrations.filter(r => r.status === 'TENTATIVE')
  const absent = detail.registrations.filter(r => r.status === 'ABSENT')

  const fmtDate = (iso: string) => new Date(iso).toLocaleString('zh-CN')

  const btnStyle = (active: boolean) => ({
    flex: 1,
    background: active ? C.primary : '#fff',
    color: active ? '#fff' : C.text2,
    border: active ? 'none' : '1px solid #e5e7eb',
    borderRadius: '9999px',
    fontSize: px(14),
    fontWeight: active ? '600' : '400',
    marginRight: px(8),
    padding: '10px 0',
  })

  const Section = ({ title, children, extra }: { title: string; children: any; extra?: any }) => (
    <View style={{
      background: C.surface, borderRadius: px(16), padding: px(16), marginBottom: px(12),
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: px(12) }}>
        <Text style={{ fontSize: px(15), fontWeight: '700', color: C.text }}>{title}</Text>
        {extra}
      </View>
      {children}
    </View>
  )

  const RegGroup = ({ label, list, color }: { label: string; list: typeof joined; color: string }) => {
    if (list.length === 0) return null
    return (
      <View style={{ marginBottom: px(12) }}>
        <View style={{
          display: 'flex', alignItems: 'center', marginBottom: px(8),
        }}>
          <View style={{ width: px(6), height: px(6), borderRadius: '50%', background: color, marginRight: px(8) }} />
          <Text style={{ fontSize: px(13), fontWeight: '600', color }}>
            {label}（{list.length}人）
          </Text>
        </View>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: px(8) }}>
          {list.map(r => (
            <View key={r.userId} style={{
              display: 'flex', alignItems: 'center', background: '#f9fafb',
              borderRadius: '9999px', padding: '4px 10px 4px 4px',
            }}>
              {r.avatarUrl
                ? <Image src={r.avatarUrl} style={{
                    width: px(24), height: px(24), borderRadius: '50%', marginRight: px(6),
                  }} />
                : <View style={{
                    width: px(24), height: px(24), borderRadius: '50%', background: '#e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: px(6),
                  }}>
                    <Text style={{ fontSize: px(12) }}>👤</Text>
                  </View>
              }
              <Text style={{ fontSize: px(13), color: C.text }}>{r.nickname}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <ScrollView scrollY style={{ height: '100%', background: C.bg }}>
      <View style={{ padding: '12px 16px 24px' }}>
        {/* 基本信息 */}
        <View style={{
          background: C.surface, borderRadius: px(16), padding: px(20), marginBottom: px(12),
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: px(12) }}>
            <Text style={{ fontSize: px(20), fontWeight: '700', color: C.text, lineHeight: '1.4', flex: 1, paddingRight: px(12) }}>
              {a.title}
            </Text>
            <Text style={{
              fontSize: px(11), fontWeight: '500',
              color: isOpen ? C.primary : C.text3,
              background: isOpen ? C.primaryLight : '#f3f4f6',
              borderRadius: '9999px', padding: '4px 10px', flexShrink: 0,
            }}>
              {isOpen ? '报名中' : a.status === 'FINISHED' ? '已结束' : '已关闭'}
            </Text>
          </View>

          {a.opponent && (
            <View style={{ display: 'flex', alignItems: 'center', marginBottom: px(8) }}>
              <Text style={{ fontSize: px(13), color: C.text3, marginRight: px(6), width: px(20) }}>⚔️</Text>
              <Text style={{ fontSize: px(14), color: C.text2 }}>{t('act.vs')}{a.opponent}</Text>
            </View>
          )}
          <View style={{ display: 'flex', alignItems: 'center', marginBottom: px(8) }}>
            <Text style={{ fontSize: px(13), color: C.text3, marginRight: px(6), width: px(20) }}>📍</Text>
            <Text style={{ fontSize: px(14), color: C.text2 }}>{a.location}</Text>
          </View>
          <View style={{ display: 'flex', alignItems: 'center', marginBottom: px(8) }}>
            <Text style={{ fontSize: px(13), color: C.text3, marginRight: px(6), width: px(20) }}>🕐</Text>
            <Text style={{ fontSize: px(14), color: C.text2 }}>{fmtDate(a.startTime)}</Text>
          </View>
          {a.deadline && (
            <View style={{ display: 'flex', alignItems: 'center' }}>
              <Text style={{ fontSize: px(13), color: C.text3, marginRight: px(6), width: px(20) }}>⏰</Text>
              <Text style={{ fontSize: px(13), color: C.text3 }}>报名截止 {fmtDate(a.deadline)}</Text>
            </View>
          )}
        </View>

        {/* 比赛结果 */}
        {detail.result && (
          <View style={{
            background: C.surface, borderRadius: px(16), padding: px(20), marginBottom: px(12),
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', textAlign: 'center',
          }}>
            <Text style={{ fontSize: px(13), color: C.text3, display: 'block', marginBottom: px(8) }}>
              {t('act.result')}
            </Text>
            <Text style={{ fontSize: px(40), fontWeight: '800', color: C.text, display: 'block', marginBottom: px(4) }}>
              {detail.result.ourScore} : {detail.result.oppScore}
            </Text>
            <Text style={{
              fontSize: px(14), fontWeight: '600',
              color: detail.result.outcome === 'WIN' ? C.win : detail.result.outcome === 'LOSE' ? C.lose : C.draw,
              display: 'inline-block',
              background: detail.result.outcome === 'WIN' ? '#ecfdf5' : detail.result.outcome === 'LOSE' ? '#fef2f2' : '#fffbeb',
              borderRadius: '9999px', padding: '4px 14px',
            }}>
              {detail.result.outcome === 'WIN' ? t('act.win') : detail.result.outcome === 'LOSE' ? t('act.lose') : t('act.draw')}
            </Text>
          </View>
        )}

        {/* 三档报名按钮 */}
        {isOpen && (
          <View style={{
            background: C.surface, borderRadius: px(16), padding: px(16), marginBottom: px(12),
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <Text style={{ fontSize: px(13), color: C.text3, marginBottom: px(12), display: 'block' }}>选择你的状态</Text>
            <View style={{ display: 'flex' }}>
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
          </View>
        )}

        {/* 报名名单 */}
        <Section
          title={t('act.registrations')}
          extra={
            <Text style={{ fontSize: px(13), color: C.text3 }}>
              {a.registeredCount}{a.maxPlayers ? `/${a.maxPlayers}` : ''}人
            </Text>
          }
        >
          <RegGroup label={t('act.joined_count')} list={joined} color={C.win} />
          <RegGroup label={t('act.tentative_count')} list={tentative} color={C.draw} />
          <RegGroup label={t('act.absent_count')} list={absent} color={C.text3} />

          {detail.registrations.length === 0 && (
            <Text style={{ color: C.text3, fontSize: px(14), textAlign: 'center', padding: px(16) }}>
              {t('act.no_regs')}
            </Text>
          )}
        </Section>

        {/* 管理员操作 + 分享 */}
        <View style={{ display: 'flex', flexDirection: 'column', gap: px(8) }}>
          {isCaptainOrAdmin() && isOpen && (
            <Button
              style={{
                background: '#fff', color: C.text3, border: '1px solid #e5e7eb',
                borderRadius: '9999px', fontSize: px(14), padding: '10px 0',
              }}
              onClick={handleClose}
            >
              {t('act.close')}
            </Button>
          )}
          {isCaptainOrAdmin() && a.status === 'OPEN' && (
            <Button
              style={{
                background: '#2196F3', color: '#fff', border: 'none',
                borderRadius: '9999px', fontSize: px(14), padding: '10px 0',
              }}
              onClick={() => Taro.navigateTo({ url: `/pages/activity-create/index?editId=${activityId}` })}
            >
              {t('act.edit')}
            </Button>
          )}
          {isCaptainOrAdmin() && a.type === 'MATCH' && a.status !== 'OPEN' && !detail.result && (
            <Button
              style={{
                background: C.draw, color: '#fff', border: 'none',
                borderRadius: '9999px', fontSize: px(14), padding: '10px 0',
              }}
              onClick={() => Taro.navigateTo({ url: `/pages/activity-create/index?resultFor=${activityId}` })}
            >
              {t('act.record')}
            </Button>
          )}
          <Button
            openType='share'
            style={{
              background: C.primaryLight, color: C.primary, border: 'none',
              borderRadius: '9999px', fontSize: px(14), padding: '10px 0',
            }}
          >
            {t('act.share')}
          </Button>
        </View>
      </View>
    </ScrollView>
  )
}
