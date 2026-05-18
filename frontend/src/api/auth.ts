import { api } from './client'
import type { LoginRes } from '../types/api'

export const authApi = {
  login: (code: string, nickname?: string, avatarUrl?: string) =>
    api.post<LoginRes>('/api/v1/auth/login', { code, nickname, avatarUrl }, false),
}
