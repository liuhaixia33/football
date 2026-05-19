import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { financeApi } from '../../api/finance'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import { px } from '../../utils/style'

const C = {
  primary: '#00e472',
  primaryDim: 'rgba(0,228,114,0.12)',
  bg: '#0b0f18',
  surface: '#131a27',
  surface2: '#1a2235',
  border: 'rgba(255,255,255,0.09)',
  text: '#e8f0fb',
  text2: '#7a8ca3',
  text3: '#364a60',
  win: '#00e472',
  lose: '#ff4d5a',
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

  const labelStyle = {
    fontSize: px(24), fontWeight: '600', color: C.text3,
    marginBottom: px(8), display: 'block',
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
  }
  const inputStyle = {
    border: `1px solid ${C.border}`, borderRadius: px(12),
    padding: `${px(14)} ${px(14)}`,
    marginBottom: px(20), fontSize: px(30), background: C.surface2, color: C.text,
  }

  return (
    <View style={{ padding: px(16), background: C.bg, minHeight: '100%' }}>
      <View style={{
        background: C.surface, borderRadius: px(16), padding: px(20),
        border: `1px solid ${C.border}`,
      }}>
        <Text style={{
          fontSize: px(40), fontWeight: '800', color: C.text,
          marginBottom: px(24), display: 'block', letterSpacing: '-0.01em',
        }}>
          {t('finance_form.title')}
        </Text>

        {/* 收入/支出切换 */}
        <View style={{ display: 'flex', marginBottom: px(24), gap: px(10) }}>
          {(['INCOME', 'EXPENSE'] as const).map(typeVal => (
            <View
              key={typeVal}
              onClick={() => setType(typeVal)}
              style={{
                flex: 1, textAlign: 'center', padding: px(12), borderRadius: px(12),
                background: type === typeVal
                  ? (typeVal === 'INCOME' ? 'rgba(0,228,114,0.15)' : 'rgba(255,77,90,0.15)')
                  : C.surface2,
                border: type === typeVal
                  ? `1.5px solid ${typeVal === 'INCOME' ? 'rgba(0,228,114,0.4)' : 'rgba(255,77,90,0.4)'}`
                  : `1px solid ${C.border}`,
              }}
            >
              <Text style={{
                fontSize: px(30), fontWeight: '700',
                color: type === typeVal
                  ? (typeVal === 'INCOME' ? C.win : C.lose)
                  : C.text2,
              }}>
                {typeVal === 'INCOME' ? `+ ${t('finance_form.income')}` : `- ${t('finance_form.expense')}`}
              </Text>
            </View>
          ))}
        </View>

        <Text style={labelStyle}>{t('finance_form.amount')}</Text>
        <View style={{
          display: 'flex', alignItems: 'center',
          border: `1px solid ${C.border}`, borderRadius: px(12),
          padding: `${px(14)} ${px(14)}`, marginBottom: px(20),
          background: C.surface2,
        }}>
          <Text style={{ fontSize: px(44), fontWeight: '800', color: C.text, marginRight: px(4) }}>¥</Text>
          <Input
            value={amount}
            onInput={e => setAmount(e.detail.value)}
            type='digit'
            placeholder='0.00'
            style={{ fontSize: px(44), fontWeight: '800', color: C.text, flex: 1, background: 'transparent' }}
          />
        </View>

        <Text style={labelStyle}>{t('finance_form.category')}</Text>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: px(8), marginBottom: px(24) }}>
          {CATEGORIES.map(c => (
            <View
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: `${px(7)} ${px(14)}`, borderRadius: '9999px', fontSize: px(26),
                border: `1.5px solid ${category === c ? 'rgba(0,228,114,0.4)' : C.border}`,
                color: category === c ? C.primary : C.text2,
                background: category === c ? C.primaryDim : C.surface2,
                fontWeight: category === c ? '700' : '400',
              }}
            >
              <Text style={{ color: category === c ? C.primary : C.text2, fontWeight: category === c ? '700' : '400' }}>
                {c}
              </Text>
            </View>
          ))}
        </View>

        <Text style={labelStyle}>{t('finance_form.date')}</Text>
        <Input
          value={recordDate}
          onInput={e => setRecordDate(e.detail.value)}
          placeholder='YYYY-MM-DD'
          style={inputStyle}
        />

        <Text style={labelStyle}>{t('finance_form.desc')}</Text>
        <Input
          value={description}
          onInput={e => setDescription(e.detail.value)}
          placeholder={t('common.optional')}
          style={{ ...inputStyle, marginBottom: px(32) }}
        />

        <Button
          style={{
            background: C.primary, color: '#0b0f18', borderRadius: px(14),
            border: 'none', fontSize: px(32), fontWeight: '700',
            padding: `${px(14)} 0`,
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
