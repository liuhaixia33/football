import { useState } from 'react'
import { View, Text, Button, Image, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { userApi } from '../../api/user'
import { uploadApi } from '../../api/upload'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import { useLangStore } from '../../store/lang'
import type { MyStatsRes, MemberRole } from '../../types/api'

export default function MyPage() {
  const [stats, setStats] = useState<MyStatsRes | null>(null)
  const { nickname, avatarUrl, token, userId, currentTeamId, currentRole,
          teams, setCurrentTeam, setTeams, setAuth, clear } = useAuthStore()
  const t = useT()
  const { language, setLanguage } = useLangStore()

  // 编辑遮罩状态
  const [editing, setEditing] = useState(false)
  const [draftAvatarTmp, setDraftAvatarTmp] = useState('')
  const [draftNickname, setDraftNickname] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!currentTeamId) return
    try {
      const s = await userApi.stats(currentTeamId)
      setStats(s)
    } catch {
      // non-critical
    }
    try {
      const profile = await userApi.me()
      setTeams(profile.teams)
    } catch {
      // non-critical
    }
  }

  useDidShow(load)

  const openEdit = () => {
    setDraftAvatarTmp('')
    setDraftNickname(nickname ?? '')
    setEditing(true)
  }

  const saveProfile = async () => {
    if (saving) return
    setSaving(true)
    try {
      let ossUrl: string | undefined
      if (draftAvatarTmp) {
        const { url } = await uploadApi.avatar(draftAvatarTmp)
        ossUrl = url
      }
      await userApi.updateProfile({
        nickname: draftNickname || undefined,
        avatarUrl: ossUrl,
      })
      setAuth(token!, userId!, draftNickname || nickname!, ossUrl ?? avatarUrl ?? '')
      setEditing(false)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const switchTeam = (teamId: number, role: MemberRole) => {
    setCurrentTeam(teamId, role)
    Taro.reLaunch({ url: '/pages/home/index' })
  }

  const roleLabel = (role: MemberRole) =>
    role === 'CAPTAIN' ? t('my.captain') : role === 'ADMIN' ? t('my.admin') : t('my.player')

  const logout = () => {
    Taro.showModal({
      title: t('my.logout_title'),
      content: t('my.logout_content'),
      success: ({ confirm }) => {
        if (confirm) {
          clear()
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      }
    })
  }

  const leaveTeam = () => {
    if (currentRole === 'CAPTAIN') {
      Taro.showToast({ title: t('my.leave_captain'), icon: 'none' })
      return
    }
    if (!currentTeamId) return
    Taro.showModal({
      title: t('my.leave_title'),
      content: t('my.leave_content'),
      success: async ({ confirm }) => {
        if (!confirm) return
        try {
          const { teamApi } = await import('../../api/team')
          await teamApi.leave(currentTeamId)
          Taro.showToast({ title: '已退出球队', icon: 'success' })
          setTimeout(() => {
            clear()
            Taro.reLaunch({ url: '/pages/login/index' })
          }, 1000)
        } catch (e: unknown) {
          Taro.showToast({ title: e instanceof Error ? e.message : t('common.error'), icon: 'none' })
        }
      }
    })
  }

  const switchLanguage = () => {
    Taro.showActionSheet({
      itemList: [t('my.lang_zh'), t('my.lang_en')],
      success: ({ tapIndex }) => {
        const lang: 'zh' | 'en' = tapIndex === 0 ? 'zh' : 'en'
        setLanguage(lang)
        Taro.setNavigationBarTitle({ title: lang === 'zh' ? '我的' : 'My' })
      },
    })
  }

  const draftAvatarDisplay = draftAvatarTmp || avatarUrl || ''

  return (
    <View style={{ height: '100vh', overflow: 'auto' }}>
      {/* Profile header — 点击进入编辑 */}
      <View
        onClick={openEdit}
        style={{ background: '#4CAF50', padding: '32px 16px 24px',
                 display: 'flex', alignItems: 'center', gap: '16px' }}
      >
        {avatarUrl
          ? <Image src={avatarUrl} style={{ width: '56px', height: '56px', borderRadius: '50%' }} />
          : <Text style={{ fontSize: '56px' }}>👤</Text>
        }
        <View>
          <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', display: 'block' }}>
            {nickname ?? '球员'}
          </Text>
          <Text style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)' }}>
            {roleLabel(currentRole ?? 'PLAYER')}
          </Text>
        </View>
        <Text style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.7)', fontSize: '12px' }}>
          {t('my.edit')} ›
        </Text>
      </View>

      {/* Match stats */}
      {stats && (
        <View style={{ background: '#fff', margin: '12px 16px', borderRadius: '8px', padding: '16px' }}>
          <Text style={{ fontSize: '15px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>
            {t('my.stats')}
          </Text>
          <View style={{ display: 'flex', textAlign: 'center' }}>
            {[
              { label: t('my.matches'), value: stats.totalMatches, color: '#333' },
              { label: t('my.wins'),    value: stats.wins,         color: '#4CAF50' },
              { label: t('my.draws'),   value: stats.draws,        color: '#FF9800' },
              { label: t('my.losses'),  value: stats.losses,       color: '#f44336' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1 }}>
                <Text style={{ fontSize: '24px', fontWeight: 'bold', color: s.color, display: 'block' }}>
                  {s.value}
                </Text>
                <Text style={{ fontSize: '12px', color: '#999' }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Team list */}
      <View style={{ background: '#fff', margin: '0 16px 12px', borderRadius: '8px', padding: '16px' }}>
        <Text style={{ fontSize: '15px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>
          {t('my.teams')}
        </Text>
        {teams.map(tm => (
          <View key={tm.teamId} onClick={() => switchTeam(tm.teamId, tm.role)}
                style={{ display: 'flex', alignItems: 'center', padding: '10px 0',
                         borderBottom: '1px solid #f5f5f5' }}>
            <Text style={{ fontSize: '24px', marginRight: '12px' }}>⚽</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: '14px', display: 'block' }}>{tm.teamName}</Text>
              <Text style={{ fontSize: '12px', color: '#999' }}>{roleLabel(tm.role)}</Text>
            </View>
            {tm.teamId === currentTeamId && (
              <Text style={{ fontSize: '12px', color: '#4CAF50' }}>{t('my.current')}</Text>
            )}
          </View>
        ))}
        <View onClick={() => Taro.navigateTo({ url: '/pages/onboard/index' })}
              style={{ textAlign: 'center', padding: '12px 0', color: '#4CAF50', fontSize: '14px' }}>
          {t('my.join_create')}
        </View>
      </View>

      {/* Language switcher */}
      <View onClick={switchLanguage}
            style={{ background: '#fff', margin: '0 16px 12px', borderRadius: '8px',
                     padding: '14px 16px', display: 'flex', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: '14px' }}>{t('my.language')}</Text>
        <Text style={{ fontSize: '14px', color: '#999' }}>
          {language === 'zh' ? t('my.lang_zh') : t('my.lang_en')} ›
        </Text>
      </View>

      {/* Action buttons */}
      <View style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Button style={{ background: '#fff', color: '#f44336', border: '1px solid #fecaca',
                         borderRadius: '8px', fontSize: '14px' }}
                onClick={leaveTeam}>
          {t('my.leave')}
        </Button>
        <Button style={{ background: '#f5f5f5', color: '#999', border: 'none',
                         borderRadius: '8px', fontSize: '14px' }}
                onClick={logout}>
          {t('my.logout')}
        </Button>
      </View>

      {/* 编辑遮罩 */}
      {editing && (
        <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                       background: 'rgba(0,0,0,.5)', display: 'flex',
                       alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <View style={{ background: '#fff', borderRadius: '12px', padding: '24px',
                         width: '280px', display: 'flex', flexDirection: 'column',
                         alignItems: 'center', gap: '16px' }}>
            <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>{t('my.edit_profile')}</Text>

            {/* 头像选择 */}
            <Button
              openType="chooseAvatar"
              onChooseAvatar={(e) => setDraftAvatarTmp((e as unknown as { detail: { avatarUrl: string } }).detail.avatarUrl)}
              style={{ background: 'transparent', border: 'none', padding: 0,
                       width: '80px', height: '80px', borderRadius: '50%' }}
            >
              {draftAvatarDisplay
                ? <Image src={draftAvatarDisplay} style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
                : <View style={{ width: '80px', height: '80px', borderRadius: '50%',
                                 background: '#e0e0e0', display: 'flex', alignItems: 'center',
                                 justifyContent: 'center', fontSize: '28px' }}>👤</View>
              }
            </Button>

            {/* 昵称输入 */}
            <Input
              type="nickname"
              value={draftNickname}
              onInput={(e) => setDraftNickname(e.detail.value)}
              placeholder={t('login.nickname_placeholder')}
              style={{ border: '1px solid #e0e0e0', borderRadius: '8px',
                       padding: '10px 12px', fontSize: '15px', width: '100%' }}
            />

            {/* 按钮 */}
            <View style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <Button
                style={{ flex: 1, background: '#f5f5f5', color: '#666', border: 'none',
                         borderRadius: '8px', fontSize: '14px' }}
                onClick={() => setEditing(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                style={{ flex: 1, background: '#4CAF50', color: '#fff', border: 'none',
                         borderRadius: '8px', fontSize: '14px' }}
                loading={saving}
                onClick={saveProfile}
              >
                {t('common.save')}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
