# 球队名片功能设计文档

**日期**：2026-05-21
**状态**：待实现

---

## 背景与目标

现有小程序的加入球队流程依赖手动输入邀请码，转化路径长、体验差。本功能通过「球队名片」海报，让队长一键生成带小程序码的精美图片，外人扫码即可直达申请加入页，实现零摩擦拉新。

**核心目标**：
- 拉新：通过图片分享吸引外部用户扫码加入
- 活跃：给球队一个可对外展示的「门面」

---

## 用户流程

### 队长端（生成 & 分享）

1. 进入「我的」页面，点击「生成球队名片」
2. 调用后端接口，后端生成海报图片并返回 OSS URL
3. 前端展示海报预览，提供「保存到相册」按钮
4. 队长从相册分享图片到朋友圈或微信群

### 外部用户端（扫码 & 申请）

1. 微信扫描海报上的小程序码
2. 跳转到 `pages/join-team/index`，自动携带 `teamId` 参数，展示球队名称
3. 填写申请信息并提交
4. 进入现有申请审核流程，队长审批通过后加入

---

## 海报设计

**风格**：清爽绿色（`#2ecc71` 主色，白色卡片背景）

**内容元素**：
- 球队 Logo（圆形头像）
- 球队名称（大号字体）
- 球队简介（一行文字）
- 三项数据：队员数 / 比赛场数 / 胜场数
- 小程序码（微信官方生成，带 `teamId` scene 参数）
- 底部文案：「扫码申请加入」

**尺寸**：750 × 1080px（适配分享图比例）

---

## 技术实现

### 后端

**新增接口**：
```
GET /api/v1/team/{teamId}/poster
```
- 权限：仅限 ADMIN 角色调用
- 响应：`{ posterUrl: "https://..." }`

**接口内部流程**：
1. 从 Redis 查询缓存（key: `poster:{teamId}:{date}`，TTL 24h），命中则直接返回
2. 调用微信 `wxacode.getUnlimited` 生成小程序码
   - `scene`: `teamId={teamId}`
   - `page`: `pages/join-team/index`
3. 查询球队基础信息（名称、Logo、简介、成员数、比赛数、胜场数）
4. 用 Java `Graphics2D` 合成海报图片（绘制背景色、文字、Logo、小程序码）
5. 上传图片到阿里云 OSS
6. 写入 Redis 缓存，返回 OSS URL

**改动文件**：
- `WechatService`：新增 `generateMiniCode(scene, page)` 方法
- `TeamController`：新增 `getPoster` 接口
- `TeamService`：新增 `generatePoster(teamId)` 业务逻辑
- `OssService`：复用现有上传方法

**新增依赖**：无（`Graphics2D` 为 JDK 内置，小程序码通过现有微信 HTTP 调用）

### 前端

**新增页面**：`pages/team-poster/index.tsx`
- 进入后自动调用生成接口（展示 loading）
- 展示海报图片
- 「保存到相册」按钮（调用 `Taro.saveImageToPhotosAlbum`，需用户授权相册权限）

**改动文件**：
- `pages/my/index.tsx`：在队长视角加入「生成球队名片」入口按钮
- `pages/join-team/index.tsx`：支持从 `onLoad` options 读取 `scene` 参数解析 `teamId`（当前只支持手动输邀请码）
- `src/api/team.ts`：新增 `getTeamPoster(teamId)` 请求方法

### 数据库

无需新增表，复用现有 `team`、`team_member`、`activity`、`match_result` 数据。

---

## 复用 & 不改动

| 模块 | 状态 |
|---|---|
| 申请加入审核流程 | ✅ 完全复用 |
| OSS 图片上传 | ✅ 复用 `OssService` |
| 微信登录 / JWT 鉴权 | ✅ 不变 |
| 邀请码加入方式 | ✅ 保留，两种方式并存 |

---

## 边界与约束

- 海报每天每支球队只生成一次（Redis 缓存），避免重复调用微信 API
- 小程序码生成需要微信服务号权限（`wxacode.getUnlimited`），确认 AppID 有此权限
- `Taro.saveImageToPhotosAlbum` 需在真机上测试（模拟器行为不一致）
- 海报图片合成在后端完成，不在前端 Canvas 渲染（微信小程序 Canvas 兼容性差）

---

## 不在本期范围

- 球队公开主页（外人可浏览的球队介绍页）
- 赛后战报分享
- 个人数据名片
