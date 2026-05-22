# Player Stats Growth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在"我的"页面新增统计卡片，展示球员出勤率、连续参与、队内排名和月度趋势图。

**Architecture:** 扩展现有 `GET /api/v1/users/me/stats` 接口，在 `MyStatsRes` 中新增 4 个字段（不破坏现有字段）。所有计算逻辑在 `UserService.getStats()` 中完成，数据来自已有表 `activity` + `activity_registration` + `team_member`，无需新建数据库表。前端在 `my/index.tsx` 现有 Stats 卡片下方追加新卡片和月度柱状图，CSS 手写，不引入第三方图表库。

**Tech Stack:** Java 17 / Spring Boot 3.2 / JPA（后端）；Taro 3.6 + React + TypeScript（前端）

---

## File Map

| 操作 | 文件 |
|---|---|
| Create | `backend/src/main/java/com/football/team/dto/res/MonthStatRes.java` |
| Modify | `backend/src/main/java/com/football/team/dto/res/MyStatsRes.java` |
| Modify | `backend/src/main/java/com/football/team/repository/ActivityRepository.java` |
| Modify | `backend/src/main/java/com/football/team/service/UserService.java` |
| Modify | `backend/src/test/java/com/football/team/service/UserServiceTest.java` |
| Modify | `frontend/src/types/api.ts` |
| Modify | `frontend/src/pages/my/index.tsx` |

---

## Task 1: 新增 MonthStatRes DTO 并扩展 MyStatsRes

**Files:**
- Create: `backend/src/main/java/com/football/team/dto/res/MonthStatRes.java`
- Modify: `backend/src/main/java/com/football/team/dto/res/MyStatsRes.java`

- [ ] **Step 1: 创建 MonthStatRes**

```java
// backend/src/main/java/com/football/team/dto/res/MonthStatRes.java
package com.football.team.dto.res;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MonthStatRes {
    private String month; // "2026-05"
    private int count;
}
```

- [ ] **Step 2: 扩展 MyStatsRes**

将 `MyStatsRes.java` 替换为：

```java
// backend/src/main/java/com/football/team/dto/res/MyStatsRes.java
package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class MyStatsRes {
    // 现有字段（不变）
    private int totalMatches;
    private int wins;
    private int draws;
    private int losses;

    // 新增字段
    private double attendanceRate;
    private int currentStreak;
    private int teamAttendanceRank;
    private int teamMemberCount;
    private List<MonthStatRes> monthlyStats;
}
```

- [ ] **Step 3: 编译验证**

```bash
cd backend && mvn compile -q
```

Expected: BUILD SUCCESS（无编译错误）

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/football/team/dto/res/MonthStatRes.java \
        backend/src/main/java/com/football/team/dto/res/MyStatsRes.java
git commit -m "feat(stats): add MonthStatRes and extend MyStatsRes with growth fields"
```

---

## Task 2: ActivityRepository 新增查询方法

**Files:**
- Modify: `backend/src/main/java/com/football/team/repository/ActivityRepository.java`

- [ ] **Step 1: 新增派生查询方法**

在 `ActivityRepository` 接口中追加：

```java
import com.football.team.enums.ActivityStatus;
// ...（现有 import 保持不变）

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByTeamIdOrderByStartTimeDesc(Long teamId);

    List<Activity> findByTeamIdAndStatusOrderByStartTimeDesc(Long teamId, ActivityStatus status);

    @Modifying
    @Query("UPDATE Activity a SET a.status = :newStatus WHERE a.status IN :statuses AND a.startTime <= :now")
    int bulkUpdateStatusByStartTimeBefore(ActivityStatus newStatus, List<ActivityStatus> statuses, LocalDateTime now);
}
```

- [ ] **Step 2: 编译验证**

```bash
cd backend && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/football/team/repository/ActivityRepository.java
git commit -m "feat(stats): add findByTeamIdAndStatusOrderByStartTimeDesc to ActivityRepository"
```

---

## Task 3: 测试 + 实现出勤率和连续参与

**Files:**
- Modify: `backend/src/test/java/com/football/team/service/UserServiceTest.java`
- Modify: `backend/src/main/java/com/football/team/service/UserService.java`

- [ ] **Step 1: 在 UserServiceTest 中写失败测试**

在 `UserServiceTest.java` 现有测试末尾追加：

```java
// ── 新增 import（文件顶部）──
// import com.football.team.entity.Activity;
// import com.football.team.entity.ActivityRegistration;
// import com.football.team.entity.TeamMember;
// import com.football.team.enums.*;
// import java.time.LocalDateTime;
// import java.util.List;
// import static org.assertj.core.api.Assertions.assertThat;

