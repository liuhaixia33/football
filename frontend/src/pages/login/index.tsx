import { useState } from 'react'
import { View, Text, Button, Image, Input, Checkbox } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authApi } from '../../api/auth'
import { uploadApi } from '../../api/upload'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import { px } from '../../utils/style'

const C = {
  primary: '#22c55e',
  primaryDim: 'rgba(34,197,94,0.12)',
  primaryBorder: 'rgba(34,197,94,0.25)',
  primaryDash: 'rgba(34,197,94,0.35)',
  bg: '#0f1010',
  surface: '#181c18',
  surface2: '#1e2420',
  border: 'rgba(255,255,255,0.09)',
  disabledBg: 'rgba(255,255,255,0.07)',
  disabledText: '#0f1010',
  text: '#e8ede8',
  text2: '#8a9e8a',
  text3: '#4a5a4a',
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [avatarTmp, setAvatarTmp] = useState('')
  const { setAuth, setTeams, avatarUrl: storedAvatarUrl, nickname: storedNickname } = useAuthStore()
  const [nickname, setNickname] = useState(storedNickname || '')
  const t = useT()

  const urlInviteCode = (Taro.getCurrentInstance().router?.params?.inviteCode as string | undefined) || ''
  const urlTeamId = Number(Taro.getCurrentInstance().router?.params?.teamId) || null

  // 老用户：本地有头像和昵称缓存，跳过收集步骤
  const isReturningUser = !!(storedAvatarUrl && storedNickname)
  const agreedBefore = !!Taro.getStorageSync('agreedTerms')
  const [agreed, setAgreed] = useState(isReturningUser && agreedBefore)

  const avatarDisplay = avatarTmp || storedAvatarUrl || ''
  const canLogin = isReturningUser
    ? agreed && !loading
    : !!(avatarTmp || storedAvatarUrl) && !!nickname.trim() && !loading && agreed

  const handleLogin = async () => {
    if (!canLogin) return
    setLoading(true)
    try {
      let ossUrl: string | undefined
      if (avatarTmp) {
        const { url } = await uploadApi.avatar(avatarTmp)
        ossUrl = url
      }
      const { code } = await Taro.login()
      // 老用户不传 nickname/avatarUrl，后端直接用 DB 里的值
      const res = isReturningUser && !avatarTmp
        ? await authApi.login(code)
        : await authApi.login(code, nickname.trim(), ossUrl ?? storedAvatarUrl ?? '')
      setAuth(res.token, res.userId, res.nickname, res.avatarUrl || ossUrl || storedAvatarUrl || '')
      setTeams(res.teams)
      Taro.setStorageSync('agreedTerms', true)

      const storageCode = Taro.getStorageSync('pending_invite_code') as string | undefined
      Taro.removeStorageSync('pending_invite_code')
      const pendingCode = storageCode || urlInviteCode || ''

      if (res.teams.length === 0) {
        if (pendingCode) {
          let joinMsg = '已发起加入申请，需队长审核后方可加入球队。'
          try {
            await teamApi.join(pendingCode)
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : ''
            if (msg.includes('已是')) {
              joinMsg = '您已是该球队成员。'
            } else if (msg.includes('审核中')) {
              joinMsg = '您的申请正在审核中，请等待队长处理。'
            } else if (msg) {
              joinMsg = msg
            }
          }
          await new Promise<void>(resolve =>
            Taro.showModal({
              title: '申请已发送',
              content: joinMsg,
              showCancel: false,
              confirmText: '知道了',
              success: () => resolve(),
            })
          )
          Taro.reLaunch({ url: '/pages/home/index' })
        } else {
          Taro.reLaunch({ url: '/pages/onboard/index' })
        }
      } else {
        if (pendingCode) {
          const alreadyMember = res.teams.some(t => t.inviteCode === pendingCode)
          if (!alreadyMember) {
            try {
              const teamInfo = await teamApi.getByInviteCode(pendingCode)
              await new Promise<void>(resolve => {
                Taro.showModal({
                  title: '加入球队',
                  content: `检测到邀请，是否申请加入「${teamInfo.name}」？`,
                  success: async ({ confirm }) => {
                    if (confirm) {
                      try {
                        await teamApi.join(pendingCode)
                        Taro.showToast({ title: '申请已发送，等待管理员审核', icon: 'success' })
                      } catch (e: unknown) {
                        const msg = e instanceof Error ? e.message : ''
                        if (!msg.includes('已是') && !msg.includes('审核中')) {
                          Taro.showToast({ title: msg || '申请失败', icon: 'none' })
                        }
                      }
                    }
                    resolve()
                  },
                })
              })
            } catch {} // 无效邀请码静默忽略
          }
        }
        if (res.teams.length === 1) {
          useAuthStore.getState().setCurrentTeam(res.teams[0].teamId, res.teams[0].role)
          Taro.reLaunch({ url: '/pages/home/index' })
        } else {
          const matchedTeam = urlTeamId ? res.teams.find(t => t.teamId === urlTeamId) : null
          if (matchedTeam) {
            useAuthStore.getState().setCurrentTeam(matchedTeam.teamId, matchedTeam.role)
            Taro.reLaunch({ url: '/pages/home/index' })
          } else {
            Taro.reLaunch({ url: '/pages/team-select/index' })
          }
        }
      }
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : t('login.fail'), icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ height: '100%', background: 'linear-gradient(180deg, #162016 0%, #0f1010 40%)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Brand ── */}
      <View style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        paddingTop: px(80), paddingBottom: px(24),
      }}>
        <View style={{
          width: px(88), height: px(88), borderRadius: '50%',
          background: C.primaryDim,
          border: `2px solid ${C.primaryBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: px(16),
        }}>
          <Text style={{ fontSize: px(80) }}>⚽</Text>
        </View>
        <Text style={{
          fontSize: px(48), fontWeight: '900', color: C.text,
          textAlign: 'center', letterSpacing: '-0.02em', marginBottom: px(6),
        }}>
          {t('login.title')}
        </Text>
        <Text style={{ fontSize: px(26), color: C.text2, textAlign: 'center' }}>
          加入你的球队，记录每一场比赛
        </Text>
      </View>

      <View style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                     justifyContent: 'flex-start', padding: `${px(36)} ${px(40)} ${px(40)}`, gap: px(20) }}>

        {isReturningUser ? (
          /* ── 老用户：展示已有资料，跳过收集 ── */
          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: px(12) }}>
            <Image
              src={storedAvatarUrl!}
              style={{
                width: px(140), height: px(140), borderRadius: '50%',
                border: `3px solid ${C.primary}`, display: 'block',
              }}
            />
            <Text style={{ fontSize: px(34), fontWeight: '700', color: C.text }}>
              {storedNickname}
            </Text>
          </View>
        ) : (
          /* ── 新用户：收集头像和昵称 ── */
          <>
            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Button
                openType="chooseAvatar"
                onChooseAvatar={(e) => setAvatarTmp((e as unknown as { detail: { avatarUrl: string } }).detail.avatarUrl)}
                style={{ background: 'transparent', border: 'none', padding: 0 }}
              >
                {avatarDisplay
                  ? <Image src={avatarDisplay} style={{
                      width: px(140), height: px(140), borderRadius: '50%',
                      border: `3px solid ${C.primary}`,
                      display: 'block',
                    }} />
                  : <View style={{
                      width: px(140), height: px(140), borderRadius: '50%',
                      background: C.surface2, border: `2px dashed ${C.primaryDash}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: px(80) }}>📷</Text>
                    </View>
                }
              </Button>
              <Text style={{ fontSize: px(24), color: C.text3, marginTop: px(12) }}>
                {avatarDisplay ? '点击更换头像' : t('login.tap_avatar')}
              </Text>
            </View>
            <Input
              type="nickname"
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
              onBlur={(e) => setNickname(e.detail.value)}
              placeholder={t('login.nickname_placeholder')}
              style={{
                width: px(380),
                height: px(56),
                background: C.surface,
                borderRadius: px(14),
                padding: `0 ${px(20)}`,
                fontSize: px(32),
                border: `1px solid ${C.border}`,
                color: C.text,
                textAlign: 'center',
              }}
            />
          </>
        )}

        {/* 协议同意行 */}
        <View
          style={{ display: 'flex', alignItems: 'center', gap: px(8), marginTop: px(16) }}
          onClick={() => setAgreed(v => !v)}
        >
          <Checkbox
            value="agreed"
            checked={agreed}
            color={C.primary}
            onChange={() => setAgreed(v => !v)}
            style={{ transform: 'scale(0.8)' }}
          />
          <Text style={{ fontSize: px(24), color: C.text2 }}>
            我已阅读并同意
          </Text>
          <Text
            style={{ fontSize: px(24), color: C.primary, textDecoration: 'underline' }}
            onClick={(e) => { e.stopPropagation(); Taro.navigateTo({ url: '/pages/terms/index' }) }}
          >
            《用户协议》
          </Text>
          <Text style={{ fontSize: px(24), color: C.text2 }}>和</Text>
          <Text
            style={{ fontSize: px(24), color: C.primary, textDecoration: 'underline' }}
            onClick={(e) => { e.stopPropagation(); Taro.navigateTo({ url: '/pages/privacy/index' }) }}
          >
            《隐私政策》
          </Text>
        </View>

        <Button
          style={{
            width: px(520),
            marginTop: px(20),
            background: canLogin ? C.primary : C.disabledBg,
            color: canLogin ? C.disabledText : C.text3,
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
