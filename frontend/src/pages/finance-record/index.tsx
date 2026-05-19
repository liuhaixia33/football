import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { financeApi } from '../../api/finance'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'

const CATEGORIES = ['队费', '场地费', '装备费', '奖金', '其他']

const labelStyle = { fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' } as const
const inputStyle = {
  border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px',
  marginBottom: '16px', fontSize: '15px', background: '#fafafa'
} as const
const btnStyle = { background: '#4CAF50', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '16px' } as const

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
    <View style={{ padding: '16px' }}>
      <View style={{ display: 'flex', marginBottom: '16px', gap: '8px' }}>
        {(['INCOME', 'EXPENSE'] as const).map(typeVal => (
          <View
            key={typeVal}
            onClick={() => setType(typeVal)}
            style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px',
                     fontSize: '14px',
                     background: type === typeVal ? (typeVal === 'INCOME' ? '#4CAF50' : '#f44336') : '#f5f5f5',
                     color: type === typeVal ? '#fff' : '#666' }}
          >
            <Text>{typeVal === 'INCOME' ? `+ ${t('finance_form.income')}` : `- ${t('finance_form.expense')}`}</Text>
          </View>
        ))}
      </View>

      <Text style={labelStyle}>{t('finance_form.amount')}</Text>
      <Input
        value={amount}
        onInput={e => setAmount(e.detail.value)}
        type='digit'
        placeholder='0.00'
        style={{ ...inputStyle, fontSize: '20px', textAlign: 'center' }}
      />

      <Text style={labelStyle}>{t('finance_form.category')}</Text>
      <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {CATEGORIES.map(c => (
          <View
            key={c}
            onClick={() => setCategory(c)}
            style={{ padding: '6px 12px', borderRadius: '16px', fontSize: '13px',
                     border: `1px solid ${category === c ? '#4CAF50' : '#e0e0e0'}`,
                     color: category === c ? '#4CAF50' : '#666',
                     background: category === c ? '#E8F5E9' : '#fff' }}
          >
            <Text>{c}</Text>
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
        style={{ ...inputStyle, marginBottom: '32px' }}
      />

      <Button style={btnStyle} loading={loading} onClick={submit}>
        {t('finance_form.submit')}
      </Button>
    </View>
  )
}
