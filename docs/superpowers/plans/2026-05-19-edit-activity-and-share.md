# 编辑活动 & 分享活动 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 CAPTAIN/ADMIN 添加编辑 OPEN 状态活动的功能，为所有成员添加分享活动到微信群的功能。

**Architecture:** 后端新增 `PUT /api/v1/activities/{activityId}` 接口，复用 `CreateActivityReq` DTO；前端 `activity-create` 页扩展为双模式（创建/编辑），`activity-detail` 页新增编辑入口和分享功能。

**Tech Stack:** Spring Boot 3.2.5 + Mockito（后端测试）、Taro 3.6 + React hooks、`useShareAppMessage`（Taro 微信分享 hook）

---

## 文件变更总览

| 文件 | 操作 |
|------|------|
| `backend/src/main/java/com/football/team/service/ActivityService.java` | 修改：新增 `updateActivity()` |
| `backend/src/main/java/com/football/team/controller/ActivityController.java` | 修改：新增 PUT 端点 |
| `backend/src/test/java/com/football/team/service/ActivityServiceTest.java` | 修改：新增 3 个测试 |
| `frontend/src/api/activity.ts` | 修改：新增 `update()` |
| `frontend/src/pages/activity-detail/index.tsx` | 修改：编辑按钮 + 分享功能 |
| `frontend/src/pages/activity-create/index.tsx` | 修改：支持编辑模式 |
| `frontend/src/pages/activity-create/index.config.ts` | 修改：动态标题（删除硬编码） |
| `frontend/src/assets/images/share-cover.png` | 新建：分享封面图 |

---

### Task 1: 后端 Service — updateActivity()

**Files:**
- Modify: `backend/src/test/java/com/football/team/service/ActivityServiceTest.java`
- Modify: `backend/src/main/java/com/football/team/service/ActivityService.java`

- [ ] **Step 1: 写失败测试**

在 `ActivityServiceTest.java` 末尾，在最后一个 `@Test` 方法后、闭合 `}` 前添加以下三个测试方法：

```java
@Test
void updateActivity_success_updatesAllFields() {
    Activity a = new Activity();
    a.setId(1L); a.setTeamId(1L); a.setStatus(ActivityStatus.OPEN);
    when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
    when(activityRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    CreateActivityReq req = new CreateActivityReq();
    req.setType(ActivityType.TRAINING);
    req.setTitle("周六训练");
    req.setLocation("五人制球场");
    req.setStartTime(java.time.LocalDateTime.of(2026, 6, 7, 9, 0));

    Activity result = activityService.updateActivity(1L, 1L, req);

    assertEquals("周六训练", result.getTitle());
    assertEquals("五人制球场", result.getLocation());
    assertEquals(ActivityType.TRAINING, result.getType());
}

@Test
void updateActivity_closedActivity_throwsBadRequest() {
    Activity a = new Activity();
    a.setId(2L); a.setTeamId(1L); a.setStatus(ActivityStatus.CLOSED);
    when(activityRepository.findById(2L)).thenReturn(Optional.of(a));

    CreateActivityReq req = new CreateActivityReq();
    req.setType(ActivityType.MATCH); req.setTitle("x"); req.setLocation("x");
    req.setStartTime(java.time.LocalDateTime.now());

    assertThrows(BusinessException.class, () -> activityService.updateActivity(2L, 1L, req));
}

@Test
void updateActivity_wrongTeam_throwsNotFound() {
    Activity a = new Activity();
    a.setId(3L); a.setTeamId(99L); a.setStatus(ActivityStatus.OPEN);
    when(activityRepository.findById(3L)).thenReturn(Optional.of(a));

    CreateActivityReq req = new CreateActivityReq();
    req.setType(ActivityType.MATCH); req.setTitle("x"); req.setLocation("x");
    req.setStartTime(java.time.LocalDateTime.now());

    assertThrows(BusinessException.class, () -> activityService.updateActivity(3L, 1L, req));
}
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
cd /Users/caoyajun/football-team/backend
./mvnw test -pl . -Dtest=ActivityServiceTest -q 2>&1 | tail -20
```

