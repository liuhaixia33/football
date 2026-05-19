# 足球队管理小程序 · 前端实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Taro 3.x（React + TypeScript）实现足球队管理微信小程序，对接已有 Spring Boot 后端 API。

**Architecture:** 所有页面用函数式组件 + Hooks；Zustand 管理 token/当前球队/角色等全局状态；`Taro.request` 封装成带 JWT + `X-Team-Id` 头的 API 客户端；自定义 Tab Bar 根据角色动态渲染 3 或 4 个标签。

**Tech Stack:** Taro 3.6+, React 18, TypeScript 5, Zustand 4, SCSS, WeChat DevTools（调试验证）

---

## 文件结构

```
football-team/
└── frontend/
    ├── src/
    │   ├── app.tsx                          ← App 入口，auth 检查
    │   ├── app.config.ts                    ← 页面注册 + tabBar 配置
    │   ├── app.scss
    │   ├── config.ts                        ← API_BASE 等常量
    │   ├── types/
    │   │   └── api.ts                       ← 所有 API 请求/响应 TypeScript 类型
    │   ├── api/
    │   │   ├── client.ts                    ← Taro.request 封装（JWT + X-Team-Id）
    │   │   ├── auth.ts                      ← login
    │   │   ├── team.ts                      ← 球队 CRUD
    │   │   ├── activity.ts                  ← 活动 CRUD
    │   │   ├── finance.ts                   ← 财务
    │   │   └── user.ts                      ← 个人中心
    │   ├── store/
    │   │   └── auth.ts                      ← Zustand store（token/currentTeamId/role）
    │   ├── custom-tab-bar/
    │   │   ├── index.tsx                    ← 自定义 Tab Bar（3/4 tabs）
    │   │   └── index.scss
    │   └── pages/
    │       ├── login/index.tsx + config.ts  ← 微信登录
    │       ├── team-select/index.tsx        ← 多球队切换
    │       ├── onboard/index.tsx            ← 首次使用引导
    │       ├── create-team/index.tsx        ← 创建球队
    │       ├── join-team/index.tsx          ← 输入邀请码加入
    │       ├── home/index.tsx + config.ts   ← Tab1：活动列表
    │       ├── activity-detail/index.tsx    ← 活动详情 + 报名
    │       ├── activity-create/index.tsx    ← 发布活动
    │       ├── members/index.tsx + config.ts ← Tab2：队员列表
    │       ├── finance/index.tsx + config.ts ← Tab3：财务汇总
    │       ├── finance-record/index.tsx     ← 新增收支
    │       ├── member-fee/index.tsx         ← 队费状态
    │       └── my/index.tsx + config.ts     ← Tab4：个人中心
    ├── __tests__/
    │   └── auth.store.test.ts               ← Zustand store 单元测试
    ├── package.json
    ├── tsconfig.json
    ├── project.config.json
    └── config/
        ├── index.js
        ├── dev.js
        └── prod.js
```

---

## Task 1: 项目初始化、类型定义与 API 客户端

**Files:**
- Create: `frontend/` (Taro CLI init)
- Create: `frontend/src/config.ts`
- Create: `frontend/src/types/api.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/auth.ts`, `team.ts`, `activity.ts`, `finance.ts`, `user.ts`
- Modify: `frontend/src/app.config.ts`

- [ ] **Step 1: 初始化 Taro 项目**

```bash
cd /Users/caoyajun/football-team
npx @tarojs/cli init frontend
```

CLI 交互选项（依次选择）：
- 框架：React
- 语言：TypeScript
- CSS 预处理：Sass
- 模板：默认模板

```bash
cd frontend
npm install zustand
```

删除默认示例页面：
```bash
rm -rf src/pages/index
```

- [ ] **Step 2: 写 `src/config.ts`**

```typescript
// src/config.ts
export const API_BASE = 'http://localhost:8080'
```

- [ ] **Step 3: 写 `src/types/api.ts`**

```typescript
// src/types/api.ts

export type MemberRole = 'CAPTAIN' | 'ADMIN' | 'PLAYER'
export type MemberStatus = 'PENDING' | 'ACTIVE' | 'REMOVED'
export type ActivityType = 'MATCH' | 'TRAINING'
export type ActivityStatus = 'OPEN' | 'CLOSED' | 'FINISHED'
export type MatchOutcome = 'WIN' | 'DRAW' | 'LOSE'
export type FinanceType = 'INCOME' | 'EXPENSE'

export interface TeamBrief {
  teamId: number
  teamName: string
  logoUrl: string
  role: MemberRole
}

export interface LoginRes {
  token: string
  userId: number
  nickname: string
  teams: TeamBrief[]
}

export interface Team {
  id: number
  name: string
  logoUrl: string
  description: string
  inviteCode: string
}

export interface MemberRes {
  memberId: number
  userId: number
  nickname: string
  avatarUrl: string
  role: MemberRole
  status: MemberStatus
  joinedAt: string | null
}

export interface ActivityRes {
  id: number
  type: ActivityType
  title: string
  opponent: string | null
  location: string
  startTime: string
  deadline: string | null
  maxPlayers: number | null
  registeredCount: number
  status: ActivityStatus
  iJoined: boolean
}

export interface MatchResultRes {
  ourScore: number
  oppScore: number
  outcome: MatchOutcome
  notes: string | null
}

export interface ActivityDetailRes {
  activity: ActivityRes
  registrations: Array<{ userId: number; nickname: string; avatarUrl: string }>
  result: MatchResultRes | null
}

export interface FinanceRecord {
  id: number
  type: FinanceType
  amount: number
  category: string
  description: string
  recordDate: string
}

export interface FinanceSummaryRes {
  totalIncome: number
  totalExpense: number
  balance: number
  records: FinanceRecord[]
}

export interface MemberFeeRes {
  userId: number
  nickname: string
  amountDue: number
  amountPaid: number
  isPaid: boolean
}

export interface UserProfileRes {
  userId: number
  nickname: string
  avatarUrl: string
  teams: TeamBrief[]
}

export interface MyStatsRes {
  totalMatches: number
  wins: number
  draws: number
  losses: number
}
```

- [ ] **Step 4: 写 `src/api/client.ts`**

```typescript
// src/api/client.ts
import Taro from '@tarojs/taro'
import { API_BASE } from '../config'
import { useAuthStore } from '../store/auth'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: Record<string, unknown>,
  withTeam = true
): Promise<T> {
  const { token, currentTeamId } = useAuthStore.getState()

  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) header['Authorization'] = `Bearer ${token}`
  if (withTeam && currentTeamId) header['X-Team-Id'] = String(currentTeamId)

  const res = await Taro.request({
    url: API_BASE + path,
    method,
    data,
    header,
  })

  const body = res.data as ApiResponse<T>
  if (body.code === 401) {
    useAuthStore.getState().clear()
    Taro.reLaunch({ url: '/pages/login/index' })
    throw new Error('未登录')
  }
  if (body.code !== 200) {
    throw new Error(body.message || '请求失败')
  }
  return body.data
}

export const api = {
  get:    <T>(path: string, withTeam = true) =>
    request<T>('GET', path, undefined, withTeam),
  post:   <T>(path: string, data?: Record<string, unknown>, withTeam = true) =>
    request<T>('POST', path, data, withTeam),
  put:    <T>(path: string, data?: Record<string, unknown>, withTeam = true) =>
    request<T>('PUT', path, data, withTeam),
  delete: <T>(path: string, withTeam = true) =>
    request<T>('DELETE', path, undefined, withTeam),
}
```

- [ ] **Step 5: 写 5 个 API 模块**

```typescript
// src/api/auth.ts
import { api } from './client'
import type { LoginRes } from '../types/api'

export const authApi = {
  login: (code: string, nickname?: string, avatarUrl?: string) =>
    api.post<LoginRes>('/api/v1/auth/login', { code, nickname, avatarUrl }, false),
}
```

```typescript
// src/api/team.ts
import { api } from './client'
import type { MemberRes, Team } from '../types/api'

export const teamApi = {
  create: (name: string, description?: string) =>
    api.post<Team>('/api/v1/teams', { name, description }, false),
  join: (inviteCode: string) =>
    api.post<void>('/api/v1/teams/join', { inviteCode }, false),
  listMembers: (teamId: number) =>
    api.get<MemberRes[]>(`/api/v1/teams/${teamId}/members`),
  reviewApply: (teamId: number, memberId: number, approve: boolean) =>
    api.post<void>(`/api/v1/teams/${teamId}/members/review`, { memberId, approve }),
  setRole: (teamId: number, userId: number, role: string) =>
    api.put<void>(`/api/v1/teams/${teamId}/members/role`, { userId, role }),
  removeMember: (teamId: number, userId: number) =>
    api.delete<void>(`/api/v1/teams/${teamId}/members/${userId}`),
  leave: (teamId: number) =>
    api.delete<void>(`/api/v1/teams/${teamId}/leave`),
}
```

