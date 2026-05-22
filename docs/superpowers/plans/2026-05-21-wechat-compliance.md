# 微信小程序合规整改实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 6 项微信小程序合规整改（P0 强制登录/协议页面、P1 UGC 内容安全、P2 隐私弹窗），使小程序能通过微信审核。

**Architecture:** 前端新增隐私政策/用户协议静态页面、登录页加协议同意勾选、移除全局强制跳登录；后端新增 `ContentSafetyService` 封装微信 msgSecCheck/imgSecCheck，注入到 5 个 UGC 入口；前端 app.tsx 接入微信 privacy popup。

**Tech Stack:** Taro 3.6 (TypeScript/React)，Spring Boot 3.2.5 (Java 17)，微信 security.msgSecCheck / security.imgSecCheck API，现有 WechatService.getAccessToken()

---

## 文件清单

| 操作 | 文件 |
|---|---|
| 新建 | `frontend/src/pages/privacy/index.tsx` |
| 新建 | `frontend/src/pages/privacy/index.config.ts` |
| 新建 | `frontend/src/pages/terms/index.tsx` |
| 新建 | `frontend/src/pages/terms/index.config.ts` |
| 新建 | `backend/src/main/java/com/football/team/service/ContentSafetyService.java` |
| 新建 | `backend/src/test/java/com/football/team/service/ContentSafetyServiceTest.java` |
| 修改 | `frontend/src/app.config.ts` — 注册 privacy + terms 路由 |
| 修改 | `frontend/src/app.tsx` — 移除强制登录 + 接入隐私弹窗 |
| 修改 | `frontend/src/pages/login/index.tsx` — 协议同意勾选 |
| 修改 | `frontend/src/pages/home/index.tsx` — 未登录公开视图 |
| 修改 | `backend/src/main/java/com/football/team/controller/UploadController.java` |
| 修改 | `backend/src/main/java/com/football/team/service/UserService.java` |
| 修改 | `backend/src/main/java/com/football/team/service/TeamService.java` |
| 修改 | `backend/src/main/java/com/football/team/service/ActivityService.java` |

---

## Task 1：隐私政策静态页面

**Files:**
- Create: `frontend/src/pages/privacy/index.config.ts`
- Create: `frontend/src/pages/privacy/index.tsx`

- [ ] **Step 1: 创建页面配置**

```typescript
// frontend/src/pages/privacy/index.config.ts
export default {
  navigationBarTitleText: '隐私政策',
  navigationBarBackgroundColor: '#0f1010',
  navigationBarTextStyle: 'white' as const,
  backgroundColor: '#0f1010',
}
```

- [ ] **Step 2: 创建隐私政策页面**

