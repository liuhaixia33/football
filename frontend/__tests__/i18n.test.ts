import Taro from '@tarojs/taro'
import { useLangStore } from '../src/store/lang'
import { zh } from '../src/i18n/zh'
import { en } from '../src/i18n/en'

beforeEach(() => {
  Taro.clearStorageSync()
  useLangStore.setState({ language: 'zh' })
  jest.clearAllMocks()
})

describe('setLanguage', () => {
  it('updates store state to en', () => {
    useLangStore.getState().setLanguage('en')
    expect(useLangStore.getState().language).toBe('en')
  })

  it('persists language to storage', () => {
    useLangStore.getState().setLanguage('en')
    expect(Taro.getStorageSync('language')).toBe('en')
  })

  it('updates store state back to zh', () => {
    useLangStore.getState().setLanguage('en')
    useLangStore.getState().setLanguage('zh')
    expect(useLangStore.getState().language).toBe('zh')
    expect(Taro.getStorageSync('language')).toBe('zh')
  })
})

describe('zh dictionary', () => {
  it('contains required keys', () => {
    const requiredKeys = [
      'common.loading', 'tab.home', 'login.title', 'home.empty',
      'act.join', 'act_form.title_create', 'members.title',
      'finance.title', 'member_fee.title', 'my.language',
    ]
    requiredKeys.forEach(key => {
      expect(zh[key]).toBeDefined()
    })
  })

  it('all values are non-empty strings', () => {
    Object.entries(zh).forEach(([, val]) => {
      expect(typeof val).toBe('string')
      expect(val.length).toBeGreaterThan(0)
    })
  })
})

describe('en dictionary', () => {
  it('has the same keys as zh', () => {
    const zhKeys = Object.keys(zh).sort()
    const enKeys = Object.keys(en).sort()
    expect(enKeys).toEqual(zhKeys)
  })

  it('all values are non-empty strings', () => {
    Object.entries(en).forEach(([, val]) => {
      expect(typeof val).toBe('string')
      expect(val.length).toBeGreaterThan(0)
    })
  })
})
