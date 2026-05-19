# Registration Status 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将活动报名从二元（JOINED/CANCELLED）扩展为三档（JOINED/TENTATIVE/ABSENT），队员可随时切换状态，maxPlayers 仅计 JOINED 数量。

**Architecture:** 后端 upsert 模式（有记录则更新 status，无则新建），新增 RegisterReq DTO 携带 status 字段；前端详情页改为三个并排按钮，首页卡片 badge 按 myStatus 展示；ActivityRes 将 iJoined boolean 替换为 myStatus string。

**Tech Stack:** Spring Boot 3.2.5 / Java 17 / Flyway / Mockito；Taro 3.6 / React / TypeScript / Zustand

---

## 文件列表

| 操作 | 文件 |
|------|------|
| 修改 | `backend/src/main/java/com/football/team/enums/RegStatus.java` |
| 新建 | `backend/src/main/java/com/football/team/dto/request/RegisterReq.java` |
| 新建 | `backend/src/main/java/com/football/team/dto/res/RegistrationRes.java` |
| 修改 | `backend/src/main/java/com/football/team/dto/res/ActivityRes.java` |
| 修改 | `backend/src/main/java/com/football/team/dto/res/ActivityDetailRes.java` |
| 修改 | `backend/src/main/java/com/football/team/repository/ActivityRegistrationRepository.java` |
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

---

### Task 1: Backend 模型层（枚举 + DTO + Migration）

**Files:**
- Modify: `backend/src/main/java/com/football/team/enums/RegStatus.java`
- Create: `backend/src/main/java/com/football/team/dto/request/RegisterReq.java`
- Create: `backend/src/main/java/com/football/team/dto/res/RegistrationRes.java`
- Modify: `backend/src/main/java/com/football/team/dto/res/ActivityRes.java`
- Modify: `backend/src/main/java/com/football/team/dto/res/ActivityDetailRes.java`
- Create: `backend/src/main/resources/db/migration/V6__update_reg_status_comment.sql`

- [ ] **Step 1: 扩展 RegStatus 枚举**

```java
// backend/src/main/java/com/football/team/enums/RegStatus.java
package com.football.team.enums;
public enum RegStatus { JOINED, TENTATIVE, ABSENT, CANCELLED }
```

- [ ] **Step 2: 新建 RegisterReq DTO**

注意包路径用 `request`（小写），与现有 `req` 包对齐：检查目录下是否有 `dto/request` 或 `dto/req`。以下用现有路径 `dto/req`：

```java
// backend/src/main/java/com/football/team/dto/req/RegisterReq.java
package com.football.team.dto.req;

import com.football.team.enums.RegStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterReq {
    @NotNull
    private RegStatus status;
}
```

> 注意：实际包名请先运行 `ls backend/src/main/java/com/football/team/dto/` 确认是 `req` 还是 `request`。

- [ ] **Step 3: 新建 RegistrationRes DTO**

详情页的报名列表条目需要携带 status 字段，而现有 MemberRes 用于成员管理页，不应混用：

```java
// backend/src/main/java/com/football/team/dto/res/RegistrationRes.java
package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class RegistrationRes {
    private Long userId;
    private String nickname;
    private String avatarUrl;
    private String status;
}
```

- [ ] **Step 4: 更新 ActivityRes**

移除 `iJoined`，新增 `myStatus`：

```java
// backend/src/main/java/com/football/team/dto/res/ActivityRes.java
package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class ActivityRes {
    private Long id;
    private String type;
    private String title;
    private String opponent;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime deadline;
    private Integer maxPlayers;
    private long registeredCount;
    private String status;
    private String myStatus;
}
```

- [ ] **Step 5: 更新 ActivityDetailRes**

registrations 从 `List<MemberRes>` 改为 `List<RegistrationRes>`：

```java
// backend/src/main/java/com/football/team/dto/res/ActivityDetailRes.java
package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class ActivityDetailRes {
    private ActivityRes activity;
    private List<RegistrationRes> registrations;
    private MatchResultRes result;
}
```

- [ ] **Step 6: 新建 V6 migration**

```sql
-- backend/src/main/resources/db/migration/V6__update_reg_status_comment.sql
ALTER TABLE activity_registration
  MODIFY COLUMN status VARCHAR(16) NOT NULL DEFAULT 'JOINED'
    COMMENT '报名状态：JOINED已报名/TENTATIVE待定/ABSENT请假/CANCELLED已取消';
```

- [ ] **Step 7: 编译验证**

```bash
cd backend && mvn compile -q
```

Expected: BUILD SUCCESS（此时 ActivityService 引用 iJoined 和旧 registrations 类型会报错，先确保 DTO 层本身编译通过，后续 task 修 Service）

