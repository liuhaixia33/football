import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { financeApi } from '../../api/finance'
import { useAuthStore } from '../../store/auth'
import type { FinanceSummaryRes } from '../../types/api'
import { useT } from '../../i18n/useT'
import { px } from '../../utils/style'

const C = {
  primary: '#00e472',
  primaryDim: 'rgba(0,228,114,0.12)',
  bg: '#0b0f18',
  surface: '#131a27',
  surface2: '#1a2235',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8f0fb',
  text2: '#7a8ca3',
  text3: '#364a60',
  win: '#00e472',
  draw: '#ffb700',
  lose: '#ff4d5a',
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
        padding: `${px(16)} ${px(16)} ${px(12)}`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <Text style={{ fontSize: px(46), fontWeight: '800', color: C.text, letterSpacing: '-0.02em' }}>
          {t('finance.title')}
        </Text>
        <View style={{ display: 'flex', gap: px(8) }}>
          <Text
            style={{
              fontSize: px(26), color: C.primary, fontWeight: '600',
              background: C.primaryDim, borderRadius: '9999px', padding: `${px(6)} ${px(12)}`,
              border: `1px solid rgba(0,228,114,0.2)`,
            }}
            onClick={() => Taro.navigateTo({ url: '/pages/finance-record/index' })}
          >
            + {t('finance.add')}
          </Text>
          <Text
            style={{
              fontSize: px(26), color: '#4da6ff', fontWeight: '600',
              background: 'rgba(77,166,255,0.12)', borderRadius: '9999px',
              padding: `${px(6)} ${px(12)}`,
              border: '1px solid rgba(77,166,255,0.2)',
            }}
            onClick={() => Taro.navigateTo({ url: '/pages/member-fee/index' })}
          >
            队费
          </Text>
        </View>
      </View>

      <ScrollView scrollY style={{ flex: 1, padding: `${px(12)} ${px(14)}` }}>
        {/* 余额卡片 */}
        {summary && (
          <View style={{
            background: `linear-gradient(135deg, #0d2b1a 0%, #0b1f2f 100%)`,
            padding: `${px(24)} ${px(20)}`,
            marginBottom: px(14),
            borderRadius: px(20),
            border: `1px solid rgba(0,228,114,0.2)`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative glow */}
            <View style={{
              position: 'absolute', top: px(-40), right: px(-40),
              width: px(140), height: px(140), borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,228,114,0.08) 0%, transparent 70%)',
            }} />

            <Text style={{ fontSize: px(24), color: 'rgba(0,228,114,0.6)', display: 'block',
                           marginBottom: px(6), letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {t('finance.balance')}
            </Text>
            <Text style={{ fontSize: px(72), fontWeight: '800', color: C.primary,
                           display: 'block', marginBottom: px(20), letterSpacing: '-0.02em' }}>
              ¥{summary.balance.toFixed(2)}
            </Text>
            <View style={{ display: 'flex' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: px(22), color: C.text2, display: 'block',
                               marginBottom: px(4), letterSpacing: '0.05em' }}>
                  {t('finance.income')}
                </Text>
                <Text style={{ fontSize: px(36), fontWeight: '700', color: C.win }}>
                  +¥{summary.totalIncome.toFixed(2)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: px(22), color: C.text2, display: 'block',
                               marginBottom: px(4), letterSpacing: '0.05em' }}>
                  {t('finance.expense')}
                </Text>
                <Text style={{ fontSize: px(36), fontWeight: '700', color: C.lose }}>
                  -¥{summary.totalExpense.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 收支记录 */}
        <View style={{
          background: C.surface, borderRadius: px(16), padding: `${px(16)} ${px(14)}`,
          border: `1px solid ${C.border}`,
        }}>
          <Text style={{
            fontSize: px(26), fontWeight: '700', color: C.text3, display: 'block',
            marginBottom: px(14), letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            收支记录
          </Text>
          {summary?.records.map((r, idx) => (
            <View
              key={r.id}
              style={{
                display: 'flex', alignItems: 'center', padding: `${px(12)} 0`,
                borderBottom: idx < (summary.records.length - 1) ? `1px solid ${C.border}` : 'none',
              }}
            >
              <View style={{
                width: px(36), height: px(36), borderRadius: px(10),
                background: r.type === 'INCOME' ? 'rgba(0,228,114,0.12)' : 'rgba(255,77,90,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: px(12),
                flexShrink: 0,
              }}>
                <Text style={{
                  fontSize: px(28), fontWeight: '700',
                  color: r.type === 'INCOME' ? C.win : C.lose,
                }}>
                  {r.type === 'INCOME' ? '↓' : '↑'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: px(28), fontWeight: '600', color: C.text,
                               display: 'block', marginBottom: px(2) }}>
                  {r.category}
                </Text>
                <Text style={{ fontSize: px(24), color: C.text3 }}>
                  {r.recordDate}{r.description ? ` · ${r.description}` : ''}
                </Text>
              </View>
              <Text style={{
                fontSize: px(32), fontWeight: '700',
                color: r.type === 'INCOME' ? C.win : C.lose,
              }}>
                {r.type === 'INCOME' ? '+' : '-'}¥{r.amount.toFixed(2)}
              </Text>
            </View>
          ))}
          {!summary?.records.length && (
            <View style={{ textAlign: 'center', padding: `${px(32)} ${px(24)}` }}>
              <Text style={{ fontSize: px(60), display: 'block', marginBottom: px(10) }}>📒</Text>
              <Text style={{ fontSize: px(28), color: C.text3 }}>{t('finance.empty')}</Text>
            </View>
          )}
        </View>
        <View style={{ height: px(160) }} />
      </ScrollView>
    </View>
  )
}
