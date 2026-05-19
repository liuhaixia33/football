import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../store/auth'
import { useLangStore } from '../store/lang'
import { zh } from '../i18n/zh'
import { en } from '../i18n/en'
import './index.scss'

interface TabItem {
  path: string
  text: string
  icon: string
}

export default class CustomTabBar extends Component {
  getTabs(t: (key: string) => string): TabItem[] {
    const CAPTAIN_ADMIN_TABS: TabItem[] = [
      { path: '/pages/home/index',    text: t('tab.home'),    icon: '🏠' },
      { path: '/pages/members/index', text: t('tab.members'), icon: '👥' },
      { path: '/pages/finance/index', text: t('tab.finance'), icon: '💰' },
      { path: '/pages/my/index',      text: t('tab.my'),      icon: '👤' },
    ]
    const PLAYER_TABS: TabItem[] = [
      { path: '/pages/home/index',    text: t('tab.home'),    icon: '📅' },
      { path: '/pages/members/index', text: t('tab.members'), icon: '⚽' },
      { path: '/pages/my/index',      text: t('tab.my'),      icon: '👤' },
    ]
    const role = useAuthStore.getState().currentRole
    return role === 'CAPTAIN' || role === 'ADMIN' ? CAPTAIN_ADMIN_TABS : PLAYER_TABS
  }

  getCurrentIndex(tabs: TabItem[]): number {
    const pages = Taro.getCurrentPages()
    if (!pages.length) return 0
    const route = '/' + pages[pages.length - 1].route
    return Math.max(0, tabs.findIndex(t => t.path === route))
  }

  switchTab(path: string) {
    Taro.switchTab({ url: path })
  }

  render() {
    const { language } = useLangStore.getState()
    const dict = language === 'zh' ? zh : en
    const t = (key: string) => (dict as Record<string, string>)[key] ?? key
    const tabs = this.getTabs(t)
    const selected = this.getCurrentIndex(tabs)

    return (
      <View className='tab-bar'>
        {tabs.map((tab, i) => (
          <View
            key={tab.path}
            className={`tab-item ${i === selected ? 'active' : ''}`}
            onClick={() => this.switchTab(tab.path)}
          >
            <Text className='tab-icon'>{tab.icon}</Text>
            <Text className='tab-text'>{tab.text}</Text>
          </View>
        ))}
      </View>
    )
  }
}