@Test
void getStats_attendanceRate_calculatesCorrectly() {
    // Team has 4 FINISHED activities; user joined 3 of them
    Activity a1 = act(1L, 1L); Activity a2 = act(2L, 1L);
    Activity a3 = act(3L, 1L); Activity a4 = act(4L, 1L);
    when(activityRepository.findByTeamIdAndStatusOrderByStartTimeDesc(1L, ActivityStatus.FINISHED))
        .thenReturn(List.of(a4, a3, a2, a1)); // desc order

    ActivityRegistration r1 = reg(1L, 1L); ActivityRegistration r2 = reg(2L, 1L);
    ActivityRegistration r3 = reg(3L, 1L);
    // user joined a1, a2, a3 but NOT a4
    when(regRepository.findByUserIdAndStatus(1L, RegStatus.JOINED))
        .thenReturn(List.of(r1, r2, r3));

    when(matchResultRepository.findByActivityIdIn(any())).thenReturn(List.of());
    when(teamMemberRepository.findByTeamIdAndStatus(1L, MemberStatus.ACTIVE))
        .thenReturn(List.of(member(1L)));

    MyStatsRes res = userService.getStats(1L, 1L);

    assertThat(res.getAttendanceRate()).isEqualTo(0.75);
}

@Test
void getStats_currentStreak_countsConsecutiveFromLatest() {
    // Activities desc: a4(missed), a3(joined), a2(joined), a1(joined)
    // Streak starts from latest: a4 is missed → streak = 0
    Activity a1 = act(1L, 1L); Activity a2 = act(2L, 1L);
    Activity a3 = act(3L, 1L); Activity a4 = act(4L, 1L);
    when(activityRepository.findByTeamIdAndStatusOrderByStartTimeDesc(1L, ActivityStatus.FINISHED))
        .thenReturn(List.of(a4, a3, a2, a1));

    // user joined a1, a2, a3 but NOT a4 (the latest)
    ActivityRegistration r1 = reg(1L, 1L); ActivityRegistration r2 = reg(2L, 1L);
    ActivityRegistration r3 = reg(3L, 1L);
    when(regRepository.findByUserIdAndStatus(1L, RegStatus.JOINED))
        .thenReturn(List.of(r1, r2, r3));

    when(matchResultRepository.findByActivityIdIn(any())).thenReturn(List.of());
    when(teamMemberRepository.findByTeamIdAndStatus(1L, MemberStatus.ACTIVE))
        .thenReturn(List.of(member(1L)));

    MyStatsRes res = userService.getStats(1L, 1L);

    assertThat(res.getCurrentStreak()).isEqualTo(0);
}

