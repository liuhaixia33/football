# 微信头像昵称获取与修改 Design Spec

## 概述

替换已废弃的 `Taro.getUserProfile()`（微信基础库 2.27.1+ 不再可用），改用微信官方新组件获取真实头像和昵称。同时在"我的"页面提供编辑入口，用户可随时更新个人资料。

---

## 约束与边界

- 登录时头像和昵称**强制设置**，两者均非空才能点击登录按钮
- 头像选择使用 `Button open-type="chooseAvatar"`，昵称输入使用 `Input type="nickname"`（WeChat 官方新 API）
- `chooseAvatar` 返回设备临时路径，必须上传到 OSS 后才能持久化
- "我的"页编辑为**遮罩内联**，点击头像/昵称区域弹出，有保存按钮
- 编辑时头像未变化则不重新上传（节省流量）
- 后端字段均为可选更新（PATCH 语义），传什么改什么

---

## 头像上传流程

```
前端 chooseAvatar → 得到临时路径
  → Taro.uploadFile → POST /api/v1/upload/avatar (multipart)
  → 后端 OssService.uploadAvatar() → 存到 OSS
  → 返回 { url: "https://xxx.oss-cn-xxx.aliyuncs.com/avatars/..." }
  → 前端用 OSS URL 继续后续操作
```

---

## 后端

### 新增依赖（`pom.xml`）

```xml
<dependency>
  <groupId>com.aliyun.oss</groupId>
  <artifactId>aliyun-sdk-oss</artifactId>
  <version>3.17.4</version>
</dependency>
```

### 配置（`application.properties`）

```properties
oss.endpoint=https://oss-cn-xxx.aliyuncs.com
oss.access-key-id=${OSS_KEY_ID}
oss.access-key-secret=${OSS_KEY_SECRET}
oss.bucket-name=${OSS_BUCKET}
oss.base-url=https://xxx.oss-cn-xxx.aliyuncs.com
```

### 新增 DTO

```java
// dto/req/UpdateProfileReq.java
@Data
public class UpdateProfileReq {
    private String nickname;   // nullable，传则更新
    private String avatarUrl;  // nullable，传则更新
}
```

### 新增接口

| 接口 | 描述 |
|------|------|
| `POST /api/v1/upload/avatar` | 上传头像到 OSS，返回 `{ "url": "..." }` |
| `PUT /api/v1/users/me` | 更新当前用户 nickname / avatarUrl |

#### `POST /api/v1/upload/avatar`

- 权限：需要登录（Bearer token）
- 请求：`multipart/form-data`，字段名 `file`
- 文件命名：`avatars/{userId}_{timestamp}{ext}`
- 响应：`{ "url": "https://..." }`

#### `PUT /api/v1/users/me`

- 权限：需要登录
- 请求 Body：`UpdateProfileReq`（两字段均可选）
- 响应：204 No Content
- 逻辑：非 null 字段才更新，save

### 新增文件

| 操作 | 文件 |
|------|------|
| 新建 | `config/OssConfig.java` |
| 新建 | `service/OssService.java` |
| 新建 | `dto/req/UpdateProfileReq.java` |
| 新建 | `controller/UploadController.java` |
| 修改 | `controller/UserController.java`（新增 PUT 端点） |
| 修改 | `service/UserService.java`（新增 updateProfile 方法） |

### Service 逻辑

**OssService.uploadAvatar(MultipartFile file, Long userId)**：
1. 生成 key：`avatars/{userId}_{System.currentTimeMillis()}{ext}`
2. `ossClient.putObject(bucket, key, file.getInputStream())`
3. 返回 `baseUrl + "/" + key`

**UserService.updateProfile(Long userId, UpdateProfileReq req)**：
1. 查出 User，不存在则 404
2. 若 `req.nickname != null` → `user.setNickname(req.nickname)`
3. 若 `req.avatarUrl != null` → `user.setAvatarUrl(req.avatarUrl)`
4. `userRepository.save(user)`

---

## 前端

### 登录页（`src/pages/login/index.tsx`）

**移除**：`Taro.getUserProfile()` 调用及相关逻辑

