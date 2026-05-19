import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { financeApi } from '../../api/finance'
import { useAuthStore } from '../../store/auth'
import type { FinanceSummaryRes } from '../../types/api'
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

export default function FinancePage() {
  const [summary, setSummary] = useState<FinanceSummaryRes | null>(null)
  const { currentTeamId, isCaptainOrAdmin } = useAuthStore()
  const t = useT()

  useEffect(() => {
    if (!isCaptainOrAdmin()) {
      Taro.reLaunch({ url: '/pages/home/index' })
    }
  }, [])

  const load = async () => {
    if (!currentTeamId) return
    try {
      const data = await financeApi.summary(currentTeamId)
      setSummary(data)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
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
        <Text style={{ fontSize: px(22), fontWeight: '700', color: C.text }}>{t('finance.title')}</Text>
        <View style={{ display: 'flex', gap: px(8) }}>
          <Text
            style={{
              fontSize: px(13), color: C.primary, fontWeight: '500',
              background: C.primaryLight, borderRadius: '9999px', padding: '6px 12px',
            }}
            onClick={() => Taro.navigateTo({ url: '/pages/finance-record/index' })}
          >
            + {t('finance.add')}
          </Text>
          <Text
            style={{
              fontSize: px(13), color: '#2196F3', fontWeight: '500',
              background: '#e3f2fd', borderRadius: '9999px', padding: '6px 12px',
            }}
            onClick={() => Taro.navigateTo({ url: '/pages/member-fee/index' })}
          >
            队费
          </Text>
        </View>
      </View>

      <ScrollView scrollY style={{ flex: 1, padding: '12px 16px' }}>
        {/* 余额大卡片 */}
        {summary && (
          <View style={{
            background: C.primary, padding: '24px 20px', marginBottom: px(16),
            borderRadius: px(20), position: 'relative', overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(76,175,80,0.25)',
          }}>
            {/* 装饰圆 */}
            <View style={{
              position: 'absolute', top: '-30px', right: '-20px',
              width: px(120), height: px(120), borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
            }} />
            <View style={{
              position: 'absolute', bottom: '-40px', left: px(30),
              width: px(80), height: px(80), borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
            }} />

            <Text style={{ fontSize: px(13), color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: px(8) }}>
              {t('finance.balance')}
            </Text>
            <Text style={{ fontSize: px(36), fontWeight: '800', color: '#fff', display: 'block', marginBottom: px(20) }}>
              ¥{summary.balance.toFixed(2)}
            </Text>
            <View style={{ display: 'flex' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: px(12), color: 'rgba(255,255,255,0.65)', display: 'block', marginBottom: px(4) }}>
                  {t('finance.income')}
                </Text>
                <Text style={{ fontSize: px(18), fontWeight: '700', color: '#fff' }}>
                  ¥{summary.totalIncome.toFixed(2)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: px(12), color: 'rgba(255,255,255,0.65)', display: 'block', marginBottom: px(4) }}>
                  {t('finance.expense')}
                </Text>
                <Text style={{ fontSize: px(18), fontWeight: '700', color: '#fff' }}>
                  ¥{summary.totalExpense.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 收支记录 */}
        <View style={{
          background: C.surface, borderRadius: px(16), padding: px(16),
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <Text style={{ fontSize: px(15), fontWeight: '700', color: C.text, display: 'block', marginBottom: px(12) }}>
            收支记录
          </Text>
          {summary?.records.map(r => (
            <View
              key={r.id}
              style={{
                display: 'flex', alignItems: 'center', padding: '12px 0',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <View style={{
                width: px(36), height: px(36), borderRadius: '50%',
                background: r.type === 'INCOME' ? '#ecfdf5' : '#fef2f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: px(12),
                flexShrink: 0,
              }}>
                <Text style={{ fontSize: px(14) }}>
                  {r.type === 'INCOME' ? '↓' : '↑'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: px(14), fontWeight: '500', color: C.text, display: 'block', marginBottom: px(2) }}>
                  {r.category}
                </Text>
                <Text style={{ fontSize: px(12), color: C.text3 }}>
                  {r.recordDate}{r.description ? ` · ${r.description}` : ''}
                </Text>
              </View>
              <Text style={{
                fontSize: px(16), fontWeight: '700',
                color: r.type === 'INCOME' ? C.win : C.lose,
              }}>
                {r.type === 'INCOME' ? '+' : '-'}¥{r.amount.toFixed(2)}
              </Text>
            </View>
          ))}
          {!summary?.records.length && (
            <View style={{ textAlign: 'center', padding: px(32) }}>
              <Text style={{ fontSize: px(28), display: 'block', marginBottom: px(8) }}>📒</Text>
              <Text style={{ fontSize: px(14), color: C.text3 }}>{t('finance.empty')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
