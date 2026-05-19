# 微信头像昵称获取与修改 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 替换废弃的 `Taro.getUserProfile()`，使用微信新组件获取真实头像昵称，并在"我的"页提供编辑能力。

**Architecture:** 后端新增 OSS 上传接口（`POST /api/v1/upload/avatar`）和更新个人资料接口（`PUT /api/v1/users/me`）；前端登录页改为展示 chooseAvatar 按钮 + nickname 输入框，编辑在"我的"页内联遮罩完成。

**Tech Stack:** Spring Boot 3.2.5 / Java 17 / aliyun-sdk-oss 3.17.4 / Taro 3.6 / Zustand 4 / TypeScript

---

## 文件结构

| 操作 | 文件 |
|------|------|
| 新建 | `backend/.../config/OssConfig.java` |
| 新建 | `backend/.../config/OssProperties.java` |
| 新建 | `backend/.../service/OssService.java` |
| 新建 | `backend/.../dto/req/UpdateProfileReq.java` |
| 新建 | `backend/.../controller/UploadController.java` |
| 新建 | `backend/src/test/.../service/OssServiceTest.java` |
| 新建 | `backend/src/test/.../service/UserServiceTest.java` |
| 修改 | `backend/pom.xml` |
| 修改 | `backend/src/main/resources/application.yml` |
| 修改 | `backend/src/main/resources/application-dev.yml` |
| 修改 | `backend/.../service/UserService.java` |
| 修改 | `backend/.../controller/UserController.java` |
| 新建 | `frontend/src/api/upload.ts` |
| 修改 | `frontend/src/api/user.ts` |
| 修改 | `frontend/src/pages/login/index.tsx` |
| 修改 | `frontend/src/pages/my/index.tsx` |

---

### Task 1: 后端 OSS 依赖 + 配置 + OssService

**Files:**
- Modify: `backend/pom.xml`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/main/resources/application-dev.yml`
- Create: `backend/src/main/java/com/football/team/config/OssProperties.java`
- Create: `backend/src/main/java/com/football/team/config/OssConfig.java`
- Create: `backend/src/main/java/com/football/team/service/OssService.java`
- Create: `backend/src/test/java/com/football/team/service/OssServiceTest.java`

- [ ] **Step 1: 在 pom.xml 中添加 aliyun-sdk-oss 依赖**

在 `</dependencies>` 之前插入（参考现有依赖块格式，位于最后一个 dependency 后）：

```xml
<dependency>
  <groupId>com.aliyun.oss</groupId>
  <artifactId>aliyun-sdk-oss</artifactId>
  <version>3.17.4</version>
</dependency>
```

- [ ] **Step 2: 在 application.yml 中添加 oss 配置块**

在文件末尾追加（保持与 `wechat:` 块同级缩进）：

```yaml
oss:
  endpoint: ${OSS_ENDPOINT}
  access-key-id: ${OSS_KEY_ID}
  access-key-secret: ${OSS_KEY_SECRET}
  bucket-name: ${OSS_BUCKET}
  base-url: ${OSS_BASE_URL}
```

- [ ] **Step 3: 在 application-dev.yml 中填入真实配置**

在文件末尾追加（替换为你的实际 OSS 信息）：

```yaml
oss:
  endpoint: https://oss-cn-hangzhou.aliyuncs.com
  access-key-id: ${OSS_KEY_ID:your-key-id}
  access-key-secret: ${OSS_KEY_SECRET:your-key-secret}
  bucket-name: your-bucket-name
  base-url: https://your-bucket.oss-cn-hangzhou.aliyuncs.com
```

- [ ] **Step 4: 创建 OssProperties**

创建文件 `backend/src/main/java/com/football/team/config/OssProperties.java`：

```java
package com.football.team.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "oss")
public class OssProperties {
    private String endpoint;
    private String accessKeyId;
    private String accessKeySecret;
    private String bucketName;
    private String baseUrl;
}
```

- [ ] **Step 5: 创建 OssConfig**

创建文件 `backend/src/main/java/com/football/team/config/OssConfig.java`：

```java
package com.football.team.config;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(OssProperties.class)
@RequiredArgsConstructor
public class OssConfig {