```typescript
// frontend/src/pages/privacy/index.tsx
import { View, Text, ScrollView } from '@tarojs/components'
import { px } from '../../utils/style'

const C = {
  bg: '#0f1010', surface: '#181c18', border: 'rgba(255,255,255,0.07)',
  text: '#e8ede8', text2: '#8a9e8a', text3: '#4a5a4a', primary: '#22c55e',
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={{ marginBottom: px(28) }}>
      <Text style={{ fontSize: px(30), fontWeight: '700', color: C.text, display: 'block', marginBottom: px(10) }}>
        {title}
      </Text>
      <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44) }}>
        {children}
      </Text>
    </View>
  )
}

export default function PrivacyPage() {
  return (
    <ScrollView scrollY style={{ background: C.bg, minHeight: '100%' }}>
      <View style={{ padding: px(32) }}>
        <Text style={{ fontSize: px(40), fontWeight: '900', color: C.text, display: 'block', marginBottom: px(8) }}>
          隐私政策
        </Text>
        <Text style={{ fontSize: px(24), color: C.text3, display: 'block', marginBottom: px(32) }}>
          最后更新：2026-05-21
        </Text>

        <Section title="一、开发者信息">
          本小程序由个人开发者运营。如您对本隐私政策有任何疑问，可通过邮箱 xiyanziran0621@gmail.com 联系我们。
        </Section>

        <Section title="二、我们收集的信息">
          我们收集以下个人信息：\n• 微信昵称和头像（您主动提供）\n• 微信 OpenID（用于身份识别，不对外展示）\n• 您填写的球队名称、描述、活动信息\n• 您上传的头像和球队 Logo 图片
        </Section>

        <Section title="三、信息收集目的">
          我们收集上述信息的目的是：提供球队管理、活动组织、队员互动等核心功能；识别您的账号身份，确保服务安全。我们不会将您的个人信息用于任何商业推广。
        </Section>

        <Section title="四、信息存储">
          您的个人信息存储于阿里云服务器（中国大陆地区）。我们会在您使用本服务期间保留您的信息，您可随时申请删除账号及相关数据。
        </Section>

        <Section title="五、第三方服务">
          本小程序使用阿里云 OSS 存储您上传的图片文件。阿里云的隐私政策详见其官方网站。除此之外，我们不与任何第三方共享您的个人信息。
        </Section>

        <Section title="六、您的权利">
          您有权：查询我们持有的您的个人信息；要求更正不准确的信息；要求删除您的账号及全部数据。如需行使上述权利，请通过上方邮箱联系我们。
        </Section>

        <Section title="七、隐私政策更新">
          本隐私政策可能不定期更新。重大变更将通过小程序通知您。继续使用本服务即表示您同意更新后的隐私政策。
        </Section>
      </View>
    </ScrollView>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/privacy/
git commit -m "feat: add privacy policy static page"
```

---

## Task 2：用户协议静态页面

**Files:**
- Create: `frontend/src/pages/terms/index.config.ts`
- Create: `frontend/src/pages/terms/index.tsx`

- [ ] **Step 1: 创建页面配置**

```typescript
// frontend/src/pages/terms/index.config.ts
export default {
  navigationBarTitleText: '用户协议',
  navigationBarBackgroundColor: '#0f1010',
  navigationBarTextStyle: 'white' as const,
  backgroundColor: '#0f1010',
}
```

- [ ] **Step 2: 创建用户协议页面**

```typescript
// frontend/src/pages/terms/index.tsx
import { View, Text, ScrollView } from '@tarojs/components'
import { px } from '../../utils/style'

const C = {
  bg: '#0f1010', text: '#e8ede8', text2: '#8a9e8a', text3: '#4a5a4a',
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={{ marginBottom: px(28) }}>
      <Text style={{ fontSize: px(30), fontWeight: '700', color: C.text, display: 'block', marginBottom: px(10) }}>
        {title}
      </Text>
      <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44) }}>
        {children}
      </Text>
    </View>
  )
}

export default function TermsPage() {
  return (
    <ScrollView scrollY style={{ background: C.bg, minHeight: '100%' }}>
      <View style={{ padding: px(32) }}>
        <Text style={{ fontSize: px(40), fontWeight: '900', color: C.text, display: 'block', marginBottom: px(8) }}>
          用户协议
        </Text>
        <Text style={{ fontSize: px(24), color: C.text3, display: 'block', marginBottom: px(32) }}>
          最后更新：2026-05-21
        </Text>

        <Section title="一、服务范围">
          本小程序（「足球队」）提供足球队管理、活动组织、队员协作等功能。本协议适用于所有使用本服务的用户。
        </Section>

        <Section title="二、使用规则">
          您在使用本服务时，承诺：\n• 不发布违法、违规、色情、暴恐或政治敏感内容\n• 不冒充他人身份\n• 不进行任何破坏服务正常运营的行为\n• 遵守中华人民共和国相关法律法规
        </Section>

        <Section title="三、用户内容">
          您上传或发布的内容（昵称、头像、球队信息、活动信息等）所产生的法律责任由您自行承担。我们有权对违规内容进行删除处理。
        </Section>

        <Section title="四、知识产权">
          本小程序的界面设计、功能逻辑等归开发者所有。您上传的内容归您本人所有，您授权我们在提供服务范围内使用。
        </Section>

        <Section title="五、责任限制">
          本服务按「现状」提供。我们不对因不可抗力、网络故障或第三方服务中断导致的损失承担责任。
        </Section>

        <Section title="六、协议更新与争议解决">
          本协议可能不定期更新。如协议发生重大变更，我们将通过小程序通知您。因本协议产生的争议，双方应友好协商解决。
        </Section>
      </View>
    </ScrollView>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/terms/
git commit -m "feat: add terms of service static page"
```

