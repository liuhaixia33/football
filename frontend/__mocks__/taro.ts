const storage: Record<string, unknown> = {}

const Taro = {
  getStorageSync: (key: string) => storage[key] ?? null,
  setStorageSync: (key: string, value: unknown) => { storage[key] = value },
  clearStorageSync: () => { Object.keys(storage).forEach(k => delete storage[k]) },
  reLaunch: jest.fn(),
  navigateTo: jest.fn(),
  switchTab: jest.fn(),
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  login: jest.fn(),
  getUserProfile: jest.fn(),
  request: jest.fn(),
  showModal: jest.fn(),
  getCurrentPages: jest.fn(() => []),
  getCurrentInstance: jest.fn(() => ({ router: { params: {} } })),
  navigateBack: jest.fn(),
}
export default Taro
