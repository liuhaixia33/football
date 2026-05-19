import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { financeApi } from '../../api/finance'
import { useAuthStore } from '../../store/auth'
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
  lose: '#ef4444',
}

const CATEGORIES = ['队费', '场地费', '装备费', '奖金', '其他']

export default function FinanceRecordPage() {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('队费')
  const [description, setDescription] = useState('')
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const { currentTeamId, isCaptainOrAdmin } = useAuthStore()
  const t = useT()

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: t('finance_form.title') })
  }, [])

  useEffect(() => {
    if (!isCaptainOrAdmin()) {
      Taro.reLaunch({ url: '/pages/home/index' })
    }
  }, [])

  const submit = async () => {
    const amountNum = Number(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    if (!currentTeamId) return
    setLoading(true)
    try {
      await financeApi.createRecord(currentTeamId, {
        type,
        amount: amountNum,
        category,
        recordDate,
        description: description.trim() || undefined,
      })
      Taro.showToast({ title: t('common.success'), icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '提交失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ padding: px(16), background: C.bg, minHeight: '100%' }}>
      <View style={{
        background: C.surface, borderRadius: px(16), padding: px(24),
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <Text style={{
          fontSize: px(18), fontWeight: '700', color: C.text, marginBottom: px(20), display: 'block',
        }}>
          {t('finance_form.title')}
        </Text>

        {/* 类型切换 */}
        <View style={{ display: 'flex', marginBottom: px(20), gap: px(8) }}>
          {(['INCOME', 'EXPENSE'] as const).map(typeVal => (
            <View
              key={typeVal}
              onClick={() => setType(typeVal)}
              style={{
                flex: 1, textAlign: 'center', padding: px(10), borderRadius: px(12),
                fontSize: px(14), fontWeight: type === typeVal ? '600' : '400',
                background: type === typeVal
                  ? (typeVal === 'INCOME' ? C.primary : C.lose)
                  : '#f3f4f6',
                color: type === typeVal ? '#fff' : C.text2,
              }}
            >
              <Text>{typeVal === 'INCOME' ? `+ ${t('finance_form.income')}` : `- ${t('finance_form.expense')}`}</Text>
            </View>
          ))}
        </View>

        <Text style={{
          fontSize: px(13), fontWeight: '500', color: C.text2, marginBottom: px(8), display: 'block',
        }}>
          {t('finance_form.amount')}
        </Text>
        <View style={{
          display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb',
          borderRadius: px(12), padding: '12px 14px', marginBottom: px(16),
          background: C.bg,
        }}>
          <Text style={{ fontSize: px(20), fontWeight: '700', color: C.text, marginRight: px(4) }}>¥</Text>
          <Input
            value={amount}
            onInput={e => setAmount(e.detail.value)}
            type='digit'
            placeholder='0.00'
            style={{ fontSize: px(22), fontWeight: '700', color: C.text, flex: 1, background: 'transparent' }}
          />
        </View>

        <Text style={{
          fontSize: px(13), fontWeight: '500', color: C.text2, marginBottom: px(8), display: 'block',
        }}>
          {t('finance_form.category')}
        </Text>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: px(8), marginBottom: px(20) }}>
          {CATEGORIES.map(c => (
            <View
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '6px 14px', borderRadius: '9999px', fontSize: px(13),
                fontWeight: category === c ? '600' : '400',
                border: `1.5px solid ${category === c ? C.primary : '#e5e7eb'}`,
                color: category === c ? C.primary : C.text2,
                background: category === c ? C.primaryLight : C.surface,
              }}
            >
              <Text>{c}</Text>
            </View>
          ))}
        </View>

        <Text style={{
          fontSize: px(13), fontWeight: '500', color: C.text2, marginBottom: px(8), display: 'block',
        }}>
          {t('finance_form.date')}
        </Text>
        <Input
          value={recordDate}
          onInput={e => setRecordDate(e.detail.value)}
          placeholder='YYYY-MM-DD'
          style={{
            border: '1.5px solid #e5e7eb', borderRadius: px(12), padding: '12px 14px',
            marginBottom: px(16), fontSize: px(15), background: C.bg, color: C.text,
          }}
        />

        <Text style={{
          fontSize: px(13), fontWeight: '500', color: C.text2, marginBottom: px(8), display: 'block',
        }}>
          {t('finance_form.desc')}
        </Text>
        <Input
          value={description}
          onInput={e => setDescription(e.detail.value)}
          placeholder={t('common.optional')}
          style={{
            border: '1.5px solid #e5e7eb', borderRadius: px(12), padding: '12px 14px',
            marginBottom: px(32), fontSize: px(15), background: C.bg, color: C.text,
          }}
        />

        <Button
          style={{
            background: C.primary, color: '#fff', borderRadius: '9999px',
            border: 'none', fontSize: px(16), fontWeight: '600', padding: '10px 0',
          }}
          loading={loading}
          onClick={submit}
        >
          {t('finance_form.submit')}
        </Button>
      </View>
    </View>
  )
}
