import Taro from '@tarojs/taro'
import { API_BASE } from '../config'
import { useAuthStore } from '../store/auth'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: Record<string, unknown>,
  withTeam = true
): Promise<T> {
  const { token, currentTeamId } = useAuthStore.getState()

  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) header['Authorization'] = `Bearer ${token}`
  if (withTeam && currentTeamId) header['X-Team-Id'] = String(currentTeamId)

  const res = await Taro.request({
    url: API_BASE + path,
    method,
    data,
    header,
  })

  if (res.statusCode >= 400) {
    throw new Error(`服务器错误 (${res.statusCode})`)
  }

  const body = res.data as ApiResponse<T>
  if (body.code === 401) {
    useAuthStore.getState().clear()
    Taro.reLaunch({ url: '/pages/login/index' })
    throw new Error('未登录')
  }
  if (body.code !== 200) {
    throw new Error(body.message || '请求失败')
  }
  return body.data
}

export const api = {
  get:    <T>(path: string, withTeam = true) =>
    request<T>('GET', path, undefined, withTeam),
  post:   <T>(path: string, data?: Record<string, unknown>, withTeam = true) =>
    request<T>('POST', path, data, withTeam),
  put:    <T>(path: string, data?: Record<string, unknown>, withTeam = true) =>
    request<T>('PUT', path, data, withTeam),
  delete: <T>(path: string, withTeam = true) =>
    request<T>('DELETE', path, undefined, withTeam),
}
