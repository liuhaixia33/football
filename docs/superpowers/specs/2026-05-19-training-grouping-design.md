# 训练活动分组功能设计文档

## 功能概述

为 TRAINING 类型活动提供队员分组管理能力。队长（CAPTAIN）和管理员（ADMIN）可在活动 OPEN 期间对已报名（JOINED）队员进行分组，支持随机均分和手动调整，分组结果持久化到数据库，并可生成海报图片分享到微信群。

---

## 使用场景与约束

| 项目 | 说明 |
|------|------|
| 活动类型 | 仅 TRAINING |
| 活动状态 | OPEN（可读写）、CLOSED（只读） |
| 操作人 | CAPTAIN 或 ADMIN |
| 分组对象 | 报名状态为 JOINED 的队员 |
| 默认组数 | 2，最多 4 |
| 支持空组 | 是 |
| 允许不均匀分配 | 是 |
| 分组可修改 | OPEN 可改，CLOSED 锁定 |

---

## 数据模型

### 新增表

```sql
CREATE TABLE activity_group (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    activity_id BIGINT      NOT NULL,
    group_index INT         NOT NULL,
    group_name  VARCHAR(50) NOT NULL,
    created_at  DATETIME    NOT NULL,
    updated_at  DATETIME    NOT NULL,
    CONSTRAINT fk_ag_activity FOREIGN KEY (activity_id) REFERENCES activity(id)
);

CREATE TABLE activity_group_member (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    user_id  BIGINT NOT NULL,
    CONSTRAINT fk_agm_group FOREIGN KEY (group_id) REFERENCES activity_group(id),
    CONSTRAINT fk_agm_user  FOREIGN KEY (user_id)  REFERENCES user(id)
);
```

### JPA 实体

**ActivityGroup**
```java
@Entity @Table(name = "activity_group")
@Data @NoArgsConstructor
public class ActivityGroup {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long activityId;
    private int groupIndex;
    private String groupName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

**ActivityGroupMember**
```java
@Entity @Table(name = "activity_group_member")
@Data @NoArgsConstructor
public class ActivityGroupMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long groupId;
    private Long userId;
}
```

### 说明
- 同一活动同一 user_id 只能出现在一个组，由应用层保证（PUT 接口原子替换）
- 未分组队员不写入表，前端从 JOINED 报名列表中差集计算
- CLOSED 状态下后端拒绝所有写操作

---

## API 设计

### GET `/api/v1/activities/{activityId}/grouping`

获取当前分组及未分组队员。

**Response 200:**
```json
{
  "groups": [
    {
      "id": 1,
      "index": 0,
      "name": "红队",
      "members": [
        { "userId": 10, "nickname": "张三", "avatarUrl": "..." }
      ]
    }
  ],
  "ungrouped": [
    { "userId": 20, "nickname": "李四", "avatarUrl": "..." }
  ]
}
```

### PUT `/api/v1/activities/{activityId}/grouping`

全量替换分组（原子操作：删旧建新）。

**Request Body:**
```json
{
  "groupCount": 2,
  "groups": [
    { "index": 0, "name": "红队", "memberIds": [10, 11] },
    { "index": 1, "name": "蓝队", "memberIds": [20] }
  ]
}
```

**Response:** 200 成功 / 403 无权限或 CLOSED 状态

### POST `/api/v1/activities/{activityId}/grouping/random`

服务端随机均分并持久化。

**Request Body:**
```json
{
  "groupCount": 2,
  "groupNames": ["红队", "蓝队"]
}
```

**Response:** 200 + 同 GET 的分组结构 / 400 无可分配队员 / 403 无权限

### 权限校验（Service 层统一）
- 操作人为该队伍 CAPTAIN 或 ADMIN
- 活动类型为 TRAINING
- 写操作要求状态为 OPEN（否则 403）

---

## 前端设计

### 入口
活动详情页：TRAINING 类型 + OPEN/CLOSED 状态 + CAPTAIN/ADMIN 身份 → 底部展示"分组管理"按钮，跳转 `/pages/grouping/index?activityId=xxx`。

### 页面结构

```
GroupingPage
├── 顶部栏：组数选择（2 / 3 / 4，仅 OPEN 可切换）+ "一键随机"按钮（仅 OPEN）
├── 中部：GroupCard × N
│   ├── 组名（OPEN 状态可点击内联编辑）
│   └── PlayerChip × M
│       └── 点击 → 底部弹出"移到第X组 / 移出分组 / 取消"
├── 未分组区（同样支持点击分配，仅 OPEN 可操作）
└── 底部固定栏
    ├── "保存"按钮（仅 OPEN，有未保存修改时高亮）
    └── "生成海报"按钮（OPEN/CLOSED 均可，点击先自动保存）
```

### 状态管理
本地 `useState` 管理分组数据，不进 Zustand。页面进入时 GET 接口拉取初始数据。

### CLOSED 状态
所有编辑控件禁用（组名不可点、队员不可移动、随机按钮隐藏），仅展示分组结果和"生成海报"。

---

## 海报生成

**内容：** 活动标题、时间、地点 + 各组名称与队员昵称列表

**流程：**
1. 点击"生成海报" → 若有未保存修改先调 PUT 接口保存
2. 在离屏 Canvas 上绘制海报内容
3. `Taro.canvasToTempFilePath` 导出图片
4. 预览页：用户长按保存到相册或直接转发到微信群

**Canvas 布局（示意）：**
```
┌─────────────────────────────┐
│  [活动标题]                  │
│  时间：2026-06-01 19:00      │
│  地点：XX 足球场              │
├─────────────────────────────┤
│  红队（5人）                 │
│  张三 / 李四 / 王五 ...       │
├─────────────────────────────┤
│  蓝队（4人）                 │
│  赵六 / 钱七 / ...           │
└─────────────────────────────┘
```

---

## 错误处理

| 场景 | 后端响应 | 前端处理 |
|------|----------|----------|
| 活动 CLOSED 执行写操作 | 403 | Toast："活动已结束，无法修改分组" |
| 非 CAPTAIN/ADMIN | 403 | 不展示入口按钮（双重保护） |
| JOINED 队员为 0 | 400 | Toast："暂无可分配队员" |
| 网络失败 | - | Toast 提示，保留本地编辑状态 |

---

## 测试策略

### 后端（JUnit + Mockito）

**GroupingServiceTest：**
- 随机分组均分逻辑（N 人分 K 组，余数分配到前几组）
- CLOSED 状态拒绝写入（期望抛 403 异常）
- 非 CAPTAIN/ADMIN 拒绝（期望抛 403 异常）
- 空队员列表时返回 400

**GroupingControllerTest：**
- GET 接口：有分组数据 / 无分组数据 200 响应
- PUT 接口：成功 200 / CLOSED 403
- POST random：成功 200 / 无队员 400

### 前端（手动验证）
- 随机分组 → 所有 JOINED 队员均被分配
- 点击队员移组 → 旧组移除、新组添加
- 修改组名 → 保存后刷新验证持久化
- CLOSED 状态 → 编辑控件全部禁用
- 海报生成 → 内容包含活动标题、时间、地点和分组信息
