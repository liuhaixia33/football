import { api } from './client'
import type { UserProfileRes, MyStatsRes } from '../types/api'

export const userApi = {
  me: () => api.get<UserProfileRes>('/api/v1/users/me', false),
  stats: (teamId: number) =>
    api.get<MyStatsRes>(`/api/v1/users/me/stats?teamId=${teamId}`, false),
  updateProfile: (body: { nickname?: string; avatarUrl?: string }) =>
    api.put<void>('/api/v1/users/me', body as Record<string, unknown>, false),
}
