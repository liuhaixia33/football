import { useState, useEffect, useRef } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'

const fmt = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const labelStyle = { fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' } as const
const inputStyle = {
  border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px',
  marginBottom: '16px', fontSize: '15px', background: '#fafafa'
} as const
const btnStyle = {
  background: '#4CAF50', color: '#fff', borderRadius: '8px',
  border: 'none', fontSize: '16px'
} as const

export default function ActivityCreatePage() {
  const params = Taro.getCurrentInstance().router?.params ?? {}
  const resultFor = params.resultFor ?? null
  const editId = params.editId ?? null

  const [type, setType] = useState<'MATCH' | 'TRAINING'>('MATCH')
  const [title, setTitle] = useState('')
  const [opponent, setOpponent] = useState('')
  const [location, setLocation] = useState('')
  const [startTime, setStartTime] = useState('')
  const [deadline, setDeadline] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')

  const [ourScore, setOurScore] = useState('')
  const [oppScore, setOppScore] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const { currentTeamId, isCaptainOrAdmin } = useAuthStore()
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (!isCaptainOrAdmin()) {
      Taro.navigateBack()
      return
    }
    if (editId) {
      Taro.setNavigationBarTitle({ title: '编辑活动' })
    } else if (!resultFor) {
      Taro.setNavigationBarTitle({ title: '发布活动' })
    } else {
      Taro.setNavigationBarTitle({ title: '录入比分' })
    }
  }, [])

  useDidShow(() => {
    if (editId && !hasLoaded.current) {
      hasLoaded.current = true
      activityApi.detail(Number(editId)).then(detail => {
        const a = detail.activity
        setType(a.type)
        setTitle(a.title)
        setOpponent(a.opponent ?? '')
        setLocation(a.location)
        setStartTime(fmt(a.startTime))
        setDeadline(a.deadline ? fmt(a.deadline) : '')
        setMaxPlayers(a.maxPlayers != null ? String(a.maxPlayers) : '')
      }).catch(() => Taro.showToast({ title: '加载活动失败', icon: 'none' }))
    }
  })

  const validateActivityForm = (): boolean => {
    if (!title.trim() || !location.trim() || !startTime) {
      Taro.showToast({ title: '请填写必填项', icon: 'none' })
      return false
    }
    if (isNaN(new Date(startTime).getTime())) {
      Taro.showToast({ title: '开始时间格式错误，请使用 2026-06-01 09:00', icon: 'none' })
      return false
    }
    if (deadline && isNaN(new Date(deadline).getTime())) {
      Taro.showToast({ title: '截止时间格式错误', icon: 'none' })
      return false
    }
    if (maxPlayers && (isNaN(Number(maxPlayers)) || Number(maxPlayers) <= 0 || !Number.isInteger(Number(maxPlayers)))) {
      Taro.showToast({ title: '最大报名人数须为正整数', icon: 'none' })
      return false
    }
    return true
  }

  const buildActivityBody = () => ({
    type,
    title: title.trim(),
    location: location.trim(),
    startTime: new Date(startTime).toISOString(),
    opponent: type === 'MATCH' ? (opponent.trim() || undefined) : undefined,
    deadline: deadline ? new Date(deadline).toISOString() : undefined,
    maxPlayers: maxPlayers ? Number(maxPlayers) : undefined,
  })

  const submitActivity = async () => {
    if (!validateActivityForm()) return
    if (!currentTeamId) return
    setLoading(true)
    try {
      if (editId) {
        await activityApi.update(Number(editId), buildActivityBody())
        Taro.showToast({ title: '修改成功', icon: 'success' })
      } else {
        await activityApi.create(currentTeamId, buildActivityBody())
        Taro.showToast({ title: '发布成功', icon: 'success' })
      }
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const submitResult = async () => {
    if (!ourScore || !oppScore) {
      Taro.showToast({ title: '请输入比分', icon: 'none' })
      return
    }
    if (isNaN(Number(ourScore)) || isNaN(Number(oppScore))) {
      Taro.showToast({ title: '比分格式错误', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      await activityApi.recordResult(
        Number(resultFor!),
        Number(ourScore),
        Number(oppScore),
        notes.trim() || undefined
      )
      Taro.showToast({ title: '录入成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '录入失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (resultFor) {
    return (
      <View style={{ padding: '16px' }}>
        <Text style={labelStyle}>我方比分 *</Text>
        <Input
          value={ourScore}
          onInput={e => setOurScore(e.detail.value)}
          type='number'
          placeholder='0'
          style={inputStyle}
        />
        <Text style={labelStyle}>对方比分 *</Text>
        <Input
          value={oppScore}
          onInput={e => setOppScore(e.detail.value)}
          type='number'
          placeholder='0'
          style={inputStyle}
        />
        <Text style={labelStyle}>备注</Text>
        <Input
          value={notes}
          onInput={e => setNotes(e.detail.value)}
          placeholder='可选'
          style={{ ...inputStyle, marginBottom: '32px' }}
        />
        <Button style={btnStyle} loading={loading} onClick={submitResult}>
          保存比分
        </Button>
      </View>
    )
  }

  return (
    <View style={{ padding: '16px' }}>
      <Text style={labelStyle}>类型 *</Text>
      <View style={{ display: 'flex', marginBottom: '16px', gap: '8px' }}>
        {(['MATCH', 'TRAINING'] as const).map(t => (
          <View
            key={t}
            onClick={() => setType(t)}
            style={{
              flex: 1, textAlign: 'center', padding: '10px',
              border: `1px solid ${type === t ? '#4CAF50' : '#e0e0e0'}`,
              borderRadius: '8px', color: type === t ? '#4CAF50' : '#666'
            }}
          >
            <Text>{t === 'MATCH' ? '⚽ 比赛' : '🏃 训练'}</Text>
          </View>
        ))}
      </View>

      <Text style={labelStyle}>标题 *</Text>
      <Input
        value={title}
        onInput={e => setTitle(e.detail.value)}
        placeholder='例如：周六联赛 vs 红星队'
        style={inputStyle}
      />

      {type === 'MATCH' && (
        <>
          <Text style={labelStyle}>对手</Text>
          <Input
            value={opponent}
            onInput={e => setOpponent(e.detail.value)}
            placeholder='对手球队名称'
            style={inputStyle}
          />
        </>
      )}

      <Text style={labelStyle}>地点 *</Text>
      <Input
        value={location}
        onInput={e => setLocation(e.detail.value)}
        placeholder='比赛/训练场地'
        style={inputStyle}
      />

      <Text style={labelStyle}>开始时间 *</Text>
      <Input
        value={startTime}
        onInput={e => setStartTime(e.detail.value)}
        placeholder='2026-06-01 09:00'
        style={inputStyle}
      />

      <Text style={labelStyle}>报名截止时间</Text>
      <Input
        value={deadline}
        onInput={e => setDeadline(e.detail.value)}
        placeholder='可选，例如 2026-05-31 23:59'
        style={inputStyle}
      />

      <Text style={labelStyle}>最大报名人数</Text>
      <Input
        value={maxPlayers}
        onInput={e => setMaxPlayers(e.detail.value)}
        type='number'
        placeholder='可选，不填表示不限'
        style={{ ...inputStyle, marginBottom: '32px' }}
      />

      <Button style={btnStyle} loading={loading} onClick={submitActivity}>
        {editId ? '保存修改' : '发布活动'}
      </Button>
    </View>
  )
}
