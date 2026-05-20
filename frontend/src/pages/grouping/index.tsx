import { useState, useEffect } from 'react'
import { View, Text, Button, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { groupingApi } from '../../api/grouping'
import type { GroupMemberDto, GroupingRes } from '../../types/api'

interface LocalGroup {
  id?: number
  index: number
  name: string
  members: GroupMemberDto[]
}

export default function GroupingPage() {
  const params = Taro.getCurrentInstance().router?.params ?? {}
  const activityId = Number(params.activityId)
  const activityTitle = decodeURIComponent(params.title ?? '')
  const activityTime = decodeURIComponent(params.startTime ?? '')
  const activityLocation = decodeURIComponent(params.location ?? '')
  const activityStatus = params.status ?? ''
  const isOpen = activityStatus === 'OPEN'

  const [groups, setGroups] = useState<LocalGroup[]>([])
  const [ungrouped, setUngrouped] = useState<GroupMemberDto[]>([])
  const [groupCount, setGroupCount] = useState(2)
  const [selected, setSelected] = useState<{ member: GroupMemberDto; fromGroupIndex: number | null } | null>(null)
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null)
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadGrouping() }, [activityId])

  function applyRes(res: GroupingRes) {
    setGroups(res.groups.map(g => ({ id: g.id, index: g.index, name: g.name, members: g.members })))
    setUngrouped(res.ungrouped)
    if (res.groups.length > 0) setGroupCount(res.groups.length)
    setDirty(false)
  }

  async function loadGrouping() {
    setLoading(true)
    try { applyRes(await groupingApi.getGrouping(activityId)) }
    catch (e: unknown) { Taro.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' }) }
    finally { setLoading(false) }
  }

  async function handleSave() {
    try {
      const res = await groupingApi.saveGrouping(activityId, {
        groupCount: groups.length,
        groups: groups.map(g => ({ index: g.index, name: g.name, memberIds: g.members.map(m => m.userId) })),
      })
      applyRes(res)
      Taro.showToast({ title: '保存成功', icon: 'success' })
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
    }
  }

  async function handleRandom() {
    const defaultNames = ['第1组', '第2组', '第3组', '第4组']
    const groupNames = groups.length >= groupCount
      ? groups.slice(0, groupCount).map(g => g.name)
      : defaultNames.slice(0, groupCount)
    try {
      const res = await groupingApi.randomGrouping(activityId, { groupCount, groupNames })
      applyRes(res)
      Taro.showToast({ title: '随机分组完成', icon: 'success' })
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '分组失败', icon: 'none' })
    }
  }

  function handleGroupCountChange(count: number) {
    if (!isOpen) return
    const defaultNames = ['第1组', '第2组', '第3组', '第4组']
    const newGroups: LocalGroup[] = []
    for (let i = 0; i < count; i++) {
      if (i < groups.length) newGroups.push(groups[i])
      else newGroups.push({ index: i, name: defaultNames[i], members: [] })
    }
    if (count < groups.length) {
      const removed = groups.slice(count).flatMap(g => g.members)
      setUngrouped(prev => [...prev, ...removed])
    }
    setGroups(newGroups)
    setGroupCount(count)
    setDirty(true)
  }

  function handlePlayerClick(member: GroupMemberDto, fromGroupIndex: number | null) {
    if (!isOpen) return
    setSelected({ member, fromGroupIndex })
  }

  function handleMoveTo(toGroupIndex: number | null) {
    if (!selected) return
    const { member, fromGroupIndex } = selected

    setGroups(prev => prev.map((g, idx) => {
      if (idx === fromGroupIndex) return { ...g, members: g.members.filter(m => m.userId !== member.userId) }
      if (idx === toGroupIndex) return { ...g, members: [...g.members, member] }
      return g
    }))

    if (fromGroupIndex === null) setUngrouped(prev => prev.filter(m => m.userId !== member.userId))
    if (toGroupIndex === null) setUngrouped(prev => [...prev, member])

    setSelected(null)
    setDirty(true)
  }

  function handleRenameGroup(groupIndex: number, newName: string) {
    setGroups(prev => prev.map((g, idx) => idx === groupIndex ? { ...g, name: newName } : g))
    setDirty(true)
  }

  const chipStyle = (active: boolean) => ({
    display: 'inline-block',
    padding: '4px 10px',
    margin: '4px',
    borderRadius: '16px',
    fontSize: '13px',
    background: active ? '#4CAF50' : '#f0f0f0',
    color: active ? '#fff' : '#333',
  })

  if (loading) {
    return (
      <View style={{ padding: '32px', textAlign: 'center' }}>
        <Text style={{ color: '#999' }}>加载中...</Text>
      </View>
    )
  }

  return (
    <ScrollView scrollY style={{ height: '100vh', background: '#f5f5f5' }}>
      <View style={{ padding: '12px' }}>

        {/* 组数 + 随机按钮 */}
        {isOpen && (
          <View style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', background: '#fff', borderRadius: '8px', padding: '12px' }}>
            <Text style={{ fontSize: '14px', color: '#333', marginRight: '12px' }}>分组数：</Text>
            {[2, 3, 4].map(n => (
              <Button
                key={n}
                style={{
                  padding: '4px 12px',
                  marginRight: '6px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  background: groupCount === n ? '#4CAF50' : '#f0f0f0',
                  color: groupCount === n ? '#fff' : '#333',
                  border: 'none',
                }}
                onClick={() => handleGroupCountChange(n)}
              >{n}</Button>
            ))}
            <Button
              style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', background: '#4CAF50', color: '#fff', border: 'none' }}
              onClick={handleRandom}
            >一键随机</Button>
          </View>
        )}

        {/* 各分组卡片 */}
        {groups.map((g, idx) => (
          <View key={idx} style={{ background: '#fff', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
            {/* 组名（可编辑） */}
            {isOpen && editingGroupIndex === idx ? (
              <Input
                value={g.name}
                style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #4CAF50' }}
                onInput={e => handleRenameGroup(idx, e.detail.value)}
                onBlur={() => setEditingGroupIndex(null)}
                focus
              />
            ) : (
              <Text
                style={{ fontSize: '15px', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#333' }}
                onClick={() => isOpen && setEditingGroupIndex(idx)}
              >
                {g.name}（{g.members.length}人）{isOpen && <Text style={{ fontSize: '12px', color: '#999' }}> 点击改名</Text>}
              </Text>
            )}
            {/* 队员列表 */}
            <View>
              {g.members.map(m => (
                <Text
                  key={m.userId}
                  style={chipStyle(selected?.member.userId === m.userId)}
                  onClick={() => handlePlayerClick(m, idx)}
                >{m.nickname}</Text>
              ))}
              {g.members.length === 0 && (
                <Text style={{ fontSize: '13px', color: '#bbb' }}>（空组）</Text>
              )}
            </View>
          </View>
        ))}

        {/* 未分组 */}
        {(ungrouped.length > 0 || groups.length === 0) && (
          <View style={{ background: '#fff', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
            <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '8px' }}>
              未分组（{ungrouped.length}人）
            </Text>
            {ungrouped.map(m => (
              <Text
                key={m.userId}
                style={chipStyle(selected?.member.userId === m.userId)}
                onClick={() => handlePlayerClick(m, null)}
              >{m.nickname}</Text>
            ))}
          </View>
        )}

        {/* 移动操作面板（选中后显示） */}
        {selected && (
          <View style={{ position: 'fixed', bottom: '80px', left: '12px', right: '12px', background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 -2px 12px rgba(0,0,0,0.1)' }}>
            <Text style={{ fontSize: '14px', color: '#333', display: 'block', marginBottom: '10px' }}>
              移动「{selected.member.nickname}」到：
            </Text>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {groups.map((g, idx) => idx !== selected.fromGroupIndex && (
                <Button key={idx} style={{ padding: '6px 14px', borderRadius: '16px', fontSize: '13px', border: '1px solid #4CAF50', color: '#4CAF50', background: '#fff' }} onClick={() => handleMoveTo(idx)}>
                  {g.name}
                </Button>
              ))}
              {selected.fromGroupIndex !== null && (
                <Button style={{ padding: '6px 14px', borderRadius: '16px', fontSize: '13px', border: '1px solid #999', color: '#999', background: '#fff' }} onClick={() => handleMoveTo(null)}>
                  移出分组
                </Button>
              )}
              <Button style={{ padding: '6px 14px', borderRadius: '16px', fontSize: '13px', border: '1px solid #ccc', color: '#ccc', background: '#fff' }} onClick={() => setSelected(null)}>
                取消
              </Button>
            </View>
          </View>
        )}

        {/* 底部操作栏 */}
        <View style={{ position: 'fixed', bottom: '0', left: '0', right: '0', background: '#fff', padding: '12px', display: 'flex', gap: '10px', boxShadow: '0 -1px 4px rgba(0,0,0,0.08)' }}>
          {isOpen && (
            <Button
              style={{ flex: '1', background: dirty ? '#4CAF50' : '#bbb', color: '#fff', borderRadius: '8px', fontSize: '14px', border: 'none' }}
              disabled={!dirty}
              onClick={handleSave}
            >保存</Button>
          )}
          <Button
            style={{ flex: '1', background: '#fff', color: '#4CAF50', border: '1px solid #4CAF50', borderRadius: '8px', fontSize: '14px' }}
            onClick={async () => {
              if (dirty) await handleSave()
              Taro.navigateTo({
                url: `/pages/grouping/poster?activityId=${activityId}&title=${encodeURIComponent(activityTitle)}&startTime=${encodeURIComponent(activityTime)}&location=${encodeURIComponent(activityLocation)}`,
              })
            }}
          >生成海报</Button>
        </View>

        <View style={{ height: '70px' }} />
      </View>
    </ScrollView>
  )
}
