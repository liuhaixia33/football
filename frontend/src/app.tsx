import { PropsWithChildren } from 'react'
import PrivacyPopup from './components/PrivacyPopup/index'
import './app.scss'

function App({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <PrivacyPopup />
    </>
  )
}

export default App
