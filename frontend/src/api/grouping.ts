import { api } from './client'
import type { GroupingRes } from '../types/api'

export const groupingApi = {
  getGrouping: (activityId: number) =>
    api.get<GroupingRes>(`/api/v1/activities/${activityId}/grouping`),

  saveGrouping: (activityId: number, body: {
    groupCount: number
    groups: Array<{ index: number; name: string; memberIds: number[] }>
  }) => api.put<GroupingRes>(`/api/v1/activities/${activityId}/grouping`, body as Record<string, unknown>),

  randomGrouping: (activityId: number, body: {
    groupCount: number
    groupNames: string[]
  }) => api.post<GroupingRes>(`/api/v1/activities/${activityId}/grouping/random`, body as Record<string, unknown>),
}
