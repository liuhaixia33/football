# 训练活动分组功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 TRAINING 类型活动添加队员分组管理功能，支持随机均分、手动调整、自定义组名，并可生成海报分享到微信群。

**Architecture:** 后端新增两张规范化表（activity_group / activity_group_member）和 GroupingService + GroupingController；前端新增 `/pages/grouping/index` 页面，活动详情页入口跳转，Canvas 生成海报。

**Tech Stack:** Spring Boot 3.2.5 / JPA / Flyway / JUnit 5 / Mockito；Taro 3.6 / React / TypeScript / Taro Canvas API

---

## 文件结构

**新建（后端）**
- `backend/src/main/resources/db/migration/V7__activity_grouping.sql`
- `backend/src/main/java/com/football/team/entity/ActivityGroup.java`
- `backend/src/main/java/com/football/team/entity/ActivityGroupMember.java`
- `backend/src/main/java/com/football/team/repository/ActivityGroupRepository.java`
- `backend/src/main/java/com/football/team/repository/ActivityGroupMemberRepository.java`
- `backend/src/main/java/com/football/team/dto/req/SaveGroupingReq.java`
- `backend/src/main/java/com/football/team/dto/req/RandomGroupingReq.java`
- `backend/src/main/java/com/football/team/dto/res/GroupingRes.java`
- `backend/src/main/java/com/football/team/service/GroupingService.java`
- `backend/src/main/java/com/football/team/controller/GroupingController.java`
- `backend/src/test/java/com/football/team/service/GroupingServiceTest.java`

**新建（前端）**
- `frontend/src/api/grouping.ts`
- `frontend/src/pages/grouping/index.config.ts`
- `frontend/src/pages/grouping/index.tsx`

**修改（前端）**
- `frontend/src/types/api.ts` — 新增 GroupingRes 相关类型
- `frontend/src/app.config.ts` — 注册 grouping 页面
- `frontend/src/pages/activity-detail/index.tsx` — 添加"分组管理"入口按钮

---

### Task 1: DB 迁移 V7

**Files:**
- Create: `backend/src/main/resources/db/migration/V7__activity_grouping.sql`

- [ ] **Step 1: 创建迁移文件**

```sql
CREATE TABLE `activity_group` (
  `id`           BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `activity_id`  BIGINT      NOT NULL,
  `group_index`  INT         NOT NULL,
  `group_name`   VARCHAR(50) NOT NULL,
  `created_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_activity` (`activity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `activity_group_member` (
  `id`        BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `group_id`  BIGINT NOT NULL,
  `user_id`   BIGINT NOT NULL,
  KEY `idx_group` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- [ ] **Step 2: 验证 SQL 语法**

确认文件保存为 `V7__activity_grouping.sql`（双下划线），与 V1-V6 命名风格一致。

- [ ] **Step 3: 提交**

```bash
cd /Users/caoyajun/football-team
git add backend/src/main/resources/db/migration/V7__activity_grouping.sql
git commit -m "feat: add activity_group and activity_group_member tables"
```

---

### Task 2: JPA 实体

**Files:**
- Create: `backend/src/main/java/com/football/team/entity/ActivityGroup.java`
- Create: `backend/src/main/java/com/football/team/entity/ActivityGroupMember.java`

- [ ] **Step 1: 创建 ActivityGroup 实体**

```java
package com.football.team.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "activity_group")
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

- [ ] **Step 2: 创建 ActivityGroupMember 实体**

```java
package com.football.team.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data @Entity @Table(name = "activity_group_member")
public class ActivityGroupMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long groupId;
    private Long userId;
}
```

- [ ] **Step 3: 编译验证**

```bash
cd /Users/caoyajun/football-team/backend
./mvnw compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 4: 提交**

```bash
cd /Users/caoyajun/football-team
git add backend/src/main/java/com/football/team/entity/ActivityGroup.java \
        backend/src/main/java/com/football/team/entity/ActivityGroupMember.java
git commit -m "feat: add ActivityGroup and ActivityGroupMember entities"
```

---

### Task 3: Repository 接口

**Files:**
- Create: `backend/src/main/java/com/football/team/repository/ActivityGroupRepository.java`
- Create: `backend/src/main/java/com/football/team/repository/ActivityGroupMemberRepository.java`

- [ ] **Step 1: 创建 ActivityGroupRepository**

```java
package com.football.team.repository;

import com.football.team.entity.ActivityGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityGroupRepository extends JpaRepository<ActivityGroup, Long> {
    List<ActivityGroup> findByActivityIdOrderByGroupIndex(Long activityId);
    void deleteByActivityId(Long activityId);
}
```

- [ ] **Step 2: 创建 ActivityGroupMemberRepository**

```java
package com.football.team.repository;

import com.football.team.entity.ActivityGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityGroupMemberRepository extends JpaRepository<ActivityGroupMember, Long> {
    List<ActivityGroupMember> findByGroupId(Long groupId);
    void deleteByGroupId(Long groupId);
    void deleteByGroupIdIn(List<Long> groupIds);
}
```

- [ ] **Step 3: 编译验证**

```bash
cd /Users/caoyajun/football-team/backend
./mvnw compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 4: 提交**

```bash
cd /Users/caoyajun/football-team
git add backend/src/main/java/com/football/team/repository/ActivityGroupRepository.java \
        backend/src/main/java/com/football/team/repository/ActivityGroupMemberRepository.java
git commit -m "feat: add ActivityGroup and ActivityGroupMember repositories"
```

---

### Task 4: DTO 类

**Files:**
- Create: `backend/src/main/java/com/football/team/dto/req/SaveGroupingReq.java`
- Create: `backend/src/main/java/com/football/team/dto/req/RandomGroupingReq.java`
- Create: `backend/src/main/java/com/football/team/dto/res/GroupingRes.java`

- [ ] **Step 1: 创建 SaveGroupingReq**

```java
package com.football.team.dto.req;

