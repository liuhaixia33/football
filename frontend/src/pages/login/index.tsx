import { useState } from 'react'
import { View, Text, Button, Image, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authApi } from '../../api/auth'
import { uploadApi } from '../../api/upload'
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
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [avatarTmp, setAvatarTmp] = useState('')
  const [nickname, setNickname] = useState('')
  const { setAuth, setTeams, avatarUrl: storedAvatarUrl } = useAuthStore()
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
    <View style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', background: C.bg, padding: px(32),
    }}>
      <View style={{
        background: C.surface, borderRadius: px(20), padding: '32px 24px',
        width: '100%', maxWidth: px(360),
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}>
        <Text style={{
          fontSize: px(24), fontWeight: '700', color: C.text,
          marginBottom: px(8), display: 'block', textAlign: 'center',
        }}>
          {t('login.title')}
        </Text>
        <Text style={{
          fontSize: px(14), color: C.text3, marginBottom: px(28),
          display: 'block', textAlign: 'center',
        }}>
          加入你的球队，记录每一场比赛
        </Text>

        {/* 头像选择 */}
        <View style={{ display: 'flex', justifyContent: 'center', marginBottom: px(8) }}>
          <Button
            openType="chooseAvatar"
            onChooseAvatar={(e) => setAvatarTmp((e as unknown as { detail: { avatarUrl: string } }).detail.avatarUrl)}
            style={{
              background: 'transparent', border: 'none', padding: 0,
              width: px(96), height: px(96), borderRadius: '50%',
            }}
          >
            {avatarDisplay
              ? <Image src={avatarDisplay} style={{
                  width: px(96), height: px(96), borderRadius: '50%',
                  border: '3px solid ' + C.primaryLight,
                }} />
              : <View style={{
                  width: px(96), height: px(96), borderRadius: '50%',
                  background: C.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: '2px dashed #d1d5db',
                }}>
                  <Text style={{ fontSize: px(36) }}>📷</Text>
                </View>
            }
          </Button>
        </View>
        <Text style={{ fontSize: px(12), color: C.text3, marginBottom: px(24), textAlign: 'center', display: 'block' }}>
          {t('login.tap_avatar')}
        </Text>

        {/* 昵称输入 */}
        <Text style={{
          fontSize: px(13), fontWeight: '500', color: C.text2,
          marginBottom: px(8), display: 'block',
        }}>
          昵称
        </Text>
        <Input
          type="nickname"
          value={nickname}
          onInput={(e) => setNickname(e.detail.value)}
          placeholder={t('login.nickname_placeholder')}
          style={{
            background: C.bg, borderRadius: px(12), padding: '12px 14px',
            fontSize: px(15), width: '100%', marginBottom: px(32),
            border: '1px solid #e5e7eb', color: C.text, boxSizing: 'border-box',
          }}
        />

        {/* 登录按钮 */}
        <Button
          style={{
            background: canLogin ? C.primary : '#d1d5db', color: '#fff',
            borderRadius: '9999px', padding: '12px 0', fontSize: px(16),
            fontWeight: '600', border: 'none', opacity: loading ? 0.7 : 1,
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