```typescript
// src/api/activity.ts
import { api } from './client'
import type { ActivityRes, ActivityDetailRes, Activity } from '../types/api'

export const activityApi = {
  list: (teamId: number) =>
    api.get<ActivityRes[]>(`/api/v1/activities/team/${teamId}`),
  detail: (activityId: number) =>
    api.get<ActivityDetailRes>(`/api/v1/activities/${activityId}`),
  create: (teamId: number, body: {
    type: string; title: string; location: string; startTime: string;
    opponent?: string; deadline?: string; maxPlayers?: number
  }) => api.post<Activity>(`/api/v1/activities/team/${teamId}`, body as Record<string, unknown>),
  register: (activityId: number) =>
    api.post<void>(`/api/v1/activities/${activityId}/register`, undefined),
  cancelRegister: (activityId: number) =>
    api.delete<void>(`/api/v1/activities/${activityId}/register`),
  close: (activityId: number) =>
    api.put<void>(`/api/v1/activities/${activityId}/close`, undefined),
  recordResult: (activityId: number, ourScore: number, oppScore: number, notes?: string) =>
    api.put<void>(`/api/v1/activities/${activityId}/result`, { ourScore, oppScore, notes }),
}
```

```typescript
// src/api/finance.ts
import { api } from './client'
import type { FinanceSummaryRes, FinanceRecord, MemberFeeRes } from '../types/api'

export const financeApi = {
  summary: (teamId: number, from?: string, to?: string) => {
    const params = from && to ? `?from=${from}&to=${to}` : ''
    return api.get<FinanceSummaryRes>(`/api/v1/finance/team/${teamId}/summary${params}`)
  },
  createRecord: (teamId: number, body: {
    type: string; amount: number; category: string; recordDate: string; description?: string
  }) => api.post<FinanceRecord>(`/api/v1/finance/team/${teamId}/records`, body as Record<string, unknown>),
  setMemberFee: (teamId: number, season: number, amountDue: number) =>
    api.post<void>(`/api/v1/finance/team/${teamId}/fees/set`, { season, amountDue }),
  markFee: (teamId: number, userId: number, season: number, amountPaid: number) =>
    api.put<void>(`/api/v1/finance/team/${teamId}/fees/mark`, { userId, season, amountPaid }),
  memberFees: (teamId: number, season: number) =>
    api.get<MemberFeeRes[]>(`/api/v1/finance/team/${teamId}/fees?season=${season}`),
}
```

```typescript
// src/api/user.ts
import { api } from './client'
import type { UserProfileRes, MyStatsRes } from '../types/api'

export const userApi = {
  me: () => api.get<UserProfileRes>('/api/v1/users/me', false),
  stats: (teamId: number) =>
    api.get<MyStatsRes>(`/api/v1/users/me/stats?teamId=${teamId}`, false),
}
```

- [ ] **Step 6: 更新 `src/app.config.ts`**

```typescript
// src/app.config.ts
export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/team-select/index',
    'pages/onboard/index',
    'pages/create-team/index',
    'pages/join-team/index',
    'pages/home/index',
    'pages/activity-detail/index',
    'pages/activity-create/index',
    'pages/members/index',
    'pages/finance/index',
    'pages/finance-record/index',
    'pages/member-fee/index',
    'pages/my/index',
  ],
  tabBar: {
    custom: true,
    color: '#999999',
    selectedColor: '#4CAF50',
    list: [
      { pagePath: 'pages/home/index', text: '首页' },
      { pagePath: 'pages/members/index', text: '队员' },
      { pagePath: 'pages/finance/index', text: '财务' },
      { pagePath: 'pages/my/index', text: '我的' },
    ],
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4CAF50',
    navigationBarTitleText: '足球队',
    navigationBarTextStyle: 'white',
  },
})
```

- [ ] **Step 7: 验证编译**

```bash
npm run build:weapp 2>&1 | tail -5
# 预期：Build completed successfully
```

- [ ] **Step 8: Commit**

```bash
cd /Users/caoyajun/football-team
git add frontend/
git commit -m "feat: frontend project init, types, API client"
```

---

## Task 2: 全局状态管理（Auth Store）与单元测试

**Files:**
- Create: `frontend/src/store/auth.ts`
- Create: `frontend/__tests__/auth.store.test.ts`

- [ ] **Step 1: 写 `src/store/auth.ts`**

```typescript
// src/store/auth.ts
import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type { TeamBrief, MemberRole } from '../types/api'

interface AuthState {
  token: string | null
  userId: number | null
  nickname: string | null
  avatarUrl: string | null
  currentTeamId: number | null
  currentRole: MemberRole | null
  teams: TeamBrief[]

  setAuth: (token: string, userId: number, nickname: string, avatarUrl: string) => void
  setCurrentTeam: (teamId: number, role: MemberRole) => void
  setTeams: (teams: TeamBrief[]) => void
  clear: () => void
  isAtLeast: (required: MemberRole) => boolean
  isCaptainOrAdmin: () => boolean
}

const ROLE_ORDER: Record<MemberRole, number> = { CAPTAIN: 0, ADMIN: 1, PLAYER: 2 }

function load<T>(key: string): T | null {
  try { return Taro.getStorageSync(key) || null } catch { return null }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token:         load('token'),
  userId:        load('userId'),
  nickname:      load('nickname'),
  avatarUrl:     load('avatarUrl'),
  currentTeamId: load('currentTeamId'),
  currentRole:   load('currentRole'),
  teams: [],

  setAuth: (token, userId, nickname, avatarUrl) => {
    Taro.setStorageSync('token', token)
    Taro.setStorageSync('userId', userId)
    Taro.setStorageSync('nickname', nickname)
    Taro.setStorageSync('avatarUrl', avatarUrl)
    set({ token, userId, nickname, avatarUrl })
  },

  setCurrentTeam: (teamId, role) => {
    Taro.setStorageSync('currentTeamId', teamId)
    Taro.setStorageSync('currentRole', role)
    set({ currentTeamId: teamId, currentRole: role })
  },

  setTeams: (teams) => set({ teams }),

  clear: () => {
    try { Taro.clearStorageSync() } catch {}
    set({ token: null, userId: null, nickname: null, avatarUrl: null,
          currentTeamId: null, currentRole: null, teams: [] })
  },

  isAtLeast: (required) => {
    const { currentRole } = get()
    if (!currentRole) return false
    return ROLE_ORDER[currentRole] <= ROLE_ORDER[required]
  },

  isCaptainOrAdmin: () => {
    const { currentRole } = get()
    return currentRole === 'CAPTAIN' || currentRole === 'ADMIN'
  },
}))
```

- [ ] **Step 2: 在 `package.json` 中加 jest 配置**

在 `frontend/package.json` 的 `scripts` 中确认有 `"test": "jest"`，若没有则手动添加。另在根级添加 jest 配置：

```bash
npm install --save-dev jest @types/jest ts-jest
```

在 `frontend/package.json` 根级添加：
```json
"jest": {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "moduleNameMapper": {
    "@tarojs/taro": "<rootDir>/__mocks__/taro.ts"
  }
}
```

- [ ] **Step 3: 写 Taro mock**

```typescript
// frontend/__mocks__/taro.ts
const storage: Record<string, unknown> = {}

const Taro = {
  getStorageSync: (key: string) => storage[key] ?? null,
  setStorageSync: (key: string, value: unknown) => { storage[key] = value },
  clearStorageSync: () => { Object.keys(storage).forEach(k => delete storage[k]) },
  reLaunch: jest.fn(),
  navigateTo: jest.fn(),
  switchTab: jest.fn(),
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  login: jest.fn(),
  getUserProfile: jest.fn(),
}
export default Taro
```

- [ ] **Step 4: 写 `__tests__/auth.store.test.ts`**

