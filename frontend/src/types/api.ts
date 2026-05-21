export type MemberRole = 'CAPTAIN' | 'ADMIN' | 'PLAYER'
export type MemberStatus = 'PENDING' | 'ACTIVE' | 'REMOVED'
export type ActivityType = 'MATCH' | 'TRAINING'
export type ActivityStatus = 'OPEN' | 'CLOSED' | 'FINISHED'
export type MatchOutcome = 'WIN' | 'DRAW' | 'LOSE'
export type FinanceType = 'INCOME' | 'EXPENSE'
export type RegStatus = 'JOINED' | 'TENTATIVE' | 'ABSENT'

export interface TeamBrief {
  teamId: number
  teamName: string
  logoUrl: string
  role: MemberRole
  inviteCode: string
}

export interface LoginRes {
  token: string
  userId: number
  nickname: string
  avatarUrl: string
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
  myStatus: RegStatus | null
}

export interface MatchResultRes {
  ourScore: number
  oppScore: number
  outcome: MatchOutcome
  notes: string | null
}

export interface ActivityDetailRes {
  activity: ActivityRes
  registrations: Array<{ userId: number; nickname: string; avatarUrl: string; status: RegStatus }>
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

export interface GroupMemberDto {
  userId: number
  nickname: string
  avatarUrl: string
}

export interface GroupDto {
  id: number
  index: number
  name: string
  members: GroupMemberDto[]
}

export interface GroupingRes {
  groups: GroupDto[]
  ungrouped: GroupMemberDto[]
}