    private final OssProperties ossProperties;

    @Bean
    public OSS ossClient() {
        return new OSSClientBuilder().build(
            ossProperties.getEndpoint(),
            ossProperties.getAccessKeyId(),
            ossProperties.getAccessKeySecret()
        );
    }
}
```

- [ ] **Step 6: 写 OssServiceTest（先写测试）**

创建文件 `backend/src/test/java/com/football/team/service/OssServiceTest.java`：

```java
package com.football.team.service;

import com.aliyun.oss.OSS;
import com.football.team.config.OssProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OssServiceTest {

    @Mock OSS ossClient;
    @Mock OssProperties ossProperties;
    @InjectMocks OssService ossService;

    @Test
    void uploadAvatar_returnsOssUrlWithCorrectKeyAndExtension() throws IOException {
        when(ossProperties.getBucketName()).thenReturn("test-bucket");
        when(ossProperties.getBaseUrl()).thenReturn("https://test.oss.aliyuncs.com");

        MockMultipartFile file = new MockMultipartFile(
            "file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});

        String url = ossService.uploadAvatar(file, 42L);

        verify(ossClient).putObject(
            eq("test-bucket"),
            argThat(key -> key.startsWith("avatars/42_") && key.endsWith(".jpg")),
            any(InputStream.class)
        );
        assertThat(url).startsWith("https://test.oss.aliyuncs.com/avatars/42_");
        assertThat(url).endsWith(".jpg");
    }

    @Test
    void uploadAvatar_defaultsToJpgExtensionWhenNoExtension() throws IOException {
        when(ossProperties.getBucketName()).thenReturn("test-bucket");
        when(ossProperties.getBaseUrl()).thenReturn("https://test.oss.aliyuncs.com");

        MockMultipartFile file = new MockMultipartFile(
            "file", "photo", "image/jpeg", new byte[]{1, 2, 3});

        String url = ossService.uploadAvatar(file, 1L);

        assertThat(url).endsWith(".jpg");
    }
}
```

- [ ] **Step 7: 运行测试，确认失败（OssService 尚未创建）**

```bash
cd backend && mvn test -pl . -Dtest=OssServiceTest -q 2>&1 | tail -5
```

Expected: `OssServiceTest` 编译失败或找不到类

- [ ] **Step 8: 创建 OssService**

创建文件 `backend/src/main/java/com/football/team/service/OssService.java`：

```java
package com.football.team.service;

import com.aliyun.oss.OSS;
import com.football.team.config.OssProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class OssService {

    private final OSS ossClient;
    private final OssProperties ossProperties;

    public String uploadAvatar(MultipartFile file, Long userId) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        String key = "avatars/" + userId + "_" + System.currentTimeMillis() + ext;
        ossClient.putObject(ossProperties.getBucketName(), key, file.getInputStream());
        return ossProperties.getBaseUrl() + "/" + key;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }
}
```

- [ ] **Step 9: 运行测试，确认通过**

```bash
cd backend && mvn test -pl . -Dtest=OssServiceTest -q 2>&1 | tail -5
```

Expected: `BUILD SUCCESS`, 2 tests passed

- [ ] **Step 10: Commit**

```bash
cd backend && git add pom.xml src/main/resources/application.yml src/main/resources/application-dev.yml \
  src/main/java/com/football/team/config/OssProperties.java \
  src/main/java/com/football/team/config/OssConfig.java \
  src/main/java/com/football/team/service/OssService.java \
  src/test/java/com/football/team/service/OssServiceTest.java
