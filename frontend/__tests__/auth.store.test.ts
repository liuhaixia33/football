import { useAuthStore } from '../src/store/auth'

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: null, userId: null, nickname: null, avatarUrl: null,
      currentTeamId: null, currentRole: null, teams: [],
    })
  })

  test('isAtLeast: same role returns true', () => {
    useAuthStore.setState({ currentRole: 'ADMIN' })
    expect(useAuthStore.getState().isAtLeast('ADMIN')).toBe(true)
  })

  test('isAtLeast: CAPTAIN can access ADMIN-required', () => {
    useAuthStore.setState({ currentRole: 'CAPTAIN' })
    expect(useAuthStore.getState().isAtLeast('ADMIN')).toBe(true)
  })

  test('isAtLeast: PLAYER cannot access ADMIN-required', () => {
    useAuthStore.setState({ currentRole: 'PLAYER' })
    expect(useAuthStore.getState().isAtLeast('ADMIN')).toBe(false)
  })

  test('isAtLeast: null role returns false', () => {
    useAuthStore.setState({ currentRole: null })
    expect(useAuthStore.getState().isAtLeast('PLAYER')).toBe(false)
  })

  test('isCaptainOrAdmin: CAPTAIN returns true', () => {
    useAuthStore.setState({ currentRole: 'CAPTAIN' })
    expect(useAuthStore.getState().isCaptainOrAdmin()).toBe(true)
  })

  test('isCaptainOrAdmin: PLAYER returns false', () => {
    useAuthStore.setState({ currentRole: 'PLAYER' })
    expect(useAuthStore.getState().isCaptainOrAdmin()).toBe(false)
  })
})
