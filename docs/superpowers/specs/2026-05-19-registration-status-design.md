# 活动报名状态扩展 Design Spec

## 概述

将活动报名从二元（报名/取消）扩展为三档选择：**报名（JOINED）**、**待定（TENTATIVE）**、**请假（ABSENT）**。队员在 OPEN 状态的活动中可随时切换三种状态，活动截止/关闭后状态锁定。

---

## 约束与边界

- `maxPlayers` 限制**仅计算 JOINED** 人数，待定和请假不占名额
- 活动 status 为 CLOSED 或 FINISHED，或已过截止时间时，操作按钮隐藏，状态锁定
- 点击已选中状态按钮 → 取消报名（状态变为 CANCELLED）
- 不翻译后端返回的错误消息

---

## 后端

### DB Migration（V6）

仅更新字段注释，varchar(16) 已能存储新枚举值，无数据迁移：

```sql
ALTER TABLE activity_registration
  MODIFY COLUMN status VARCHAR(16) NOT NULL DEFAULT 'JOINED'
    COMMENT '报名状态：JOINED已报名/TENTATIVE待定/ABSENT请假/CANCELLED已取消';
```

### 枚举

```java
// com/football/team/enums/RegStatus.java
public enum RegStatus { JOINED, TENTATIVE, ABSENT, CANCELLED }
```

### 新增 DTO

```java
// dto/request/RegisterReq.java
public class RegisterReq {
    @NotNull
    private RegStatus status; // JOINED | TENTATIVE | ABSENT
}
```

### 接口变更

| 接口 | 变更 |
|------|------|
| `POST /api/v1/activities/{activityId}/register` | 新增 `@RequestBody RegisterReq`，status 为 JOINED/TENTATIVE/ABSENT |
| `DELETE /api/v1/activities/{activityId}/register` | 不变（取消报名，设为 CANCELLED） |

### Service 逻辑（register 方法）

```
1. 查活动是否属于当前 teamId，否则 404
2. 查活动 status 是否为 OPEN，且未过 deadline，否则 400
3. 若 req.status == JOINED：检查 maxPlayers（仅 JOINED 计数），超出则 400
4. 查询是否已有 ActivityRegistration（任意 status）：
   - 存在 → setStatus(req.status)，save
   - 不存在 → 新建，save
```

### Response DTO 变更

**ActivityRes**（`dto/res/ActivityRes.java`）：
- 移除 `iJoined: boolean`
- 新增 `myStatus: String`（值为 `"JOINED"/"TENTATIVE"/"ABSENT"` 或 `null`，null 表示未登记）

**ActivityDetailRes**（`dto/res/ActivityDetailRes.java`）：
- `registrations` 列表元素新增 `status` 字段（`String`，值为 `"JOINED"/"TENTATIVE"/"ABSENT"`）

### Service 查询逻辑（getDetail / listActivities）

- `myStatus`：查找当前用户最新非 CANCELLED 的记录，取其 status；无记录或全为 CANCELLED 则返回 null
- `registrations`：查询所有 status IN (JOINED, TENTATIVE, ABSENT) 的记录，每条附带 status 字段
- `registeredCount`（首页卡片人数）：仅计 JOINED 数量

---

## 前端

### 类型变更（`src/types/api.ts`）

```ts
// 新增
export type RegStatus = 'JOINED' | 'TENTATIVE' | 'ABSENT'

// ActivityRes 改动
// 移除：iJoined: boolean
// 新增：
myStatus: RegStatus | null

// ActivityDetailRes.registrations 元素新增
status: RegStatus
```

### API 层（`src/api/activity.ts`）

```ts
register: (activityId: number, status: RegStatus) =>
  api.post<void>(`/activities/${activityId}/register`, { status })
// cancelRegister 不变
```

### Activity Detail 页面（`src/pages/activity-detail/index.tsx`）

**操作区**（`isOpen` 为 true 时显示）：

三个并排按钮，当前 `myStatus` 对应的按钮高亮（绿色背景），其余为灰色描边：

```
[ ✅ 报名 ]  [ ❓ 待定 ]  [ 🏖 请假 ]
```

- 点击**未高亮**按钮 → `register(activityId, status)`，刷新详情
- 点击**已高亮**按钮 → `cancelRegister(activityId)`，刷新详情

**报名名单区块**（始终显示）：

分三组，无数据的组不显示：

```
报名（N人）
  [头像] 姓名
  ...

待定（N人）         ← 有 TENTATIVE 记录才显示
  [头像] 姓名

请假（N人）         ← 有 ABSENT 记录才显示
  [头像] 姓名
```

### Home 页面活动卡片（`src/pages/home/index.tsx`）

将 `a.iJoined` 替换为 `a.myStatus`，badge 显示逻辑：

| myStatus | badge |
|----------|-------|
| `'JOINED'` | `✓ 已报名` |
| `'TENTATIVE'` | `? 待定` |
| `'ABSENT'` | `— 请假` |
| `null` | 不显示 badge |

### i18n 新增翻译键

**zh.ts / en.ts** 新增：

| 键 | 中文 | English |
|---|---|---|
| `act.status_joined` | ✅ 报名 | ✅ Join |
| `act.status_tentative` | ❓ 待定 | ❓ Maybe |
| `act.status_absent` | 🏖 请假 | 🏖 Absent |
| `act.badge_joined` | ✓ 已报名 | ✓ Joined |
| `act.badge_tentative` | ? 待定 | ? Maybe |
| `act.badge_absent` | — 请假 | — Absent |
| `act.joined_count` | 报名 | Joined |
| `act.tentative_count` | 待定 | Maybe |
| `act.absent_count` | 请假 | Absent |

---

## 涉及文件

| 操作 | 文件 |
|------|------|
| 修改 | `backend/src/main/java/com/football/team/enums/RegStatus.java` |
| 新建 | `backend/src/main/java/com/football/team/dto/request/RegisterReq.java` |
| 修改 | `backend/src/main/java/com/football/team/dto/res/ActivityRes.java` |
| 修改 | `backend/src/main/java/com/football/team/dto/res/ActivityDetailRes.java` |
| 修改 | `backend/src/main/java/com/football/team/service/ActivityService.java` |
| 修改 | `backend/src/main/java/com/football/team/controller/ActivityController.java` |
| 新建 | `backend/src/main/resources/db/migration/V6__update_reg_status_comment.sql` |
| 修改 | `backend/src/test/java/com/football/team/service/ActivityServiceTest.java` |
| 修改 | `frontend/src/types/api.ts` |
| 修改 | `frontend/src/api/activity.ts` |
| 修改 | `frontend/src/pages/activity-detail/index.tsx` |
| 修改 | `frontend/src/pages/home/index.tsx` |
| 修改 | `frontend/src/i18n/zh.ts` |
| 修改 | `frontend/src/i18n/en.ts` |