import lombok.Data;
import java.util.List;

@Data
public class SaveGroupingReq {
    private int groupCount;
    private List<GroupDto> groups;

    @Data
    public static class GroupDto {
        private int index;
        private String name;
        private List<Long> memberIds;
    }
}
```

- [ ] **Step 2: 创建 RandomGroupingReq**

```java
package com.football.team.dto.req;

import lombok.Data;
import java.util.List;

@Data
public class RandomGroupingReq {
    private int groupCount;
    private List<String> groupNames;
}
```

- [ ] **Step 3: 创建 GroupingRes**

```java
package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class GroupingRes {
    private List<GroupDto> groups;
    private List<MemberDto> ungrouped;

    @Data @Builder
    public static class GroupDto {
        private Long id;
        private int index;
        private String name;
        private List<MemberDto> members;
    }

    @Data @Builder
    public static class MemberDto {
        private Long userId;
        private String nickname;
        private String avatarUrl;
    }
}
```

- [ ] **Step 4: 编译验证**

```bash
cd /Users/caoyajun/football-team/backend
./mvnw compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 5: 提交**

```bash
cd /Users/caoyajun/football-team
git add backend/src/main/java/com/football/team/dto/req/SaveGroupingReq.java \
        backend/src/main/java/com/football/team/dto/req/RandomGroupingReq.java \
        backend/src/main/java/com/football/team/dto/res/GroupingRes.java
git commit -m "feat: add grouping DTOs"
```

---

### Task 5: GroupingService + 单元测试

**Files:**
- Create: `backend/src/main/java/com/football/team/service/GroupingService.java`
- Test: `backend/src/test/java/com/football/team/service/GroupingServiceTest.java`

- [ ] **Step 1: 写失败测试**

创建 `backend/src/test/java/com/football/team/service/GroupingServiceTest.java`：

