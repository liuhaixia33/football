import { useLangStore } from '../store/lang'
import { zh } from './zh'
import { en } from './en'

export function useT(): (key: string) => string {
  const { language } = useLangStore()
  const dict = language === 'zh' ? zh : en
  return (key: string) => dict[key] ?? key
}
