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
