import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'

export default function OnboardPage() {
  return (
    <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                   justifyContent: 'center', height: '100vh', padding: '32px' }}>
      <Text style={{ fontSize: '48px', marginBottom: '24px' }}>⚽</Text>
      <Text style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
        欢迎加入足球队
      </Text>
      <Text style={{ fontSize: '14px', color: '#999', marginBottom: '48px',
                     textAlign: 'center' }}>
        你还没有加入任何球队，创建新球队或通过邀请码加入
      </Text>
      <Button
        style={{ background: '#4CAF50', color: '#fff', borderRadius: '8px',
                 width: '100%', marginBottom: '12px', border: 'none' }}
        onClick={() => Taro.navigateTo({ url: '/pages/create-team/index' })}
      >
        创建球队
      </Button>
      <Button
        style={{ background: '#fff', color: '#4CAF50', border: '1px solid #4CAF50',
                 borderRadius: '8px', width: '100%' }}
        onClick={() => Taro.navigateTo({ url: '/pages/join-team/index' })}
      >
        输入邀请码加入
      </Button>
    </View>
  )
}