```typescript
// __tests__/auth.store.test.ts
import { useAuthStore } from '../src/store/auth'

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: null, userId: null, nickname: null, avatarUrl: null,
      currentTeamId: null, currentRole: null, teams: [],
    })
  })

  test('isAtLeast: same role returns true', () => {
    useAuthStore.setState({ currentRole: 'ADMIN' })
    expect(useAuthStore.getState().isAtLeast('ADMIN')).toBe(true)
  })

  test('isAtLeast: CAPTAIN can access ADMIN-required', () => {
    useAuthStore.setState({ currentRole: 'CAPTAIN' })
    expect(useAuthStore.getState().isAtLeast('ADMIN')).toBe(true)
  })

  test('isAtLeast: PLAYER cannot access ADMIN-required', () => {
    useAuthStore.setState({ currentRole: 'PLAYER' })
    expect(useAuthStore.getState().isAtLeast('ADMIN')).toBe(false)
  })

  test('isAtLeast: null role returns false', () => {
    useAuthStore.setState({ currentRole: null })
    expect(useAuthStore.getState().isAtLeast('PLAYER')).toBe(false)
  })

  test('isCaptainOrAdmin: CAPTAIN returns true', () => {
    useAuthStore.setState({ currentRole: 'CAPTAIN' })
    expect(useAuthStore.getState().isCaptainOrAdmin()).toBe(true)
  })

  test('isCaptainOrAdmin: PLAYER returns false', () => {
    useAuthStore.setState({ currentRole: 'PLAYER' })
    expect(useAuthStore.getState().isCaptainOrAdmin()).toBe(false)
  })
})
```

- [ ] **Step 5: 运行测试**

```bash
cd /Users/caoyajun/football-team/frontend
npx jest __tests__/auth.store.test.ts --no-coverage 2>&1 | tail -10
# 预期：6 tests passed
```

- [ ] **Step 6: Commit**

```bash
cd /Users/caoyajun/football-team
git add frontend/
git commit -m "feat: auth store with role hierarchy, 6 unit tests pass"
```

---

## Task 3: 登录页与球队选择流程

**Files:**
- Create: `frontend/src/pages/login/index.tsx`
- Create: `frontend/src/pages/login/index.config.ts`
- Create: `frontend/src/pages/team-select/index.tsx`
- Create: `frontend/src/pages/team-select/index.config.ts`
- Create: `frontend/src/pages/onboard/index.tsx`
- Create: `frontend/src/pages/onboard/index.config.ts`
- Create: `frontend/src/pages/create-team/index.tsx`
- Create: `frontend/src/pages/create-team/index.config.ts`
- Create: `frontend/src/pages/join-team/index.tsx`
- Create: `frontend/src/pages/join-team/index.config.ts`

- [ ] **Step 1: 写登录页 `src/pages/login/index.tsx`**

```tsx
// src/pages/login/index.tsx
import { useState } from 'react'
import { View, Text, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/auth'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { setAuth, setTeams } = useAuthStore()

  const handleLogin = async () => {
    if (loading) return
    setLoading(true)
    try {
      // 1. 获取微信 code
      const { code } = await Taro.login()

      // 2. 获取用户昵称和头像（需用户点击按钮授权，这里已在 Button openType 处理）
      let nickname: string | undefined
      let avatarUrl: string | undefined
      try {
        const profile = await Taro.getUserProfile({ desc: '用于完善队员信息' })
        nickname = profile.userInfo.nickName
        avatarUrl = profile.userInfo.avatarUrl
      } catch {
        // 用户拒绝授权，使用默认昵称
      }

      // 3. 后端换取 JWT
      const res = await authApi.login(code, nickname, avatarUrl)
      setAuth(res.token, res.userId, res.nickname, avatarUrl ?? '')
      setTeams(res.teams)

      // 4. 根据球队数量路由
      if (res.teams.length === 0) {
        Taro.reLaunch({ url: '/pages/onboard/index' })
      } else if (res.teams.length === 1) {
        const t = res.teams[0]
        useAuthStore.getState().setCurrentTeam(t.teamId, t.role)
        Taro.reLaunch({ url: '/pages/home/index' })
      } else {
        Taro.reLaunch({ url: '/pages/team-select/index' })
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '登录失败，请重试'
      Taro.showToast({ title: msg, icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                   justifyContent: 'center', height: '100vh', background: '#f5f5f5' }}>
      <Text style={{ fontSize: '48px', marginBottom: '16px' }}>⚽</Text>
      <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#333',
                     marginBottom: '8px' }}>足球队管理</Text>
      <Text style={{ fontSize: '14px', color: '#999', marginBottom: '60px' }}>
        管理你的球队，记录每一场比赛
      </Text>
      <Button
        style={{ background: '#4CAF50', color: '#fff', borderRadius: '24px',
                 padding: '12px 48px', fontSize: '16px', border: 'none' }}
        loading={loading}
        onClick={handleLogin}
      >
        微信一键登录
      </Button>
    </View>
  )
}
```

```typescript
// src/pages/login/index.config.ts
export default definePageConfig({
  navigationBarTitleText: '登录',
  navigationBarBackgroundColor: '#4CAF50',
  navigationBarTextStyle: 'white',
})
```

- [ ] **Step 2: 写球队选择页 `src/pages/team-select/index.tsx`**

```tsx
// src/pages/team-select/index.tsx
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/auth'

export default function TeamSelectPage() {
  const { teams, setCurrentTeam } = useAuthStore()

  const select = (teamId: number, role: import('../../types/api').MemberRole) => {
    setCurrentTeam(teamId, role)
    Taro.reLaunch({ url: '/pages/home/index' })
  }

  return (
    <View style={{ padding: '16px' }}>
      <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px',
                     display: 'block' }}>选择球队</Text>
      {teams.map(t => (
        <View
          key={t.teamId}
          onClick={() => select(t.teamId, t.role)}
          style={{ background: '#fff', borderRadius: '8px', padding: '16px',
                   marginBottom: '12px', display: 'flex', alignItems: 'center',
                   boxShadow: '0 1px 4px rgba(0,0,0,.1)' }}
        >
          <Text style={{ fontSize: '32px', marginRight: '12px' }}>⚽</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', display: 'block' }}>
              {t.teamName}
            </Text>
            <Text style={{ fontSize: '12px', color: '#999' }}>
              {t.role === 'CAPTAIN' ? '队长' : t.role === 'ADMIN' ? '管理员' : '队员'}
            </Text>
          </View>
          <Text style={{ color: '#ccc' }}>›</Text>
        </View>
      ))}
      <View
        onClick={() => Taro.navigateTo({ url: '/pages/onboard/index' })}
        style={{ textAlign: 'center', padding: '16px', color: '#4CAF50', fontSize: '14px' }}
      >
        + 加入或创建新球队
      </View>
    </View>
  )
}
```

```typescript
// src/pages/team-select/index.config.ts
export default definePageConfig({ navigationBarTitleText: '选择球队' })
```

- [ ] **Step 3: 写引导页 `src/pages/onboard/index.tsx`**

```tsx
// src/pages/onboard/index.tsx
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'

export default function OnboardPage() {
  return (
    <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                   justifyContent: 'center', height: '100vh', padding: '32px' }}>
      <Text style={{ fontSize: '48px', marginBottom: '24px' }}>⚽</Text>
      <Text style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
        欢迎加入足球队
      </Text>
      <Text style={{ fontSize: '14px', color: '#999', marginBottom: '48px',
                     textAlign: 'center' }}>
        你还没有加入任何球队，创建新球队或通过邀请码加入
      </Text>
      <Button
        style={{ background: '#4CAF50', color: '#fff', borderRadius: '8px',
                 width: '100%', marginBottom: '12px', border: 'none' }}
        onClick={() => Taro.navigateTo({ url: '/pages/create-team/index' })}
      >
        创建球队
      </Button>
      <Button
        style={{ background: '#fff', color: '#4CAF50', border: '1px solid #4CAF50',
                 borderRadius: '8px', width: '100%' }}
        onClick={() => Taro.navigateTo({ url: '/pages/join-team/index' })}
      >
        输入邀请码加入
      </Button>
    </View>
  )
}
```

```typescript
// src/pages/onboard/index.config.ts
export default definePageConfig({ navigationBarTitleText: '开始使用' })
```

- [ ] **Step 4: 写创建球队页 `src/pages/create-team/index.tsx`**

