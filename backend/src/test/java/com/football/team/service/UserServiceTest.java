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
import com.football.team.dto.res.MyStatsRes;
import com.football.team.entity.Activity;
import com.football.team.entity.ActivityRegistration;
import com.football.team.entity.TeamMember;
import com.football.team.enums.ActivityStatus;
import com.football.team.enums.MemberStatus;
import com.football.team.enums.RegStatus;
import java.time.LocalDateTime;
import java.util.List;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock TeamRepository teamRepository;
    @Mock ActivityRegistrationRepository regRepository;
    @Mock ActivityRepository activityRepository;
    @Mock MatchResultRepository matchResultRepository;
    @Mock ContentSafetyService contentSafetyService;
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
        req.setNickname("new-name");

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

    @Test
    void getStats_attendanceRate_calculatesCorrectly() {
        Activity a1 = act(1L, 1L); Activity a2 = act(2L, 1L);
        Activity a3 = act(3L, 1L); Activity a4 = act(4L, 1L);
        when(activityRepository.findByTeamIdAndStatusOrderByStartTimeDesc(1L, ActivityStatus.FINISHED))
            .thenReturn(List.of(a4, a3, a2, a1));

        ActivityRegistration r1 = reg(1L, 1L); ActivityRegistration r2 = reg(2L, 1L);
        ActivityRegistration r3 = reg(3L, 1L);
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
        Activity a1 = act(1L, 1L); Activity a2 = act(2L, 1L);
        Activity a3 = act(3L, 1L); Activity a4 = act(4L, 1L);
        when(activityRepository.findByTeamIdAndStatusOrderByStartTimeDesc(1L, ActivityStatus.FINISHED))
            .thenReturn(List.of(a4, a3, a2, a1));

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
}