实际上编译会失败因为 ActivityService.toActivityRes() 还在用 iJoined，但这没关系——我们在 Task 3 里修复 Service。

- [ ] **Step 8: Commit**

```bash
cd backend
git add src/main/java/com/football/team/enums/RegStatus.java \
        src/main/java/com/football/team/dto/req/RegisterReq.java \
        src/main/java/com/football/team/dto/res/RegistrationRes.java \
        src/main/java/com/football/team/dto/res/ActivityRes.java \
        src/main/java/com/football/team/dto/res/ActivityDetailRes.java \
        src/main/resources/db/migration/V6__update_reg_status_comment.sql
git commit -m "feat: extend RegStatus enum and add RegisterReq/RegistrationRes DTOs"
```

---

### Task 2: Repository — 新增 findByActivityIdAndStatusIn

**Files:**
- Modify: `backend/src/main/java/com/football/team/repository/ActivityRegistrationRepository.java`

Spring Data JPA 会根据方法名自动生成 `IN` 查询，无需写 JPQL。

- [ ] **Step 1: 添加 findByActivityIdAndStatusIn 方法**

```java
// backend/src/main/java/com/football/team/repository/ActivityRegistrationRepository.java
package com.football.team.repository;

import com.football.team.entity.ActivityRegistration;
import com.football.team.enums.RegStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ActivityRegistrationRepository extends JpaRepository<ActivityRegistration, Long> {
    Optional<ActivityRegistration> findByActivityIdAndUserId(Long activityId, Long userId);
    List<ActivityRegistration> findByActivityIdAndStatus(Long activityId, RegStatus status);
    List<ActivityRegistration> findByActivityIdAndStatusIn(Long activityId, Collection<RegStatus> statuses);
    long countByActivityIdAndStatus(Long activityId, RegStatus status);
    List<ActivityRegistration> findByUserIdAndStatus(Long userId, RegStatus status);
}
```

- [ ] **Step 2: 编译验证**

```bash
cd backend && mvn compile -q 2>&1 | grep -E "ERROR|BUILD"
```

- [ ] **Step 3: Commit**

```bash
cd backend
git add src/main/java/com/football/team/repository/ActivityRegistrationRepository.java
git commit -m "feat: add findByActivityIdAndStatusIn to registration repository"
```

---

### Task 3: ActivityService 全量更新 + 测试

**Files:**
- Modify: `backend/src/main/java/com/football/team/service/ActivityService.java`
- Modify: `backend/src/test/java/com/football/team/service/ActivityServiceTest.java`

- [ ] **Step 1: 先写失败测试**

完整替换 `ActivityServiceTest.java`（保留现有非 register 测试，更新 register 相关测试）：

