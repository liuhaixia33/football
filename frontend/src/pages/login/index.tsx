import { useState } from 'react'
import { View, Text, Button, Image, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authApi } from '../../api/auth'
import { uploadApi } from '../../api/upload'
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
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [avatarTmp, setAvatarTmp] = useState('')
  const { setAuth, setTeams, avatarUrl: storedAvatarUrl, nickname: storedNickname } = useAuthStore()
  const [nickname, setNickname] = useState(storedNickname || '')
  const t = useT()

  const avatarDisplay = avatarTmp || storedAvatarUrl || ''
  const canLogin = !!(avatarTmp || storedAvatarUrl) && !!nickname.trim() && !loading

  const handleLogin = async () => {
    if (!canLogin) return
    setLoading(true)
    try {
      let ossUrl = storedAvatarUrl ?? ''
      if (avatarTmp) {
        const { url } = await uploadApi.avatar(avatarTmp)
        ossUrl = url
      }
      const { code } = await Taro.login()
      const res = await authApi.login(code, nickname.trim(), ossUrl)
      setAuth(res.token, res.userId, res.nickname, res.avatarUrl || ossUrl)
      setTeams(res.teams)

      if (res.teams.length === 0) {
        Taro.reLaunch({ url: '/pages/onboard/index' })
      } else if (res.teams.length === 1) {
        useAuthStore.getState().setCurrentTeam(res.teams[0].teamId, res.teams[0].role)
        Taro.reLaunch({ url: '/pages/home/index' })
      } else {
        Taro.reLaunch({ url: '/pages/team-select/index' })
      }
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : t('login.fail'), icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>

      {/* ── Top brand area: ~40% height ── */}
      <View style={{
        flex: 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: px(32),
        background: 'linear-gradient(180deg, #0e2d1e 0%, #0b0f18 100%)',
      }}>
        {/* Ball icon */}
        <View style={{
          width: px(100), height: px(100), borderRadius: '50%',
          background: C.primaryDim,
          border: `2px solid rgba(0,228,114,0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: px(20),
        }}>
          <Text style={{ fontSize: px(94) }}>⚽</Text>
        </View>
        <Text style={{
          fontSize: px(52), fontWeight: '900', color: C.text, display: 'block',
          textAlign: 'center', letterSpacing: '-0.02em', marginBottom: px(6),
        }}>
          {t('login.title')}
        </Text>
        <Text style={{ fontSize: px(28), color: C.text2, textAlign: 'center', display: 'block' }}>
          加入你的球队，记录每一场比赛
        </Text>
      </View>

      {/* ── Form area: ~60% height ── */}
      <View style={{
        flex: 3,
        padding: `${px(32)} ${px(24)} ${px(48)}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
      }}>

        {/* Avatar row */}
        <View style={{
          display: 'flex', alignItems: 'center', gap: px(16),
          marginBottom: px(24),
          background: C.surface,
          borderRadius: px(16),
          padding: `${px(14)} ${px(16)}`,
          border: `1px solid ${C.border}`,
        }}>
          <Button
            openType="chooseAvatar"
            onChooseAvatar={(e) => setAvatarTmp((e as unknown as { detail: { avatarUrl: string } }).detail.avatarUrl)}
            style={{ background: 'transparent', border: 'none', padding: 0,
                     width: px(56), height: px(56), borderRadius: '50%', flexShrink: 0 }}
          >
            {avatarDisplay
              ? <Image src={avatarDisplay} style={{
                  width: px(56), height: px(56), borderRadius: '50%',
                  border: `2px solid ${C.primary}`,
                }} />
              : <View style={{
                  width: px(56), height: px(56), borderRadius: '50%',
                  background: C.surface2, border: `2px dashed rgba(0,228,114,0.35)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: px(46) }}>📷</Text>
                </View>
            }
          </Button>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: px(28), fontWeight: '600', color: C.text, display: 'block', marginBottom: px(2) }}>
              头像
            </Text>
            <Text style={{ fontSize: px(24), color: C.text3 }}>
              {avatarDisplay ? '点击更换头像' : t('login.tap_avatar')}
            </Text>
          </View>
          <Text style={{ fontSize: px(28), color: C.text3 }}>›</Text>
        </View>

        {/* Nickname */}
        <View style={{ marginBottom: px(8) }}>
          <Text style={{
            fontSize: px(24), fontWeight: '700', color: C.text3,
            marginBottom: px(8), display: 'block',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            昵称
          </Text>
          <Input
            type="nickname"
            value={nickname}
            onInput={(e) => setNickname(e.detail.value)}
            onBlur={(e) => setNickname(e.detail.value)}
            placeholder={t('login.nickname_placeholder')}
            style={{
              height: px(52),
              background: C.surface,
              borderRadius: px(14),
              padding: `0 ${px(16)}`,
              fontSize: px(32),
              border: `1px solid ${C.border}`,
              color: C.text,
            }}
          />
        </View>

        {/* Login button */}
        <Button
          style={{
            marginTop: px(32),
            background: canLogin ? C.primary : 'rgba(255,255,255,0.07)',
            color: canLogin ? '#0b0f18' : C.text3,
            borderRadius: px(16),
            height: px(56),
            lineHeight: px(56),
            fontSize: px(34),
            fontWeight: '800',
            border: 'none',
            letterSpacing: '0.02em',
          }}
          loading={loading}
          disabled={!canLogin}
          onClick={handleLogin}
        >
          {t('login.btn')}
        </Button>
      </View>
    </View>
  )
}