**新增状态**：
```ts
const [avatarTmp, setAvatarTmp] = useState('')  // 设备临时路径，用于预览和上传
const [nickname, setNickname] = useState('')
```

**UI 结构**（替换原登录按钮区域）：

```
┌─────────────────────────────┐
│  [头像圆形预览]              │
│  Button open-type=chooseAvatar  │
│                             │
│  Input type="nickname"      │
│                             │
│  [ 登录 ]  disabled={!avatarTmp || !nickname.trim()}  │
└─────────────────────────────┘
```

**头像选择**：
```tsx
<Button open-type="chooseAvatar" onChooseAvatar={(e) => {
  setAvatarTmp(e.detail.avatarUrl)  // 临时路径，仅用于预览
}}>
  <Image src={avatarTmp || defaultAvatar} />
</Button>
```

**登录流程**：
1. 上传头像：`const { url } = await uploadApi.avatar(avatarTmp)`
2. 获取 code：`const { code } = await Taro.login()`
3. 登录：`await authApi.login({ code, nickname, avatarUrl: url })`
4. 写 store，跳转首页

### "我的"页（`src/pages/my/index.tsx`）

**新增状态**：
```ts
const [editing, setEditing] = useState(false)
const [draftAvatar, setDraftAvatar] = useState('')  // 临时路径
const [draftNickname, setDraftNickname] = useState('')
```

**触发**：点击顶部头像/昵称区域 → `setEditing(true)`，同时 `setDraftNickname(nickname)`

**遮罩内容**：
- chooseAvatar 按钮（展示当前头像预览）
- `Input type="nickname"` value={draftNickname}
- 保存按钮 / 取消按钮

**保存流程**：
1. 若 `draftAvatar` 非空（用户换了头像）→ 上传 → 获得 OSS URL
2. `PUT /api/v1/users/me` with `{ nickname: draftNickname, avatarUrl: ossUrl ?? undefined }`
3. 更新 Zustand store（nickname + avatarUrl）
4. 关闭遮罩

### API 层（`src/api/upload.ts`，新建）

```ts
export const uploadApi = {
  avatar: (tmpPath: string): Promise<{ url: string }> =>
    new Promise((resolve, reject) =>
      Taro.uploadFile({
        url: `${BASE_URL}/api/v1/upload/avatar`,
        filePath: tmpPath,
        name: 'file',
        header: { Authorization: `Bearer ${getToken()}` },
        success: (res) => resolve(JSON.parse(res.data)),
        fail: reject,
      })
    ),
}
```

### Store 变更（`src/store/auth.ts`）

`useAuthStore` 需新增 `avatarUrl` 字段及 setter：
```ts
avatarUrl: string
setAvatarUrl: (url: string) => void
// 或在 setCurrentTeam / 登录 action 中一并写入
```

登录成功后从 `/api/v1/auth/login` 响应中取 `avatarUrl` 写入 store；编辑保存后更新 store。

### 类型变更（`src/types/api.ts`）

确保 `AuthRes`（登录响应类型）包含：
```ts
avatarUrl: string
```

---

## 涉及文件

| 操作 | 文件 |
|------|------|
| 新建 | `backend/src/main/java/com/football/team/config/OssConfig.java` |
| 新建 | `backend/src/main/java/com/football/team/service/OssService.java` |
| 新建 | `backend/src/main/java/com/football/team/dto/req/UpdateProfileReq.java` |
| 新建 | `backend/src/main/java/com/football/team/controller/UploadController.java` |
| 修改 | `backend/src/main/java/com/football/team/controller/UserController.java` |
| 修改 | `backend/src/main/java/com/football/team/service/UserService.java` |
| 修改 | `backend/src/main/resources/application.properties` |
| 修改 | `backend/pom.xml` |
| 新建 | `frontend/src/api/upload.ts` |
| 修改 | `frontend/src/pages/login/index.tsx` |
| 修改 | `frontend/src/pages/my/index.tsx` |
| 修改 | `frontend/src/store/auth.ts`（新增 avatarUrl 字段） |
| 修改 | `frontend/src/types/api.ts`（确保 AuthRes 含 avatarUrl） |