预期：编译失败，提示 `cannot find symbol: method updateActivity`

- [ ] **Step 3: 在 ActivityService 中实现 updateActivity()**

在 `ActivityService.java` 的 `closeActivity()` 方法之前添加：

```java
public Activity updateActivity(Long activityId, Long teamId, CreateActivityReq req) {
    Activity a = activityRepository.findById(activityId)
        .orElseThrow(() -> BusinessException.notFound("活动不存在"));
    if (!a.getTeamId().equals(teamId))
        throw BusinessException.notFound("活动不存在");
    if (a.getStatus() != ActivityStatus.OPEN)
        throw BusinessException.badRequest("已封闭的活动不可修改");
    a.setType(req.getType());
    a.setTitle(req.getTitle());
    a.setOpponent(req.getOpponent());
    a.setLocation(req.getLocation());
    a.setStartTime(req.getStartTime());
    a.setDeadline(req.getDeadline());
    a.setMaxPlayers(req.getMaxPlayers());
    return activityRepository.save(a);
}
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
cd /Users/caoyajun/football-team/backend
./mvnw test -pl . -Dtest=ActivityServiceTest -q 2>&1 | tail -10
```

预期：`BUILD SUCCESS`，6 个测试全部通过（含原有 3 个）

- [ ] **Step 5: Commit**

```bash
cd /Users/caoyajun/football-team
git add backend/src/main/java/com/football/team/service/ActivityService.java
git add backend/src/test/java/com/football/team/service/ActivityServiceTest.java
git commit -m "feat(backend): add updateActivity service method with tests"
```

---

### Task 2: 后端 Controller — PUT /api/v1/activities/{activityId}

**Files:**
- Modify: `backend/src/main/java/com/football/team/controller/ActivityController.java`

- [ ] **Step 1: 在 ActivityController 中添加导入和端点**

在 `ActivityController.java` 的 `result()` 方法之后、最后一个 `}` 之前添加：

```java
@PutMapping("/{activityId}")
@RequireRole(MemberRole.ADMIN)
public ApiResponse<ActivityRes> update(HttpServletRequest req,
                                       @PathVariable Long activityId,
                                       @RequestBody @Valid CreateActivityReq body) {
    Long teamId = (Long) req.getAttribute("currentTeamId");
    Activity updated = activityService.updateActivity(activityId, teamId, body);
    User user = (User) req.getAttribute("currentUser");
    return ApiResponse.ok(activityService.toActivityRes(updated, user.getId()));
}
```

注意：上面调用了 `activityService.toActivityRes()`，需要将 `ActivityService` 中现有的 `private ActivityRes toRes(...)` 改为 `public ActivityRes toActivityRes(...)`，并将类内其他调用处同步更新为新方法名。

- [ ] **Step 2: 修改 ActivityService 中的 toRes 可见性和方法名**

将 `ActivityService.java` 中：

```java
private ActivityRes toRes(Activity a, Long currentUserId) {
```

改为：

```java
public ActivityRes toActivityRes(Activity a, Long currentUserId) {
```

同时将 `listActivities()` 和 `getDetail()` 中的 `.map(a -> toRes(a, currentUserId))` 改为 `.map(a -> toActivityRes(a, currentUserId))`，`getDetail()` 中的 `toRes(a, currentUserId)` 也改为 `toActivityRes(a, currentUserId)`。

- [ ] **Step 3: 编译验证**

```bash
cd /Users/caoyajun/football-team/backend
./mvnw compile -q 2>&1 | tail -10
```

预期：`BUILD SUCCESS`，无编译错误

- [ ] **Step 4: 运行全量测试**

```bash
cd /Users/caoyajun/football-team/backend
./mvnw test -q 2>&1 | tail -10
```

预期：`BUILD SUCCESS`，所有测试通过

- [ ] **Step 5: Commit**

