import { useState, useEffect, useRef } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
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

const fmt = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

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

  const labelStyle = { fontSize: px(14), fontWeight: '500', color: C.text2, marginBottom: px(8), display: 'block' } as const
  const inputStyle = {
    border: '1px solid #e5e7eb', borderRadius: px(12), padding: '12px 14px',
    marginBottom: px(16), fontSize: px(15), background: C.bg, color: C.text,
  } as const
  const btnStyle = {
    background: C.primary, color: '#fff', borderRadius: '9999px',
    border: 'none', fontSize: px(16), fontWeight: '600',
  } as const

  if (resultFor) {
    return (
      <View style={{ padding: px(16), background: C.bg, minHeight: '100%' }}>
        <View style={{ background: C.surface, borderRadius: px(16), padding: px(20), boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <Text style={{ fontSize: px(18), fontWeight: '700', color: C.text, marginBottom: px(20), display: 'block' }}>
            录入比赛结果
          </Text>
          <Text style={labelStyle}>{t('act_form.our_score')}</Text>
          <Input
            value={ourScore}
            onInput={e => setOurScore(e.detail.value)}
            type='number'
            placeholder='0'
            style={{ ...inputStyle, fontSize: px(24), textAlign: 'center', fontWeight: '700' }}
          />
          <Text style={labelStyle}>{t('act_form.opp_score')}</Text>
          <Input
            value={oppScore}
            onInput={e => setOppScore(e.detail.value)}
            type='number'
            placeholder='0'
            style={{ ...inputStyle, fontSize: px(24), textAlign: 'center', fontWeight: '700' }}
          />
          <Text style={labelStyle}>{t('act_form.notes')}</Text>
          <Input
            value={notes}
            onInput={e => setNotes(e.detail.value)}
            placeholder={t('common.optional')}
            style={{ ...inputStyle, marginBottom: px(32) }}
          />
          <Button style={btnStyle} loading={loading} onClick={submitResult}>
            {t('act_form.save_score')}
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View style={{ padding: px(16), background: C.bg, minHeight: '100%' }}>
      <View style={{ background: C.surface, borderRadius: px(16), padding: px(20), boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <Text style={{ fontSize: px(18), fontWeight: '700', color: C.text, marginBottom: px(20), display: 'block' }}>
          {editId ? t('act_form.title_edit') : t('act_form.title_create')}
        </Text>

        <Text style={labelStyle}>{t('act_form.type')}</Text>
        <View style={{ display: 'flex', marginBottom: px(16), gap: px(8) }}>
          {(['MATCH', 'TRAINING'] as const).map(tp => (
            <View
              key={tp}
              onClick={() => setType(tp)}
              style={{
                flex: 1, textAlign: 'center', padding: px(10),
                border: `1.5px solid ${type === tp ? C.primary : '#e5e7eb'}`,
                borderRadius: px(12), color: type === tp ? C.primary : C.text2,
                background: type === tp ? C.primaryLight : C.surface,
                fontWeight: type === tp ? '600' : '400',
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
          style={{ ...inputStyle, marginBottom: px(32) }}
        />

        <Button style={btnStyle} loading={loading} onClick={submitActivity}>
          {editId ? t('act_form.save') : t('act_form.publish')}
        </Button>
      </View>
    </View>
  )
}
