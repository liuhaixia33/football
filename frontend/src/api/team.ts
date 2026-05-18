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