---

## Task 3：登录页增加协议同意机制

**Files:**
- Modify: `frontend/src/pages/login/index.tsx`

- [ ] **Step 1: 读取现有 login 页面，找到登录按钮区域（约第 95 行）**

在 `canLogin` 变量上方，添加 `agreed` state；在登录按钮上方添加协议勾选行。

- [ ] **Step 2: 修改 login/index.tsx**

在文件中：

1. 在 `useState` 导入中已有的基础上，已有 `import { useState } from 'react'` — 无需修改。

2. 在现有 `import { View, Text, Button, Image, Input } from '@tarojs/components'` — 需要添加 `Checkbox`：
```typescript
import { View, Text, Button, Image, Input, Checkbox } from '@tarojs/components'
```

3. 在 `const [loading, setLoading] = useState(false)` 后添加：
```typescript
const [agreed, setAgreed] = useState(false)
```

4. 将 `canLogin` 修改为：
```typescript
const canLogin = !!(avatarTmp || storedAvatarUrl) && !!nickname.trim() && !loading && agreed
```

5. 在登录按钮（`<Button ... onClick={handleLogin}>`）之前，**紧接在** `marginTop: px(52)` 的那个 Button 之前，插入以下 JSX（替换那段登录 Button 为：）

```typescript
        {/* 协议同意行 */}
        <View
          style={{ display: 'flex', alignItems: 'center', gap: px(8), marginTop: px(16) }}
          onClick={() => setAgreed(v => !v)}
        >
          <Checkbox
            value="agreed"
            checked={agreed}
            color="#22c55e"
            style={{ transform: 'scale(0.8)' }}
          />
          <Text style={{ fontSize: px(24), color: C.text2 }}>
            我已阅读并同意
          </Text>
          <Text
            style={{ fontSize: px(24), color: '#22c55e', textDecoration: 'underline' }}
            onClick={(e) => { e.stopPropagation(); Taro.navigateTo({ url: '/pages/terms/index' }) }}
          >
            《用户协议》
          </Text>
          <Text style={{ fontSize: px(24), color: C.text2 }}>和</Text>
          <Text
            style={{ fontSize: px(24), color: '#22c55e', textDecoration: 'underline' }}
            onClick={(e) => { e.stopPropagation(); Taro.navigateTo({ url: '/pages/privacy/index' }) }}
          >
            《隐私政策》
          </Text>
        </View>

        <Button
          style={{
            width: px(520),
            marginTop: px(20),
            background: canLogin ? '#22c55e' : 'rgba(255,255,255,0.07)',
            color: canLogin ? '#0f1010' : C.text3,
            borderRadius: px(16),
            height: px(56),
            lineHeight: px(56),
            fontSize: px(34),
            fontWeight: '800',
            border: 'none',
            letterSpacing: '0.02em',
          }}
          loading={loading}
          disabled={!canLogin}
          onClick={handleLogin}
        >
          {t('login.btn')}
        </Button>
```

