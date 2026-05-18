import { useEffect } from 'react'
import { PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import { useAuthStore } from './store/auth'
import './app.scss'

function App({ children }: PropsWithChildren) {
  const { token } = useAuthStore()

  useEffect(() => {
    if (!token) {
      Taro.reLaunch({ url: '/pages/login/index' })
    }
  }, [])

  return <>{children}</>
}

export default App
