import React from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { px } from '../../utils/style'

const C = {
  bg: '#0f1010',
  surface: '#181c18',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8ede8',
  text2: '#8a9e8a',
  text3: '#4a5a4a',
  primary: '#22c55e',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: px(28) }}>
      <Text
        style={{
          fontSize: px(30),
          fontWeight: '700',
          color: C.text,
          display: 'block',
          marginBottom: px(10),
        }}
      >
        {title}
      </Text>
      <View
        style={{
          fontSize: px(26),
          color: C.text2,
          lineHeight: px(44),
        }}
      >
        {children}
      </View>
    </View>
  )
}

export default function PrivacyPage() {
  return (
    <ScrollView scrollY style={{ background: C.bg, minHeight: '100%' }}>
      <View style={{ padding: px(32), paddingBottom: px(60) }}>
        <Text
          style={{
            fontSize: px(40),
            fontWeight: '900',
            color: C.text,
            display: 'block',
            marginBottom: px(8),
          }}
        >
          隐私政策
        </Text>
        <Text
          style={{
            fontSize: px(24),
            color: C.text3,
            display: 'block',
            marginBottom: px(32),
          }}
        >
          最后更新：2026-05-21
        </Text>

        <Section title="一、开发者信息">
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44) }}>
            本小程序由个人开发者运营。如您对本隐私政策有任何疑问，可通过邮箱 xiyanziran0621@gmail.com 联系我们。
          </Text>
        </Section>

        <Section title="二、我们收集的信息">
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44), display: 'block' }}>
            我们收集以下个人信息：
          </Text>
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44), display: 'block' }}>
            • 微信昵称和头像（您主动提供）
          </Text>
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44), display: 'block' }}>
            • 微信 OpenID（用于身份识别，不对外展示）
          </Text>
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44), display: 'block' }}>
            • 您填写的球队名称、描述、活动信息
          </Text>
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44), display: 'block' }}>
            • 您上传的头像和球队 Logo 图片
          </Text>
        </Section>

        <Section title="三、信息收集目的">
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44) }}>
            我们收集上述信息的目的是：提供球队管理、活动组织、队员互动等核心功能；识别您的账号身份，确保服务安全。我们不会将您的个人信息用于任何商业推广。
          </Text>
        </Section>

        <Section title="四、信息存储">
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44) }}>
            您的个人信息存储于阿里云服务器（中国大陆地区）。我们会在您使用本服务期间保留您的信息，您可随时申请删除账号及相关数据。
          </Text>
        </Section>

        <Section title="五、第三方服务">
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44) }}>
            本小程序使用阿里云 OSS 存储您上传的图片文件。阿里云的隐私政策详见其官方网站。除此之外，我们不与任何第三方共享您的个人信息。
          </Text>
        </Section>

        <Section title="六、您的权利">
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44) }}>
            您有权：查询我们持有的您的个人信息；要求更正不准确的信息；要求删除您的账号及全部数据。如需行使上述权利，请通过上方邮箱联系我们。
          </Text>
        </Section>

        <Section title="七、隐私政策更新">
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44) }}>
            本隐私政策可能不定期更新。重大变更将通过小程序通知您。继续使用本服务即表示您同意更新后的隐私政策。
          </Text>
        </Section>
      </View>
    </ScrollView>
  )
}