**注意：** 删除原有的 `<Button ... marginTop: px(52) ...>` 那段，用上面完整替换。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/login/index.tsx
git commit -m "feat: add agreement consent checkbox to login page"
```

---

## Task 4：移除全局强制登录 + 注册新页面 + 首页公开视图

**Files:**
- Modify: `frontend/src/app.tsx`
- Modify: `frontend/src/app.config.ts`
- Modify: `frontend/src/pages/home/index.tsx`

- [ ] **Step 1: 修改 app.tsx — 移除强制跳转**

将 `frontend/src/app.tsx` 全文替换为：

```typescript
import { PropsWithChildren } from 'react'
import './app.scss'

function App({ children }: PropsWithChildren) {
  return <>{children}</>
}

export default App
```

注意：原来保存 `pending_invite_code` 的逻辑移到了 `home/index.tsx` 的 `useDidShow` 中（见 Step 3）。

- [ ] **Step 2: 在 app.config.ts 注册新页面**

在 `pages` 数组末尾追加两个路由（在 `'pages/team-poster/index'` 之后）：

```typescript
'pages/privacy/index',
'pages/terms/index',
```

- [ ] **Step 3: 修改 home/index.tsx — 未登录公开视图**

读取 `frontend/src/pages/home/index.tsx`。

找到组件顶部的 state 声明区域（约第 296 行），在 `const { currentTeamId, isCaptainOrAdmin, teams } = useAuthStore()` 那行处，修改为：

```typescript
const { currentTeamId, isCaptainOrAdmin, teams, token } = useAuthStore()
```

然后找到 `useDidShow(load)` 这行（约第 355 行），在其后面追加：

```typescript
  // 保存分享链接中的邀请码（原 app.tsx 逻辑移至此处）
  useEffect(() => {
    try {
      const opts = Taro.getLaunchOptionsSync()
      const inviteCode = (opts.query as Record<string, string>)?.inviteCode
      if (inviteCode) {
        Taro.setStorageSync('pending_invite_code', inviteCode)
      }
    } catch {}
  }, [])
```

然后在渲染函数的 `return (` 之前，找到最外层 View 的起始，在其内部最开始处，在所有内容之前插入未登录判断（在 JSX return 块的第一个子元素之前）：

```typescript
  // 未登录：显示欢迎页，引导登录
  if (!token) {
    return (
      <View style={{ flex: 1, background: '#0f1010', display: 'flex', flexDirection: 'column',
                     alignItems: 'center', justifyContent: 'center', padding: px(40) }}>
        <Text style={{ fontSize: px(120), display: 'block', textAlign: 'center', marginBottom: px(24) }}>⚽</Text>
        <Text style={{ fontSize: px(48), fontWeight: '900', color: '#e8ede8', textAlign: 'center',
                       display: 'block', marginBottom: px(12) }}>
          足球队
        </Text>
        <Text style={{ fontSize: px(28), color: '#8a9e8a', textAlign: 'center', display: 'block',
                       marginBottom: px(48) }}>
          管理你的球队，记录每一场比赛
        </Text>
        <Button
          style={{
            background: '#22c55e', color: '#0f1010', borderRadius: px(16),
            fontSize: px(34), fontWeight: '800', border: 'none',
            padding: `${px(18)} ${px(60)}`,
          }}
          onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}
        >
          登录 / 注册
        </Button>
      </View>
    )
  }
```

需要补充 `Button` import（检查现有 import，`View, Text` 已有，`Button` 可能没有）：
在文件顶部的 `import { View, Text, ScrollView, Image } from '@tarojs/components'` 中添加 `Button`。

- [ ] **Step 4: 编译验证**

```bash
cd frontend && npm run build:weapp 2>&1 | tail -10
# 期望：Compiled successfully
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app.tsx frontend/src/app.config.ts frontend/src/pages/home/index.tsx
git commit -m "feat: remove forced login, add public home view and register new pages"
```

---

## Task 5：后端 ContentSafetyService

**Files:**
- Create: `backend/src/main/java/com/football/team/service/ContentSafetyService.java`
- Create: `backend/src/test/java/com/football/team/service/ContentSafetyServiceTest.java`

- [ ] **Step 1: 写失败测试**

```java
// backend/src/test/java/com/football/team/service/ContentSafetyServiceTest.java
package com.football.team.service;