git commit -m "feat: add OSS config and OssService for avatar upload"
```

---

### Task 2: 后端 UploadController

**Files:**
- Create: `backend/src/main/java/com/football/team/controller/UploadController.java`

- [ ] **Step 1: 创建 UploadController**

创建文件 `backend/src/main/java/com/football/team/controller/UploadController.java`：

```java
package com.football.team.controller;

import com.football.team.dto.res.ApiResponse;
import com.football.team.entity.User;
import com.football.team.exception.BusinessException;
import com.football.team.service.OssService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    private final OssService ossService;

    @PostMapping("/avatar")
    public ApiResponse<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest req) {
        User user = (User) req.getAttribute("currentUser");
        if (user == null) throw BusinessException.unauthorized("请先登录");
        if (file.isEmpty()) throw BusinessException.badRequest("文件不能为空");
        try {
            String url = ossService.uploadAvatar(file, user.getId());
            return ApiResponse.ok(Map.of("url", url));
        } catch (IOException e) {
            throw BusinessException.badRequest("上传失败");
        }
    }
}
```

- [ ] **Step 2: 确认现有测试仍然通过**

```bash
cd backend && mvn test -q 2>&1 | tail -5
```

Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
cd backend && git add src/main/java/com/football/team/controller/UploadController.java
git commit -m "feat: add UploadController for avatar upload to OSS"
```

---

### Task 3: 后端 UpdateProfile 端点

**Files:**
- Create: `backend/src/main/java/com/football/team/dto/req/UpdateProfileReq.java`
- Modify: `backend/src/main/java/com/football/team/service/UserService.java`
- Modify: `backend/src/main/java/com/football/team/controller/UserController.java`
- Create: `backend/src/test/java/com/football/team/service/UserServiceTest.java`

- [ ] **Step 1: 创建 UpdateProfileReq DTO**

创建文件 `backend/src/main/java/com/football/team/dto/req/UpdateProfileReq.java`：

```java
package com.football.team.dto.req;

import lombok.Data;

@Data
public class UpdateProfileReq {
    private String nickname;
    private String avatarUrl;
}
```

- [ ] **Step 2: 写 UserServiceTest（先写测试）**

创建文件 `backend/src/test/java/com/football/team/service/UserServiceTest.java`：

```java
package com.football.team.service;

import com.football.team.dto.req.UpdateProfileReq;
import com.football.team.entity.User;
import com.football.team.exception.BusinessException;
import com.football.team.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock TeamRepository teamRepository;
    @Mock ActivityRegistrationRepository regRepository;
    @Mock ActivityRepository activityRepository;
    @Mock MatchResultRepository matchResultRepository;
    @InjectMocks UserService userService;

    @Test
    void updateProfile_updatesNicknameAndAvatar() {
        User user = new User();
        user.setId(1L);
        user.setNickname("old");
        user.setAvatarUrl("old-url");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UpdateProfileReq req = new UpdateProfileReq();
        req.setNickname("new");
        req.setAvatarUrl("https://oss.example.com/avatars/1_123.jpg");

        userService.updateProfile(1L, req);

        assertThat(user.getNickname()).isEqualTo("new");
        assertThat(user.getAvatarUrl()).isEqualTo("https://oss.example.com/avatars/1_123.jpg");
        verify(userRepository).save(user);
    }

    @Test
    void updateProfile_nullFields_notUpdated() {
        User user = new User();
        user.setId(1L);
        user.setNickname("old");
        user.setAvatarUrl("old-url");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UpdateProfileReq req = new UpdateProfileReq();
        req.setNickname("new-name"); // only nickname

        userService.updateProfile(1L, req);

        assertThat(user.getNickname()).isEqualTo("new-name");
        assertThat(user.getAvatarUrl()).isEqualTo("old-url");
        verify(userRepository).save(user);
    }

    @Test
    void updateProfile_userNotFound_throwsNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        UpdateProfileReq req = new UpdateProfileReq();
        req.setNickname("name");

        assertThrows(BusinessException.class, () -> userService.updateProfile(99L, req));
    }
}
```