```tsx
// src/pages/create-team/index.tsx
import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'

export default function CreateTeamPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入球队名称', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const team = await teamApi.create(name.trim(), description.trim() || undefined)
      useAuthStore.getState().setCurrentTeam(team.id, 'CAPTAIN')
      Taro.showToast({ title: '创建成功', icon: 'success' })
      setTimeout(() => Taro.reLaunch({ url: '/pages/home/index' }), 1000)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '创建失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ padding: '16px' }}>
      <Text style={{ fontSize: '14px', color: '#666', marginBottom: '8px',
                     display: 'block' }}>球队名称 *</Text>
      <Input
        value={name}
        onInput={e => setName(e.detail.value)}
        placeholder='例如：胜利FC'
        style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px',
                 marginBottom: '16px', fontSize: '16px' }}
      />
      <Text style={{ fontSize: '14px', color: '#666', marginBottom: '8px',
                     display: 'block' }}>球队简介</Text>
      <Input
        value={description}
        onInput={e => setDescription(e.detail.value)}
        placeholder='可选，描述你的球队'
        style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px',
                 marginBottom: '32px', fontSize: '16px' }}
      />
      <Button
        style={{ background: '#4CAF50', color: '#fff', borderRadius: '8px',
                 border: 'none', fontSize: '16px' }}
        loading={loading}
        onClick={submit}
      >
        创建球队
      </Button>
    </View>
  )
}
```

```typescript
// src/pages/create-team/index.config.ts
export default definePageConfig({ navigationBarTitleText: '创建球队' })
```

- [ ] **Step 5: 写加入球队页 `src/pages/join-team/index.tsx`**

```tsx
// src/pages/join-team/index.tsx
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
```

```typescript
// src/pages/join-team/index.config.ts
export default definePageConfig({ navigationBarTitleText: '加入球队' })
```

- [ ] **Step 6: 验证编译**

```bash
cd /Users/caoyajun/football-team/frontend
npm run build:weapp 2>&1 | tail -5
# 预期：Build completed successfully
```

- [ ] **Step 7: Commit**

```bash
cd /Users/caoyajun/football-team
git add frontend/
git commit -m "feat: login flow, team select, onboard, create/join team pages"
```

---

## Task 4: App 入口与自定义 Tab Bar

**Files:**
- Modify: `frontend/src/app.tsx`
- Create: `frontend/src/custom-tab-bar/index.tsx`
- Create: `frontend/src/custom-tab-bar/index.scss`

- [ ] **Step 1: 写 `src/app.tsx`**

```tsx
// src/app.tsx
import { useEffect } from 'react'
import { PropsWithChildren } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { useAuthStore } from './store/auth'
import './app.scss'

function App({ children }: PropsWithChildren) {
  const { token, currentTeamId } = useAuthStore()

  useEffect(() => {
    if (!token) {
      Taro.reLaunch({ url: '/pages/login/index' })
    }
  }, [])

  return <>{children}</>
}

export default App
```

- [ ] **Step 2: 写 `src/custom-tab-bar/index.tsx`**

这是 WeChat Mini Program 的自定义 Tab Bar 组件，必须用 Class 组件（Mini Program 原生约束）：

```tsx
// src/custom-tab-bar/index.tsx
import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../store/auth'
import './index.scss'

interface TabItem {
  path: string
  text: string
  icon: string
}

const CAPTAIN_ADMIN_TABS: TabItem[] = [
  { path: '/pages/home/index',    text: '首页', icon: '🏠' },
  { path: '/pages/members/index', text: '队员', icon: '👥' },
  { path: '/pages/finance/index', text: '财务', icon: '💰' },
  { path: '/pages/my/index',      text: '我的', icon: '👤' },
]

const PLAYER_TABS: TabItem[] = [
  { path: '/pages/home/index',    text: '活动', icon: '📅' },
  { path: '/pages/members/index', text: '球队', icon: '⚽' },
  { path: '/pages/my/index',      text: '我的', icon: '👤' },
]

export default class CustomTabBar extends Component {
  getTabs(): TabItem[] {
    const role = useAuthStore.getState().currentRole
    return role === 'CAPTAIN' || role === 'ADMIN' ? CAPTAIN_ADMIN_TABS : PLAYER_TABS
  }

  getCurrentIndex(tabs: TabItem[]): number {
    const pages = Taro.getCurrentPages()
    if (!pages.length) return 0
    const route = '/' + pages[pages.length - 1].route
    return Math.max(0, tabs.findIndex(t => t.path === route))
  }

  switchTab(path: string) {
    Taro.switchTab({ url: path })
  }

  render() {
    const tabs = this.getTabs()
    const selected = this.getCurrentIndex(tabs)

    return (
      <View className='tab-bar'>
        {tabs.map((tab, i) => (
          <View
            key={tab.path}
            className={`tab-item ${i === selected ? 'active' : ''}`}
            onClick={() => this.switchTab(tab.path)}
          >
            <Text className='tab-icon'>{tab.icon}</Text>
            <Text className='tab-text'>{tab.text}</Text>
          </View>
        ))}
      </View>
    )
  }
}
```

- [ ] **Step 3: 写 `src/custom-tab-bar/index.scss`**

```scss
// src/custom-tab-bar/index.scss
.tab-bar {
  display: flex;
  height: 50px;
  border-top: 1px solid #e0e0e0;
  background: #fff;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  .tab-icon {
    font-size: 22px;
    line-height: 1.2;
  }

  .tab-text {
    font-size: 10px;
    color: #999;
    margin-top: 2px;
  }

  &.active .tab-text {
    color: #4CAF50;
  }
}
```

- [ ] **Step 4: 更新 `src/app.scss`**

```scss
// src/app.scss
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  background: #f5f5f5;
}
```

- [ ] **Step 5: 验证编译**

```bash
cd /Users/caoyajun/football-team/frontend
npm run build:weapp 2>&1 | tail -5
# 预期：Build completed successfully
```

- [ ] **Step 6: Commit**

```bash
cd /Users/caoyajun/football-team
git add frontend/
git commit -m "feat: app shell, custom tab bar with 3/4 tabs based on role"
```

---

## Task 5: 首页（活动列表）与活动详情

**Files:**
- Create: `frontend/src/pages/home/index.tsx`
- Create: `frontend/src/pages/home/index.config.ts`
- Create: `frontend/src/pages/activity-detail/index.tsx`
- Create: `frontend/src/pages/activity-detail/index.config.ts`

- [ ] **Step 1: 写活动列表页 `src/pages/home/index.tsx`**

```tsx
// src/pages/home/index.tsx
import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'
import type { ActivityRes } from '../../types/api'

function statusLabel(a: ActivityRes): string {
  if (a.status === 'CLOSED' || a.status === 'FINISHED') return a.status === 'FINISHED' ? '已结束' : '已截止'
  if (a.deadline && new Date(a.deadline) < new Date()) return '已截止'
  return '报名中'
}

function ActivityCard({ a, onPress }: { a: ActivityRes; onPress: () => void }) {
  const label = statusLabel(a)
  const labelColor = label === '报名中' ? '#4CAF50' : '#999'

  return (
    <View
      onClick={onPress}
      style={{ background: '#fff', borderRadius: '8px', padding: '16px',
               marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}
    >
      <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <Text style={{ fontWeight: 'bold', fontSize: '16px' }}>{a.title}</Text>
        <Text style={{ fontSize: '12px', color: labelColor }}>{label}</Text>
      </View>
      <Text style={{ fontSize: '13px', color: '#666', display: 'block' }}>
        📍 {a.location}
      </Text>
      <Text style={{ fontSize: '13px', color: '#666', display: 'block', marginTop: '4px' }}>
        🕐 {new Date(a.startTime).toLocaleString('zh-CN', {
          month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })}
      </Text>
      <View style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <Text style={{ fontSize: '12px', color: '#999' }}>
          已报名 {a.registeredCount}{a.maxPlayers ? `/${a.maxPlayers}` : ''} 人
        </Text>
        {a.iJoined && (
          <Text style={{ fontSize: '12px', color: '#4CAF50' }}>✓ 已报名</Text>
        )}
      </View>
    </View>
  )
}

export default function HomePage() {
  const [activities, setActivities] = useState<ActivityRes[]>([])
  const [loading, setLoading] = useState(false)
  const { currentTeamId, isCaptainOrAdmin } = useAuthStore()

  const load = async () => {
    if (!currentTeamId) return
    setLoading(true)
    try {
      const data = await activityApi.list(currentTeamId)
      setActivities(data)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useDidShow(load)

  return (
    <View style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                     padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>活动</Text>
        {isCaptainOrAdmin() && (
          <Text
            style={{ fontSize: '14px', color: '#4CAF50' }}
            onClick={() => Taro.navigateTo({ url: '/pages/activity-create/index' })}
          >
            + 发布活动
          </Text>
        )}
      </View>
      <ScrollView scrollY style={{ flex: 1, padding: '12px 16px' }}>
        {loading ? (
          <Text style={{ textAlign: 'center', color: '#999', padding: '32px' }}>加载中...</Text>
        ) : activities.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#999', padding: '32px',
                         display: 'block' }}>暂无活动</Text>
        ) : (
          activities.map(a => (
            <ActivityCard
              key={a.id}
              a={a}
              onPress={() => Taro.navigateTo({ url: `/pages/activity-detail/index?id=${a.id}` })}
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}
```