```java
package com.football.team.service;

import com.football.team.dto.req.RandomGroupingReq;
import com.football.team.dto.req.SaveGroupingReq;
import com.football.team.dto.res.GroupingRes;
import com.football.team.entity.*;
import com.football.team.enums.ActivityStatus;
import com.football.team.enums.ActivityType;
import com.football.team.enums.RegStatus;
import com.football.team.exception.BusinessException;
import com.football.team.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.LongStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupingServiceTest {

    @Mock ActivityRepository activityRepository;
    @Mock ActivityRegistrationRepository regRepository;
    @Mock ActivityGroupRepository groupRepository;
    @Mock ActivityGroupMemberRepository groupMemberRepository;
    @Mock UserRepository userRepository;
    @InjectMocks GroupingService groupingService;

    private Activity openTrainingActivity(Long teamId) {
        Activity a = new Activity();
        a.setTeamId(teamId);
        a.setType(ActivityType.TRAINING);
        a.setStatus(ActivityStatus.OPEN);
        a.setTitle("周六训练");
        a.setLocation("XX 足球场");
        a.setStartTime(LocalDateTime.now());
        return a;
    }

    private ActivityRegistration reg(Long userId) {
        ActivityRegistration r = new ActivityRegistration();
        r.setUserId(userId);
        r.setStatus(RegStatus.JOINED);
        return r;
    }

    @Test
    void saveGrouping_throwsWhenActivityClosed() {
        Activity a = openTrainingActivity(1L);
        a.setStatus(ActivityStatus.CLOSED);
        when(activityRepository.findById(10L)).thenReturn(Optional.of(a));

        SaveGroupingReq req = new SaveGroupingReq();
        req.setGroupCount(2);
        req.setGroups(List.of());

        assertThatThrownBy(() -> groupingService.saveGrouping(10L, 1L, req))
            .isInstanceOf(BusinessException.class)
            .extracting("code").isEqualTo(403);
    }

    @Test
    void saveGrouping_throwsWhenNotTraining() {
        Activity a = openTrainingActivity(1L);
        a.setType(ActivityType.MATCH);
        when(activityRepository.findById(10L)).thenReturn(Optional.of(a));

        SaveGroupingReq req = new SaveGroupingReq();
        req.setGroupCount(2);
        req.setGroups(List.of());

        assertThatThrownBy(() -> groupingService.saveGrouping(10L, 1L, req))
            .isInstanceOf(BusinessException.class)
            .extracting("code").isEqualTo(400);
    }

    @Test
    void saveGrouping_persistsGroupsAndMembers() {
        Activity a = openTrainingActivity(1L);
        when(activityRepository.findById(10L)).thenReturn(Optional.of(a));
        when(groupRepository.findByActivityIdOrderByGroupIndex(10L)).thenReturn(List.of());
        when(regRepository.findByActivityIdAndStatus(10L, RegStatus.JOINED)).thenReturn(List.of());

        AtomicLong seq = new AtomicLong(1);
        when(groupRepository.save(any())).thenAnswer(inv -> {
            ActivityGroup g = inv.getArgument(0);
            g.setId(seq.getAndIncrement());
            return g;
        });
        when(groupMemberRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(anyLong())).thenAnswer(inv -> {
            User u = new User();
            u.setId(inv.getArgument(0));
            u.setNickname("user" + inv.getArgument(0));
            return Optional.of(u);
        });

        SaveGroupingReq.GroupDto g1 = new SaveGroupingReq.GroupDto();
        g1.setIndex(0); g1.setName("红队"); g1.setMemberIds(List.of(1L, 2L, 3L));
        SaveGroupingReq.GroupDto g2 = new SaveGroupingReq.GroupDto();
        g2.setIndex(1); g2.setName("蓝队"); g2.setMemberIds(List.of(4L, 5L));

        SaveGroupingReq req = new SaveGroupingReq();
        req.setGroupCount(2);
        req.setGroups(List.of(g1, g2));

        GroupingRes res = groupingService.saveGrouping(10L, 1L, req);

        verify(groupRepository, times(2)).save(any());
        verify(groupMemberRepository, times(5)).save(any());
        assertThat(res.getGroups()).hasSize(2);
        assertThat(res.getGroups().get(0).getMembers()).hasSize(3);
        assertThat(res.getGroups().get(1).getMembers()).hasSize(2);
    }

    @Test
    void randomGrouping_throwsWhenNoJoinedPlayers() {
        Activity a = openTrainingActivity(1L);
        when(activityRepository.findById(10L)).thenReturn(Optional.of(a));
        when(regRepository.findByActivityIdAndStatus(10L, RegStatus.JOINED)).thenReturn(List.of());

        RandomGroupingReq req = new RandomGroupingReq();
        req.setGroupCount(2);
        req.setGroupNames(List.of("红队", "蓝队"));

        assertThatThrownBy(() -> groupingService.randomGrouping(10L, 1L, req))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("暂无可分配队员");
    }

    @Test
    void randomGrouping_distributesSeven_intoThreeGroups() {
        Activity a = openTrainingActivity(1L);
        when(activityRepository.findById(10L)).thenReturn(Optional.of(a));

        List<ActivityRegistration> regs = LongStream.rangeClosed(1, 7)
            .mapToObj(this::reg).toList();
        when(regRepository.findByActivityIdAndStatus(10L, RegStatus.JOINED)).thenReturn(regs);
        when(groupRepository.findByActivityIdOrderByGroupIndex(10L)).thenReturn(List.of());

        AtomicLong seq = new AtomicLong(1);
        when(groupRepository.save(any())).thenAnswer(inv -> {
            ActivityGroup g = inv.getArgument(0);
            g.setId(seq.getAndIncrement());
            return g;
        });
        when(groupMemberRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(anyLong())).thenAnswer(inv -> {
            User u = new User();
            u.setId(inv.getArgument(0));
            u.setNickname("u" + inv.getArgument(0));
            return Optional.of(u);
        });

        RandomGroupingReq req = new RandomGroupingReq();
        req.setGroupCount(3);
        req.setGroupNames(List.of("红队", "蓝队", "黄队"));

        GroupingRes res = groupingService.randomGrouping(10L, 1L, req);

        verify(groupRepository, times(3)).save(any());
        verify(groupMemberRepository, times(7)).save(any());
        assertThat(res.getGroups()).hasSize(3);
        int total = res.getGroups().stream().mapToInt(g -> g.getMembers().size()).sum();
        assertThat(total).isEqualTo(7);
    }

    @Test
    void getGrouping_returnsGroupsAndUngrouped() {
        Activity a = openTrainingActivity(1L);
        when(activityRepository.findById(10L)).thenReturn(Optional.of(a));

        ActivityGroup group = new ActivityGroup();
        group.setId(1L); group.setGroupIndex(0); group.setGroupName("红队");
        when(groupRepository.findByActivityIdOrderByGroupIndex(10L)).thenReturn(List.of(group));

        ActivityGroupMember member = new ActivityGroupMember();
        member.setGroupId(1L); member.setUserId(10L);
        when(groupMemberRepository.findByGroupId(1L)).thenReturn(List.of(member));

        ActivityRegistration joinedReg = reg(10L);
        ActivityRegistration joinedReg2 = reg(20L);
        when(regRepository.findByActivityIdAndStatus(10L, RegStatus.JOINED))
            .thenReturn(List.of(joinedReg, joinedReg2));

        when(userRepository.findById(anyLong())).thenAnswer(inv -> {
            User u = new User();
            u.setId(inv.getArgument(0));
            u.setNickname("u" + inv.getArgument(0));
            return Optional.of(u);
        });

        GroupingRes res = groupingService.getGrouping(10L, 1L);

        assertThat(res.getGroups()).hasSize(1);
        assertThat(res.getGroups().get(0).getMembers()).hasSize(1);
        assertThat(res.getUngrouped()).hasSize(1);
        assertThat(res.getUngrouped().get(0).getUserId()).isEqualTo(20L);
    }
}
```

- [ ] **Step 2: 运行测试，确认全部失败**

```bash
cd /Users/caoyajun/football-team/backend
./mvnw test -pl . -Dtest=GroupingServiceTest -q 2>&1 | tail -5
```

Expected: FAILURE（GroupingService 不存在）

- [ ] **Step 3: 创建 GroupingService**

