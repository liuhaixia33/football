import { useState } from 'react'
import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import type { MemberRes } from '../../types/api'

function roleColor(role: string) {
  return role === 'CAPTAIN' ? '#FF9800' : role === 'ADMIN' ? '#2196F3' : '#666'
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRes[]>([])
  const [tab, setTab] = useState<'active' | 'pending'>('active')
  const t = useT()

  const roleLabel = (role: string) =>
    role === 'CAPTAIN' ? t('members.captain') : role === 'ADMIN' ? t('members.admin') : t('members.player')
  const { currentTeamId, userId, currentRole, isCaptainOrAdmin } = useAuthStore()

  const load = async () => {
    if (!currentTeamId) return
    try {
      const data = await teamApi.listMembers(currentTeamId)
      setMembers(data)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
    }
  }

  useDidShow(load)

  const active = members.filter(m => m.status === 'ACTIVE')
  const pending = members.filter(m => m.status === 'PENDING')

  const reviewApply = async (memberId: number, approve: boolean) => {
    if (!currentTeamId) return
    try {
      await teamApi.reviewApply(currentTeamId, memberId, approve)
      Taro.showToast({ title: approve ? '已通过' : '已拒绝', icon: 'success' })
      load()
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
    }
  }

  const removeMember = (targetUserId: number) => {
    if (!currentTeamId) return
    Taro.showModal({
      title: '确认移除',
      content: '确定要移除该队员吗？',
      success: async ({ confirm }) => {
        if (!confirm) return
        try {
          await teamApi.removeMember(currentTeamId, targetUserId)
          Taro.showToast({ title: '已移除', icon: 'success' })
          load()
        } catch (e: unknown) {
          Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
        }
      }
    })
  }

  const toggleAdmin = async (targetUserId: number, memberRole: string) => {
    if (!currentTeamId) return
    const newRole = memberRole === 'ADMIN' ? 'PLAYER' : 'ADMIN'
    try {
      await teamApi.setRole(currentTeamId, targetUserId, newRole)
      Taro.showToast({ title: newRole === 'ADMIN' ? '已设为管理员' : '已取消管理员', icon: 'success' })
      load()
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
    }
  }

  const list = tab === 'active' ? active : pending

  return (
    <View style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Tab switcher */}
      <View style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        {[
          { key: 'active', label: `${t('members.active')} (${active.length})` },
          { key: 'pending', label: `${t('members.pending')} (${pending.length})` },
        ].map(item => (
          <View
            key={item.key}
            onClick={() => setTab(item.key as 'active' | 'pending')}
            style={{
              flex: 1, textAlign: 'center', padding: '12px',
              color: tab === item.key ? '#4CAF50' : '#666',
              borderBottom: tab === item.key ? '2px solid #4CAF50' : '2px solid transparent',
              fontSize: '14px'
            }}
          >
            <Text>{item.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY style={{ flex: 1, padding: '12px 16px' }}>
        {list.map(m => (
          <View
            key={m.memberId}
            style={{ background: '#fff', borderRadius: '8px', padding: '12px 16px',
                     marginBottom: '8px', display: 'flex', alignItems: 'center' }}
          >
            {m.avatarUrl
              ? <Image src={m.avatarUrl} style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px' }} />
              : <Text style={{ fontSize: '32px', marginRight: '12px' }}>👤</Text>
            }
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: '15px', fontWeight: 'bold', display: 'block' }}>
                {m.nickname}
              </Text>
              <Text style={{ fontSize: '12px', color: roleColor(m.role) }}>
                {roleLabel(m.role)}
              </Text>
            </View>

            {/* Pending approval actions */}
            {tab === 'pending' && isCaptainOrAdmin() && (
              <View style={{ display: 'flex', gap: '8px' }}>
                <Button
                  size='mini'
                  style={{ background: '#4CAF50', color: '#fff', border: 'none',
                           borderRadius: '4px', fontSize: '12px' }}
                  onClick={() => reviewApply(m.memberId, true)}
                >{t('members.approve')}</Button>
                <Button
                  size='mini'
                  style={{ background: '#f5f5f5', color: '#999', border: 'none',
                           borderRadius: '4px', fontSize: '12px' }}
                  onClick={() => reviewApply(m.memberId, false)}
                >{t('members.reject')}</Button>
              </View>
            )}

            {/* Active member actions (captain only, not self, not other captain) */}
            {tab === 'active' && currentRole === 'CAPTAIN' &&
              m.userId !== userId && m.role !== 'CAPTAIN' && (
              <View style={{ display: 'flex', gap: '6px' }}>
                <Button
                  size='mini'
                  style={{ background: '#E3F2FD', color: '#1565C0', border: 'none',
                           borderRadius: '4px', fontSize: '11px' }}
                  onClick={() => toggleAdmin(m.userId, m.role)}
                >
                  {m.role === 'ADMIN' ? t('members.remove_admin') : t('members.set_admin')}
                </Button>
                <Button
                  size='mini'
                  style={{ background: '#FFEBEE', color: '#C62828', border: 'none',
                           borderRadius: '4px', fontSize: '11px' }}
                  onClick={() => removeMember(m.userId)}
                >{t('members.remove')}</Button>
              </View>
            )}
          </View>
        ))}
        {list.length === 0 && (
          <Text style={{ textAlign: 'center', color: '#999', display: 'block', padding: '32px' }}>
            {t('members.empty')}
          </Text>
        )}
      </ScrollView>
    </View>
  )
}