@Test
void getStats_currentStreak_countsWhenLatestAttended() {
    // Activities desc: a3(joined), a2(joined), a1(missed)
    Activity a1 = act(1L, 1L); Activity a2 = act(2L, 1L); Activity a3 = act(3L, 1L);
    when(activityRepository.findByTeamIdAndStatusOrderByStartTimeDesc(1L, ActivityStatus.FINISHED))
        .thenReturn(List.of(a3, a2, a1));

    ActivityRegistration r2 = reg(2L, 1L); ActivityRegistration r3 = reg(3L, 1L);
    when(regRepository.findByUserIdAndStatus(1L, RegStatus.JOINED))
        .thenReturn(List.of(r2, r3));

    when(matchResultRepository.findByActivityIdIn(any())).thenReturn(List.of());
    when(teamMemberRepository.findByTeamIdAndStatus(1L, MemberStatus.ACTIVE))
        .thenReturn(List.of(member(1L)));

    MyStatsRes res = userService.getStats(1L, 1L);

    assertThat(res.getCurrentStreak()).isEqualTo(2);
}

// ── 辅助方法（追加到测试类末尾）──
private Activity act(Long id, Long teamId) {
    Activity a = new Activity();
    a.setId(id);
    a.setTeamId(teamId);
    a.setStatus(ActivityStatus.FINISHED);
    a.setStartTime(LocalDateTime.of(2026, 1, (int)(long)id, 10, 0));
    return a;
}

private ActivityRegistration reg(Long activityId, Long userId) {
    ActivityRegistration r = new ActivityRegistration();
    r.setActivityId(activityId);
    r.setUserId(userId);
    r.setStatus(RegStatus.JOINED);
    return r;
}

private TeamMember member(Long userId) {
    TeamMember m = new TeamMember();
    m.setUserId(userId);
    m.setStatus(MemberStatus.ACTIVE);
    return m;
}
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd backend && mvn test -pl . -Dtest=UserServiceTest#getStats_attendanceRate_calculatesCorrectly -q 2>&1 | tail -10
```

Expected: FAIL（`getStats` 尚未返回 `attendanceRate`）

- [ ] **Step 3: 在 UserService 中实现出勤率和连续参与**

将 `UserService.getStats()` 替换为：

```java
public MyStatsRes getStats(Long userId, Long teamId) {
    // ── 所有已完成活动（按时间倒序）──
    List<Activity> teamFinished = activityRepository
        .findByTeamIdAndStatusOrderByStartTimeDesc(teamId, ActivityStatus.FINISHED);

    // ── 该用户所有 JOINED 报名的 activityId 集合 ──
    Set<Long> joinedIds = regRepository
        .findByUserIdAndStatus(userId, RegStatus.JOINED)
        .stream().map(ActivityRegistration::getActivityId)
        .collect(java.util.stream.Collectors.toSet());

    // ── 出勤率 ──
    int total = teamFinished.size();
    int participated = (int) teamFinished.stream()
        .filter(a -> joinedIds.contains(a.getId())).count();
    double attendanceRate = total == 0 ? 0.0 : (double) participated / total;

    // ── 连续参与（从最新活动往回数，遇到第一次缺席停止）──
    int currentStreak = 0;
    for (Activity a : teamFinished) {
        if (joinedIds.contains(a.getId())) currentStreak++;
        else break;
    }

    // ── 队内出勤排名 ──
    List<TeamMember> activeMembers = teamMemberRepository
        .findByTeamIdAndStatus(teamId, MemberStatus.ACTIVE);
    int teamMemberCount = activeMembers.size();

    double myRate = attendanceRate;
    int teamAttendanceRank = 1;
    for (TeamMember m : activeMembers) {
        if (m.getUserId().equals(userId)) continue;
        Set<Long> mJoined = regRepository
            .findByUserIdAndStatus(m.getUserId(), RegStatus.JOINED)
            .stream().map(ActivityRegistration::getActivityId)
            .collect(java.util.stream.Collectors.toSet());
        double mRate = total == 0 ? 0.0
            : (double) teamFinished.stream().filter(a -> mJoined.contains(a.getId())).count() / total;
        if (mRate > myRate) teamAttendanceRank++;
    }

    // ── 月度统计（最近 6 个自然月）──
    java.time.YearMonth now = java.time.YearMonth.now();
    List<MonthStatRes> monthlyStats = new java.util.ArrayList<>();
    for (int i = 5; i >= 0; i--) {
        java.time.YearMonth ym = now.minusMonths(i);
        int count = (int) teamFinished.stream()
            .filter(a -> java.time.YearMonth.from(a.getStartTime()).equals(ym)
                      && joinedIds.contains(a.getId()))
            .count();
        monthlyStats.add(new MonthStatRes(ym.toString(), count));
    }

    // ── 现有胜负统计 ──
    List<Long> matchIds = teamFinished.stream()
        .filter(a -> a.getType() == ActivityType.MATCH && joinedIds.contains(a.getId()))
        .map(Activity::getId).toList();
    List<MatchResult> results = matchResultRepository.findByActivityIdIn(matchIds);
    int wins   = (int) results.stream().filter(r -> r.getOutcome() == MatchOutcome.WIN).count();
    int draws  = (int) results.stream().filter(r -> r.getOutcome() == MatchOutcome.DRAW).count();
    int losses = (int) results.stream().filter(r -> r.getOutcome() == MatchOutcome.LOSE).count();

    return MyStatsRes.builder()
        .totalMatches(results.size()).wins(wins).draws(draws).losses(losses)
        .attendanceRate(attendanceRate).currentStreak(currentStreak)
        .teamAttendanceRank(teamAttendanceRank).teamMemberCount(teamMemberCount)
        .monthlyStats(monthlyStats)
        .build();
}
```

同时在文件顶部补充缺少的 import：

```java
import com.football.team.entity.MatchResult;
import com.football.team.enums.MemberStatus;
import java.util.Set;
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd backend && mvn test -Dtest=UserServiceTest -q 2>&1 | tail -5
```

Expected: `Tests run: N, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/football/team/service/UserService.java \
        backend/src/test/java/com/football/team/service/UserServiceTest.java