```java
// backend/src/test/java/com/football/team/service/ActivityServiceTest.java
package com.football.team.service;

import com.football.team.dto.req.CreateActivityReq;
import com.football.team.dto.req.RegisterReq;
import com.football.team.dto.req.RecordResultReq;
import com.football.team.entity.Activity;
import com.football.team.entity.ActivityRegistration;
import com.football.team.entity.MatchResult;
import com.football.team.enums.ActivityStatus;
import com.football.team.enums.ActivityType;
import com.football.team.enums.MatchOutcome;
import com.football.team.enums.RegStatus;
import com.football.team.exception.BusinessException;
import com.football.team.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock ActivityRepository activityRepository;
    @Mock ActivityRegistrationRepository regRepository;
    @Mock MatchResultRepository matchResultRepository;
    @Mock UserRepository userRepository;
    @InjectMocks ActivityService activityService;

    // ---- register() 测试 ----

    @Test
    void register_closedActivity_throwsBadRequest() {
        Activity a = new Activity(); a.setId(1L); a.setTeamId(1L); a.setStatus(ActivityStatus.CLOSED);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
        RegisterReq req = new RegisterReq(); req.setStatus(RegStatus.JOINED);
        assertThrows(BusinessException.class, () -> activityService.register(1L, 1L, 1L, req));
    }

    @Test
    void register_joined_whenMaxReached_throwsBadRequest() {
        Activity a = new Activity(); a.setId(1L); a.setTeamId(1L);
        a.setStatus(ActivityStatus.OPEN); a.setMaxPlayers(10);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
        when(regRepository.countByActivityIdAndStatus(1L, RegStatus.JOINED)).thenReturn(10L);
        RegisterReq req = new RegisterReq(); req.setStatus(RegStatus.JOINED);
        assertThrows(BusinessException.class, () -> activityService.register(1L, 2L, 1L, req));
    }

    @Test
    void register_tentative_doesNotCheckMaxPlayers() {
        Activity a = new Activity(); a.setId(1L); a.setTeamId(1L);
        a.setStatus(ActivityStatus.OPEN); a.setMaxPlayers(10);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
        when(regRepository.findByActivityIdAndUserId(1L, 2L)).thenReturn(Optional.empty());
        when(regRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        RegisterReq req = new RegisterReq(); req.setStatus(RegStatus.TENTATIVE);
        assertDoesNotThrow(() -> activityService.register(1L, 2L, 1L, req));
        verify(regRepository, never()).countByActivityIdAndStatus(any(), any());
    }

    @Test
    void register_existingRecord_updatesStatus() {
        Activity a = new Activity(); a.setId(1L); a.setTeamId(1L); a.setStatus(ActivityStatus.OPEN);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
        ActivityRegistration existing = new ActivityRegistration(); existing.setStatus(RegStatus.ABSENT);
        when(regRepository.findByActivityIdAndUserId(1L, 2L)).thenReturn(Optional.of(existing));
        when(regRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        RegisterReq req = new RegisterReq(); req.setStatus(RegStatus.TENTATIVE);
        activityService.register(1L, 2L, 1L, req);
        verify(regRepository).save(argThat(r -> r.getStatus() == RegStatus.TENTATIVE));
    }

    @Test
    void register_noExistingRecord_createsNew() {
        Activity a = new Activity(); a.setId(1L); a.setTeamId(1L); a.setStatus(ActivityStatus.OPEN);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
        when(regRepository.findByActivityIdAndUserId(1L, 2L)).thenReturn(Optional.empty());
        when(regRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        RegisterReq req = new RegisterReq(); req.setStatus(RegStatus.JOINED);
        activityService.register(1L, 2L, 1L, req);
        verify(regRepository).save(argThat(r ->
            r.getActivityId().equals(1L) && r.getUserId().equals(2L) && r.getStatus() == RegStatus.JOINED));
    }

    // ---- cancelRegister() 测试 ----

    @Test
    void cancelRegister_withJoinedRecord_setsCancelled() {
        Activity a = new Activity(); a.setId(1L); a.setTeamId(1L); a.setStatus(ActivityStatus.OPEN);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
        ActivityRegistration reg = new ActivityRegistration(); reg.setStatus(RegStatus.JOINED);
        when(regRepository.findByActivityIdAndUserId(1L, 2L)).thenReturn(Optional.of(reg));
        when(regRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        activityService.cancelRegister(1L, 2L, 1L);
        verify(regRepository).save(argThat(r -> r.getStatus() == RegStatus.CANCELLED));
    }

    @Test
    void cancelRegister_withTentativeRecord_setsCancelled() {
        Activity a = new Activity(); a.setId(1L); a.setTeamId(1L); a.setStatus(ActivityStatus.OPEN);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
        ActivityRegistration reg = new ActivityRegistration(); reg.setStatus(RegStatus.TENTATIVE);
        when(regRepository.findByActivityIdAndUserId(1L, 2L)).thenReturn(Optional.of(reg));
        when(regRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        activityService.cancelRegister(1L, 2L, 1L);
        verify(regRepository).save(argThat(r -> r.getStatus() == RegStatus.CANCELLED));
    }

    @Test
    void cancelRegister_withCancelledRecord_throwsNotFound() {
        Activity a = new Activity(); a.setId(1L); a.setTeamId(1L); a.setStatus(ActivityStatus.OPEN);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
        ActivityRegistration reg = new ActivityRegistration(); reg.setStatus(RegStatus.CANCELLED);
        when(regRepository.findByActivityIdAndUserId(1L, 2L)).thenReturn(Optional.of(reg));
        assertThrows(BusinessException.class, () -> activityService.cancelRegister(1L, 2L, 1L));
    }

    // ---- 其他现有测试（保持不变）----

    @Test
    void recordResult_win_setsOutcomeCorrectly() {
        Activity a = new Activity(); a.setId(1L); a.setTeamId(1L); a.setType(ActivityType.MATCH);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
        when(matchResultRepository.findByActivityId(1L)).thenReturn(Optional.empty());
        when(matchResultRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        RecordResultReq req = new RecordResultReq();
        req.setOurScore(3); req.setOppScore(1);
        activityService.recordResult(1L, req, 1L);
        verify(matchResultRepository).save(argThat(r -> r.getOutcome() == MatchOutcome.WIN));
    }

    @Test
    void updateActivity_success_updatesAllFields() {
        Activity a = new Activity(); a.setId(1L); a.setTeamId(1L); a.setStatus(ActivityStatus.OPEN);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
        when(activityRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        CreateActivityReq req = new CreateActivityReq();
        req.setType(ActivityType.TRAINING);
        req.setTitle("周六训练");
        req.setLocation("五人制球场");
        req.setStartTime(java.time.LocalDateTime.of(2026, 6, 7, 9, 0));
        Activity result = activityService.updateActivity(1L, 1L, req);
        assertEquals("周六训练", result.getTitle());
        assertEquals("五人制球场", result.getLocation());
        assertEquals(ActivityType.TRAINING, result.getType());
        verify(activityRepository).save(a);
    }

    @Test
    void updateActivity_closedActivity_throwsBadRequest() {
        Activity a = new Activity(); a.setId(2L); a.setTeamId(1L); a.setStatus(ActivityStatus.CLOSED);
        when(activityRepository.findById(2L)).thenReturn(Optional.of(a));
        CreateActivityReq req = new CreateActivityReq();
        req.setType(ActivityType.MATCH); req.setTitle("x"); req.setLocation("x");
        req.setStartTime(java.time.LocalDateTime.now());
        BusinessException ex = assertThrows(BusinessException.class,
            () -> activityService.updateActivity(2L, 1L, req));
        assertEquals(400, ex.getCode());
    }

    @Test
    void updateActivity_wrongTeam_throwsNotFound() {
        Activity a = new Activity(); a.setId(3L); a.setTeamId(99L); a.setStatus(ActivityStatus.OPEN);
        when(activityRepository.findById(3L)).thenReturn(Optional.of(a));
        CreateActivityReq req = new CreateActivityReq();
        req.setType(ActivityType.MATCH); req.setTitle("x"); req.setLocation("x");
        req.setStartTime(java.time.LocalDateTime.now());
        BusinessException ex = assertThrows(BusinessException.class,
            () -> activityService.updateActivity(3L, 1L, req));
        assertEquals(404, ex.getCode());
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd backend && mvn test -pl . -Dtest=ActivityServiceTest -q 2>&1 | tail -20
```

