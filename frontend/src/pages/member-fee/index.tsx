import { useState, useEffect } from 'react'
import { View, Text, Button, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { financeApi } from '../../api/finance'
import { useAuthStore } from '../../store/auth'
import type { MemberFeeRes } from '../../types/api'
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
        marginBottom: px(16), boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <View style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: px(16),
        }}>
          <Text style={{
            fontSize: px(24), color: C.primary, fontWeight: '300',
            padding: '8px 16px', background: C.primaryLight, borderRadius: px(12),
          }}
            onClick={() => setSeason(s => s - 1)}>‹</Text>
          <Text style={{ fontSize: px(20), fontWeight: '700', color: C.text }}>
            {season} 赛季
          </Text>
          <Text style={{
            fontSize: px(24), color: C.primary, fontWeight: '300',
            padding: '8px 16px', background: C.primaryLight, borderRadius: px(12),
          }}
            onClick={() => setSeason(s => s + 1)}>›</Text>
        </View>
      </View>

      {/* Set fee amount (captain only) */}
      {currentRole === 'CAPTAIN' && (
        <View style={{
          background: C.surface, borderRadius: px(16), padding: px(16),
          marginBottom: px(16), display: 'flex', gap: px(10), alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: px(13), fontWeight: '500', color: C.text2, marginBottom: px(6), display: 'block',
            }}>
              设置本赛季每人应缴金额
            </Text>
            <Input
              value={feeAmount}
              onInput={e => setFeeAmount(e.detail.value)}
              type='digit'
              placeholder='0.00'
              style={{
                border: '1.5px solid #e5e7eb', borderRadius: px(10), padding: '10px 12px',
                fontSize: px(15), background: C.bg, color: C.text,
              }}
            />
          </View>
          <Button
            size='mini'
            style={{
              background: C.primary, color: '#fff', border: 'none',
              borderRadius: '9999px', fontSize: px(13), fontWeight: '600',
              padding: '8px 18px', marginTop: px(18),
            }}
            onClick={handleSetFee}
          >
            {t('member_fee.set_fee')}
          </Button>
        </View>
      )}

      {/* Fee list */}
      <View style={{
        background: C.surface, borderRadius: px(16), padding: px(16),
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <Text style={{
          fontSize: px(15), fontWeight: '700', color: C.text,
          marginBottom: px(12), display: 'block',
        }}>
          队员缴费情况
        </Text>

        {fees.map(f => (
          <View
            key={f.userId}
            style={{
              display: 'flex', alignItems: 'center', padding: '12px 0',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            {f.avatarUrl
              ? <Image src={f.avatarUrl} style={{
                  width: px(36), height: px(36), borderRadius: '50%',
                  marginRight: px(12), border: '2px solid #f3f4f6',
                }} />
              : <View style={{
                  width: px(36), height: px(36), borderRadius: '50%',
                  background: '#e5e7eb', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginRight: px(12),
                }}>
                  <Text style={{ fontSize: px(14) }}>👤</Text>
                </View>
            }
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: px(14), fontWeight: '600', color: C.text, display: 'block', marginBottom: px(2) }}>
                {f.nickname}
              </Text>
              <Text style={{ fontSize: px(12), color: C.text3 }}>
                {t('member_fee.paid')} ¥{f.amountPaid} / {t('member_fee.due')} ¥{f.amountDue}
              </Text>
            </View>
            {f.isPaid ? (
              <Text style={{
                fontSize: px(12), fontWeight: '600', color: C.win,
                background: '#ecfdf5', borderRadius: '9999px', padding: '4px 12px',
              }}>
                ✓ {t('member_fee.is_paid')}
              </Text>
            ) : (currentRole === 'CAPTAIN' || currentRole === 'ADMIN') ? (
              <Button
                size='mini'
                style={{
                  background: C.primaryLight, color: C.primary, border: 'none',
                  borderRadius: '9999px', fontSize: px(12), fontWeight: '500',
                  padding: '4px 12px',
                }}
                onClick={() => handleMarkFee(f.userId, f.amountDue)}
              >
                {t('member_fee.mark_paid')}
              </Button>
            ) : (
              <Text style={{
                fontSize: px(12), fontWeight: '500', color: C.lose,
                background: '#fef2f2', borderRadius: '9999px', padding: '4px 12px',
              }}>
                未付
              </Text>
            )}
          </View>
        ))}
        {fees.length === 0 && (
          <View style={{ textAlign: 'center', padding: '40px 24px' }}>
            <Text style={{ fontSize: px(32), display: 'block', marginBottom: px(8) }}>💰</Text>
            <Text style={{ fontSize: px(14), color: C.text3 }}>
              {currentRole === 'CAPTAIN' ? '本赛季暂无队费记录，请先设置应缴金额' : '本赛季暂无队费记录'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
