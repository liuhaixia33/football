import { useState } from 'react'
import { View, Text, Button, Image, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authApi } from '../../api/auth'
import { uploadApi } from '../../api/upload'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'

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
    <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                   justifyContent: 'center', height: '100vh', background: '#f5f5f5' }}>
      <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#333',
                     marginBottom: '32px' }}>{t('login.title')}</Text>

      {/* 头像选择 */}
      <Button
        openType="chooseAvatar"
        onChooseAvatar={(e) => setAvatarTmp((e as unknown as { detail: { avatarUrl: string } }).detail.avatarUrl)}
        style={{ background: 'transparent', border: 'none', padding: 0,
                 width: '88px', height: '88px', borderRadius: '50%', marginBottom: '16px' }}
      >
        {avatarDisplay
          ? <Image src={avatarDisplay} style={{ width: '88px', height: '88px', borderRadius: '50%' }} />
          : <View style={{ width: '88px', height: '88px', borderRadius: '50%',
                           background: '#e0e0e0', display: 'flex', alignItems: 'center',
                           justifyContent: 'center', fontSize: '32px' }}>👤</View>
        }
      </Button>
      <Text style={{ fontSize: '12px', color: '#999', marginBottom: '24px' }}>
        {t('login.tap_avatar')}
      </Text>

      {/* 昵称输入 */}
      <Input
        type="nickname"
        value={nickname}
        onInput={(e) => setNickname(e.detail.value)}
        placeholder={t('login.nickname_placeholder')}
        style={{ background: '#fff', borderRadius: '8px', padding: '12px 16px',
                 fontSize: '16px', width: '240px', marginBottom: '32px',
                 border: '1px solid #e0e0e0' }}
      />

      {/* 登录按钮 */}
      <Button
        style={{ background: canLogin ? '#4CAF50' : '#ccc', color: '#fff',
                 borderRadius: '24px', padding: '12px 48px', fontSize: '16px',
                 border: 'none', opacity: loading ? 0.7 : 1 }}
        loading={loading}
        disabled={!canLogin}
        onClick={handleLogin}
      >
        {t('login.btn')}
      </Button>
    </View>
  )
}