Expected: 编译错误（register() 参数不匹配）或测试失败

- [ ] **Step 3: 更新 ActivityService**

完整替换 ActivityService 中的 register / cancelRegister / toActivityRes / getDetail 四个方法：

```java
// backend/src/main/java/com/football/team/service/ActivityService.java
// 在文件顶部 import 区域新增：
import com.football.team.dto.req.RegisterReq;
import com.football.team.dto.res.RegistrationRes;
import java.util.List;
```

**register 方法（替换 lines 76-102）：**

```java
public void register(Long activityId, Long userId, Long teamId, RegisterReq req) {
    Activity a = activityRepository.findById(activityId)
        .orElseThrow(() -> BusinessException.notFound("活动不存在"));
    if (!a.getTeamId().equals(teamId))
        throw BusinessException.notFound("活动不存在");
    if (a.getStatus() != ActivityStatus.OPEN)
        throw BusinessException.badRequest("报名已截止");
    if (a.getDeadline() != null && LocalDateTime.now().isAfter(a.getDeadline()))
        throw BusinessException.badRequest("报名已截止");

    if (req.getStatus() == RegStatus.JOINED) {
        long count = regRepository.countByActivityIdAndStatus(activityId, RegStatus.JOINED);
        if (a.getMaxPlayers() != null && count >= a.getMaxPlayers())
            throw BusinessException.badRequest("报名人数已满");
    }

    regRepository.findByActivityIdAndUserId(activityId, userId).ifPresentOrElse(reg -> {
        reg.setStatus(req.getStatus());
        regRepository.save(reg);
    }, () -> {
        ActivityRegistration reg = new ActivityRegistration();
        reg.setActivityId(activityId);
        reg.setUserId(userId);
        reg.setStatus(req.getStatus());
        regRepository.save(reg);
    });
}
```

**cancelRegister 方法（替换 lines 104-114）：**

```java
public void cancelRegister(Long activityId, Long userId, Long teamId) {
    Activity a = activityRepository.findById(activityId)
        .orElseThrow(() -> BusinessException.notFound("活动不存在"));
    if (!a.getTeamId().equals(teamId))
        throw BusinessException.notFound("活动不存在");
    ActivityRegistration reg = regRepository.findByActivityIdAndUserId(activityId, userId)
        .filter(r -> r.getStatus() != RegStatus.CANCELLED)
        .orElseThrow(() -> BusinessException.notFound("未找到报名记录"));
    reg.setStatus(RegStatus.CANCELLED);
    regRepository.save(reg);
}
```

**toActivityRes 方法（替换 lines 169-180）：**