```java
package com.football.team.service;

import com.football.team.dto.req.RandomGroupingReq;
import com.football.team.dto.req.SaveGroupingReq;
import com.football.team.dto.res.GroupingRes;
import com.football.team.entity.*;
import com.football.team.enums.ActivityStatus;
import com.football.team.enums.ActivityType;
import com.football.team.enums.RegStatus;
import com.football.team.exception.BusinessException;
import com.football.team.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupingService {

    private final ActivityRepository activityRepository;
    private final ActivityRegistrationRepository regRepository;
    private final ActivityGroupRepository groupRepository;
    private final ActivityGroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public GroupingRes getGrouping(Long activityId, Long teamId) {
        Activity a = findAndVerify(activityId, teamId);

        List<ActivityGroup> groups = groupRepository.findByActivityIdOrderByGroupIndex(activityId);

        Set<Long> groupedUserIds = groups.stream()
            .flatMap(g -> groupMemberRepository.findByGroupId(g.getId()).stream())
            .map(ActivityGroupMember::getUserId)
            .collect(Collectors.toSet());

        List<Long> joinedUserIds = regRepository.findByActivityIdAndStatus(activityId, RegStatus.JOINED)
            .stream().map(ActivityRegistration::getUserId).toList();

        List<GroupingRes.GroupDto> groupDtos = groups.stream().map(g -> {
            List<GroupingRes.MemberDto> members = groupMemberRepository.findByGroupId(g.getId())
                .stream().map(m -> toMemberDto(m.getUserId())).toList();
            return GroupingRes.GroupDto.builder()
                .id(g.getId()).index(g.getGroupIndex()).name(g.getGroupName())
                .members(members).build();
        }).toList();

        List<GroupingRes.MemberDto> ungrouped = joinedUserIds.stream()
            .filter(id -> !groupedUserIds.contains(id))
            .map(this::toMemberDto).toList();

        return GroupingRes.builder().groups(groupDtos).ungrouped(ungrouped).build();
    }

    public GroupingRes saveGrouping(Long activityId, Long teamId, SaveGroupingReq req) {
        Activity a = findAndVerify(activityId, teamId);
        if (a.getType() != ActivityType.TRAINING)
            throw BusinessException.badRequest("仅训练活动支持分组");
        if (a.getStatus() != ActivityStatus.OPEN)
            throw BusinessException.forbidden("活动已结束，无法修改分组");

        deleteExistingGrouping(activityId);

        LocalDateTime now = LocalDateTime.now();
        List<GroupingRes.GroupDto> groupDtos = new ArrayList<>();

        for (SaveGroupingReq.GroupDto groupReq : req.getGroups()) {
            ActivityGroup group = new ActivityGroup();
            group.setActivityId(activityId);
            group.setGroupIndex(groupReq.getIndex());
            group.setGroupName(groupReq.getName());
            group.setCreatedAt(now);
            group.setUpdatedAt(now);
            ActivityGroup saved = groupRepository.save(group);

            List<GroupingRes.MemberDto> memberDtos = new ArrayList<>();
            for (Long userId : groupReq.getMemberIds()) {
                ActivityGroupMember m = new ActivityGroupMember();
                m.setGroupId(saved.getId());
                m.setUserId(userId);
                groupMemberRepository.save(m);
                memberDtos.add(toMemberDto(userId));
            }

            groupDtos.add(GroupingRes.GroupDto.builder()
                .id(saved.getId()).index(saved.getGroupIndex()).name(saved.getGroupName())
                .members(memberDtos).build());
        }

        Set<Long> groupedIds = req.getGroups().stream()
            .flatMap(g -> g.getMemberIds().stream()).collect(Collectors.toSet());

        List<GroupingRes.MemberDto> ungrouped = regRepository
            .findByActivityIdAndStatus(activityId, RegStatus.JOINED).stream()
            .filter(r -> !groupedIds.contains(r.getUserId()))
            .map(r -> toMemberDto(r.getUserId())).toList();

        return GroupingRes.builder().groups(groupDtos).ungrouped(ungrouped).build();
    }

    public GroupingRes randomGrouping(Long activityId, Long teamId, RandomGroupingReq req) {
        Activity a = findAndVerify(activityId, teamId);
        if (a.getType() != ActivityType.TRAINING)
            throw BusinessException.badRequest("仅训练活动支持分组");
        if (a.getStatus() != ActivityStatus.OPEN)
            throw BusinessException.forbidden("活动已结束，无法修改分组");

        List<Long> joinedIds = regRepository.findByActivityIdAndStatus(activityId, RegStatus.JOINED)
            .stream().map(ActivityRegistration::getUserId).collect(Collectors.toCollection(ArrayList::new));

        if (joinedIds.isEmpty())
            throw BusinessException.badRequest("暂无可分配队员");

        Collections.shuffle(joinedIds);
        int k = req.getGroupCount();
        int base = joinedIds.size() / k;
        int extra = joinedIds.size() % k;

        List<SaveGroupingReq.GroupDto> groupDtos = new ArrayList<>();
        int offset = 0;
        for (int i = 0; i < k; i++) {
            int size = base + (i < extra ? 1 : 0);
            SaveGroupingReq.GroupDto g = new SaveGroupingReq.GroupDto();
            g.setIndex(i);
            g.setName(req.getGroupNames().get(i));
            g.setMemberIds(new ArrayList<>(joinedIds.subList(offset, offset + size)));
            groupDtos.add(g);
            offset += size;
        }

        SaveGroupingReq saveReq = new SaveGroupingReq();
        saveReq.setGroupCount(k);
        saveReq.setGroups(groupDtos);
        return saveGrouping(activityId, teamId, saveReq);
    }

    private void deleteExistingGrouping(Long activityId) {
        List<ActivityGroup> existing = groupRepository.findByActivityIdOrderByGroupIndex(activityId);
        if (!existing.isEmpty()) {
            List<Long> groupIds = existing.stream().map(ActivityGroup::getId).toList();
            groupMemberRepository.deleteByGroupIdIn(groupIds);
            groupRepository.deleteAll(existing);
        }
    }

    private Activity findAndVerify(Long activityId, Long teamId) {
        Activity a = activityRepository.findById(activityId)
            .orElseThrow(() -> BusinessException.notFound("活动不存在"));
        if (!a.getTeamId().equals(teamId))
            throw BusinessException.notFound("活动不存在");
        return a;
    }

    private GroupingRes.MemberDto toMemberDto(Long userId) {
        User u = userRepository.findById(userId).orElseThrow();
        return GroupingRes.MemberDto.builder()
            .userId(u.getId()).nickname(u.getNickname()).avatarUrl(u.getAvatarUrl())
            .build();
    }
}
```

- [ ] **Step 4: 运行测试，确认全部通过**

```bash
cd /Users/caoyajun/football-team/backend
./mvnw test -pl . -Dtest=GroupingServiceTest -q 2>&1 | tail -5
```

Expected: BUILD SUCCESS，5 tests passed

- [ ] **Step 5: 提交**

```bash
cd /Users/caoyajun/football-team
git add backend/src/main/java/com/football/team/service/GroupingService.java \
        backend/src/test/java/com/football/team/service/GroupingServiceTest.java
git commit -m "feat: add GroupingService with get/save/random grouping logic"
```

