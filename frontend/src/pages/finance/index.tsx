import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { financeApi } from '../../api/finance'
import { useAuthStore } from '../../store/auth'
import type { FinanceSummaryRes } from '../../types/api'

export default function FinancePage() {
  const [summary, setSummary] = useState<FinanceSummaryRes | null>(null)
  const { currentTeamId } = useAuthStore()

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
    <View style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                     padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>财务</Text>
        <View style={{ display: 'flex', gap: '12px' }}>
          <Text
            style={{ color: '#4CAF50', fontSize: '14px' }}
            onClick={() => Taro.navigateTo({ url: '/pages/finance-record/index' })}
          >
            + 记录收支
          </Text>
          <Text
            style={{ color: '#2196F3', fontSize: '14px' }}
            onClick={() => Taro.navigateTo({ url: '/pages/member-fee/index' })}
          >
            队费
          </Text>
        </View>
      </View>

      <ScrollView scrollY style={{ flex: 1 }}>
        {summary && (
          <View style={{ background: '#4CAF50', padding: '20px 16px', margin: '12px 16px',
                         borderRadius: '12px', color: '#fff' }}>
            <Text style={{ fontSize: '14px', opacity: 0.8, display: 'block',
                           marginBottom: '8px' }}>结余</Text>
            <Text style={{ fontSize: '32px', fontWeight: 'bold', display: 'block',
                           marginBottom: '16px' }}>¥{summary.balance.toFixed(2)}</Text>
            <View style={{ display: 'flex' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: '12px', opacity: 0.7, display: 'block' }}>总收入</Text>
                <Text style={{ fontSize: '16px' }}>¥{summary.totalIncome.toFixed(2)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: '12px', opacity: 0.7, display: 'block' }}>总支出</Text>
                <Text style={{ fontSize: '16px' }}>¥{summary.totalExpense.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ padding: '0 16px 16px' }}>
          <Text style={{ fontSize: '15px', fontWeight: 'bold', display: 'block',
                         marginBottom: '8px' }}>收支记录</Text>
          {summary?.records.map(r => (
            <View
              key={r.id}
              style={{ background: '#fff', borderRadius: '8px', padding: '12px 16px',
                       marginBottom: '8px', display: 'flex', alignItems: 'center' }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: '14px', display: 'block' }}>{r.category}</Text>
                <Text style={{ fontSize: '12px', color: '#999' }}>
                  {r.recordDate}{r.description ? ` · ${r.description}` : ''}
                </Text>
              </View>
              <Text style={{ fontSize: '16px', fontWeight: 'bold',
                             color: r.type === 'INCOME' ? '#4CAF50' : '#f44336' }}>
                {r.type === 'INCOME' ? '+' : '-'}¥{r.amount.toFixed(2)}
              </Text>
            </View>
          ))}
          {!summary?.records.length && (
            <Text style={{ textAlign: 'center', color: '#999', display: 'block', padding: '32px' }}>
              暂无收支记录
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