```java
public ActivityRes toActivityRes(Activity a, Long currentUserId) {
    long count = regRepository.countByActivityIdAndStatus(a.getId(), RegStatus.JOINED);
    String myStatus = regRepository.findByActivityIdAndUserId(a.getId(), currentUserId)
        .filter(r -> r.getStatus() != RegStatus.CANCELLED)
        .map(r -> r.getStatus().name())
        .orElse(null);
    return ActivityRes.builder()
        .id(a.getId()).type(a.getType().name()).title(a.getTitle())
        .opponent(a.getOpponent()).location(a.getLocation())
        .startTime(a.getStartTime()).deadline(a.getDeadline())
        .maxPlayers(a.getMaxPlayers()).registeredCount(count)
        .status(a.getStatus().name()).myStatus(myStatus)
        .build();
}
```

**getDetail 方法（替换 lines 50-74）：**

```java
@Transactional(readOnly = true)
public ActivityDetailRes getDetail(Long activityId, Long currentUserId, Long teamId) {
    Activity a = activityRepository.findById(activityId)
        .orElseThrow(() -> BusinessException.notFound("活动不存在"));
    if (!a.getTeamId().equals(teamId))
        throw BusinessException.notFound("活动不存在");

    List<RegistrationRes> regs = regRepository.findByActivityIdAndStatusIn(
            activityId, List.of(RegStatus.JOINED, RegStatus.TENTATIVE, RegStatus.ABSENT))
        .stream().map(r -> {
            User u = userRepository.findById(r.getUserId()).orElseThrow();
            return RegistrationRes.builder()
                .userId(u.getId()).nickname(u.getNickname())
                .avatarUrl(u.getAvatarUrl()).status(r.getStatus().name())
                .build();
        }).toList();

    MatchResultRes result = matchResultRepository.findByActivityId(activityId)
        .map(mr -> MatchResultRes.builder()
            .ourScore(mr.getOurScore()).oppScore(mr.getOppScore())
            .outcome(mr.getOutcome().name()).notes(mr.getNotes()).build())
        .orElse(null);

    return ActivityDetailRes.builder()
        .activity(toActivityRes(a, currentUserId))
        .registrations(regs)
        .result(result)
        .build();
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd backend && mvn test -pl . -Dtest=ActivityServiceTest 2>&1 | tail -20
```

Expected: Tests run: 10, Failures: 0, Errors: 0

- [ ] **Step 5: 运行全量测试**

```bash
cd backend && mvn test -q 2>&1 | tail -10
```

Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
cd backend
git add src/main/java/com/football/team/service/ActivityService.java \
        src/test/java/com/football/team/service/ActivityServiceTest.java
git commit -m "feat: update ActivityService for multi-status registration"
```

---

### Task 4: ActivityController 更新 register 端点

**Files:**
- Modify: `backend/src/main/java/com/football/team/controller/ActivityController.java`

- [ ] **Step 1: 为 register 方法添加 @RequestBody**

修改 ActivityController.java 中的 register 方法（当前 lines 53-60）：

```java
@PostMapping("/{activityId}/register")
@RequireRole(MemberRole.PLAYER)
public ApiResponse<Void> register(HttpServletRequest req,
                                  @PathVariable Long activityId,
                                  @RequestBody @Valid RegisterReq body) {
    User user = (User) req.getAttribute("currentUser");
    Long teamId = (Long) req.getAttribute("currentTeamId");
    activityService.register(activityId, user.getId(), teamId, body);
    return ApiResponse.ok(null);
}
```

同时在文件顶部 import 区新增：

```java
import com.football.team.dto.req.RegisterReq;
```

- [ ] **Step 2: 编译 + 全量测试**

```bash
cd backend && mvn test -q 2>&1 | tail -10
```

Expected: BUILD SUCCESS, Tests run: N, Failures: 0

- [ ] **Step 3: Commit**

```bash
cd backend
git add src/main/java/com/football/team/controller/ActivityController.java
git commit -m "feat: accept RegisterReq body in register endpoint"
```

---

### Task 5: Frontend 类型 + API 层

**Files:**
- Modify: `frontend/src/types/api.ts`
- Modify: `frontend/src/api/activity.ts`

- [ ] **Step 1: 更新 types/api.ts**

在文件顶部现有类型之后、`TeamBrief` 之前，新增 RegStatus 类型：

```ts
export type RegStatus = 'JOINED' | 'TENTATIVE' | 'ABSENT'
```

将 `ActivityRes` 接口中的 `iJoined: boolean` 替换为 `myStatus: RegStatus | null`：

```ts
export interface ActivityRes {
  id: number
  type: ActivityType
  title: string
  opponent: string | null
  location: string
  startTime: string
  deadline: string | null
  maxPlayers: number | null
  registeredCount: number
  status: ActivityStatus
  myStatus: RegStatus | null
}
```

将 `ActivityDetailRes` 中的 registrations 元素类型新增 `status` 字段：

```ts
export interface ActivityDetailRes {
  activity: ActivityRes
  registrations: Array<{ userId: number; nickname: string; avatarUrl: string; status: RegStatus }>
  result: MatchResultRes | null
}
```

- [ ] **Step 2: 更新 api/activity.ts**

将 `register` 方法从无参改为接受 `status: RegStatus`，并在 import 中引入 `RegStatus`：

```ts
import { api } from './client'
import type { ActivityRes, ActivityDetailRes, RegStatus } from '../types/api'