```bash
cd /Users/caoyajun/football-team
git add backend/src/main/java/com/football/team/controller/ActivityController.java
git add backend/src/main/java/com/football/team/service/ActivityService.java
git commit -m "feat(backend): add PUT /api/v1/activities/{activityId} update endpoint"
```

---

### Task 3: 前端 API — activityApi.update()

**Files:**
- Modify: `frontend/src/api/activity.ts`

- [ ] **Step 1: 在 activityApi 对象中添加 update 方法**

在 `frontend/src/api/activity.ts` 的 `recordResult` 方法之后添加：

```typescript
update: (activityId: number, body: {
  type: string; title: string; location: string; startTime: string;
  opponent?: string; deadline?: string; maxPlayers?: number
}) => api.put<ActivityRes>(`/api/v1/activities/${activityId}`, body as Record<string, unknown>),
```

- [ ] **Step 2: TypeScript 编译检查**

```bash
cd /Users/caoyajun/football-team/frontend
npx tsc --noEmit 2>&1 | head -20
```

预期：无错误输出

- [ ] **Step 3: Commit**

```bash
cd /Users/caoyajun/football-team
git add frontend/src/api/activity.ts
git commit -m "feat(frontend): add activityApi.update() for PUT endpoint"
```

---

### Task 4: 前端 activity-detail — 编辑按钮

**Files:**
- Modify: `frontend/src/pages/activity-detail/index.tsx`

- [ ] **Step 1: 在操作按钮区添加"编辑活动"按钮**

在 `activity-detail/index.tsx` 中，找到以下代码块（关闭报名按钮）：

```tsx
        {isCaptainOrAdmin() && isOpen && (
          <Button
            style={{
              background: '#fff',
              color: '#999',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              marginTop: '8px',
              fontSize: '14px',
            }}
            onClick={handleClose}
          >
            关闭报名
          </Button>
        )}
```

在该块**之后**（`录入比分`按钮之前）插入：

```tsx
        {isCaptainOrAdmin() && a.status === 'OPEN' && (
          <Button
            style={{
              background: '#2196F3',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              marginTop: '8px',
              fontSize: '14px',
            }}
            onClick={() =>
              Taro.navigateTo({
                url: `/pages/activity-create/index?editId=${activityId}`,
              })
            }
          >
            编辑活动
          </Button>
        )}
```

- [ ] **Step 2: TypeScript 编译检查**

```bash
cd /Users/caoyajun/football-team/frontend
npx tsc --noEmit 2>&1 | head -20
```

预期：无错误

- [ ] **Step 3: Commit**

```bash
cd /Users/caoyajun/football-team
git add frontend/src/pages/activity-detail/index.tsx
git commit -m "feat(frontend): add edit activity button for captain/admin on open activities"
```

---

### Task 5: 前端 activity-create — 编辑模式

**Files:**
- Modify: `frontend/src/pages/activity-create/index.tsx`
- Modify: `frontend/src/pages/activity-create/index.config.ts`

- [ ] **Step 1: 修改 index.config.ts，移除硬编码标题**

将 `frontend/src/pages/activity-create/index.config.ts` 改为：

```typescript
export default definePageConfig({ navigationBarTitleText: '活动' })
```

（实际标题在运行时由 `Taro.setNavigationBarTitle()` 动态设置）

- [ ] **Step 2: 替换 activity-create/index.tsx 全部内容**

将 `frontend/src/pages/activity-create/index.tsx` 替换为：

```tsx
import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'

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
    if (editId) {
      activityApi.detail(Number(editId)).then(detail => {
        const a = detail.activity
        setType(a.type)
        setTitle(a.title)
        setOpponent(a.opponent ?? '')
        setLocation(a.location)
        const fmt = (iso: string) => {
          const d = new Date(iso)
          const pad = (n: number) => String(n).padStart(2, '0')
          return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
        }
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
    opponent: opponent.trim() || undefined,
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
```

- [ ] **Step 3: TypeScript 编译检查**

```bash
cd /Users/caoyajun/football-team/frontend
npx tsc --noEmit 2>&1 | head -20
```

预期：无错误

