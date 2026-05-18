import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { teamApi } from '../../api/team'

export default function JoinTeamPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!code.trim()) {
      Taro.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      await teamApi.join(code.trim().toUpperCase())
      Taro.showToast({ title: '申请已提交，等待审批', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '加入失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ padding: '16px' }}>
      <Text style={{ fontSize: '14px', color: '#666', marginBottom: '8px',
                     display: 'block' }}>邀请码</Text>
      <Input
        value={code}
        onInput={e => setCode(e.detail.value)}
        placeholder='请输入 8 位邀请码'
        maxlength={8}
        style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px',
                 marginBottom: '24px', fontSize: '20px', letterSpacing: '4px',
                 textAlign: 'center' }}
      />
      <Button
        style={{ background: '#4CAF50', color: '#fff', borderRadius: '8px',
                 border: 'none', fontSize: '16px' }}
        loading={loading}
        onClick={submit}
      >
        申请加入
      </Button>
    </View>
  )
}
