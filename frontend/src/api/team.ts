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
  getTeam: (teamId: number) =>
    api.get<Team>(`/api/v1/teams/${teamId}`),
  updateTeam: (teamId: number, body: { name?: string; description?: string; logoUrl?: string }) =>
    api.put<Team>(`/api/v1/teams/${teamId}`, body as Record<string, unknown>),
  getByInviteCode: (inviteCode: string) =>
    api.get<Team>(`/api/v1/teams/by-invite/${inviteCode}`),
  getPublicInfo: (teamId: number) =>
    api.get<{ teamId: number; name: string; logoUrl: string; description: string; memberCount: number }>(
      `/api/v1/teams/${teamId}/public`,
      false
    ),
  applyByTeamId: (teamId: number) =>
    api.post<void>(`/api/v1/teams/${teamId}/apply`, {}, false),
  getPoster: (teamId: number) =>
    api.get<{ posterUrl: string }>(`/api/v1/teams/${teamId}/poster`),
}