export const activityApi = {
  list: (teamId: number) =>
    api.get<ActivityRes[]>(`/api/v1/activities/team/${teamId}`),
  detail: (activityId: number) =>
    api.get<ActivityDetailRes>(`/api/v1/activities/${activityId}`),
  create: (teamId: number, body: {
    type: string; title: string; location: string; startTime: string;
    opponent?: string; deadline?: string; maxPlayers?: number
  }) => api.post<ActivityRes>(`/api/v1/activities/team/${teamId}`, body as Record<string, unknown>),
  register: (activityId: number, status: RegStatus) =>
    api.post<void>(`/api/v1/activities/${activityId}/register`, { status }),
  cancelRegister: (activityId: number) =>
    api.delete<void>(`/api/v1/activities/${activityId}/register`),
  close: (activityId: number) =>
    api.put<void>(`/api/v1/activities/${activityId}/close`, undefined),
  recordResult: (activityId: number, ourScore: number, oppScore: number, notes?: string) =>
    api.put<void>(`/api/v1/activities/${activityId}/result`, { ourScore, oppScore, notes }),
  update: (activityId: number, body: {
    type: string; title: string; location: string; startTime: string;
    opponent?: string; deadline?: string; maxPlayers?: number
  }) => api.put<ActivityRes>(`/api/v1/activities/${activityId}`, body as Record<string, unknown>),
}
```

- [ ] **Step 3: 类型检查**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

此步骤会报错（activity-detail 和 home 还用 iJoined），这是预期的——下面两个 task 修页面。只要错误是"iJoined does not exist"而非 api.ts 本身的错误即可。

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/types/api.ts src/api/activity.ts
git commit -m "feat: update ActivityRes/ActivityDetailRes types and register API"
```

---

### Task 6: activity-detail 页面

**Files:**
- Modify: `frontend/src/pages/activity-detail/index.tsx`

- [ ] **Step 1: 重写 activity-detail 页面**

完整替换 `frontend/src/pages/activity-detail/index.tsx`：

