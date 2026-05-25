import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import { px } from '../../utils/style'

const C = {
  primary: '#22c55e', primaryDim: 'rgba(34,197,94,0.12)',
  bg: '#0f1010', surface: '#181c18', surface2: '#1e2420',
  border: 'rgba(255,255,255,0.09)', text: '#e8ede8',
  text2: '#8a9e8a', text3: '#4a5a4a',
}

export default function JoinTeamPage() {
  const [code, setCode]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [teamName, setTeamName]   = useState('')
  const [sceneTeamId, setSceneTeamId] = useState<number | null>(null)
  const t = useT()

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: t('join_team.title') })

    const routerParams = Taro.getCurrentInstance().router?.params ?? {}
    const scene = routerParams.scene
    if (scene) {
      const decoded = decodeURIComponent(scene)
      // 支持新格式 t=123&c=ABCD1234 和旧格式 teamId=123
      const idMatch = decoded.match(/(?:^|&)t=(\d+)/) || decoded.match(/teamId=(\d+)/)
      const codeMatch = decoded.match(/(?:^|&)c=([A-Z0-9]+)/)
      if (idMatch) {
        const id = Number(idMatch[1])
        const inviteCode = codeMatch?.[1] ?? ''

        // 无论是否登录，先持久化邀请码；token 过期时 401 会跳登录，storage 保证上下文不丢失
        if (inviteCode) Taro.setStorageSync('pending_invite_code', inviteCode)

        if (!useAuthStore.getState().token) {
          Taro.reLaunch({ url: '/pages/login/index' })
          return
        }

        setSceneTeamId(id)
        if (inviteCode) setCode(inviteCode)
        teamApi.getPublicInfo(id)
          .then(info => setTeamName(info.name))
          .catch(() => setTeamName('该球队'))
      }
    }
  }, [])

  // 扫码进入：直接按 teamId 申请
  const submitByTeamId = async () => {
    if (!sceneTeamId) return
    setLoading(true)
    try {
      await teamApi.applyByTeamId(sceneTeamId)
      Taro.removeStorageSync('pending_invite_code')
      Taro.showToast({ title: '申请已提交，等待队长审核', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '申请失败'
      if (msg.includes('已是该球队成员')) {
        Taro.showToast({ title: '您已是该球队成员', icon: 'success' })
        setTimeout(() => Taro.switchTab({ url: '/pages/index/index' }), 1500)
      } else {
        Taro.showToast({ title: msg, icon: 'none' })
      }
    } finally {
      setLoading(false)
    }
  }

  // 手动输入邀请码申请
  const submitByCode = async () => {
    if (!code.trim()) {
      Taro.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      await teamApi.join(code.trim().toUpperCase())
      Taro.showToast({ title: t('join_team.success'), icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '加入失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ padding: px(20), background: C.bg, minHeight: '100%' }}>
      <View style={{
        background: C.surface, borderRadius: px(20), padding: px(24),
        border: `1px solid ${C.border}`,
      }}>
        <View style={{
          width: px(56), height: px(56), borderRadius: px(16),
          background: C.primaryDim, border: `1px solid rgba(0,228,114,0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: px(16),
        }}>
          <Text style={{ fontSize: px(52) }}>🔑</Text>
        </View>

        <Text style={{ fontSize: px(44), fontWeight: '800', color: C.text, marginBottom: px(6), display: 'block' }}>
          {t('join_team.title')}
        </Text>

        {sceneTeamId ? (
          // 扫码进入：展示球队名称，直接申请
          <>
            <Text style={{ fontSize: px(28), color: C.text2, marginBottom: px(32), display: 'block' }}>
              你正在申请加入「{teamName || '加载中…'}」
            </Text>
            <Button
              style={{
                background: C.primary, color: '#0f1010',
                borderRadius: px(14), border: 'none',
                fontSize: px(32), fontWeight: '700', padding: `${px(14)} 0`,
              }}
              loading={loading}
              onClick={submitByTeamId}
            >
              申请加入
            </Button>
          </>
        ) : (
          // 手动输入邀请码
          <>
            <Text style={{ fontSize: px(28), color: C.text2, marginBottom: px(32), display: 'block' }}>
              向球队管理员索取邀请码，输入后即可申请加入
            </Text>
            <Text style={{ fontSize: px(24), fontWeight: '600', color: C.text3, marginBottom: px(10), display: 'block' }}>
              {t('join_team.code')}
            </Text>
            <Input
              value={code}
              onInput={e => setCode(e.detail.value)}
              placeholder='请输入 8 位邀请码'
              maxlength={8}
              style={{
                border: `1.5px solid ${code ? 'rgba(34,197,94,0.4)' : C.border}`,
                borderRadius: px(14), padding: `${px(18)} ${px(14)}`,
                marginBottom: px(32), fontSize: px(52), letterSpacing: px(8),
                textAlign: 'center', background: C.surface2, color: C.primary,
                fontWeight: '800',
              }}
            />
            <Button
              style={{
                background: code.trim().length > 0 ? C.primary : 'rgba(255,255,255,0.07)',
                color: code.trim().length > 0 ? '#0f1010' : C.text3,
                borderRadius: px(14), border: 'none',
                fontSize: px(32), fontWeight: '700', padding: `${px(14)} 0`,
              }}
              loading={loading}
              onClick={submitByCode}
            >
              {t('join_team.submit')}
            </Button>
          </>
        )}
      </View>
    </View>
  )
}
