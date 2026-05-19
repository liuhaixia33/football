import { api } from './client'
import type { ActivityRes, ActivityDetailRes, RegStatus } from '../types/api'

export const activityApi = {
  list: (teamId: number) =>
    api.get<ActivityRes[]>(`/api/v1/activities/team/${teamId}`),
  detail: (activityId: number) =>
    api.get<ActivityDetailRes>(`/api/v1/activities/${activityId}`),
  create: (teamId: number, body: {
    type: string; title: string; location: string; startTime: string;
    opponent?: string; deadline?: string; maxPlayers?: number
  }) => api.post<ActivityRes>(`/api/v1/activities/team/${teamId}`, body as Record<string, unknown>),
  register: (activityId: number, status: RegStatus) =>
    api.post<void>(`/api/v1/activities/${activityId}/register`, { status }),
  cancelRegister: (activityId: number) =>
    api.delete<void>(`/api/v1/activities/${activityId}/register`),
  close: (activityId: number) =>
    api.put<void>(`/api/v1/activities/${activityId}/close`, undefined),
  recordResult: (activityId: number, ourScore: number, oppScore: number, notes?: string) =>
    api.put<void>(`/api/v1/activities/${activityId}/result`, { ourScore, oppScore, notes }),
  update: (activityId: number, body: {
    type: string; title: string; location: string; startTime: string;
    opponent?: string; deadline?: string; maxPlayers?: number
  }) => api.put<ActivityRes>(`/api/v1/activities/${activityId}`, body as Record<string, unknown>),
}
