import { useState, useEffect } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { financeApi } from '../../api/finance'
import { useAuthStore } from '../../store/auth'
import type { MemberFeeRes } from '../../types/api'
import { useT } from '../../i18n/useT'
import { px } from '../../utils/style'

const C = {
  primary: '#22c55e',
  primaryDim: 'rgba(34,197,94,0.12)',
  bg: '#0f1010',
  surface: '#181c18',
  surface2: '#1e2420',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8ede8',
  text2: '#8a9e8a',
  text3: '#4a5a4a',
  win: '#22c55e',
  lose: '#ff4d5a',
}

export default function MemberFeePage() {
  const currentYear = new Date().getFullYear()
  const [season, setSeason] = useState(currentYear)
  const [fees, setFees] = useState<MemberFeeRes[]>([])
  const [feeAmount, setFeeAmount] = useState('')
  const { currentTeamId, currentRole, isCaptainOrAdmin } = useAuthStore()
  const t = useT()

  useEffect(() => {
    if (!isCaptainOrAdmin()) {
      Taro.reLaunch({ url: '/pages/home/index' })
    }
  }, [])

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: t('member_fee.title') })
  }, [])

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
    <View style={{ padding: px(16), background: C.bg, minHeight: '100%' }}>
      {/* Season switcher */}
      <View style={{
        background: C.surface, borderRadius: px(16), padding: px(16),
        marginBottom: px(14), border: `1px solid ${C.border}`,
      }}>
        <View style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: px(20),
        }}>
          <View
            onClick={() => setSeason(s => s - 1)}
            style={{
              width: px(40), height: px(40), borderRadius: px(10),
              background: C.surface2, border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: px(40), color: C.text2, lineHeight: '1' }}>‹</Text>
          </View>
          <Text style={{ fontSize: px(40), fontWeight: '800', color: C.text, letterSpacing: '-0.01em' }}>
            {season} 赛季
          </Text>
          <View
            onClick={() => setSeason(s => s + 1)}
            style={{
              width: px(40), height: px(40), borderRadius: px(10),
              background: C.surface2, border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: px(40), color: C.text2, lineHeight: '1' }}>›</Text>
          </View>
        </View>
      </View>

      {/* Set fee (captain only) */}
      {currentRole === 'CAPTAIN' && (
        <View style={{
          background: C.surface, borderRadius: px(16), padding: px(16),
          marginBottom: px(14), border: `1px solid ${C.border}`,
        }}>
          <Text style={{
            fontSize: px(24), fontWeight: '600', color: C.text3, marginBottom: px(10),
            display: 'block', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            设置每人应缴金额
          </Text>
          <View style={{ display: 'flex', gap: px(10), alignItems: 'center' }}>
            <View style={{ flex: 1, display: 'flex', alignItems: 'center',
                           border: `1px solid ${C.border}`, borderRadius: px(12),
                           padding: `${px(10)} ${px(12)}`, background: C.surface2 }}>
              <Text style={{ fontSize: px(32), fontWeight: '700', color: C.text, marginRight: px(4) }}>¥</Text>
              <Input
                value={feeAmount}
                onInput={e => setFeeAmount(e.detail.value)}
                type='digit'
                placeholder='0.00'
                style={{ fontSize: px(32), fontWeight: '700', color: C.text, flex: 1, background: 'transparent' }}
              />
            </View>
            <Button
              size='mini'
              style={{
                background: C.primary, color: '#0f1010', border: 'none',
                borderRadius: px(10), fontSize: px(26), fontWeight: '700',
                padding: `${px(10)} ${px(16)}`,
              }}
              onClick={handleSetFee}
            >
              {t('member_fee.set_fee')}
            </Button>
          </View>
        </View>
      )}

      {/* Fee list */}
      <View style={{
        background: C.surface, borderRadius: px(16), padding: `${px(16)} ${px(14)}`,
        border: `1px solid ${C.border}`,
      }}>
        <Text style={{
          fontSize: px(24), fontWeight: '700', color: C.text3,
          marginBottom: px(14), display: 'block',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          队员缴费情况
        </Text>

        {fees.map((f, idx) => (
          <View
            key={f.userId}
            style={{
              display: 'flex', alignItems: 'center',
              padding: `${px(12)} 0`,
              borderBottom: idx < fees.length - 1 ? `1px solid ${C.border}` : 'none',
            }}
          >
            <View style={{
              width: px(38), height: px(38), borderRadius: '50%',
              background: `hsl(${((f.userId * 137) % 360)}, 40%, 20%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginRight: px(12), border: `2px solid ${C.border}`, flexShrink: 0,
            }}>
              <Text style={{ fontSize: px(32) }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: px(28), fontWeight: '600', color: C.text,
                             display: 'block', marginBottom: px(2) }}>
                {f.nickname}
              </Text>
              <Text style={{ fontSize: px(24), color: C.text3 }}>
                {t('member_fee.paid')} ¥{f.amountPaid} / {t('member_fee.due')} ¥{f.amountDue}
              </Text>
            </View>
            {f.isPaid ? (
              <Text style={{
                fontSize: px(24), fontWeight: '700', color: C.win,
                background: 'rgba(34,197,94,0.12)', borderRadius: '9999px', padding: '4px 12px',
                border: '1px solid rgba(0,228,114,0.2)',
              }}>
                ✓ {t('member_fee.is_paid')}
              </Text>
            ) : (currentRole === 'CAPTAIN' || currentRole === 'ADMIN') ? (
              <Button
                size='mini'
                style={{
                  background: C.primaryDim, color: C.primary, border: '1px solid rgba(0,228,114,0.2)',
                  borderRadius: '9999px', fontSize: px(24), fontWeight: '600',
                  padding: '4px 12px',
                }}
                onClick={() => handleMarkFee(f.userId, f.amountDue)}
              >
                {t('member_fee.mark_paid')}
              </Button>
            ) : (
              <Text style={{
                fontSize: px(24), fontWeight: '600', color: C.lose,
                background: 'rgba(255,77,90,0.1)', borderRadius: '9999px', padding: '4px 12px',
              }}>
                未付
              </Text>
            )}
          </View>
        ))}
        {fees.length === 0 && (
          <View style={{ textAlign: 'center', padding: `${px(36)} ${px(24)}` }}>
            <Text style={{ fontSize: px(60), display: 'block', marginBottom: px(10) }}>💰</Text>
            <Text style={{ fontSize: px(28), color: C.text3 }}>
              {currentRole === 'CAPTAIN' ? '本赛季暂无记录，请先设置应缴金额' : '本赛季暂无队费记录'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