```typescript
// src/pages/home/index.config.ts
export default definePageConfig({ navigationBarTitleText: '活动' })
```

- [ ] **Step 2: 写活动详情页 `src/pages/activity-detail/index.tsx`**

```tsx
// src/pages/activity-detail/index.tsx
import { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'
import type { ActivityDetailRes } from '../../types/api'

export default function ActivityDetailPage() {
  const [detail, setDetail] = useState<ActivityDetailRes | null>(null)
  const { isCaptainOrAdmin } = useAuthStore()

  const activityId = Number(Taro.getCurrentInstance().router?.params?.id)

  useEffect(() => {
    if (!activityId) return
    activityApi.detail(activityId)
      .then(setDetail)
      .catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
  }, [activityId])

  if (!detail) {
    return <View style={{ padding: '32px', textAlign: 'center' }}>
      <Text style={{ color: '#999' }}>加载中...</Text>
    </View>
  }

  const a = detail.activity
  const isOpen = a.status === 'OPEN' && !(a.deadline && new Date(a.deadline) < new Date())

  const handleRegister = async () => {
    try {
      if (a.iJoined) {
        await activityApi.cancelRegister(activityId)
        Taro.showToast({ title: '已取消报名', icon: 'success' })
      } else {
        await activityApi.register(activityId)
        Taro.showToast({ title: '报名成功', icon: 'success' })
      }
      const updated = await activityApi.detail(activityId)
      setDetail(updated)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
    }
  }

  const handleClose = async () => {
    try {
      await activityApi.close(activityId)
      Taro.showToast({ title: '已关闭报名', icon: 'success' })
      const updated = await activityApi.detail(activityId)
      setDetail(updated)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
    }
  }

  return (
    <ScrollView scrollY style={{ height: '100vh' }}>
      <View style={{ padding: '16px' }}>
        {/* 基本信息 */}
        <View style={{ background: '#fff', borderRadius: '8px', padding: '16px',
                       marginBottom: '12px' }}>
          <Text style={{ fontSize: '20px', fontWeight: 'bold', display: 'block',
                         marginBottom: '12px' }}>{a.title}</Text>
          {a.opponent && (
            <Text style={{ fontSize: '14px', color: '#666', display: 'block',
                           marginBottom: '6px' }}>⚽ 对阵：{a.opponent}</Text>
          )}
          <Text style={{ fontSize: '14px', color: '#666', display: 'block',
                         marginBottom: '6px' }}>📍 地点：{a.location}</Text>
          <Text style={{ fontSize: '14px', color: '#666', display: 'block',
                         marginBottom: '6px' }}>
            🕐 开始：{new Date(a.startTime).toLocaleString('zh-CN')}
          </Text>
          {a.deadline && (
            <Text style={{ fontSize: '14px', color: '#999', display: 'block' }}>
              ⏰ 截止：{new Date(a.deadline).toLocaleString('zh-CN')}
            </Text>
          )}
        </View>

        {/* 比赛结果 */}
        {detail.result && (
          <View style={{ background: '#fff', borderRadius: '8px', padding: '16px',
                         marginBottom: '12px', textAlign: 'center' }}>
            <Text style={{ fontSize: '14px', color: '#666', display: 'block',
                           marginBottom: '8px' }}>比赛结果</Text>
            <Text style={{ fontSize: '36px', fontWeight: 'bold' }}>
              {detail.result.ourScore} : {detail.result.oppScore}
            </Text>
            <Text style={{ fontSize: '16px', color:
              detail.result.outcome === 'WIN' ? '#4CAF50' :
              detail.result.outcome === 'LOSE' ? '#f44336' : '#FF9800',
              display: 'block', marginTop: '4px' }}>
              {detail.result.outcome === 'WIN' ? '胜利' :
               detail.result.outcome === 'LOSE' ? '负' : '平局'}
            </Text>
          </View>
        )}

        {/* 报名名单 */}
        <View style={{ background: '#fff', borderRadius: '8px', padding: '16px',
                       marginBottom: '12px' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>
            报名名单（{a.registeredCount}{a.maxPlayers ? `/${a.maxPlayers}` : ''}人）
          </Text>
          {detail.registrations.map(r => (
            <View key={r.userId} style={{ display: 'flex', alignItems: 'center',
                                          marginBottom: '8px' }}>
              <Text style={{ fontSize: '24px', marginRight: '8px' }}>👤</Text>
              <Text style={{ fontSize: '14px' }}>{r.nickname}</Text>
            </View>
          ))}
          {detail.registrations.length === 0 && (
            <Text style={{ color: '#999', fontSize: '14px' }}>暂无人报名</Text>
          )}
        </View>

        {/* 操作按钮 */}
        {isOpen && (
          <Button
            style={{ background: a.iJoined ? '#fff' : '#4CAF50',
                     color: a.iJoined ? '#f44336' : '#fff',
                     border: a.iJoined ? '1px solid #f44336' : 'none',
                     borderRadius: '8px', fontSize: '16px' }}
            onClick={handleRegister}
          >
            {a.iJoined ? '取消报名' : '我要参加'}
          </Button>
        )}
        {isCaptainOrAdmin() && isOpen && (
          <Button
            style={{ background: '#fff', color: '#999', border: '1px solid #e0e0e0',
                     borderRadius: '8px', marginTop: '8px', fontSize: '14px' }}
            onClick={handleClose}
          >
            关闭报名
          </Button>
        )}
        {isCaptainOrAdmin() && a.type === 'MATCH' && a.status !== 'OPEN' && !detail.result && (
          <Button
            style={{ background: '#FF9800', color: '#fff', border: 'none',
                     borderRadius: '8px', marginTop: '8px', fontSize: '14px' }}
            onClick={() => Taro.navigateTo({
              url: `/pages/activity-create/index?resultFor=${activityId}`
            })}
          >
            录入比分
          </Button>
        )}
      </View>
    </ScrollView>
  )
}
```

```typescript
// src/pages/activity-detail/index.config.ts
export default definePageConfig({ navigationBarTitleText: '活动详情' })
```

- [ ] **Step 3: 验证编译**

```bash
npm run build:weapp 2>&1 | tail -5
# 预期：Build completed successfully
```

- [ ] **Step 4: Commit**

```bash
cd /Users/caoyajun/football-team
git add frontend/
git commit -m "feat: home activity list, activity detail with register/cancel"
```

---

## Task 6: 发布活动与录入比分

**Files:**
- Create: `frontend/src/pages/activity-create/index.tsx`
- Create: `frontend/src/pages/activity-create/index.config.ts`

- [ ] **Step 1: 写 `src/pages/activity-create/index.tsx`**

此页面兼顾两个功能：通过 URL param `resultFor` 区分"发布活动"和"录入比分"。

