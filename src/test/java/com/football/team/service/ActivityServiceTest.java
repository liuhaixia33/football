package com.football.team.service;

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

    @Test
    void register_closedActivity_throwsBadRequest() {
        Activity a = new Activity(); a.setId(1L); a.setTeamId(1L); a.setStatus(ActivityStatus.CLOSED);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
        assertThrows(BusinessException.class, () -> activityService.register(1L, 1L, 1L));
    }

    @Test
    void register_alreadyJoined_throwsBadRequest() {
        Activity a = new Activity(); a.setId(1L); a.setTeamId(1L); a.setStatus(ActivityStatus.OPEN);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(a));
        when(regRepository.countByActivityIdAndStatus(1L, RegStatus.JOINED)).thenReturn(0L);
        ActivityRegistration existing = new ActivityRegistration();
        existing.setStatus(RegStatus.JOINED);
        when(regRepository.findByActivityIdAndUserId(1L, 2L)).thenReturn(Optional.of(existing));
        assertThrows(BusinessException.class, () -> activityService.register(1L, 2L, 1L));
    }

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
}