- [ ] **Step 3: 运行测试，确认失败（方法不存在）**

```bash
cd backend && mvn test -pl . -Dtest=UserServiceTest -q 2>&1 | tail -5
```

Expected: 编译失败，`updateProfile` 方法未定义

- [ ] **Step 4: 在 UserService 中添加 updateProfile 方法**

在 `backend/src/main/java/com/football/team/service/UserService.java` 的 `getStats` 方法之后追加：

```java
@Transactional
public void updateProfile(Long userId, UpdateProfileReq req) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> BusinessException.notFound("用户不存在"));
    if (req.getNickname() != null) user.setNickname(req.getNickname());
    if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());
    userRepository.save(user);
}
```

同时在文件顶部 import 区域添加（如不存在）：

```java
import com.football.team.dto.req.UpdateProfileReq;
```

注意：`UserService` 类级别标注了 `@Transactional(readOnly = true)`，方法级 `@Transactional` 覆盖为可写事务。

- [ ] **Step 5: 运行测试，确认通过**

```bash
cd backend && mvn test -pl . -Dtest=UserServiceTest -q 2>&1 | tail -5
```

Expected: `BUILD SUCCESS`, 3 tests passed

- [ ] **Step 6: 在 UserController 中添加 PUT /me 端点**

在 `backend/src/main/java/com/football/team/controller/UserController.java` 的 `stats` 方法之后追加：

```java
@PutMapping("/me")
public ApiResponse<Void> updateProfile(@RequestBody UpdateProfileReq req,
                                       HttpServletRequest request) {
    User user = (User) request.getAttribute("currentUser");
    if (user == null) throw BusinessException.unauthorized("请先登录");
    userService.updateProfile(user.getId(), req);
    return ApiResponse.ok(null);
}
```

同时在文件顶部 import 区域添加：

```java
import com.football.team.dto.req.UpdateProfileReq;
```

- [ ] **Step 7: 运行全量测试，确认通过**

```bash
cd backend && mvn test -q 2>&1 | tail -5
```

Expected: `BUILD SUCCESS`

- [ ] **Step 8: Commit**

```bash
cd backend && git add \
  src/main/java/com/football/team/dto/req/UpdateProfileReq.java \
  src/main/java/com/football/team/service/UserService.java \
  src/main/java/com/football/team/controller/UserController.java \
  src/test/java/com/football/team/service/UserServiceTest.java
git commit -m "feat: add PUT /api/v1/users/me for profile update"
```

---

### Task 4: 前端 Upload API + updateProfile API

**Files:**
- Create: `frontend/src/api/upload.ts`
- Modify: `frontend/src/api/user.ts`

- [ ] **Step 1: 创建 frontend/src/api/upload.ts**

```ts
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
```

- [ ] **Step 2: 在 frontend/src/api/user.ts 中添加 updateProfile**

将文件替换为：

```ts
import { api } from './client'
import type { UserProfileRes, MyStatsRes } from '../types/api'

export const userApi = {
  me: () => api.get<UserProfileRes>('/api/v1/users/me', false),
  stats: (teamId: number) =>
    api.get<MyStatsRes>(`/api/v1/users/me/stats?teamId=${teamId}`, false),
  updateProfile: (body: { nickname?: string; avatarUrl?: string }) =>
    api.put<void>('/api/v1/users/me', body as Record<string, unknown>, false),
}
```