```tsx
import { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { activityApi } from '../../api/activity'
import { useAuthStore } from '../../store/auth'
import type { ActivityDetailRes, RegStatus } from '../../types/api'
import { useT } from '../../i18n/useT'

export default function ActivityDetailPage() {
  const [detail, setDetail] = useState<ActivityDetailRes | null>(null)
  const t = useT()
  const { isCaptainOrAdmin, currentTeamId } = useAuthStore()

  const activityId = Number(Taro.getCurrentInstance().router?.params?.id)

  useShareAppMessage(() => ({
    title: detail?.activity.title ?? '球队活动',
    path: `/pages/activity-detail/index?id=${activityId}&teamId=${currentTeamId}`,
    imageUrl: '/assets/images/share-cover.png',
  }))

  useDidShow(() => {
    Taro.showShareMenu({ withShareTicket: false, showShareItems: ['shareAppMessage'] })
  })

  useEffect(() => {
    if (!activityId) return
    activityApi
      .detail(activityId)
      .then(setDetail)
      .catch(() => Taro.showToast({ title: t('act.load_fail'), icon: 'none' }))
  }, [activityId])

  if (!detail) {
    return (
      <View style={{ padding: '32px', textAlign: 'center' }}>
        <Text style={{ color: '#999' }}>{t('common.loading')}</Text>
      </View>
    )
  }

  const a = detail.activity
  const isOpen = a.status === 'OPEN' && !(a.deadline && new Date(a.deadline) < new Date())

  const handleRegister = async (status: RegStatus) => {
    try {
      if (a.myStatus === status) {
        await activityApi.cancelRegister(activityId)
      } else {
        await activityApi.register(activityId, status)
      }
      const updated = await activityApi.detail(activityId)
      setDetail(updated)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : t('common.error'), icon: 'none' })
    }
  }

  const handleClose = async () => {
    try {
      await activityApi.close(activityId)
      Taro.showToast({ title: '已关闭报名', icon: 'success' })
      const updated = await activityApi.detail(activityId)
      setDetail(updated)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : t('common.error'), icon: 'none' })
    }
  }

  const joined = detail.registrations.filter(r => r.status === 'JOINED')
  const tentative = detail.registrations.filter(r => r.status === 'TENTATIVE')
  const absent = detail.registrations.filter(r => r.status === 'ABSENT')

  const btnStyle = (active: boolean) => ({
    flex: '1',
    background: active ? '#4CAF50' : '#fff',
    color: active ? '#fff' : '#666',
    border: active ? 'none' : '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    marginRight: '8px',
  })

  return (
    <ScrollView scrollY style={{ height: '100vh' }}>
      <View style={{ padding: '16px' }}>
        {/* 基本信息 */}
        <View style={{ background: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
          <Text style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>
            {a.title}
          </Text>
          {a.opponent && (
            <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px' }}>
              {t('act.vs')}{a.opponent}
            </Text>
          )}
          <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px' }}>
            {t('act.location')}{a.location}
          </Text>
          <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px' }}>
            {t('act.start')}{new Date(a.startTime).toLocaleString('zh-CN')}
          </Text>
          {a.deadline && (
            <Text style={{ fontSize: '14px', color: '#999', display: 'block' }}>
              {t('act.deadline')}{new Date(a.deadline).toLocaleString('zh-CN')}
            </Text>
          )}
        </View>

        {/* 比赛结果 */}
        {detail.result && (
          <View style={{ background: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '12px', textAlign: 'center' }}>
            <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '8px' }}>
              {t('act.result')}
            </Text>
            <Text style={{ fontSize: '36px', fontWeight: 'bold' }}>
              {detail.result.ourScore} : {detail.result.oppScore}
            </Text>
            <Text
              style={{
                fontSize: '16px',
                color: detail.result.outcome === 'WIN' ? '#4CAF50' : detail.result.outcome === 'LOSE' ? '#f44336' : '#FF9800',
                display: 'block',
                marginTop: '4px',
              }}
            >
              {detail.result.outcome === 'WIN' ? t('act.win') : detail.result.outcome === 'LOSE' ? t('act.lose') : t('act.draw')}
            </Text>
          </View>
        )}

        {/* 三档报名按钮 */}
        {isOpen && (
          <View style={{ display: 'flex', marginBottom: '12px' }}>
            <Button style={btnStyle(a.myStatus === 'JOINED')} onClick={() => handleRegister('JOINED')}>
              {t('act.status_joined')}
            </Button>
            <Button style={btnStyle(a.myStatus === 'TENTATIVE')} onClick={() => handleRegister('TENTATIVE')}>
              {t('act.status_tentative')}
            </Button>
            <Button style={{ ...btnStyle(a.myStatus === 'ABSENT'), marginRight: '0' }} onClick={() => handleRegister('ABSENT')}>
              {t('act.status_absent')}
            </Button>
          </View>
        )}

        {/* 报名名单（分组） */}
        <View style={{ background: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>
            {t('act.registrations')}（{a.registeredCount}{a.maxPlayers ? `/${a.maxPlayers}` : ''}人）
          </Text>

          {/* JOINED 组 */}
          {joined.length > 0 && (
            <View style={{ marginBottom: '12px' }}>
              <Text style={{ fontSize: '13px', color: '#4CAF50', display: 'block', marginBottom: '6px' }}>
                {t('act.joined_count')}（{joined.length}人）
              </Text>
              {joined.map(r => (
                <View key={r.userId} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                  <Text style={{ fontSize: '20px', marginRight: '8px' }}>👤</Text>
                  <Text style={{ fontSize: '14px' }}>{r.nickname}</Text>
                </View>
              ))}
            </View>
          )}

          {/* TENTATIVE 组 */}
          {tentative.length > 0 && (
            <View style={{ marginBottom: '12px' }}>
              <Text style={{ fontSize: '13px', color: '#FF9800', display: 'block', marginBottom: '6px' }}>
                {t('act.tentative_count')}（{tentative.length}人）
              </Text>
              {tentative.map(r => (
                <View key={r.userId} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                  <Text style={{ fontSize: '20px', marginRight: '8px' }}>👤</Text>
                  <Text style={{ fontSize: '14px' }}>{r.nickname}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ABSENT 组 */}
          {absent.length > 0 && (
            <View>
              <Text style={{ fontSize: '13px', color: '#999', display: 'block', marginBottom: '6px' }}>
                {t('act.absent_count')}（{absent.length}人）
              </Text>
              {absent.map(r => (
                <View key={r.userId} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                  <Text style={{ fontSize: '20px', marginRight: '8px' }}>👤</Text>
                  <Text style={{ fontSize: '14px' }}>{r.nickname}</Text>
                </View>
              ))}
            </View>
          )}

          {detail.registrations.length === 0 && (
            <Text style={{ color: '#999', fontSize: '14px' }}>{t('act.no_regs')}</Text>
          )}
        </View>

        {/* 管理员操作按钮 */}
        {isCaptainOrAdmin() && isOpen && (
          <Button
            style={{ background: '#fff', color: '#999', border: '1px solid #e0e0e0', borderRadius: '8px', marginTop: '8px', fontSize: '14px' }}
            onClick={handleClose}
          >
            {t('act.close')}
          </Button>
        )}
        {isCaptainOrAdmin() && a.status === 'OPEN' && (
          <Button
            style={{ background: '#2196F3', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '8px', fontSize: '14px' }}
            onClick={() => Taro.navigateTo({ url: `/pages/activity-create/index?editId=${activityId}` })}
          >
            {t('act.edit')}
          </Button>
        )}
        {isCaptainOrAdmin() && a.type === 'MATCH' && a.status !== 'OPEN' && !detail.result && (
          <Button
            style={{ background: '#FF9800', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '8px', fontSize: '14px' }}
            onClick={() => Taro.navigateTo({ url: `/pages/activity-create/index?resultFor=${activityId}` })}
          >
            {t('act.record')}
          </Button>
        )}
        <Button
          openType='share'
          style={{ background: '#fff', color: '#07C160', border: '1px solid #07C160', borderRadius: '8px', marginTop: '8px', fontSize: '14px' }}
        >
          {t('act.share')}
        </Button>
      </View>
    </ScrollView>
  )
}
```