```tsx
// src/pages/activity-create/index.tsx
import { useState } from 'react'
import { View, Text, Input, Button, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'

export default function ActivityCreatePage() {
  const params = Taro.getCurrentInstance().router?.params ?? {}
  const resultFor = params.resultFor ? Number(params.resultFor) : null

  // 发布活动状态
  const [type, setType] = useState<'MATCH' | 'TRAINING'>('MATCH')
  const [title, setTitle] = useState('')
  const [opponent, setOpponent] = useState('')
  const [location, setLocation] = useState('')
  const [startTime, setStartTime] = useState('')
  const [deadline, setDeadline] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')

  // 录入比分状态
  const [ourScore, setOurScore] = useState('')
  const [oppScore, setOppScore] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const { currentTeamId } = useAuthStore()

  const submitActivity = async () => {
    if (!title.trim() || !location.trim() || !startTime) {
      Taro.showToast({ title: '请填写必填项', icon: 'none' })
      return
    }
    if (!currentTeamId) return
    setLoading(true)
    try {
      await activityApi.create(currentTeamId, {
        type, title: title.trim(), location: location.trim(),
        startTime: new Date(startTime).toISOString(),
        opponent: opponent.trim() || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        maxPlayers: maxPlayers ? Number(maxPlayers) : undefined,
      })
      Taro.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '发布失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const submitResult = async () => {
    if (!ourScore || !oppScore) {
      Taro.showToast({ title: '请输入比分', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      await activityApi.recordResult(resultFor!, Number(ourScore), Number(oppScore),
                                     notes.trim() || undefined)
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
        <Text style={{ fontSize: '14px', color: '#666', marginBottom: '8px',
                       display: 'block' }}>我方比分 *</Text>
        <Input value={ourScore} onInput={e => setOurScore(e.detail.value)}
               type='number' placeholder='0'
               style={inputStyle} />
        <Text style={{ fontSize: '14px', color: '#666', marginBottom: '8px',
                       display: 'block' }}>对方比分 *</Text>
        <Input value={oppScore} onInput={e => setOppScore(e.detail.value)}
               type='number' placeholder='0'
               style={inputStyle} />
        <Text style={{ fontSize: '14px', color: '#666', marginBottom: '8px',
                       display: 'block' }}>备注</Text>
        <Input value={notes} onInput={e => setNotes(e.detail.value)}
               placeholder='可选'
               style={{ ...inputStyle, marginBottom: '32px' }} />
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
            style={{ flex: 1, textAlign: 'center', padding: '10px',
                     border: `1px solid ${type === t ? '#4CAF50' : '#e0e0e0'}`,
                     borderRadius: '8px', color: type === t ? '#4CAF50' : '#666' }}
          >
            <Text>{t === 'MATCH' ? '⚽ 比赛' : '🏃 训练'}</Text>
          </View>
        ))}
      </View>

      <Text style={labelStyle}>标题 *</Text>
      <Input value={title} onInput={e => setTitle(e.detail.value)}
             placeholder='例如：周六联赛 vs 红星队' style={inputStyle} />

      {type === 'MATCH' && <>
        <Text style={labelStyle}>对手</Text>
        <Input value={opponent} onInput={e => setOpponent(e.detail.value)}
               placeholder='对手球队名称' style={inputStyle} />
      </>}

      <Text style={labelStyle}>地点 *</Text>
      <Input value={location} onInput={e => setLocation(e.detail.value)}
             placeholder='比赛/训练场地' style={inputStyle} />

      <Text style={labelStyle}>开始时间 *</Text>
      <Input value={startTime} onInput={e => setStartTime(e.detail.value)}
             placeholder='2026-06-01 09:00' style={inputStyle} />

      <Text style={labelStyle}>报名截止时间</Text>
      <Input value={deadline} onInput={e => setDeadline(e.detail.value)}
             placeholder='可选，例如 2026-05-31 23:59' style={inputStyle} />

      <Text style={labelStyle}>最大报名人数</Text>
      <Input value={maxPlayers} onInput={e => setMaxPlayers(e.detail.value)}
             type='number' placeholder='可选，不填表示不限'
             style={{ ...inputStyle, marginBottom: '32px' }} />

      <Button style={btnStyle} loading={loading} onClick={submitActivity}>
        发布活动
      </Button>
    </View>
  )
}

const labelStyle = { fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }
const inputStyle = {
  border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px',
  marginBottom: '16px', fontSize: '15px', background: '#fafafa'
}
const btnStyle = {
  background: '#4CAF50', color: '#fff', borderRadius: '8px',
  border: 'none', fontSize: '16px'
}
```

```typescript
// src/pages/activity-create/index.config.ts
export default definePageConfig({ navigationBarTitleText: '发布活动' })
```

- [ ] **Step 2: 验证编译**

```bash
npm run build:weapp 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd /Users/caoyajun/football-team
git add frontend/
git commit -m "feat: create activity form, record match result"
```

---

## Task 7: 队员管理页

**Files:**
- Create: `frontend/src/pages/members/index.tsx`
- Create: `frontend/src/pages/members/index.config.ts`

- [ ] **Step 1: 写 `src/pages/members/index.tsx`**

```tsx
// src/pages/members/index.tsx
import { useState } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
import type { MemberRes } from '../../types/api'

function roleLabel(role: string) {
  return role === 'CAPTAIN' ? '队长' : role === 'ADMIN' ? '管理员' : '队员'
}

function roleColor(role: string) {
  return role === 'CAPTAIN' ? '#FF9800' : role === 'ADMIN' ? '#2196F3' : '#666'
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRes[]>([])
  const [tab, setTab] = useState<'active' | 'pending'>('active')
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

  const removeMember = async (targetUserId: number) => {
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

  const setAdmin = async (targetUserId: number, currentRole: string) => {
    if (!currentTeamId) return
    const newRole = currentRole === 'ADMIN' ? 'PLAYER' : 'ADMIN'
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
      {/* Tab 切换 */}
      <View style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        {[{ key: 'active', label: `活跃 (${active.length})` },
          { key: 'pending', label: `待审批 (${pending.length})` }
        ].map(t => (
          <View
            key={t.key}
            onClick={() => setTab(t.key as 'active' | 'pending')}
            style={{ flex: 1, textAlign: 'center', padding: '12px',
                     color: tab === t.key ? '#4CAF50' : '#666',
                     borderBottom: tab === t.key ? '2px solid #4CAF50' : '2px solid transparent',
                     fontSize: '14px' }}
          >
            <Text>{t.label}</Text>
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
            <Text style={{ fontSize: '32px', marginRight: '12px' }}>👤</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: '15px', fontWeight: 'bold', display: 'block' }}>
                {m.nickname}
              </Text>
              <Text style={{ fontSize: '12px', color: roleColor(m.role) }}>
                {roleLabel(m.role)}
              </Text>
            </View>

            {/* 待审批操作 */}
            {tab === 'pending' && isCaptainOrAdmin() && (
              <View style={{ display: 'flex', gap: '8px' }}>
                <Button
                  size='mini'
                  style={{ background: '#4CAF50', color: '#fff', border: 'none',
                           borderRadius: '4px', fontSize: '12px' }}
                  onClick={() => reviewApply(m.memberId, true)}
                >通过</Button>
                <Button
                  size='mini'
                  style={{ background: '#f5f5f5', color: '#999', border: 'none',
                           borderRadius: '4px', fontSize: '12px' }}
                  onClick={() => reviewApply(m.memberId, false)}
                >拒绝</Button>
              </View>
            )}

            {/* 活跃成员操作（仅队长） */}
            {tab === 'active' && currentRole === 'CAPTAIN' && m.userId !== userId &&
              m.role !== 'CAPTAIN' && (
              <View style={{ display: 'flex', gap: '6px' }}>
                <Button
                  size='mini'
                  style={{ background: '#E3F2FD', color: '#1565C0', border: 'none',
                           borderRadius: '4px', fontSize: '11px' }}
                  onClick={() => setAdmin(m.userId, m.role)}
                >
                  {m.role === 'ADMIN' ? '取消管理' : '设为管理'}
                </Button>
                <Button
                  size='mini'
                  style={{ background: '#FFEBEE', color: '#C62828', border: 'none',
                           borderRadius: '4px', fontSize: '11px' }}
                  onClick={() => removeMember(m.userId)}
                >移除</Button>
              </View>
            )}
          </View>
        ))}
        {list.length === 0 && (
          <Text style={{ textAlign: 'center', color: '#999', display: 'block', padding: '32px' }}>
            {tab === 'pending' ? '暂无待审批申请' : '暂无成员'}
          </Text>
        )}
      </ScrollView>
    </View>
  )
}
```

```typescript
// src/pages/members/index.config.ts
export default definePageConfig({ navigationBarTitleText: '队员' })
```

- [ ] **Step 2: 验证编译**

```bash
npm run build:weapp 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd /Users/caoyajun/football-team
git add frontend/
git commit -m "feat: members page with review, role management, remove member"
```

---

## Task 8: 财务管理页

**Files:**
- Create: `frontend/src/pages/finance/index.tsx`
- Create: `frontend/src/pages/finance/index.config.ts`
- Create: `frontend/src/pages/finance-record/index.tsx`
- Create: `frontend/src/pages/finance-record/index.config.ts`
- Create: `frontend/src/pages/member-fee/index.tsx`
- Create: `frontend/src/pages/member-fee/index.config.ts`

- [ ] **Step 1: 写财务汇总页 `src/pages/finance/index.tsx`**