- [ ] **Step 4: Commit**

```bash
cd /Users/caoyajun/football-team
git add frontend/src/pages/activity-create/index.tsx
git add frontend/src/pages/activity-create/index.config.ts
git commit -m "feat(frontend): support edit mode in activity-create page (editId param)"
```

---

### Task 6: 前端 activity-detail — 分享活动

**Files:**
- Modify: `frontend/src/pages/activity-detail/index.tsx`
- Create: `frontend/src/assets/images/share-cover.png`

- [ ] **Step 1: 创建分享封面图**

```bash
mkdir -p /Users/caoyajun/football-team/frontend/src/assets/images
python3 - <<'EOF'
import zlib, struct

def make_png(w, h, r, g, b):
    def chunk(tag, data):
        crc = zlib.crc32(tag + data) & 0xffffffff
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', crc)
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    raw = b''.join(b'\x00' + bytes([r, g, b] * w) for _ in range(h))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')

with open('/Users/caoyajun/football-team/frontend/src/assets/images/share-cover.png', 'wb') as f:
    f.write(make_png(500, 400, 76, 175, 80))
print("share-cover.png created")
EOF
```

预期输出：`share-cover.png created`

- [ ] **Step 2: 修改 activity-detail/index.tsx 添加分享功能**

在文件顶部 import 行中，将：

```tsx
import Taro from '@tarojs/taro'
```

改为：

```tsx
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
```

- [ ] **Step 3: 在 ActivityDetailPage 组件内添加分享 hook 和 showShareMenu**

先将已有的：

```tsx
  const { isCaptainOrAdmin } = useAuthStore()
```

改为（合并解构，避免重复调用 hook）：

```tsx
  const { isCaptainOrAdmin, currentTeamId } = useAuthStore()
```

然后在 `const activityId = ...` 一行**之后**添加：

```tsx
  useShareAppMessage(() => ({
    title: detail?.activity.title ?? '球队活动',
    path: `/pages/activity-detail/index?id=${activityId}&teamId=${currentTeamId}`,
    imageUrl: '/assets/images/share-cover.png',
  }))

  useDidShow(() => {
    Taro.showShareMenu({ withShareTicket: false, menus: ['shareAppMessage'] })
  })
```

- [ ] **Step 4: 在操作按钮区添加分享按钮**

在 `activity-detail/index.tsx` 操作按钮区最底部（`录入比分`按钮块之后、`</View>` 关闭 `ScrollView` 之前）添加：

```tsx
        <Button
          openType='share'
          style={{
            background: '#fff',
            color: '#07C160',
            border: '1px solid #07C160',
            borderRadius: '8px',
            marginTop: '8px',
            fontSize: '14px',
          }}
        >
          分享给好友
        </Button>
```

- [ ] **Step 5: TypeScript 编译检查**

```bash
cd /Users/caoyajun/football-team/frontend
npx tsc --noEmit 2>&1 | head -20
```

预期：无错误

- [ ] **Step 6: Commit**

```bash
cd /Users/caoyajun/football-team
git add frontend/src/pages/activity-detail/index.tsx
git add frontend/src/assets/images/share-cover.png
git commit -m "feat(frontend): add share activity to WeChat group with share button and cover image"
```

---

## 手工验证清单

**编辑活动：**
- [ ] 以 CAPTAIN/ADMIN 身份打开一个 OPEN 状态的活动详情，看到"编辑活动"蓝色按钮
- [ ] 点击进入编辑页，表单字段已预填当前活动数据，页面标题为"编辑活动"
- [ ] 修改标题/地点，点击"保存修改"，返回详情页，数据已更新
- [ ] 以 PLAYER 身份打开活动详情，不显示"编辑活动"按钮
- [ ] 打开 CLOSED/FINISHED 活动，不显示"编辑活动"按钮

**分享活动：**
- [ ] 打开任意活动详情，底部显示"分享给好友"按钮（绿色边框）
- [ ] 点击分享按钮，微信弹出分享菜单
- [ ] 分享卡片标题为活动名称
