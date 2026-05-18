// src/store/auth.ts — minimal stub, will be replaced in Task 2
import { create } from 'zustand'

interface AuthState {
  token: string | null
  currentTeamId: number | null
  clear: () => void
}

export const useAuthStore = create<AuthState>(() => ({
  token: null,
  currentTeamId: null,
  clear: () => {},
}))