```tsx
// src/pages/finance/index.tsx
import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { financeApi } from '../../api/finance'
import { useAuthStore } from '../../store/auth'
import type { FinanceSummaryRes } from '../../types/api'

export default function FinancePage() {
  const [summary, setSummary] = useState<FinanceSummaryRes | null>(null)
  const { currentTeamId } = useAuthStore()

  const load = async () => {
    if (!currentTeamId) return
    try {
      const data = await financeApi.summary(currentTeamId)
      setSummary(data)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
    }
  }

  useDidShow(load)

  return (
    <View style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部操作栏 */}
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                     padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>财务</Text>
        <View style={{ display: 'flex', gap: '12px' }}>
          <Text style={{ color: '#4CAF50', fontSize: '14px' }}
                onClick={() => Taro.navigateTo({ url: '/pages/finance-record/index' })}>
            + 记录收支
          </Text>
          <Text style={{ color: '#2196F3', fontSize: '14px' }}
                onClick={() => Taro.navigateTo({ url: '/pages/member-fee/index' })}>
            队费
          </Text>
        </View>
      </View>

      <ScrollView scrollY style={{ flex: 1 }}>
        {/* 汇总卡片 */}
        {summary && (
          <View style={{ background: '#4CAF50', padding: '20px 16px', margin: '12px 16px',
                         borderRadius: '12px', color: '#fff' }}>
            <Text style={{ fontSize: '14px', opacity: 0.8, display: 'block',
                           marginBottom: '8px' }}>结余</Text>
            <Text style={{ fontSize: '32px', fontWeight: 'bold', display: 'block',
                           marginBottom: '16px' }}>¥{summary.balance.toFixed(2)}</Text>
            <View style={{ display: 'flex' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: '12px', opacity: 0.7, display: 'block' }}>总收入</Text>
                <Text style={{ fontSize: '16px' }}>¥{summary.totalIncome.toFixed(2)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: '12px', opacity: 0.7, display: 'block' }}>总支出</Text>
                <Text style={{ fontSize: '16px' }}>¥{summary.totalExpense.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 流水列表 */}
        <View style={{ padding: '0 16px 16px' }}>
          <Text style={{ fontSize: '15px', fontWeight: 'bold', display: 'block',
                         marginBottom: '8px' }}>收支记录</Text>
          {summary?.records.map(r => (
            <View key={r.id}
                  style={{ background: '#fff', borderRadius: '8px', padding: '12px 16px',
                           marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: '14px', display: 'block' }}>{r.category}</Text>
                <Text style={{ fontSize: '12px', color: '#999' }}>
                  {r.recordDate} {r.description && `· ${r.description}`}
                </Text>
              </View>
              <Text style={{ fontSize: '16px', fontWeight: 'bold',
                             color: r.type === 'INCOME' ? '#4CAF50' : '#f44336' }}>
                {r.type === 'INCOME' ? '+' : '-'}¥{r.amount.toFixed(2)}
              </Text>
            </View>
          ))}
          {!summary?.records.length && (
            <Text style={{ textAlign: 'center', color: '#999', display: 'block',
                           padding: '32px' }}>暂无收支记录</Text>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
```

```typescript
// src/pages/finance/index.config.ts
export default definePageConfig({ navigationBarTitleText: '财务' })
```

- [ ] **Step 2: 写新增收支页 `src/pages/finance-record/index.tsx`**

```tsx
// src/pages/finance-record/index.tsx
import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { financeApi } from '../../api/finance'
import { useAuthStore } from '../../store/auth'

const CATEGORIES = ['队费', '场地费', '装备费', '奖金', '其他']

export default function FinanceRecordPage() {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('队费')
  const [description, setDescription] = useState('')
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const { currentTeamId, userId } = useAuthStore()

  const submit = async () => {
    if (!amount || isNaN(Number(amount))) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    if (!currentTeamId || !userId) return
    setLoading(true)
    try {
      await financeApi.createRecord(currentTeamId, {
        type, amount: Number(amount), category, recordDate,
        description: description.trim() || undefined,
      })
      Taro.showToast({ title: '记录成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '提交失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ padding: '16px' }}>
      {/* 收入/支出切换 */}
      <View style={{ display: 'flex', marginBottom: '16px', gap: '8px' }}>
        {(['INCOME', 'EXPENSE'] as const).map(t => (
          <View
            key={t}
            onClick={() => setType(t)}
            style={{ flex: 1, textAlign: 'center', padding: '10px',
                     borderRadius: '8px', fontSize: '14px',
                     background: type === t ? (t === 'INCOME' ? '#4CAF50' : '#f44336') : '#f5f5f5',
                     color: type === t ? '#fff' : '#666' }}
          >
            <Text>{t === 'INCOME' ? '+ 收入' : '- 支出'}</Text>
          </View>
        ))}
      </View>

      <Text style={labelStyle}>金额 *</Text>
      <Input value={amount} onInput={e => setAmount(e.detail.value)}
             type='digit' placeholder='0.00'
             style={{ ...inputStyle, fontSize: '20px', textAlign: 'center' }} />

      <Text style={labelStyle}>分类 *</Text>
      <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {CATEGORIES.map(c => (
          <View
            key={c}
            onClick={() => setCategory(c)}
            style={{ padding: '6px 12px', borderRadius: '16px', fontSize: '13px',
                     border: `1px solid ${category === c ? '#4CAF50' : '#e0e0e0'}`,
                     color: category === c ? '#4CAF50' : '#666',
                     background: category === c ? '#E8F5E9' : '#fff' }}
          >
            <Text>{c}</Text>
          </View>
        ))}
      </View>

      <Text style={labelStyle}>日期 *</Text>
      <Input value={recordDate} onInput={e => setRecordDate(e.detail.value)}
             placeholder='YYYY-MM-DD' style={inputStyle} />

      <Text style={labelStyle}>备注</Text>
      <Input value={description} onInput={e => setDescription(e.detail.value)}
             placeholder='可选'
             style={{ ...inputStyle, marginBottom: '32px' }} />

      <Button style={btnStyle} loading={loading} onClick={submit}>
        保存
      </Button>
    </View>
  )
}

const labelStyle = { fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }
const inputStyle = { border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px',
                     marginBottom: '16px', fontSize: '15px', background: '#fafafa' }
const btnStyle = { background: '#4CAF50', color: '#fff', borderRadius: '8px',
                   border: 'none', fontSize: '16px' }
```

```typescript
// src/pages/finance-record/index.config.ts
export default definePageConfig({ navigationBarTitleText: '新增收支' })
```

- [ ] **Step 3: 写队费状态页 `src/pages/member-fee/index.tsx`**

```tsx
// src/pages/member-fee/index.tsx
import { useState, useEffect } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { financeApi } from '../../api/finance'
import { useAuthStore } from '../../store/auth'
import type { MemberFeeRes } from '../../types/api'

export default function MemberFeePage() {
  const currentYear = new Date().getFullYear()
  const [season, setSeason] = useState(currentYear)
  const [fees, setFees] = useState<MemberFeeRes[]>([])
  const [setFeeAmount, setSetFeeAmount] = useState('')
  const { currentTeamId, currentRole } = useAuthStore()

  const load = async () => {
    if (!currentTeamId) return
    try {
      const data = await financeApi.memberFees(currentTeamId, season)
      setFees(data)
    } catch {
      // 可能没有设置该赛季队费，静默处理
    }
  }

  useEffect(() => { load() }, [season])

  const handleSetFee = async () => {
    if (!setFeeAmount || isNaN(Number(setFeeAmount))) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    if (!currentTeamId) return
    try {
      await financeApi.setMemberFee(currentTeamId, season, Number(setFeeAmount))
      Taro.showToast({ title: '已设置', icon: 'success' })
      setSetFeeAmount('')
      load()
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '设置失败', icon: 'none' })
    }
  }

  const handleMarkFee = async (userId: number, amountDue: number) => {
    if (!currentTeamId) return
    try {
      await financeApi.markFee(currentTeamId, userId, season, amountDue)
      Taro.showToast({ title: '已标记为已付', icon: 'success' })
      load()
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
    }
  }

  return (
    <View style={{ padding: '16px' }}>
      {/* 赛季切换 */}
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                     gap: '16px', marginBottom: '16px' }}>
        <Text style={{ fontSize: '20px', color: '#4CAF50' }}
              onClick={() => setSeason(s => s - 1)}>‹</Text>
        <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>{season} 赛季</Text>
        <Text style={{ fontSize: '20px', color: '#4CAF50' }}
              onClick={() => setSeason(s => s + 1)}>›</Text>
      </View>

      {/* 设置队费（仅队长） */}
      {currentRole === 'CAPTAIN' && (
        <View style={{ background: '#fff', borderRadius: '8px', padding: '12px',
                       marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <Input
            value={setFeeAmount}
            onInput={e => setSetFeeAmount(e.detail.value)}
            type='digit'
            placeholder='设置本赛季每人应缴金额'
            style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: '6px',
                     padding: '8px', fontSize: '14px' }}
          />
          <Button
            size='mini'
            style={{ background: '#4CAF50', color: '#fff', border: 'none',
                     borderRadius: '6px', fontSize: '13px' }}
            onClick={handleSetFee}
          >
            设置
          </Button>
        </View>
      )}

      {/* 队费列表 */}
      {fees.map(f => (
        <View key={f.userId}
              style={{ background: '#fff', borderRadius: '8px', padding: '12px 16px',
                       marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
          <Text style={{ fontSize: '24px', marginRight: '12px' }}>👤</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
              {f.nickname}
            </Text>
            <Text style={{ fontSize: '12px', color: '#999' }}>
              已付 ¥{f.amountPaid} / 应缴 ¥{f.amountDue}
            </Text>
          </View>
          {f.isPaid ? (
            <Text style={{ color: '#4CAF50', fontSize: '13px' }}>✓ 已付</Text>
          ) : (
            <Button
              size='mini'
              style={{ background: '#E8F5E9', color: '#4CAF50', border: 'none',
                       borderRadius: '4px', fontSize: '12px' }}
              onClick={() => handleMarkFee(f.userId, f.amountDue)}
            >
              标记已付
            </Button>
          )}
        </View>
      ))}
      {fees.length === 0 && (
        <Text style={{ textAlign: 'center', color: '#999', display: 'block', padding: '32px' }}>
          本赛季暂无队费记录{currentRole === 'CAPTAIN' ? '，请先设置应缴金额' : ''}
        </Text>
      )}
    </View>
  )
}
```