git commit -m "feat(stats): implement attendance rate, streak, ranking, monthly stats"
```

---

## Task 4: 测试队内出勤排名

**Files:**
- Modify: `backend/src/test/java/com/football/team/service/UserServiceTest.java`

- [ ] **Step 1: 追加排名测试**

在 `UserServiceTest.java` 追加：

```java
@Test
void getStats_teamRank_ranksCorrectly() {
    // 3 activities; user participated in 2 (rate=2/3≈0.67)
    // member2 participated in 3 (rate=1.0) → ranks above user
    // member3 participated in 1 (rate=1/3≈0.33) → ranks below user
    Activity a1 = act(1L, 1L); Activity a2 = act(2L, 1L); Activity a3 = act(3L, 1L);
    when(activityRepository.findByTeamIdAndStatusOrderByStartTimeDesc(1L, ActivityStatus.FINISHED))
        .thenReturn(List.of(a3, a2, a1));

    // userId=1: joined a1, a2
    when(regRepository.findByUserIdAndStatus(1L, RegStatus.JOINED))
        .thenReturn(List.of(reg(1L, 1L), reg(2L, 1L)));
    // userId=2: joined a1, a2, a3
    when(regRepository.findByUserIdAndStatus(2L, RegStatus.JOINED))
        .thenReturn(List.of(reg(1L, 2L), reg(2L, 2L), reg(3L, 2L)));
    // userId=3: joined a1 only
    when(regRepository.findByUserIdAndStatus(3L, RegStatus.JOINED))
        .thenReturn(List.of(reg(1L, 3L)));

    when(matchResultRepository.findByActivityIdIn(any())).thenReturn(List.of());

    TeamMember m1 = member(1L); TeamMember m2 = member(2L); TeamMember m3 = member(3L);
    when(teamMemberRepository.findByTeamIdAndStatus(1L, MemberStatus.ACTIVE))
        .thenReturn(List.of(m1, m2, m3));

    MyStatsRes res = userService.getStats(1L, 1L);

    assertThat(res.getTeamAttendanceRank()).isEqualTo(2);
    assertThat(res.getTeamMemberCount()).isEqualTo(3);
}
```

注意：`reg(activityId, userId)` 辅助方法需要同时设置 `userId` 字段。更新辅助方法：

```java
private ActivityRegistration reg(Long activityId, Long userId) {
    ActivityRegistration r = new ActivityRegistration();
    r.setActivityId(activityId);
    r.setUserId(userId);
    r.setStatus(RegStatus.JOINED);
    return r;
}
```

（此方法已在 Task 3 中定义，直接复用即可。）

- [ ] **Step 2: 运行测试确认通过**

```bash
cd backend && mvn test -Dtest=UserServiceTest -q 2>&1 | tail -5
```

Expected: `Tests run: N, Failures: 0, Errors: 0`

- [ ] **Step 3: Commit**

```bash
git add backend/src/test/java/com/football/team/service/UserServiceTest.java
git commit -m "test(stats): add team attendance ranking test"
```

---

## Task 5: 测试月度统计

**Files:**
- Modify: `backend/src/test/java/com/football/team/service/UserServiceTest.java`

- [ ] **Step 1: 追加月度统计测试**

```java
@Test
void getStats_monthlyStats_returns6Months() {
    // 1 activity in current month, user participated
    java.time.LocalDateTime thisMonth = java.time.YearMonth.now()
        .atDay(15).atStartOfDay();
    Activity a1 = new Activity();
    a1.setId(1L); a1.setTeamId(1L);
    a1.setStatus(ActivityStatus.FINISHED);
    a1.setStartTime(thisMonth);

    when(activityRepository.findByTeamIdAndStatusOrderByStartTimeDesc(1L, ActivityStatus.FINISHED))
        .thenReturn(List.of(a1));
    when(regRepository.findByUserIdAndStatus(1L, RegStatus.JOINED))
        .thenReturn(List.of(reg(1L, 1L)));
    when(matchResultRepository.findByActivityIdIn(any())).thenReturn(List.of());
    when(teamMemberRepository.findByTeamIdAndStatus(1L, MemberStatus.ACTIVE))
        .thenReturn(List.of(member(1L)));

    MyStatsRes res = userService.getStats(1L, 1L);

    assertThat(res.getMonthlyStats()).hasSize(6);
    // 最后一个元素是当月
    var last = res.getMonthlyStats().get(5);
    assertThat(last.getMonth()).isEqualTo(java.time.YearMonth.now().toString());
    assertThat(last.getCount()).isEqualTo(1);
    // 其余月份无活动，count=0
    res.getMonthlyStats().subList(0, 5)
        .forEach(m -> assertThat(m.getCount()).isEqualTo(0));
}
```

- [ ] **Step 2: 运行所有测试确认通过**

```bash
cd backend && mvn test -Dtest=UserServiceTest -q 2>&1 | tail -5
```

Expected: `Tests run: N, Failures: 0, Errors: 0`

- [ ] **Step 3: Commit**

```bash
git add backend/src/test/java/com/football/team/service/UserServiceTest.java
git commit -m "test(stats): add monthly stats test"
```

---

## Task 6: 前端类型更新

**Files:**
- Modify: `frontend/src/types/api.ts`

- [ ] **Step 1: 扩展 MyStatsRes 类型**

在 `frontend/src/types/api.ts` 中找到 `MyStatsRes` 接口，替换为：

```typescript
export interface MonthStat {
  month: string  // "2026-05"
  count: number
}

