# 编辑活动 & 分享活动 Design Spec

## 概述

两个独立优化：
1. **编辑活动**：CAPTAIN/ADMIN 可在活动 OPEN 状态时修改所有字段
2. **分享活动**：所有成员可将活动分享到微信群

---

## Feature 1：编辑活动

### 后端

**新增接口：** `PUT /api/v1/activities/{activityId}`

- 权限：`@RequireRole(MemberRole.ADMIN)`（CAPTAIN 和 ADMIN 均可）
- 请求头：`X-Team-Id`（已有机制，无需改动）
- 校验：
  - activityId 对应的活动必须属于当前 teamId，否则 403
  - 活动 status 必须为 `OPEN`，否则 400（错误信息："活动已封闭，不可修改"）
- 请求体（`UpdateActivityReq`，与 `CreateActivityReq` 字段相同）：
  - `title` String（必填）
  - `startTime` LocalDateTime（必填）
  - `endTime` LocalDateTime（必填）
  - `location` String（必填）
  - `description` String（可选）
  - `fee` BigDecimal（可选，默认 0）
- 响应：`ActivityRes`（更新后的活动数据）

**涉及文件：**
- 新增：`dto/request/UpdateActivityReq.java`
- 修改：`controller/ActivityController.java`（新增 updateActivity 方法）
- 修改：`service/ActivityService.java`（新增 updateActivity 逻辑）

### 前端

**api 层：**
- `api/activity.ts` 新增 `updateActivity(activityId: number, req: CreateActivityReq): Promise<ActivityRes>`，调用 `PUT /api/v1/activities/{activityId}`

**activity-detail 页：**
- CAPTAIN 或 ADMIN 且活动 status == 'OPEN' 时，页面顶部工具区显示"编辑"按钮
- 点击跳转：`/pages/activity-create/index?editId={activityId}`

**activity-create 页（扩展为双模式）：**
- 读取 URL 参数 `editId`（字符串）
- 若存在 `editId`：
  - 进入编辑模式，页面标题显示"编辑活动"
  - `useDidShow` 时调用 `GET /api/v1/activities/{editId}` 获取现有数据并填入表单
  - 提交时调用 `updateActivity`（PUT）
- 若不存在 `editId`：
  - 保持原有创建模式，页面标题"创建活动"，提交调 POST

---

## Feature 2：分享活动

**仅前端，无后端改动。**

**activity-detail 页：**
- `useDidShow` 时调用 `Taro.showShareMenu({ menus: ['shareAppMessage'] })` 开启分享菜单
- 新增 `useShareAppMessage` hook，返回分享配置：
  - `title`：活动标题（`activity.title`）
  - `path`：`/pages/activity-detail/index?activityId={id}&teamId={currentTeamId}`（需携带 teamId 让接收方自动选队）
  - `imageUrl`：`/assets/images/share-cover.png`（预置静态图片）
- 页面底部操作区新增"分享给好友"按钮，`open-type="share"`

**静态资源：**
- 新增 `frontend/src/assets/images/share-cover.png`（足球主题封面图，尺寸建议 500×400）

---

## 约束与边界

- 编辑不影响已报名记录（registrations 不变）
- 编辑不影响活动 status（只有 closeActivity 能改变 status）
- 分享路径接收方打开后，若未加入该 team 则走正常鉴权流程（403 或提示加入）
- teamId 通过 URL 参数传递，接收方打开时需校验自身是否属于该 team