---

### Task 6: GroupingController

**Files:**
- Create: `backend/src/main/java/com/football/team/controller/GroupingController.java`

- [ ] **Step 1: 创建 GroupingController**

```java
package com.football.team.controller;

import com.football.team.dto.req.RandomGroupingReq;
import com.football.team.dto.req.SaveGroupingReq;
import com.football.team.dto.res.ApiResponse;
import com.football.team.dto.res.GroupingRes;
import com.football.team.enums.MemberRole;
import com.football.team.security.RequireRole;
import com.football.team.service.GroupingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class GroupingController {

    private final GroupingService groupingService;

    @GetMapping("/{activityId}/grouping")
    @RequireRole(MemberRole.PLAYER)
    public ApiResponse<GroupingRes> getGrouping(HttpServletRequest req,
                                                @PathVariable Long activityId) {
        Long teamId = (Long) req.getAttribute("currentTeamId");
        return ApiResponse.ok(groupingService.getGrouping(activityId, teamId));
    }

    @PutMapping("/{activityId}/grouping")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<GroupingRes> saveGrouping(HttpServletRequest req,
                                                  @PathVariable Long activityId,
                                                  @RequestBody SaveGroupingReq body) {
        Long teamId = (Long) req.getAttribute("currentTeamId");
        return ApiResponse.ok(groupingService.saveGrouping(activityId, teamId, body));
    }

    @PostMapping("/{activityId}/grouping/random")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<GroupingRes> randomGrouping(HttpServletRequest req,
                                                    @PathVariable Long activityId,
                                                    @RequestBody RandomGroupingReq body) {
        Long teamId = (Long) req.getAttribute("currentTeamId");
        return ApiResponse.ok(groupingService.randomGrouping(activityId, teamId, body));
    }
}
```

说明：`@RequireRole(MemberRole.ADMIN)` 允许 CAPTAIN（ordinal 0）和 ADMIN（ordinal 1），因为 `TeamContextHolder.isAtLeast` 使用 `ordinal <=` 判断。GET 使用 PLAYER 让所有成员都能查看分组。

- [ ] **Step 2: 编译验证**

```bash
cd /Users/caoyajun/football-team/backend
./mvnw compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 3: 提交**

```bash
cd /Users/caoyajun/football-team
git add backend/src/main/java/com/football/team/controller/GroupingController.java
git commit -m "feat: add GroupingController with GET/PUT/POST-random endpoints"
```

---

### Task 7: 前端 — 类型定义 + API 客户端

**Files:**
- Modify: `frontend/src/types/api.ts`
- Create: `frontend/src/api/grouping.ts`

- [ ] **Step 1: 在 api.ts 末尾追加分组类型**

在 `frontend/src/types/api.ts` 末尾添加：

```ts
export interface GroupMemberDto {
  userId: number
  nickname: string
  avatarUrl: string
}

export interface GroupDto {
  id: number
  index: number
  name: string
  members: GroupMemberDto[]
}

export interface GroupingRes {
  groups: GroupDto[]
  ungrouped: GroupMemberDto[]
}
```

- [ ] **Step 2: 创建 groupingApi**

```ts
import { api } from './client'
import type { GroupingRes } from '../types/api'

export const groupingApi = {
  getGrouping: (activityId: number) =>
    api.get<GroupingRes>(`/api/v1/activities/${activityId}/grouping`),

  saveGrouping: (activityId: number, body: {
    groupCount: number
    groups: Array<{ index: number; name: string; memberIds: number[] }>
  }) => api.put<GroupingRes>(`/api/v1/activities/${activityId}/grouping`, body as Record<string, unknown>),

  randomGrouping: (activityId: number, body: {
    groupCount: number
    groupNames: string[]
  }) => api.post<GroupingRes>(`/api/v1/activities/${activityId}/grouping/random`, body as Record<string, unknown>),
}
```

- [ ] **Step 3: TypeScript 类型检查**

```bash
cd /Users/caoyajun/football-team/frontend
npx tsc --noEmit 2>&1 | head -20
```

Expected: 无报错

- [ ] **Step 4: 提交**

```bash
cd /Users/caoyajun/football-team
git add frontend/src/types/api.ts frontend/src/api/grouping.ts
git commit -m "feat: add grouping API types and client"
```

---

### Task 8: 前端 — 注册页面 + 活动详情入口

**Files:**
- Create: `frontend/src/pages/grouping/index.config.ts`
- Modify: `frontend/src/app.config.ts`
- Modify: `frontend/src/pages/activity-detail/index.tsx`

- [ ] **Step 1: 创建分组页配置文件**

```ts
// frontend/src/pages/grouping/index.config.ts
export default definePageConfig({
  navigationBarTitleText: '分组管理',
})
```

- [ ] **Step 2: 在 app.config.ts 注册 grouping 页面**

在 `frontend/src/app.config.ts` 的 `pages` 数组末尾（`'pages/my/index'` 之后）添加：

```ts
'pages/grouping/index',
```

完整 pages 数组：

```ts
pages: [
  'pages/login/index',
  'pages/team-select/index',
  'pages/onboard/index',
  'pages/create-team/index',
  'pages/join-team/index',
  'pages/home/index',
  'pages/activity-detail/index',
  'pages/activity-create/index',
  'pages/members/index',
  'pages/finance/index',
  'pages/finance-record/index',
  'pages/member-fee/index',
  'pages/my/index',
  'pages/grouping/index',
],
```

- [ ] **Step 3: 在活动详情页添加"分组管理"入口**

在 `frontend/src/pages/activity-detail/index.tsx` 中，在 `isCaptainOrAdmin` 和 `isTraining` 条件下渲染按钮。

首先在组件顶部（`const isOpen = ...` 之后）添加：

```tsx
const isTraining = a.type === 'TRAINING'
const canManageGrouping = isCaptainOrAdmin() && isTraining && (a.status === 'OPEN' || a.status === 'CLOSED')
```

然后在关闭报名按钮（`{isCaptainOrAdmin() && isOpen && ...}` 块）之后，添加分组管理按钮：

```tsx
{canManageGrouping && (
  <Button
    style={{
      width: '100%',
      background: '#fff',
      color: '#4CAF50',
      border: '1px solid #4CAF50',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '12px',
    }}
    onClick={() =>
      Taro.navigateTo({
        url: `/pages/grouping/index?activityId=${activityId}&title=${encodeURIComponent(a.title)}&startTime=${encodeURIComponent(a.startTime)}&location=${encodeURIComponent(a.location ?? '')}&status=${a.status}`,
      })
    }
  >
    分组管理
  </Button>
)}
```

- [ ] **Step 4: TypeScript 检查**

```bash
cd /Users/caoyajun/football-team/frontend
npx tsc --noEmit 2>&1 | head -20
```

Expected: 无报错

- [ ] **Step 5: 提交**

```bash
cd /Users/caoyajun/football-team
git add frontend/src/pages/grouping/index.config.ts \
        frontend/src/app.config.ts \
        frontend/src/pages/activity-detail/index.tsx