export interface MyStatsRes {
  totalMatches: number
  wins: number
  draws: number
  losses: number
  attendanceRate: number       // 0.0 ~ 1.0
  currentStreak: number
  teamAttendanceRank: number
  teamMemberCount: number
  monthlyStats: MonthStat[]
}
```

- [ ] **Step 2: 类型检查**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: 无错误输出

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/api.ts
git commit -m "feat(stats): extend MyStatsRes type with growth fields"
```

---

## Task 7: 前端统计卡片 UI

**Files:**
- Modify: `frontend/src/pages/my/index.tsx`

- [ ] **Step 1: 在现有 Stats 卡片块之后插入新卡片**

在 `my/index.tsx` 中找到现有 Stats 卡片的结束处（约第 409 行，`</View>` 之后，`{/* ── Settings ── */}` 之前），插入新卡片：

```tsx
        {/* ── Growth Stats ── */}
        {stats && stats.monthlyStats && (
          <View style={{ padding: `${px(14)} ${px(16)} 0` }}>
            <SectionTitle label='出勤数据' />
            <View style={{
              background: C.surface, borderRadius: px(16),
              border: `1px solid ${C.border}`, overflow: 'hidden',
            }}>
              {/* 2×2 指标网格 */}
              <View style={{ display: 'flex', flexWrap: 'wrap' }}>
                {[
                  { label: '出勤率', value: `${Math.round(stats.attendanceRate * 100)}%` },
                  { label: '连续参与', value: `${stats.currentStreak}场` },
                  { label: '本赛季', value: `${stats.totalMatches}场` },
                  { label: '队内排名', value: `第${stats.teamAttendanceRank}/${stats.teamMemberCount}名` },
                ].map((item, idx) => (
                  <View key={idx} style={{
                    width: '50%', padding: `${px(14)} ${px(16)}`,
                    borderBottom: idx < 2 ? `1px solid ${C.border}` : 'none',
                    borderLeft: idx % 2 === 1 ? `1px solid ${C.border}` : 'none',
                  }}>
                    <Text style={{ fontSize: px(20), color: C.text3, display: 'block', marginBottom: px(4) }}>
                      {item.label}
                    </Text>
                    <Text style={{ fontSize: px(36), fontWeight: '800', color: C.text, letterSpacing: '-0.02em' }}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 月度趋势柱状图 */}
              <View style={{ borderTop: `1px solid ${C.border}`, padding: `${px(12)} ${px(16)} ${px(14)}` }}>
                <Text style={{ fontSize: px(20), color: C.text3, display: 'block', marginBottom: px(10) }}>
                  近6个月参与趋势
                </Text>
                <View style={{ display: 'flex', alignItems: 'flex-end', gap: px(6), height: px(60) }}>
                  {(() => {
                    const maxCount = Math.max(...stats.monthlyStats.map(m => m.count), 1)
                    return stats.monthlyStats.map((m, idx) => (
                      <View key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: px(4) }}>
                        <View style={{
                          width: '100%',
                          height: px(Math.max(m.count / maxCount * 44, m.count > 0 ? 6 : 2)),
                          background: m.count > 0 ? C.primary : C.border,
                          borderRadius: px(3),
                        }} />
                        <Text style={{ fontSize: px(18), color: C.text3 }}>
                          {m.month.slice(5)}月
                        </Text>
                      </View>
                    ))
                  })()}
                </View>
              </View>
            </View>
          </View>
        )}
```

- [ ] **Step 2: 类型检查**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: 无错误输出

- [ ] **Step 3: 构建前端验证无编译错误**

```bash
cd frontend && npm run build:weapp 2>&1 | tail -10
```

Expected: 构建成功，无错误

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/my/index.tsx
git commit -m "feat(stats): add growth stats card and monthly trend chart to my page"
```

---

## 完成后验证清单

- [ ] 后端所有测试通过：`cd backend && mvn test -q`
- [ ] 前端类型检查通过：`cd frontend && npx tsc --noEmit`
- [ ] 前端构建成功：`cd frontend && npm run build:weapp`
- [ ] 部署后用微信开发者工具打开，进入「我的」页面，确认：
  - 4 个数字指标正确显示
  - 月度柱状图根据参与记录正确渲染
  - 无活动数据时（新球队）显示 0 而不是崩溃
