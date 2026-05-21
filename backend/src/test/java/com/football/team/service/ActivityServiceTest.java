package com.football.team.service;

import com.football.team.dto.req.CreateActivityReq;
import com.football.team.dto.req.RegisterReq;
import com.football.team.dto.req.RecordResultReq;
import com.football.team.entity.Activity;
import com.football.team.entity.ActivityRegistration;
import com.football.team.entity.MatchResult;
import com.football.team.entity.User;
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
    @Mock ContentSafetyService contentSafetyService;
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
        a.setCreatedBy(10L);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
        User creator = new User(); creator.setId(10L); creator.setOpenid("openid-10");
        when(userRepository.findById(10L)).thenReturn(Optional.of(creator));
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
