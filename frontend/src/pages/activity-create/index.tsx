import { useState, useEffect, useRef } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'

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
  const t = useT()

  useEffect(() => {
    if (!isCaptainOrAdmin()) {
      Taro.navigateBack()
      return
    }
    if (editId) {
      Taro.setNavigationBarTitle({ title: t('act_form.title_edit') })
    } else if (!resultFor) {
      Taro.setNavigationBarTitle({ title: t('act_form.title_create') })
    } else {
      Taro.setNavigationBarTitle({ title: t('act_form.title_result') })
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
      }).catch(() => Taro.showToast({ title: t('act_form.load_fail'), icon: 'none' }))
    }
  })

  const validateActivityForm = (): boolean => {
    if (!title.trim() || !location.trim() || !startTime) {
      Taro.showToast({ title: t('act_form.err_required'), icon: 'none' })
      return false
    }
    if (isNaN(new Date(startTime).getTime())) {
      Taro.showToast({ title: t('act_form.err_start_fmt'), icon: 'none' })
      return false
    }
    if (deadline && isNaN(new Date(deadline).getTime())) {
      Taro.showToast({ title: t('act_form.err_deadline_fmt'), icon: 'none' })
      return false
    }
    if (maxPlayers && (isNaN(Number(maxPlayers)) || Number(maxPlayers) <= 0 || !Number.isInteger(Number(maxPlayers)))) {
      Taro.showToast({ title: t('act_form.err_max_players'), icon: 'none' })
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
        Taro.showToast({ title: t('act_form.success_edit'), icon: 'success' })
      } else {
        await activityApi.create(currentTeamId, buildActivityBody())
        Taro.showToast({ title: t('act_form.success_create'), icon: 'success' })
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
      Taro.showToast({ title: t('act_form.err_required'), icon: 'none' })
      return
    }
    if (isNaN(Number(ourScore)) || isNaN(Number(oppScore))) {
      Taro.showToast({ title: t('act_form.err_score_fmt'), icon: 'none' })
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
      Taro.showToast({ title: t('act_form.success_score'), icon: 'success' })
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
        <Text style={labelStyle}>{t('act_form.our_score')}</Text>
        <Input
          value={ourScore}
          onInput={e => setOurScore(e.detail.value)}
          type='number'
          placeholder='0'
          style={inputStyle}
        />
        <Text style={labelStyle}>{t('act_form.opp_score')}</Text>
        <Input
          value={oppScore}
          onInput={e => setOppScore(e.detail.value)}
          type='number'
          placeholder='0'
          style={inputStyle}
        />
        <Text style={labelStyle}>{t('act_form.notes')}</Text>
        <Input
          value={notes}
          onInput={e => setNotes(e.detail.value)}
          placeholder={t('common.optional')}
          style={{ ...inputStyle, marginBottom: '32px' }}
        />
        <Button style={btnStyle} loading={loading} onClick={submitResult}>
          {t('act_form.save_score')}
        </Button>
      </View>
    )
  }

  return (
    <View style={{ padding: '16px' }}>
      <Text style={labelStyle}>{t('act_form.type')}</Text>
      <View style={{ display: 'flex', marginBottom: '16px', gap: '8px' }}>
        {(['MATCH', 'TRAINING'] as const).map(tp => (
          <View
            key={tp}
            onClick={() => setType(tp)}
            style={{
              flex: 1, textAlign: 'center', padding: '10px',
              border: `1px solid ${type === tp ? '#4CAF50' : '#e0e0e0'}`,
              borderRadius: '8px', color: type === tp ? '#4CAF50' : '#666'
            }}
          >
            <Text>{tp === 'MATCH' ? t('act_form.match') : t('act_form.training')}</Text>
          </View>
        ))}
      </View>

      <Text style={labelStyle}>{t('act_form.label_title')}</Text>
      <Input
        value={title}
        onInput={e => setTitle(e.detail.value)}
        placeholder={t('act_form.placeholder_title')}
        style={inputStyle}
      />

      {type === 'MATCH' && (
        <>
          <Text style={labelStyle}>{t('act_form.label_opponent')}</Text>
          <Input
            value={opponent}
            onInput={e => setOpponent(e.detail.value)}
            placeholder={t('act_form.placeholder_opponent')}
            style={inputStyle}
          />
        </>
      )}

      <Text style={labelStyle}>{t('act_form.label_location')}</Text>
      <Input
        value={location}
        onInput={e => setLocation(e.detail.value)}
        placeholder={t('act_form.placeholder_location')}
        style={inputStyle}
      />

      <Text style={labelStyle}>{t('act_form.label_start')}</Text>
      <Input
        value={startTime}
        onInput={e => setStartTime(e.detail.value)}
        placeholder={t('act_form.placeholder_start')}
        style={inputStyle}
      />

      <Text style={labelStyle}>{t('act_form.label_deadline')}</Text>
      <Input
        value={deadline}
        onInput={e => setDeadline(e.detail.value)}
        placeholder={t('act_form.placeholder_deadline')}
        style={inputStyle}
      />

      <Text style={labelStyle}>{t('act_form.label_max')}</Text>
      <Input
        value={maxPlayers}
        onInput={e => setMaxPlayers(e.detail.value)}
        type='number'
        placeholder={t('act_form.placeholder_max')}
        style={{ ...inputStyle, marginBottom: '32px' }}
      />

      <Button style={btnStyle} loading={loading} onClick={submitActivity}>
        {editId ? t('act_form.save') : t('act_form.publish')}
      </Button>
    </View>
  )
}
