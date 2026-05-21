import React from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { px } from '../../utils/style'

const C = {
  bg: '#0f1010', text: '#e8ede8', text2: '#8a9e8a', text3: '#4a5a4a',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: px(28) }}>
      <Text style={{ fontSize: px(30), fontWeight: '700', color: C.text, display: 'block', marginBottom: px(10) }}>
        {title}
      </Text>
      <View>
        {children}
      </View>
    </View>
  )
}

export default function TermsPage() {
  return (
    <ScrollView scrollY style={{ background: C.bg, minHeight: '100%' }}>
      <View style={{ padding: px(32), paddingBottom: px(60) }}>
        <Text style={{ fontSize: px(40), fontWeight: '900', color: C.text, display: 'block', marginBottom: px(8) }}>
          用户协议
        </Text>
        <Text style={{ fontSize: px(24), color: C.text3, display: 'block', marginBottom: px(32) }}>
          最后更新：2026-05-21
        </Text>

        <Section title="一、服务范围">
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44) }}>
            本小程序（「足球队」）提供足球队管理、活动组织、队员协作等功能。本协议适用于所有使用本服务的用户。
          </Text>
        </Section>

        <Section title="二、使用规则">
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44), display: 'block' }}>您在使用本服务时，承诺：</Text>
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44), display: 'block' }}>• 不发布违法、违规、色情、暴恐或政治敏感内容</Text>
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44), display: 'block' }}>• 不冒充他人身份</Text>
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44), display: 'block' }}>• 不进行任何破坏服务正常运营的行为</Text>
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44), display: 'block' }}>• 遵守中华人民共和国相关法律法规</Text>
        </Section>

        <Section title="三、用户内容">
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44) }}>
            您上传或发布的内容（昵称、头像、球队信息、活动信息等）所产生的法律责任由您自行承担。我们有权对违规内容进行删除处理。
          </Text>
        </Section>

        <Section title="四、知识产权">
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44) }}>
            本小程序的界面设计、功能逻辑等归开发者所有。您上传的内容归您本人所有，您授权我们在提供服务范围内使用。
          </Text>
        </Section>

        <Section title="五、责任限制">
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44) }}>
            本服务按「现状」提供。我们不对因不可抗力、网络故障或第三方服务中断导致的损失承担责任。
          </Text>
        </Section>

        <Section title="六、协议更新与争议解决">
          <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44) }}>
            本协议可能不定期更新。如协议发生重大变更，我们将通过小程序通知您。因本协议产生的争议，双方应友好协商解决。
          </Text>
        </Section>
      </View>
    </ScrollView>
  )
}
