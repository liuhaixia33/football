const storage: Record<string, unknown> = {}

const Taro = {
  getStorageSync: (key: string) => storage[key] ?? null,
  setStorageSync: (key: string, value: unknown) => { storage[key] = value },
  clearStorageSync: () => { Object.keys(storage).forEach(k => delete storage[k]) },
  removeStorageSync: (key: string) => { delete storage[key] },
  getSystemInfoSync: jest.fn(() => ({ language: 'zh_CN' })),
  reLaunch: jest.fn(),
  navigateTo: jest.fn(),
  switchTab: jest.fn(),
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showActionSheet: jest.fn(),
  showModal: jest.fn(),
  login: jest.fn(),
  getUserProfile: jest.fn(),
  request: jest.fn(),
  getCurrentPages: jest.fn(() => []),
  getCurrentInstance: jest.fn(() => ({ router: { params: {} } })),
  navigateBack: jest.fn(),
  setNavigationBarTitle: jest.fn(),
}
export default Taro
