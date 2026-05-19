import Taro from '@tarojs/taro'
import { API_BASE } from '../config'
import { useAuthStore } from '../store/auth'

export const uploadApi = {
  avatar: (filePath: string): Promise<{ url: string }> =>
    new Promise((resolve, reject) => {
      const token = useAuthStore.getState().token
      Taro.uploadFile({
        url: `${API_BASE}/api/v1/upload/avatar`,
        filePath,
        name: 'file',
        header: token ? { Authorization: `Bearer ${token}` } : {},
        success: (res) => {
          if (res.statusCode >= 400) {
            reject(new Error(`上传失败 (${res.statusCode})`))
            return
          }
          try {
            const body = JSON.parse(res.data) as { code: number; message: string; data: { url: string } }
            if (body.code !== 200) {
              reject(new Error(body.message || '上传失败'))
              return
            }
            resolve(body.data)
          } catch {
            reject(new Error('上传失败'))
          }
        },
        fail: (err) => reject(new Error(err.errMsg || '上传失败')),
      })
    }),
}
