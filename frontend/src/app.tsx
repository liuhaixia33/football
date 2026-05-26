import { PropsWithChildren, useEffect } from 'react'
import Taro from '@tarojs/taro'
import PrivacyPopup from './components/PrivacyPopup/index'
import { useAuthStore } from './store/auth'
import { authApi } from './api/auth'
import './app.scss'

function App({ children }: PropsWithChildren) {
  const token = useAuthStore(s => s.token)

  useEffect(() => {
    if (token) return
    Taro.login()
      .then(({ code }) => authApi.login(code))
      .then(res => {
        useAuthStore.getState().setAuth(res.token, res.userId, res.nickname, res.avatarUrl ?? '')
        useAuthStore.getState().setTeams(res.teams)
      })
      .catch(() => {})
  }, [])

  return (
    <>
      {children}
      <PrivacyPopup />
    </>
  )
}

export default App
