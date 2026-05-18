import { useState, useEffect } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { financeApi } from '../../api/finance'
import { useAuthStore } from '../../store/auth'
import type { MemberFeeRes } from '../../types/api'

export default function MemberFeePage() {
  const currentYear = new Date().getFullYear()
  const [season, setSeason] = useState(currentYear)
  const [fees, setFees] = useState<MemberFeeRes[]>([])
  const [feeAmount, setFeeAmount] = useState('')
  const { currentTeamId, currentRole } = useAuthStore()

  const load = async () => {
    if (!currentTeamId) return
    try {
      const data = await financeApi.memberFees(currentTeamId, season)
      setFees(data)
    } catch {
      setFees([])
    }
  }

  useEffect(() => { load() }, [season, currentTeamId])

  const handleSetFee = async () => {
    const amount = Number(feeAmount)
    if (!feeAmount || isNaN(amount) || amount <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    if (!currentTeamId) return
    try {
      await financeApi.setMemberFee(currentTeamId, season, amount)
      Taro.showToast({ title: '已设置', icon: 'success' })
      setFeeAmount('')
      load()
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '设置失败', icon: 'none' })
    }
  }

  const handleMarkFee = async (targetUserId: number, amountDue: number) => {
    if (!currentTeamId) return
    try {
      await financeApi.markFee(currentTeamId, targetUserId, season, amountDue)
      Taro.showToast({ title: '已标记为已付', icon: 'success' })
      load()
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
    }
  }

  return (
    <View style={{ padding: '16px' }}>
      {/* Season switcher */}
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                     gap: '16px', marginBottom: '16px' }}>
        <Text style={{ fontSize: '20px', color: '#4CAF50' }}
              onClick={() => setSeason(s => s - 1)}>‹</Text>
        <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>{season} 赛季</Text>
        <Text style={{ fontSize: '20px', color: '#4CAF50' }}
              onClick={() => setSeason(s => s + 1)}>›</Text>
      </View>

      {/* Set fee amount (captain only) */}
      {currentRole === 'CAPTAIN' && (
        <View style={{ background: '#fff', borderRadius: '8px', padding: '12px',
                       marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <Input
            value={feeAmount}
            onInput={e => setFeeAmount(e.detail.value)}
            type='digit'
            placeholder='设置本赛季每人应缴金额'
            style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: '6px',
                     padding: '8px', fontSize: '14px' }}
          />
          <Button
            size='mini'
            style={{ background: '#4CAF50', color: '#fff', border: 'none',
                     borderRadius: '6px', fontSize: '13px' }}
            onClick={handleSetFee}
          >
            设置
          </Button>
        </View>
      )}

      {/* Fee list */}
      {fees.map(f => (
        <View
          key={f.userId}
          style={{ background: '#fff', borderRadius: '8px', padding: '12px 16px',
                   marginBottom: '8px', display: 'flex', alignItems: 'center' }}
        >
          <Text style={{ fontSize: '24px', marginRight: '12px' }}>👤</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
              {f.nickname}
            </Text>
            <Text style={{ fontSize: '12px', color: '#999' }}>
              已付 ¥{f.amountPaid} / 应缴 ¥{f.amountDue}
            </Text>
          </View>
          {f.isPaid ? (
            <Text style={{ color: '#4CAF50', fontSize: '13px' }}>✓ 已付</Text>
          ) : (currentRole === 'CAPTAIN' || currentRole === 'ADMIN') ? (
            <Button
              size='mini'
              style={{ background: '#E8F5E9', color: '#4CAF50', border: 'none',
                       borderRadius: '4px', fontSize: '12px' }}
              onClick={() => handleMarkFee(f.userId, f.amountDue)}
            >
              标记已付
            </Button>
          ) : (
            <Text style={{ color: '#f44336', fontSize: '13px' }}>未付</Text>
          )}
        </View>
      ))}
      {fees.length === 0 && (
        <Text style={{ textAlign: 'center', color: '#999', display: 'block', padding: '32px' }}>
          {currentRole === 'CAPTAIN' ? '本赛季暂无队费记录，请先设置应缴金额' : '本赛季暂无队费记录'}
        </Text>
      )}
    </View>
  )
}
