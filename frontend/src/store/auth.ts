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
  currentTeamInviteCode: () => string
  isGuest: () => boolean
}

const ROLE_ORDER: Record<MemberRole, number> = { CAPTAIN: 0, ADMIN: 1, PLAYER: 2 }

function load<T>(key: string): T | null {
  try {
    const v = Taro.getStorageSync(key)
    return (v !== '' && v != null) ? v as T : null
  } catch { return null }
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
    const keys = ['token', 'userId', 'currentTeamId', 'currentRole']
    keys.forEach(k => { try { Taro.removeStorageSync(k) } catch {} })
    set({ token: null, userId: null, currentTeamId: null, currentRole: null, teams: [] })
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

  currentTeamInviteCode: () => {
    const { teams, currentTeamId } = get()
    return teams.find(t => t.teamId === currentTeamId)?.inviteCode ?? ''
  },

  isGuest: () => !get().avatarUrl,
}))
