import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../store/auth'
import './index.scss'

interface TabItem {
  path: string
  text: string
  icon: string
}

const CAPTAIN_ADMIN_TABS: TabItem[] = [
  { path: '/pages/home/index',    text: '首页', icon: '🏠' },
  { path: '/pages/members/index', text: '队员', icon: '👥' },
  { path: '/pages/finance/index', text: '财务', icon: '💰' },
  { path: '/pages/my/index',      text: '我的', icon: '👤' },
]

const PLAYER_TABS: TabItem[] = [
  { path: '/pages/home/index',    text: '活动', icon: '📅' },
  { path: '/pages/members/index', text: '球队', icon: '⚽' },
  { path: '/pages/my/index',      text: '我的', icon: '👤' },
]

export default class CustomTabBar extends Component {
  getTabs(): TabItem[] {
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
    const tabs = this.getTabs()
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