```typescript
// src/pages/member-fee/index.config.ts
export default definePageConfig({ navigationBarTitleText: '队费管理' })
```

- [ ] **Step 4: 验证编译**

```bash
npm run build:weapp 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
cd /Users/caoyajun/football-team
git add frontend/
git commit -m "feat: finance summary, add record, member fee tracking pages"
```

---

## Task 9: 个人中心

**Files:**
- Create: `frontend/src/pages/my/index.tsx`
- Create: `frontend/src/pages/my/index.config.ts`

- [ ] **Step 1: 写 `src/pages/my/index.tsx`**

```tsx
// src/pages/my/index.tsx
import { useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { userApi } from '../../api/user'
import { useAuthStore } from '../../store/auth'
import type { MyStatsRes } from '../../types/api'

export default function MyPage() {
  const [stats, setStats] = useState<MyStatsRes | null>(null)
  const { nickname, avatarUrl, currentTeamId, currentRole, teams, setCurrentTeam, clear } = useAuthStore()

  const load = async () => {
    if (!currentTeamId) return
    try {
      const s = await userApi.stats(currentTeamId)
      setStats(s)
    } catch { /* 忽略统计加载失败 */ }
  }

  useDidShow(load)

  const switchTeam = (teamId: number, role: import('../../types/api').MemberRole) => {
    setCurrentTeam(teamId, role)
    Taro.reLaunch({ url: '/pages/home/index' })
  }

  const logout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
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
      Taro.showToast({ title: '队长请先转让队长身份', icon: 'none' })
      return
    }
    if (!currentTeamId) return
    Taro.showModal({
      title: '退出球队',
      content: '确定要退出当前球队吗？',
      success: async ({ confirm }) => {
        if (!confirm) return
        try {
          const { teamApi } = await import('../../api/team')
          await teamApi.leave(currentTeamId)
          Taro.showToast({ title: '已退出球队', icon: 'success' })
          clear()
          setTimeout(() => Taro.reLaunch({ url: '/pages/login/index' }), 1000)
        } catch (e: unknown) {
          Taro.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
        }
      }
    })
  }

  return (
    <View style={{ height: '100vh', overflow: 'auto' }}>
      {/* 个人信息 */}
      <View style={{ background: '#4CAF50', padding: '32px 16px 24px',
                     display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Text style={{ fontSize: '56px' }}>👤</Text>
        <View>
          <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', display: 'block' }}>
            {nickname ?? '球员'}
          </Text>
          <Text style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)' }}>
            {currentRole === 'CAPTAIN' ? '队长' :
             currentRole === 'ADMIN' ? '管理员' : '队员'}
          </Text>
        </View>
      </View>

      {/* 战绩统计 */}
      {stats && (
        <View style={{ background: '#fff', margin: '12px 16px', borderRadius: '8px',
                       padding: '16px' }}>
          <Text style={{ fontSize: '15px', fontWeight: 'bold', display: 'block',
                         marginBottom: '12px' }}>本队战绩</Text>
          <View style={{ display: 'flex', textAlign: 'center' }}>
            {[
              { label: '场数', value: stats.totalMatches },
              { label: '胜', value: stats.wins, color: '#4CAF50' },
              { label: '平', value: stats.draws, color: '#FF9800' },
              { label: '负', value: stats.losses, color: '#f44336' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1 }}>
                <Text style={{ fontSize: '24px', fontWeight: 'bold',
                               color: s.color ?? '#333', display: 'block' }}>
                  {s.value}
                </Text>
                <Text style={{ fontSize: '12px', color: '#999' }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 我的球队列表 */}
      <View style={{ background: '#fff', margin: '0 16px 12px', borderRadius: '8px',
                     padding: '16px' }}>
        <Text style={{ fontSize: '15px', fontWeight: 'bold', display: 'block',
                       marginBottom: '12px' }}>我的球队</Text>
        {teams.map(t => (
          <View
            key={t.teamId}
            onClick={() => switchTeam(t.teamId, t.role)}
            style={{ display: 'flex', alignItems: 'center', padding: '10px 0',
                     borderBottom: '1px solid #f5f5f5' }}
          >
            <Text style={{ fontSize: '24px', marginRight: '12px' }}>⚽</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: '14px', display: 'block' }}>{t.teamName}</Text>
              <Text style={{ fontSize: '12px', color: '#999' }}>
                {t.role === 'CAPTAIN' ? '队长' : t.role === 'ADMIN' ? '管理员' : '队员'}
              </Text>
            </View>
            {t.teamId === currentTeamId && (
              <Text style={{ fontSize: '12px', color: '#4CAF50' }}>当前</Text>
            )}
          </View>
        ))}
        <View
          onClick={() => Taro.navigateTo({ url: '/pages/onboard/index' })}
          style={{ textAlign: 'center', padding: '12px 0', color: '#4CAF50', fontSize: '14px' }}
        >
          + 加入或创建新球队
        </View>
      </View>

      {/* 操作按钮 */}
      <View style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Button
          style={{ background: '#fff', color: '#f44336', border: '1px solid #fecaca',
                   borderRadius: '8px', fontSize: '14px' }}
          onClick={leaveTeam}
        >
          退出当前球队
        </Button>
        <Button
          style={{ background: '#f5f5f5', color: '#999', border: 'none',
                   borderRadius: '8px', fontSize: '14px' }}
          onClick={logout}
        >
          退出登录
        </Button>
      </View>
    </View>
  )
}
```

```typescript
// src/pages/my/index.config.ts
export default definePageConfig({ navigationBarTitleText: '我的' })
```

- [ ] **Step 2: 最终全量编译验证**

```bash
cd /Users/caoyajun/football-team/frontend
npm run build:weapp 2>&1 | tail -10
# 预期：Build completed successfully，无 TypeScript 类型错误
```

- [ ] **Step 3: 运行单元测试**

```bash
npx jest --no-coverage 2>&1 | tail -10
# 预期：6 tests passed
```

- [ ] **Step 4: 在微信开发者工具中验证**

1. 打开微信开发者工具 → 导入项目 → 选择 `football-team/frontend/dist/weapp`
2. AppID 填你的小程序 AppID（开发测试可在 `project.config.json` 中填 `wx_dev_placeholder`，选"不校验合法域名"）
3. 验证以下流程：
   - 点击"微信一键登录" → 跳转到 onboard 或 home（取决于后端是否启动）
   - Tab Bar 正确显示 3 或 4 个标签（取决于角色）
   - 活动列表、队员列表、财务页均可渲染

- [ ] **Step 5: Commit**

```bash
cd /Users/caoyajun/football-team
git add frontend/
git commit -m "feat: my page with stats, team switch, logout; frontend complete"
```

---

## 开发运行说明

```bash
# 开发模式（实时编译 + 热重载）
cd frontend
npm run dev:weapp
# 在微信开发者工具中打开 frontend/dist/weapp

# 后端同时启动（另开终端）
cd backend
JWT_SECRET=dev-secret-at-least-32-characters!! \
WECHAT_APP_ID=dev_mock WECHAT_APP_SECRET=dev_mock \
mvn spring-boot:run
```

> 前端 API 地址在 `frontend/src/config.ts` 中，本地开发填 `http://localhost:8080`，部署后改为实际服务器地址。微信开发者工具需勾选"不校验合法域名"以跳过 HTTPS 要求。
