import { api } from './client'
import type { FinanceSummaryRes, FinanceRecord, MemberFeeRes } from '../types/api'

export const financeApi = {
  summary: (teamId: number, from?: string, to?: string) => {
    const params = from && to
      ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      : ''
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
    api.get<MemberFeeRes[]>(`/api/v1/finance/team/${teamId}/fees?season=${encodeURIComponent(String(season))}`),
}