git commit -m "feat: register grouping page and add entry button in activity detail"
```

---

### Task 9: 前端 — 分组页面完整 UI

**Files:**
- Create: `frontend/src/pages/grouping/index.tsx`

- [ ] **Step 1: 创建分组页面**

```tsx
import { useState, useEffect } from 'react'
import { View, Text, Button, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { groupingApi } from '../../api/grouping'
import type { GroupMemberDto, GroupingRes } from '../../types/api'

interface LocalGroup {
  id?: number
  index: number
  name: string
  members: GroupMemberDto[]
}

export default function GroupingPage() {
  const params = Taro.getCurrentInstance().router?.params ?? {}
  const activityId = Number(params.activityId)
  const activityTitle = decodeURIComponent(params.title ?? '')
  const activityTime = decodeURIComponent(params.startTime ?? '')
  const activityLocation = decodeURIComponent(params.location ?? '')
  const activityStatus = params.status ?? ''
  const isOpen = activityStatus === 'OPEN'

  const [groups, setGroups] = useState<LocalGroup[]>([])
  const [ungrouped, setUngrouped] = useState<GroupMemberDto[]>([])
  const [groupCount, setGroupCount] = useState(2)
  const [selected, setSelected] = useState<{ member: GroupMemberDto; fromGroupIndex: number | null } | null>(null)
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null)
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadGrouping() }, [activityId])

  function applyRes(res: GroupingRes) {
    setGroups(res.groups.map(g => ({ id: g.id, index: g.index, name: g.name, members: g.members })))
    setUngrouped(res.ungrouped)
    if (res.groups.length > 0) setGroupCount(res.groups.length)
    setDirty(false)
  }

  async function loadGrouping() {
    setLoading(true)
    try { applyRes(await groupingApi.getGrouping(activityId)) }
    catch (e: unknown) { Taro.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' }) }
    finally { setLoading(false) }
  }

  async function handleSave() {
    try {
      const res = await groupingApi.saveGrouping(activityId, {
        groupCount: groups.length,
        groups: groups.map(g => ({ index: g.index, name: g.name, memberIds: g.members.map(m => m.userId) })),
      })
      applyRes(res)
      Taro.showToast({ title: '保存成功', icon: 'success' })
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
    }
  }

  async function handleRandom() {
    const defaultNames = ['第1组', '第2组', '第3组', '第4组']
    const groupNames = groups.length >= groupCount
      ? groups.slice(0, groupCount).map(g => g.name)
      : defaultNames.slice(0, groupCount)
    try {
      const res = await groupingApi.randomGrouping(activityId, { groupCount, groupNames })
      applyRes(res)
      Taro.showToast({ title: '随机分组完成', icon: 'success' })
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '分组失败', icon: 'none' })
    }
  }

  function handleGroupCountChange(count: number) {
    if (!isOpen) return
    const defaultNames = ['第1组', '第2组', '第3组', '第4组']
    const newGroups: LocalGroup[] = []
    for (let i = 0; i < count; i++) {
      if (i < groups.length) newGroups.push(groups[i])
      else newGroups.push({ index: i, name: defaultNames[i], members: [] })
    }
    if (count < groups.length) {
      const removed = groups.slice(count).flatMap(g => g.members)
      setUngrouped(prev => [...prev, ...removed])
    }
    setGroups(newGroups)
    setGroupCount(count)
    setDirty(true)
  }

  function handlePlayerClick(member: GroupMemberDto, fromGroupIndex: number | null) {
    if (!isOpen) return
    setSelected({ member, fromGroupIndex })
  }

  function handleMoveTo(toGroupIndex: number | null) {
    if (!selected) return
    const { member, fromGroupIndex } = selected

    setGroups(prev => prev.map((g, idx) => {
      if (idx === fromGroupIndex) return { ...g, members: g.members.filter(m => m.userId !== member.userId) }
      if (idx === toGroupIndex) return { ...g, members: [...g.members, member] }
      return g
    }))

    if (fromGroupIndex === null) setUngrouped(prev => prev.filter(m => m.userId !== member.userId))
    if (toGroupIndex === null) setUngrouped(prev => [...prev, member])

    setSelected(null)
    setDirty(true)
  }

  function handleRenameGroup(groupIndex: number, newName: string) {
    setGroups(prev => prev.map((g, idx) => idx === groupIndex ? { ...g, name: newName } : g))
    setDirty(true)
  }

  const chipStyle = (active: boolean) => ({
    display: 'inline-block',
    padding: '4px 10px',
    margin: '4px',
    borderRadius: '16px',
    fontSize: '13px',
    background: active ? '#4CAF50' : '#f0f0f0',
    color: active ? '#fff' : '#333',
  })

  if (loading) {
    return (
      <View style={{ padding: '32px', textAlign: 'center' }}>
        <Text style={{ color: '#999' }}>加载中...</Text>
      </View>
    )
  }

  return (
    <ScrollView scrollY style={{ height: '100vh', background: '#f5f5f5' }}>
      <View style={{ padding: '12px' }}>

        {/* 组数 + 随机按钮 */}
        {isOpen && (
          <View style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', background: '#fff', borderRadius: '8px', padding: '12px' }}>
            <Text style={{ fontSize: '14px', color: '#333', marginRight: '12px' }}>分组数：</Text>
            {[2, 3, 4].map(n => (
              <Button
                key={n}
                style={{
                  padding: '4px 12px',
                  marginRight: '6px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  background: groupCount === n ? '#4CAF50' : '#f0f0f0',
                  color: groupCount === n ? '#fff' : '#333',
                  border: 'none',
                }}
                onClick={() => handleGroupCountChange(n)}
              >{n}</Button>
            ))}
            <Button
              style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', background: '#4CAF50', color: '#fff', border: 'none' }}
              onClick={handleRandom}
            >一键随机</Button>
          </View>
        )}

        {/* 各分组卡片 */}
        {groups.map((g, idx) => (
          <View key={idx} style={{ background: '#fff', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
            {/* 组名（可编辑） */}
            {isOpen && editingGroupIndex === idx ? (
              <Input
                value={g.name}
                style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #4CAF50' }}
                onInput={e => handleRenameGroup(idx, e.detail.value)}
                onBlur={() => setEditingGroupIndex(null)}
                focus
              />
            ) : (
              <Text
                style={{ fontSize: '15px', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#333' }}
                onClick={() => isOpen && setEditingGroupIndex(idx)}
              >
                {g.name}（{g.members.length}人）{isOpen && <Text style={{ fontSize: '12px', color: '#999' }}> 点击改名</Text>}
              </Text>
            )}
            {/* 队员列表 */}
            <View>
              {g.members.map(m => (
                <Text
                  key={m.userId}
                  style={chipStyle(selected?.member.userId === m.userId)}
                  onClick={() => handlePlayerClick(m, idx)}
                >{m.nickname}</Text>
              ))}
              {g.members.length === 0 && (
                <Text style={{ fontSize: '13px', color: '#bbb' }}>（空组）</Text>
              )}
            </View>
          </View>
        ))}

        {/* 未分组 */}
        {(ungrouped.length > 0 || groups.length === 0) && (
          <View style={{ background: '#fff', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
            <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '8px' }}>
              未分组（{ungrouped.length}人）
            </Text>
            {ungrouped.map(m => (
              <Text
                key={m.userId}
                style={chipStyle(selected?.member.userId === m.userId)}
                onClick={() => handlePlayerClick(m, null)}
              >{m.nickname}</Text>
            ))}
          </View>
        )}

        {/* 移动操作面板（选中后显示） */}
        {selected && (
          <View style={{ position: 'fixed', bottom: '80px', left: '12px', right: '12px', background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 -2px 12px rgba(0,0,0,0.1)' }}>
            <Text style={{ fontSize: '14px', color: '#333', display: 'block', marginBottom: '10px' }}>
              移动「{selected.member.nickname}」到：
            </Text>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {groups.map((g, idx) => idx !== selected.fromGroupIndex && (
                <Button key={idx} style={{ padding: '6px 14px', borderRadius: '16px', fontSize: '13px', border: '1px solid #4CAF50', color: '#4CAF50', background: '#fff' }} onClick={() => handleMoveTo(idx)}>
                  {g.name}
                </Button>
              ))}
              {selected.fromGroupIndex !== null && (
                <Button style={{ padding: '6px 14px', borderRadius: '16px', fontSize: '13px', border: '1px solid #999', color: '#999', background: '#fff' }} onClick={() => handleMoveTo(null)}>
                  移出分组
                </Button>
              )}
              <Button style={{ padding: '6px 14px', borderRadius: '16px', fontSize: '13px', border: '1px solid #ccc', color: '#ccc', background: '#fff' }} onClick={() => setSelected(null)}>
                取消
              </Button>
            </View>
          </View>
        )}

        {/* 底部操作栏 */}
        <View style={{ position: 'fixed', bottom: '0', left: '0', right: '0', background: '#fff', padding: '12px', display: 'flex', gap: '10px', boxShadow: '0 -1px 4px rgba(0,0,0,0.08)' }}>
          {isOpen && (
            <Button
              style={{ flex: '1', background: dirty ? '#4CAF50' : '#bbb', color: '#fff', borderRadius: '8px', fontSize: '14px', border: 'none' }}
              disabled={!dirty}
              onClick={handleSave}
            >保存</Button>
          )}
          <Button
            style={{ flex: '1', background: '#fff', color: '#4CAF50', border: '1px solid #4CAF50', borderRadius: '8px', fontSize: '14px' }}
            onClick={() => Taro.navigateTo({ url: `/pages/grouping/poster?activityId=${activityId}` })}
          >生成海报</Button>
        </View>

        <View style={{ height: '70px' }} />
      </View>
    </ScrollView>
  )
}
```

- [ ] **Step 2: TypeScript 检查**

```bash
cd /Users/caoyajun/football-team/frontend
npx tsc --noEmit 2>&1 | head -20
```

Expected: 无报错

- [ ] **Step 3: 提交**

```bash
cd /Users/caoyajun/football-team
git add frontend/src/pages/grouping/index.tsx
git commit -m "feat: add grouping management page UI"
```

---

### Task 10: 前端 — 海报生成

**Files:**
- Create: `frontend/src/pages/grouping/poster.tsx`
- Create: `frontend/src/pages/grouping/poster.config.ts`
- Modify: `frontend/src/app.config.ts`
- Modify: `frontend/src/pages/grouping/index.tsx`

说明：海报生成单独作为一个页面（poster），在跳转时传入 activityId，由海报页自行从 API 加载分组数据后绘制 Canvas。这样避免在 index.tsx 中嵌入离屏 Canvas 的复杂性。

- [ ] **Step 1: 创建海报页配置**

```ts
// frontend/src/pages/grouping/poster.config.ts
export default definePageConfig({
  navigationBarTitleText: '分组海报',
})
```

- [ ] **Step 2: 在 app.config.ts 注册海报页**

在 `frontend/src/app.config.ts` 的 `pages` 数组，`'pages/grouping/index'` 之后添加：

```ts
'pages/grouping/poster',
```

- [ ] **Step 3: 修正 index.tsx 中海报跳转按钮 URL**

在 `frontend/src/pages/grouping/index.tsx` 中，"生成海报"按钮的 `onClick`：

```tsx
onClick={async () => {
  if (dirty) await handleSave()
  Taro.navigateTo({
    url: `/pages/grouping/poster?activityId=${activityId}&title=${encodeURIComponent(activityTitle)}&startTime=${encodeURIComponent(activityTime)}&location=${encodeURIComponent(activityLocation)}`,
  })
}}
```

- [ ] **Step 4: 创建海报页**

```tsx
import { useState, useEffect } from 'react'
import { View, Text, Button, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { groupingApi } from '../../api/grouping'
import type { GroupingRes } from '../../types/api'

const CANVAS_ID = 'grouping-poster'
const W = 350
const LINE_H = 20

export default function GroupingPosterPage() {
  const params = Taro.getCurrentInstance().router?.params ?? {}
  const activityId = Number(params.activityId)
  const title = decodeURIComponent(params.title ?? '')
  const startTime = decodeURIComponent(params.startTime ?? '')
  const location = decodeURIComponent(params.location ?? '')

  const [grouping, setGrouping] = useState<GroupingRes | null>(null)
  const [canvasH, setCanvasH] = useState(500)

  useEffect(() => {
    groupingApi.getGrouping(activityId)
      .then(res => { setGrouping(res); drawPoster(res) })
      .catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
  }, [activityId])

  function calcHeight(res: GroupingRes) {
    let h = 100 // header + time/location
    res.groups.forEach(g => {
      h += 32 // group name row
      h += Math.ceil(g.members.length / 4) * LINE_H + 10 // member rows
    })
    return Math.max(h + 20, 300)
  }

  function drawPoster(res: GroupingRes) {
    const h = calcHeight(res)
    setCanvasH(h)

    setTimeout(() => {
      const ctx = Taro.createCanvasContext(CANVAS_ID)
      ctx.setFillStyle('#ffffff')
      ctx.fillRect(0, 0, W, h)

      // 顶部绿色条
      ctx.setFillStyle('#4CAF50')
      ctx.fillRect(0, 0, W, 56)
      ctx.setFillStyle('#ffffff')
      ctx.setFontSize(16)
      ctx.setTextAlign('center')
      ctx.fillText(title || '训练分组', W / 2, 34)

      // 时间 & 地点
      ctx.setFillStyle('#333333')
      ctx.setFontSize(12)
      ctx.setTextAlign('left')
      ctx.fillText(`时间：${new Date(startTime).toLocaleString('zh-CN')}`, 14, 74)
      ctx.fillText(`地点：${location}`, 14, 92)

      let y = 110
      res.groups.forEach((g, idx) => {
        // 组名背景
        ctx.setFillStyle('#f0f9f0')
        ctx.fillRect(10, y, W - 20, 26)
        ctx.setFillStyle('#2e7d32')
        ctx.setFontSize(13)
        ctx.setTextAlign('left')
        ctx.fillText(`${g.name}（${g.members.length}人）`, 16, y + 17)
        y += 30

        // 成员名字（每行最多4人）
        ctx.setFillStyle('#555555')
        ctx.setFontSize(12)
        g.members.forEach((m, mi) => {
          const col = mi % 4
          const row = Math.floor(mi / 4)
          ctx.fillText(m.nickname, 14 + col * 82, y + row * LINE_H + 14)
        })
        y += Math.ceil(g.members.length / 4) * LINE_H + 12
      })

      ctx.draw(false, () => {
        Taro.canvasToTempFilePath({
          canvasId: CANVAS_ID,
          success: (res) => {
            Taro.previewImage({ urls: [res.tempFilePath] })
          },
          fail: () => Taro.showToast({ title: '生成失败', icon: 'none' }),
        })
      })
    }, 300)
  }

  return (
    <View style={{ padding: '16px' }}>
      <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '12px' }}>
        海报生成中，请稍候...长按图片可保存或转发到微信群。
      </Text>
      <Canvas
        canvasId={CANVAS_ID}
        style={{ width: `${W}px`, height: `${canvasH}px`, border: '1px solid #e0e0e0', borderRadius: '8px' }}
      />
      <Button
        style={{ marginTop: '16px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '8px' }}
        onClick={() => grouping && drawPoster(grouping)}
      >重新生成</Button>
    </View>
  )
}
```

- [ ] **Step 5: TypeScript 检查**

```bash
cd /Users/caoyajun/football-team/frontend
npx tsc --noEmit 2>&1 | head -20
```

Expected: 无报错

- [ ] **Step 6: 提交**

```bash
cd /Users/caoyajun/football-team
git add frontend/src/pages/grouping/poster.tsx \
        frontend/src/pages/grouping/poster.config.ts \
        frontend/src/app.config.ts \
        frontend/src/pages/grouping/index.tsx
git commit -m "feat: add grouping poster generation page"
```