- [ ] **Step 2: 类型检查（activity-detail）**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "activity-detail"
```

Expected: 无错误

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/pages/activity-detail/index.tsx
git commit -m "feat: activity-detail three-button registration with grouped list"
```

---

### Task 7: Home 页面 badge 更新

**Files:**
- Modify: `frontend/src/pages/home/index.tsx`

- [ ] **Step 1: 替换 ActivityCard 中的 badge 逻辑**

将 `ActivityCard` 组件内 `iJoined` 相关代码（lines 47-53）替换为 `myStatus` badge：

```tsx
<View style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
  <Text style={{ fontSize: '12px', color: '#999' }}>
    已报名 {a.registeredCount}
    {a.maxPlayers ? `/${a.maxPlayers}` : ''}{t('home.players')}
  </Text>
  {a.myStatus === 'JOINED' && (
    <Text style={{ fontSize: '12px', color: '#4CAF50' }}>{t('act.badge_joined')}</Text>
  )}
  {a.myStatus === 'TENTATIVE' && (
    <Text style={{ fontSize: '12px', color: '#FF9800' }}>{t('act.badge_tentative')}</Text>
  )}
  {a.myStatus === 'ABSENT' && (
    <Text style={{ fontSize: '12px', color: '#999' }}>{t('act.badge_absent')}</Text>
  )}
</View>
```

- [ ] **Step 2: 类型检查**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: 无错误（所有页面）

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/pages/home/index.tsx
git commit -m "feat: home activity card badge uses myStatus"
```

---

### Task 8: i18n 新增翻译键

**Files:**
- Modify: `frontend/src/i18n/zh.ts`
- Modify: `frontend/src/i18n/en.ts`

- [ ] **Step 1: 在 zh.ts 的 act 命名空间末尾添加新键**

在 `'act.share'` 之后（或 `act` 命名空间最后一个键之后）添加：

```ts
  'act.status_joined': '✅ 报名',
  'act.status_tentative': '❓ 待定',
  'act.status_absent': '🏖 请假',
  'act.badge_joined': '✓ 已报名',
  'act.badge_tentative': '? 待定',
  'act.badge_absent': '— 请假',
  'act.joined_count': '报名',
  'act.tentative_count': '待定',
  'act.absent_count': '请假',
```

- [ ] **Step 2: 在 en.ts 的对应位置添加新键**

```ts
  'act.status_joined': '✅ Join',
  'act.status_tentative': '❓ Maybe',
  'act.status_absent': '🏖 Absent',
  'act.badge_joined': '✓ Joined',
  'act.badge_tentative': '? Maybe',
  'act.badge_absent': '— Absent',
  'act.joined_count': 'Joined',
  'act.tentative_count': 'Maybe',
  'act.absent_count': 'Absent',
```

- [ ] **Step 3: 验证 zh/en 键数量一致**

```bash
grep -c "'" frontend/src/i18n/zh.ts && grep -c "'" frontend/src/i18n/en.ts
```

Expected: 两个数字相同

- [ ] **Step 4: 类型检查**

```bash
cd frontend && npx tsc --noEmit 2>&1
```

Expected: 无错误

- [ ] **Step 5: Commit**

```bash
cd frontend
git add src/i18n/zh.ts src/i18n/en.ts
git commit -m "feat: add i18n keys for registration status feature"
```