- [ ] **Step 3: TypeScript 编译检查**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: 无错误输出

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/api/upload.ts src/api/user.ts
git commit -m "feat: add upload API and userApi.updateProfile"
```

---

### Task 5: 前端登录页改版

**Files:**
- Modify: `frontend/src/pages/login/index.tsx`

登录页需要展示头像选择区 + 昵称输入框，替换原来的 `getUserProfile` 调用。

**关键状态：**
- `avatarTmp`: 用户本次通过 chooseAvatar 选择的临时路径（空 = 未重新选择）
- 从 `useAuthStore` 读取 `avatarUrl`（已有存储值，返回用户可复用）
- 按钮禁用条件：`(!avatarTmp && !storedAvatarUrl) || !nickname.trim()`

- [ ] **Step 1: 将 login/index.tsx 替换为新版本**

```tsx
import { useState } from 'react'
import { View, Text, Button, Image, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authApi } from '../../api/auth'
import { uploadApi } from '../../api/upload'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [avatarTmp, setAvatarTmp] = useState('')
  const [nickname, setNickname] = useState('')
  const { setAuth, setTeams, avatarUrl: storedAvatarUrl } = useAuthStore()
  const t = useT()

  const avatarDisplay = avatarTmp || storedAvatarUrl || ''
  const canLogin = !!(avatarTmp || storedAvatarUrl) && !!nickname.trim() && !loading

  const handleLogin = async () => {
    if (!canLogin) return
    setLoading(true)
    try {
      let ossUrl = storedAvatarUrl ?? ''
      if (avatarTmp) {
        const { url } = await uploadApi.avatar(avatarTmp)
        ossUrl = url
      }
      const { code } = await Taro.login()
      const res = await authApi.login(code, nickname.trim(), ossUrl)
      setAuth(res.token, res.userId, res.nickname, ossUrl)
      setTeams(res.teams)

      if (res.teams.length === 0) {
        Taro.reLaunch({ url: '/pages/onboard/index' })
      } else if (res.teams.length === 1) {
        useAuthStore.getState().setCurrentTeam(res.teams[0].teamId, res.teams[0].role)
        Taro.reLaunch({ url: '/pages/home/index' })
      } else {
        Taro.reLaunch({ url: '/pages/team-select/index' })
      }
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : t('login.fail'), icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                   justifyContent: 'center', height: '100vh', background: '#f5f5f5' }}>
      <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#333',
                     marginBottom: '32px' }}>{t('login.title')}</Text>

      {/* 头像选择 */}
      <Button
        openType="chooseAvatar"
        onChooseAvatar={(e) => setAvatarTmp((e as unknown as { detail: { avatarUrl: string } }).detail.avatarUrl)}
        style={{ background: 'transparent', border: 'none', padding: 0,
                 width: '88px', height: '88px', borderRadius: '50%', marginBottom: '16px' }}
      >
        {avatarDisplay
          ? <Image src={avatarDisplay} style={{ width: '88px', height: '88px', borderRadius: '50%' }} />
          : <View style={{ width: '88px', height: '88px', borderRadius: '50%',
                           background: '#e0e0e0', display: 'flex', alignItems: 'center',
                           justifyContent: 'center', fontSize: '32px' }}>👤</View>
        }
      </Button>
      <Text style={{ fontSize: '12px', color: '#999', marginBottom: '24px' }}>
        {t('login.tap_avatar')}
      </Text>

      {/* 昵称输入 */}
      <Input
        type="nickname"
        value={nickname}
        onInput={(e) => setNickname(e.detail.value)}
        placeholder={t('login.nickname_placeholder')}
        style={{ background: '#fff', borderRadius: '8px', padding: '12px 16px',
                 fontSize: '16px', width: '240px', marginBottom: '32px',
                 border: '1px solid #e0e0e0' }}
      />

      {/* 登录按钮 */}
      <Button
        style={{ background: canLogin ? '#4CAF50' : '#ccc', color: '#fff',
                 borderRadius: '24px', padding: '12px 48px', fontSize: '16px',
                 border: 'none', opacity: loading ? 0.7 : 1 }}
        loading={loading}
        disabled={!canLogin}
        onClick={handleLogin}
      >
        {t('login.btn')}
      </Button>
    </View>
  )
}
```

- [ ] **Step 2: 在 i18n/zh.ts 中添加新 key**

在 `login` 相关键值附近添加（找到 `login.btn` 所在 object，追加）：

```ts
'login.tap_avatar': '点击设置头像',
'login.nickname_placeholder': '请输入昵称',
```

- [ ] **Step 3: 在 i18n/en.ts 中添加对应英文 key**

```ts
'login.tap_avatar': 'Tap to set avatar',
'login.nickname_placeholder': 'Enter nickname',
```

- [ ] **Step 4: TypeScript 编译检查**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: 无错误

- [ ] **Step 5: Commit**

```bash
cd frontend && git add src/pages/login/index.tsx src/i18n/zh.ts src/i18n/en.ts
git commit -m "feat: redesign login page with WeChat chooseAvatar and nickname input"
```

---

### Task 6: 前端"我的"页编辑遮罩

**Files:**
- Modify: `frontend/src/pages/my/index.tsx`

在"我的"页顶部头像/昵称区域添加点击事件，弹出内联遮罩（`position: fixed` 全屏半透明背景 + 白色卡片）供用户修改头像和昵称。

- [ ] **Step 1: 将 my/index.tsx 替换为新版本**

```tsx
import { useState } from 'react'
import { View, Text, Button, Image, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { userApi } from '../../api/user'
import { uploadApi } from '../../api/upload'
import { useAuthStore } from '../../store/auth'
import { useT } from '../../i18n/useT'
import { useLangStore } from '../../store/lang'
import type { MyStatsRes, MemberRole } from '../../types/api'

export default function MyPage() {
  const [stats, setStats] = useState<MyStatsRes | null>(null)
  const { nickname, avatarUrl, token, userId, currentTeamId, currentRole,
          teams, setCurrentTeam, setTeams, setAuth, clear } = useAuthStore()
  const t = useT()
  const { language, setLanguage } = useLangStore()

  // 编辑遮罩状态
  const [editing, setEditing] = useState(false)
  const [draftAvatarTmp, setDraftAvatarTmp] = useState('')
  const [draftNickname, setDraftNickname] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!currentTeamId) return
    try {
      const s = await userApi.stats(currentTeamId)
      setStats(s)
    } catch {
      // non-critical
    }
    try {
      const profile = await userApi.me()
      setTeams(profile.teams)
    } catch {
      // non-critical
    }
  }

  useDidShow(load)

  const openEdit = () => {
    setDraftAvatarTmp('')
    setDraftNickname(nickname ?? '')
    setEditing(true)
  }

  const saveProfile = async () => {
    if (saving) return
    setSaving(true)
    try {
      let ossUrl: string | undefined
      if (draftAvatarTmp) {
        const { url } = await uploadApi.avatar(draftAvatarTmp)
        ossUrl = url
      }
      await userApi.updateProfile({
        nickname: draftNickname || undefined,
        avatarUrl: ossUrl,
      })
      setAuth(token!, userId!, draftNickname || nickname!, ossUrl ?? avatarUrl ?? '')
      setEditing(false)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const switchTeam = (teamId: number, role: MemberRole) => {
    setCurrentTeam(teamId, role)
    Taro.reLaunch({ url: '/pages/home/index' })
  }

  const roleLabel = (role: MemberRole) =>
    role === 'CAPTAIN' ? t('my.captain') : role === 'ADMIN' ? t('my.admin') : t('my.player')

  const logout = () => {
    Taro.showModal({
      title: t('my.logout_title'),
      content: t('my.logout_content'),
      success: ({ confirm }) => {
        if (confirm) {
          clear()
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      }
    })
  }

  const leaveTeam = () => {
    if (currentRole === 'CAPTAIN') {
      Taro.showToast({ title: t('my.leave_captain'), icon: 'none' })
      return
    }
    if (!currentTeamId) return
    Taro.showModal({
      title: t('my.leave_title'),
      content: t('my.leave_content'),
      success: async ({ confirm }) => {
        if (!confirm) return
        try {
          const { teamApi } = await import('../../api/team')
          await teamApi.leave(currentTeamId)
          Taro.showToast({ title: '已退出球队', icon: 'success' })
          setTimeout(() => {
            clear()
            Taro.reLaunch({ url: '/pages/login/index' })
          }, 1000)
        } catch (e: unknown) {
          Taro.showToast({ title: e instanceof Error ? e.message : t('common.error'), icon: 'none' })
        }
      }
    })
  }

  const switchLanguage = () => {
    Taro.showActionSheet({
      itemList: [t('my.lang_zh'), t('my.lang_en')],
      success: ({ tapIndex }) => {
        const lang: 'zh' | 'en' = tapIndex === 0 ? 'zh' : 'en'
        setLanguage(lang)
        Taro.setNavigationBarTitle({ title: lang === 'zh' ? '我的' : 'My' })
      },
    })
  }

  const draftAvatarDisplay = draftAvatarTmp || avatarUrl || ''

  return (
    <View style={{ height: '100vh', overflow: 'auto' }}>
      {/* Profile header — 点击进入编辑 */}
      <View
        onClick={openEdit}
        style={{ background: '#4CAF50', padding: '32px 16px 24px',
                 display: 'flex', alignItems: 'center', gap: '16px' }}
      >
        {avatarUrl
          ? <Image src={avatarUrl} style={{ width: '56px', height: '56px', borderRadius: '50%' }} />
          : <Text style={{ fontSize: '56px' }}>👤</Text>
        }
        <View>
          <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', display: 'block' }}>
            {nickname ?? '球员'}
          </Text>
          <Text style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)' }}>
            {roleLabel(currentRole ?? 'PLAYER')}
          </Text>
        </View>
        <Text style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.7)', fontSize: '12px' }}>
          {t('my.edit')} ›
        </Text>
      </View>

      {/* Match stats */}
      {stats && (
        <View style={{ background: '#fff', margin: '12px 16px', borderRadius: '8px', padding: '16px' }}>
          <Text style={{ fontSize: '15px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>
            {t('my.stats')}
          </Text>
          <View style={{ display: 'flex', textAlign: 'center' }}>
            {[
              { label: t('my.matches'), value: stats.totalMatches, color: '#333' },
              { label: t('my.wins'),    value: stats.wins,         color: '#4CAF50' },
              { label: t('my.draws'),   value: stats.draws,        color: '#FF9800' },
              { label: t('my.losses'),  value: stats.losses,       color: '#f44336' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1 }}>
                <Text style={{ fontSize: '24px', fontWeight: 'bold', color: s.color, display: 'block' }}>
                  {s.value}
                </Text>
                <Text style={{ fontSize: '12px', color: '#999' }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Team list */}
      <View style={{ background: '#fff', margin: '0 16px 12px', borderRadius: '8px', padding: '16px' }}>
        <Text style={{ fontSize: '15px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>
          {t('my.teams')}
        </Text>
        {teams.map(tm => (
          <View key={tm.teamId} onClick={() => switchTeam(tm.teamId, tm.role)}
                style={{ display: 'flex', alignItems: 'center', padding: '10px 0',
                         borderBottom: '1px solid #f5f5f5' }}>
            <Text style={{ fontSize: '24px', marginRight: '12px' }}>⚽</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: '14px', display: 'block' }}>{tm.teamName}</Text>
              <Text style={{ fontSize: '12px', color: '#999' }}>{roleLabel(tm.role)}</Text>
            </View>
            {tm.teamId === currentTeamId && (
              <Text style={{ fontSize: '12px', color: '#4CAF50' }}>{t('my.current')}</Text>
            )}
          </View>
        ))}
        <View onClick={() => Taro.navigateTo({ url: '/pages/onboard/index' })}
              style={{ textAlign: 'center', padding: '12px 0', color: '#4CAF50', fontSize: '14px' }}>
          {t('my.join_create')}
        </View>
      </View>

      {/* Language switcher */}
      <View onClick={switchLanguage}
            style={{ background: '#fff', margin: '0 16px 12px', borderRadius: '8px',
                     padding: '14px 16px', display: 'flex', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: '14px' }}>{t('my.language')}</Text>
        <Text style={{ fontSize: '14px', color: '#999' }}>
          {language === 'zh' ? t('my.lang_zh') : t('my.lang_en')} ›
        </Text>
      </View>

      {/* Action buttons */}
      <View style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Button style={{ background: '#fff', color: '#f44336', border: '1px solid #fecaca',
                         borderRadius: '8px', fontSize: '14px' }}
                onClick={leaveTeam}>
          {t('my.leave')}
        </Button>
        <Button style={{ background: '#f5f5f5', color: '#999', border: 'none',
                         borderRadius: '8px', fontSize: '14px' }}
                onClick={logout}>
          {t('my.logout')}
        </Button>
      </View>

      {/* 编辑遮罩 */}
      {editing && (
        <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                       background: 'rgba(0,0,0,.5)', display: 'flex',
                       alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <View style={{ background: '#fff', borderRadius: '12px', padding: '24px',
                         width: '280px', display: 'flex', flexDirection: 'column',
                         alignItems: 'center', gap: '16px' }}>
            <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>{t('my.edit_profile')}</Text>

            {/* 头像选择 */}
            <Button
              openType="chooseAvatar"
              onChooseAvatar={(e) => setDraftAvatarTmp((e as unknown as { detail: { avatarUrl: string } }).detail.avatarUrl)}
              style={{ background: 'transparent', border: 'none', padding: 0,
                       width: '80px', height: '80px', borderRadius: '50%' }}
            >
              {draftAvatarDisplay
                ? <Image src={draftAvatarDisplay} style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
                : <View style={{ width: '80px', height: '80px', borderRadius: '50%',
                                 background: '#e0e0e0', display: 'flex', alignItems: 'center',
                                 justifyContent: 'center', fontSize: '28px' }}>👤</View>
              }
            </Button>

            {/* 昵称输入 */}
            <Input
              type="nickname"
              value={draftNickname}
              onInput={(e) => setDraftNickname(e.detail.value)}
              placeholder={t('login.nickname_placeholder')}
              style={{ border: '1px solid #e0e0e0', borderRadius: '8px',
                       padding: '10px 12px', fontSize: '15px', width: '100%' }}
            />

            {/* 按钮 */}
            <View style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <Button
                style={{ flex: 1, background: '#f5f5f5', color: '#666', border: 'none',
                         borderRadius: '8px', fontSize: '14px' }}
                onClick={() => setEditing(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                style={{ flex: 1, background: '#4CAF50', color: '#fff', border: 'none',
                         borderRadius: '8px', fontSize: '14px' }}
                loading={saving}
                onClick={saveProfile}
              >
                {t('common.save')}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
```

- [ ] **Step 2: 在 i18n/zh.ts 中添加新 key**

找到 `my.lang_title` 所在行之后追加（`common.cancel` / `common.save` 已存在，无需重复添加）：

```ts
'my.edit': '编辑',
'my.edit_profile': '编辑个人资料',
```

- [ ] **Step 3: 在 i18n/en.ts 中添加对应英文 key**

同样在 `my.*` 区域末尾追加：

```ts
'my.edit': 'Edit',
'my.edit_profile': 'Edit Profile',
```

- [ ] **Step 4: TypeScript 编译检查**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: 无错误

- [ ] **Step 5: Commit**

```bash
cd frontend && git add src/pages/my/index.tsx src/i18n/zh.ts src/i18n/en.ts
git commit -m "feat: add profile edit modal in My page"
```
