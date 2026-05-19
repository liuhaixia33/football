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
      height: '100%',
      background: C.bg,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 顶部品牌色块 */}
      <View style={{
        background: C.primary,
        paddingTop: px(80),
        paddingBottom: px(48),
        paddingLeft: px(24),
        paddingRight: px(24),
        borderBottomLeftRadius: px(28),
        borderBottomRightRadius: px(28),
      }}>
        <View style={{ display: 'flex', justifyContent: 'center', marginBottom: px(20) }}>
          <View style={{
            width: px(88),
            height: px(88),
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.3)',
          }}>
            <Text style={{ fontSize: px(44) }}>⚽</Text>
          </View>
        </View>
        <Text style={{
          fontSize: px(26),
          fontWeight: '700',
          color: '#fff',
          textAlign: 'center',
          display: 'block',
          marginBottom: px(8),
        }}>
          {t('login.title')}
        </Text>
        <Text style={{
          fontSize: px(14),
          color: 'rgba(255,255,255,0.85)',
          textAlign: 'center',
          display: 'block',
        }}>
          加入你的球队，记录每一场比赛
        </Text>
      </View>

      {/* 表单区铺满 */}
      <View style={{
        flex: 1,
        padding: `${px(32)} ${px(24)} ${px(24)}`,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 头像 */}
        <View style={{ display: 'flex', justifyContent: 'center', marginBottom: px(8) }}>
          <Button
            openType="chooseAvatar"
            onChooseAvatar={(e) => setAvatarTmp((e as unknown as { detail: { avatarUrl: string } }).detail.avatarUrl)}
            style={{
              background: 'transparent', border: 'none', padding: 0,
              width: px(88), height: px(88), borderRadius: '50%',
            }}
          >
            {avatarDisplay
              ? <Image src={avatarDisplay} style={{
                  width: px(88), height: px(88), borderRadius: '50%',
                  border: `3px solid ${C.primaryLight}`,
                }} />
              : <View style={{
                  width: px(88), height: px(88), borderRadius: '50%',
                  background: C.surface, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  border: `2px dashed ${C.text3}`,
                }}>
                  <Text style={{ fontSize: px(28) }}>📷</Text>
                </View>
            }
          </Button>
        </View>
        <Text style={{
          fontSize: px(13), color: C.text3, marginBottom: px(28),
          textAlign: 'center', display: 'block',
        }}>
          {t('login.tap_avatar')}
        </Text>

        {/* 昵称 */}
        <View style={{ marginBottom: px(24) }}>
          <Text style={{
            fontSize: px(14), fontWeight: '600', color: C.text,
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
              height: px(52),
              background: C.surface,
              borderRadius: px(14),
              padding: `0 ${px(16)}`,
              fontSize: px(16),
              border: `1px solid #e5e7eb`,
              color: C.text,
            }}
          />
        </View>

        {/* 撑开 */}
        <View style={{ flex: 1 }} />

        {/* 登录按钮 */}
        <Button
          style={{
            background: canLogin ? C.primary : '#d1d5db',
            color: '#fff',
            borderRadius: px(16),
            height: px(52),
            lineHeight: px(52),
            fontSize: px(17),
            fontWeight: '600',
            border: 'none',
            opacity: loading ? 0.7 : 1,
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
