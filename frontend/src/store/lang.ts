import { create } from 'zustand'
import Taro from '@tarojs/taro'

interface LangState {
  language: 'zh' | 'en'
  setLanguage: (lang: 'zh' | 'en') => void
}

function detectLanguage(): 'zh' | 'en' {
  const stored = Taro.getStorageSync('language')
  if (stored === 'zh' || stored === 'en') return stored
  try {
    const sys = Taro.getSystemInfoSync()
    return sys.language?.startsWith('zh') ? 'zh' : 'en'
  } catch {
    return 'zh'
  }
}

export const useLangStore = create<LangState>((set) => ({
  language: detectLanguage(),
  setLanguage: (lang) => {
    Taro.setStorageSync('language', lang)
    set({ language: lang })
  },
}))
