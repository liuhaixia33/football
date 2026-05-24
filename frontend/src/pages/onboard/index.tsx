import { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { teamApi } from '../../api/team'
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
}

export default function OnboardPage() {
  const t = useT()
  const params = Taro.getCurrentInstance().router?.params ?? {}
  const inviteCode = (params.inviteCode as string | undefined) || ''

  const [teamName, setTeamName] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    if (!inviteCode) return
    teamApi.getByInviteCode(inviteCode)
      .then(info => setTeamName(info.name))
      .catch(() => setTeamName(''))
  }, [inviteCode])

  async function handleJoin() {
    if (!inviteCode || joining || joined) return
    setJoining(true)
    try {
      await teamApi.join(inviteCode)
      setJoined(true)
      Taro.showToast({ title: '申请已发送，等待管理员审核', icon: 'success' })
      setTimeout(() => Taro.reLaunch({ url: '/pages/home/index' }), 1500)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('已是') || msg.includes('审核中')) {
        setJoined(true)
        setTimeout(() => Taro.reLaunch({ url: '/pages/home/index' }), 1000)
      } else {
        Taro.showToast({ title: msg || '申请失败', icon: 'none' })
      }
    } finally {
      setJoining(false)
    }
  }

  const showInvite = !!inviteCode

  return (
    <View style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', padding: px(24), background: C.bg,
    }}>
      <View style={{
        background: C.surface,
        borderRadius: px(24),
        padding: `${px(40)} ${px(28)}`,
        width: '100%',
        textAlign: 'center',
        border: `1px solid ${C.border}`,
      }}>
        {/* Icon */}
        <View style={{
          width: px(88), height: px(88), borderRadius: '50%',
          background: C.primaryDim,
          border: `2px solid rgba(34,197,94,0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto',
          marginBottom: px(20),
        }}>
          <Text style={{ fontSize: px(80) }}>⚽</Text>
        </View>

        {showInvite ? (
          <>
            <Text style={{
              fontSize: px(46), fontWeight: '800', color: C.text,
              marginBottom: px(10), display: 'block',
              letterSpacing: '-0.02em',
            }}>
              收到球队邀请
            </Text>
            <Text style={{
              fontSize: px(28), color: C.text2, marginBottom: px(8),
              display: 'block', lineHeight: '1.7',
            }}>
              {teamName === null
                ? '加载中...'
                : teamName
                  ? `「${teamName}」邀请你加入`
                  : '邀请码已失效或球队不存在'}
            </Text>
            {teamName !== null && teamName !== '' && (
              <Text style={{
                fontSize: px(24), color: C.text3, marginBottom: px(36),
                display: 'block',
              }}>
                申请加入后需等待管理员审核
              </Text>
            )}
            {(!teamName && teamName !== null) && (
              <Text style={{
                fontSize: px(24), color: C.text3, marginBottom: px(36),
                display: 'block',
              }}>
                你可以创建一支新球队
              </Text>
            )}

            <Button
              style={{
                background: (teamName && !joined) ? C.primary : 'rgba(255,255,255,0.07)',
                color: (teamName && !joined) ? '#0f1010' : C.text3,
                borderRadius: px(14),
                width: '100%', marginBottom: px(12), border: 'none',
                fontSize: px(32), fontWeight: '700', padding: `${px(14)} 0`,
                opacity: joining ? 0.7 : 1,
              }}
              loading={joining}
              disabled={!teamName || joined || joining}
              onClick={handleJoin}
            >
              {joined ? '申请已提交' : teamName ? `申请加入「${teamName}」` : '邀请码无效'}
            </Button>
            <Button
              style={{
                background: 'transparent', color: C.primary,
                border: `1.5px solid rgba(34,197,94,0.4)`,
                borderRadius: px(14), width: '100%', fontSize: px(32),
                fontWeight: '600', padding: `${px(14)} 0`,
              }}
              onClick={() => Taro.navigateTo({ url: '/pages/create-team/index' })}
            >
              {t('onboard.create')}
            </Button>
          </>
        ) : (
          <>
            <Text style={{
              fontSize: px(46), fontWeight: '800', color: C.text,
              marginBottom: px(10), display: 'block',
              letterSpacing: '-0.02em',
            }}>
              欢迎加入足球队
            </Text>
            <Text style={{
              fontSize: px(28), color: C.text2, marginBottom: px(36),
              display: 'block', lineHeight: '1.7',
            }}>
              创建新球队或通过邀请码加入已有球队
            </Text>

            <Button
              style={{
                background: C.primary, color: '#0f1010', borderRadius: px(14),
                width: '100%', marginBottom: px(12), border: 'none',
                fontSize: px(32), fontWeight: '700', padding: `${px(14)} 0`,
              }}
              onClick={() => Taro.navigateTo({ url: '/pages/create-team/index' })}
            >
              {t('onboard.create')}
            </Button>
            <Button
              style={{
                background: 'transparent', color: C.primary,
                border: `1.5px solid rgba(34,197,94,0.4)`,
                borderRadius: px(14), width: '100%', fontSize: px(32),
                fontWeight: '600', padding: `${px(14)} 0`,
              }}
              onClick={() => Taro.navigateTo({ url: '/pages/join-team/index' })}
            >
              {t('onboard.join')}
            </Button>
          </>
        )}
      </View>
    </View>
  )
}
