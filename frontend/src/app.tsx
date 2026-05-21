import { useEffect } from 'react'
import { PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import { useAuthStore } from './store/auth'
import './app.scss'

function App({ children }: PropsWithChildren) {
  const { token } = useAuthStore()

  useEffect(() => {
    if (!token) {
      // Save inviteCode from shared link before redirecting to login
      try {
        const opts = Taro.getLaunchOptionsSync()
        const inviteCode = (opts.query as Record<string, string>)?.inviteCode
        if (inviteCode) {
          Taro.setStorageSync('pending_invite_code', inviteCode)
        }
      } catch {}
      Taro.reLaunch({ url: '/pages/login/index' })
    }
  }, [token])

  return <>{children}</>
}

export default App
