import Taro from '@tarojs/taro'

/**
 * 将设计稿 px 转换为响应式 rpx。
 * 基于 Taro 配置的 designWidth（默认 750）。
 * 示例: px(16) => '16rpx' (750 设计稿)
 */
export function px(n: number): string {
  return Taro.pxTransform(n)
}