import com.football.team.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContentSafetyServiceTest {

    @Mock WechatService wechatService;
    @InjectMocks ContentSafetyService contentSafetyService;

    @Test
    void checkText_devMock_skips() {
        when(wechatService.isDevMock()).thenReturn(true);
        assertDoesNotThrow(() -> contentSafetyService.checkText("openid1", "任意文本"));
        verify(wechatService, never()).getAccessToken();
    }

    @Test
    void checkImage_devMock_skips() {
        when(wechatService.isDevMock()).thenReturn(true);
        assertDoesNotThrow(() -> contentSafetyService.checkImage(new byte[]{1, 2, 3}));
        verify(wechatService, never()).getAccessToken();
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd backend && mvn test -pl . -Dtest=ContentSafetyServiceTest -q 2>&1 | tail -5
# 期望：FAILURE — ContentSafetyService 不存在
```

- [ ] **Step 3: 在 WechatService 添加 isDevMock() 方法**

在 `WechatService.java` 末尾（`MOCK_PNG` 常量之前）添加：

```java
/** 供 ContentSafetyService 判断是否跳过审核 */
public boolean isDevMock() {
    return "dev_mock".equals(appId);
}
```

- [ ] **Step 4: 创建 ContentSafetyService**

```java
// backend/src/main/java/com/football/team/service/ContentSafetyService.java
package com.football.team.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.football.team.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ContentSafetyService {

    private final WechatService wechatService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${wechat.app-id}") private String appId;

    /**
     * 文本安全审核。仅在非 dev_mock 且文本非空时调用。
     * suggest=risky 时抛 BusinessException。
     *
     * @param openid 用户 openid（微信要求必传）
     * @param text   待审核文本
     */
    public void checkText(String openid, String text) {
        if (wechatService.isDevMock() || text == null || text.isBlank()) return;

        String token = wechatService.getAccessToken();
        String url = "https://api.weixin.qq.com/wxa/msg_sec_check?access_token=" + token;

        Map<String, Object> body = Map.of(
            "openid", openid,
            "scene", 1,       // 1=资料，2=评论，3=论坛，4=社交日志
            "version", 2,
            "content", text
        );

        String raw = restTemplate.postForObject(url, body, String.class);
        parseAndThrow(raw, "文本");
    }

    /**
     * 图片安全审核。仅在非 dev_mock 时调用。
     *
     * @param imageBytes 图片字节流
     */
    public void checkImage(byte[] imageBytes) {
        if (wechatService.isDevMock() || imageBytes == null || imageBytes.length == 0) return;

        String token = wechatService.getAccessToken();
        String url = "https://api.weixin.qq.com/wxa/img_sec_check?access_token=" + token;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        HttpEntity<byte[]> entity = new HttpEntity<>(imageBytes, headers);

        String raw = restTemplate.postForEntity(url, entity, String.class).getBody();
        parseAndThrow(raw, "图片");
    }

    private void parseAndThrow(String raw, String type) {
        if (raw == null) return;
        try {
            Map<?, ?> result = objectMapper.readValue(raw, Map.class);
            Object errcode = result.get("errcode");
            // errcode 87014 = content risky
            if (errcode instanceof Number && ((Number) errcode).intValue() == 87014) {
                throw BusinessException.badRequest("内容包含违规信息，请修改后重试");
            }
            // 解析 result.suggest（v2 接口返回）
            Object detail = result.get("result");
            if (detail instanceof Map<?, ?> detailMap) {
                Object suggest = detailMap.get("suggest");
                if ("risky".equals(suggest)) {
                    throw BusinessException.badRequest("内容包含违规信息，请修改后重试");
                }
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception ignored) {
            // JSON 解析失败不阻断业务
        }
    }
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
cd backend && mvn test -pl . -Dtest=ContentSafetyServiceTest -q 2>&1 | tail -5
# 期望：BUILD SUCCESS，Tests run: 2, Failures: 0
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/football/team/service/ContentSafetyService.java \
        backend/src/main/java/com/football/team/service/WechatService.java \
        backend/src/test/java/com/football/team/service/ContentSafetyServiceTest.java
git commit -m "feat: add ContentSafetyService for WeChat msgSecCheck and imgSecCheck"
```

---

## Task 6：UGC 接口接入内容安全审核

**Files:**
- Modify: `backend/src/main/java/com/football/team/controller/UploadController.java`
- Modify: `backend/src/main/java/com/football/team/service/UserService.java`
- Modify: `backend/src/main/java/com/football/team/service/TeamService.java`
- Modify: `backend/src/main/java/com/football/team/service/ActivityService.java`

接入点总览：
| 入口 | 文本字段 | 图片 |
|---|---|---|
| `UploadController.uploadAvatar` | — | imgSecCheck(文件字节) |
| `UserService.updateProfile` | nickname | — |
| `TeamService.createTeam` | name + description | — |
| `ActivityService.createActivity` | title + location | — |
| `ActivityService.updateActivity` | title + location | — |

- [ ] **Step 1: 修改 UploadController — 头像图片审核**

读取 `UploadController.java`（当前有 `final OssService ossService`），修改为注入 `ContentSafetyService` 并在上传前审核：

```java
// 修改 UploadController 构造字段：在 ossService 之后添加
private final ContentSafetyService contentSafetyService;

// 修改 uploadAvatar 方法（在 ossService.uploadAvatar 之前插入检查）：
@PostMapping("/avatar")
public ApiResponse<Map<String, String>> uploadAvatar(
        @RequestParam("file") MultipartFile file,
        HttpServletRequest req) {
    User user = (User) req.getAttribute("currentUser");
    if (file.isEmpty()) throw BusinessException.badRequest("文件不能为空");
    try {
        byte[] bytes = file.getBytes();
        contentSafetyService.checkImage(bytes);   // 审核图片
        Long userId = user != null ? user.getId() : null;
        String url = ossService.uploadAvatar(file, userId);
        return ApiResponse.ok(Map.of("url", url));
    } catch (BusinessException e) {
        throw e;
    } catch (IOException e) {
        throw BusinessException.badRequest("上传失败");
    }
}

// 同时添加 import：
// import com.football.team.service.ContentSafetyService;
```

- [ ] **Step 2: 修改 UserService — 昵称审核**

读取 `UserService.java`，在 `updateProfile` 方法中：

1. 注入 `ContentSafetyService`：在 class 内已有的 `@RequiredArgsConstructor` 管理的字段里添加 `private final ContentSafetyService contentSafetyService;`

2. 修改 `updateProfile` 方法：

```java
public void updateProfile(Long userId, UpdateProfileReq req) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> BusinessException.notFound("用户不存在"));
    if (req.getNickname() != null) {
        contentSafetyService.checkText(user.getOpenid(), req.getNickname());
        user.setNickname(req.getNickname());
    }
    if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());
    userRepository.save(user);
}
```

3. 添加 import：`import com.football.team.service.ContentSafetyService;`

- [ ] **Step 3: 修改 TeamService — 创建球队文本审核**

读取 `TeamService.java`，在 `createTeam` 方法中：

1. 注入 `ContentSafetyService`（同上，`@RequiredArgsConstructor` 字段）

2. 修改 `createTeam`：

```java
public Team createTeam(Long userId, CreateTeamReq req) {
    // 先查询用户 openid（用于审核）
    User creator = userRepository.findById(userId)
        .orElseThrow(() -> BusinessException.notFound("用户不存在"));
    contentSafetyService.checkText(creator.getOpenid(), req.getName());
    if (req.getDescription() != null && !req.getDescription().isBlank()) {
        contentSafetyService.checkText(creator.getOpenid(), req.getDescription());
    }
    // ... 原有 createTeam 逻辑不变（创建 team 对象，设置 name、description、inviteCode、logoUrl、save）
    Team team = new Team();
    team.setName(req.getName());
    team.setDescription(req.getDescription() != null ? req.getDescription() : "");
    team.setInviteCode(generateInviteCode());
    if (req.getLogoUrl() != null) team.setLogoUrl(req.getLogoUrl());
    team = teamRepository.save(team);
    TeamMember captain = new TeamMember();
    captain.setTeamId(team.getId());
    captain.setUserId(userId);
    captain.setRole(MemberRole.CAPTAIN);
    captain.setStatus(MemberStatus.ACTIVE);
    teamMemberRepository.save(captain);
    return team;
}
```

**注意：** 先读取现有的 `createTeam` 方法看完整实现，在保持原有逻辑的基础上在开头加上审核调用。`userRepository` 已经在 `TeamService` 中注入（用于 `getTeamByInviteCode` 等）。

3. 添加 imports：
```java
import com.football.team.service.ContentSafetyService;
import com.football.team.entity.User;
```

- [ ] **Step 4: 修改 ActivityService — 创建/更新活动文本审核**

读取 `ActivityService.java`，找到 `createActivity` 和 `updateActivity` 方法：

1. 注入 `ContentSafetyService`

2. 在 `createActivity` 方法开头（`a.setTitle` 之前），查出 creator 的 openid 并审核：

```java
// 在 createActivity 开头加：
User creator = userRepository.findById(creatorId)
    .orElseThrow(() -> BusinessException.notFound("用户不存在"));
contentSafetyService.checkText(creator.getOpenid(), req.getTitle());
contentSafetyService.checkText(creator.getOpenid(), req.getLocation());
```

3. 在 `updateActivity` 方法开头，取当前用户 openid 审核（`updateActivity` 没有 userId 参数，改为从 Activity 的 creatorId 获取）：

```java
// 在 updateActivity 开头加（activity 已查出后）：
User creator = userRepository.findById(activity.getCreatorId())
    .orElseThrow(() -> BusinessException.notFound("用户不存在"));
contentSafetyService.checkText(creator.getOpenid(), req.getTitle());
contentSafetyService.checkText(creator.getOpenid(), req.getLocation());
```

**注意：** 先读 ActivityService 完整代码，确认 `userRepository` 是否已注入，如未注入则添加字段。

4. 添加 imports：
```java
import com.football.team.service.ContentSafetyService;
import com.football.team.entity.User;
```

- [ ] **Step 5: 编译 + 全量测试**

```bash
cd backend && mvn test -q 2>&1 | grep -E "Tests run:|BUILD" | tail -10
# 期望：BUILD SUCCESS，所有测试通过（注意：ContentSafetyService 在 dev_mock 下跳过审核，不影响现有测试）
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/football/team/controller/UploadController.java \
        backend/src/main/java/com/football/team/service/UserService.java \
        backend/src/main/java/com/football/team/service/TeamService.java \
        backend/src/main/java/com/football/team/service/ActivityService.java
git commit -m "feat: integrate content safety checks into UGC entry points"
```

---

## Task 7：微信隐私弹窗组件

**Files:**
- Create: `frontend/src/components/PrivacyPopup/index.tsx`
- Modify: `frontend/src/app.tsx`

- [ ] **Step 1: 创建 PrivacyPopup 组件**

```typescript
// frontend/src/components/PrivacyPopup/index.tsx
import { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { px } from '../../utils/style'

const AGREED_KEY = 'privacy_agreed'

const C = {
  overlay: 'rgba(0,0,0,0.7)', surface: '#181c18',
  text: '#e8ede8', text2: '#8a9e8a', primary: '#22c55e',
  border: 'rgba(255,255,255,0.09)',
}

export default function PrivacyPopup() {
  const [visible, setVisible] = useState(false)
  const [resolver, setResolver] = useState<((agreed: boolean) => void) | null>(null)

  useEffect(() => {
    // 微信基础库 2.33.0+ onNeedPrivacyAuthorization 事件
    const wx = (Taro as unknown as { $global?: { wx?: Record<string, unknown> } }).$global?.wx
    if (!wx || typeof wx['onNeedPrivacyAuthorization'] !== 'function') return

    ;(wx['onNeedPrivacyAuthorization'] as (cb: (resolve: (info: { event: string }) => void) => void) => void)(
      (resolve) => {
        // 检查本次启动是否已同意
        const agreed = Taro.getStorageSync(AGREED_KEY)
        if (agreed) {
          resolve({ event: 'agree' })
          return
        }
        setVisible(true)
        setResolver(() => (agree: boolean) => {
          Taro.setStorageSync(AGREED_KEY, agree ? '1' : '')
          resolve({ event: agree ? 'agree' : 'disagree' })
          setVisible(false)
        })
      }
    )
  }, [])

  if (!visible) return null

  return (
    <View style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: C.overlay, zIndex: 9999,
      display: 'flex', alignItems: 'flex-end',
    }}>
      <View style={{
        background: C.surface, borderRadius: `${px(24)} ${px(24)} 0 0`,
        padding: px(32), width: '100%', boxSizing: 'border-box',
        border: `1px solid ${C.border}`,
      }}>
        <Text style={{ fontSize: px(34), fontWeight: '800', color: C.text, display: 'block', marginBottom: px(16) }}>
          用户隐私保护提示
        </Text>
        <Text style={{ fontSize: px(26), color: C.text2, lineHeight: px(44), display: 'block', marginBottom: px(28) }}>
          感谢您使用「足球队」小程序。在使用前，请阅读并同意我们的
          <Text
            style={{ color: C.primary }}
            onClick={() => Taro.navigateTo({ url: '/pages/privacy/index' })}
          >《隐私政策》</Text>
          ，了解我们如何收集和使用您的信息。
        </Text>
        <View style={{ display: 'flex', gap: px(16) }}>
          <Button
            style={{
              flex: 1, background: 'rgba(255,255,255,0.07)', color: C.text2,
              borderRadius: px(12), border: `1px solid ${C.border}`,
              fontSize: px(30), fontWeight: '600',
            }}
            onClick={() => resolver?.(false)}
          >
            不同意
          </Button>
          <Button
            style={{
              flex: 2, background: C.primary, color: '#0f1010',
              borderRadius: px(12), border: 'none',
              fontSize: px(30), fontWeight: '700',
            }}
            onClick={() => resolver?.(true)}
          >
            同意并继续
          </Button>
        </View>
      </View>
    </View>
  )
}
```

- [ ] **Step 2: 在 app.tsx 引入 PrivacyPopup**

将 `frontend/src/app.tsx` 修改为：

```typescript
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
```

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npm run build:weapp 2>&1 | tail -10
# 期望：Compiled successfully
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/PrivacyPopup/ frontend/src/app.tsx
git commit -m "feat: add WeChat privacy popup component"
```

---

## 自检清单

- [x] P0-需求1：app.tsx 移除强制登录跳转 → Task 4
- [x] P0-需求1：首页未登录显示公开视图 → Task 4
- [x] P0-需求2：隐私政策页面 `/pages/privacy/index` → Task 1
- [x] P0-需求3：用户协议页面 `/pages/terms/index` → Task 2
- [x] P0-需求4：登录页协议勾选 + 链接 → Task 3
- [x] P1-需求5：ContentSafetyService (msgSecCheck + imgSecCheck) → Task 5
- [x] P1-需求5：接入 5 个 UGC 入口 → Task 6
- [x] P2-需求6：微信隐私弹窗组件 → Task 7
- [x] dev_mock 模式下内容安全审核全部跳过，不影响本地开发和现有测试
- [x] 两个静态页面无需登录即可访问（app.tsx 已移除全局拦截）
