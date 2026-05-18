package com.football.team.service;

import com.football.team.dto.req.ApplyJoinReq;
import com.football.team.dto.req.ReviewApplyReq;
import com.football.team.entity.Team;
import com.football.team.entity.TeamMember;
import com.football.team.enums.MemberRole;
import com.football.team.enums.MemberStatus;
import com.football.team.exception.BusinessException;
import com.football.team.repository.TeamMemberRepository;
import com.football.team.repository.TeamRepository;
import com.football.team.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock TeamRepository teamRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock UserRepository userRepository;
    @InjectMocks TeamService teamService;

    @Test
    void applyJoin_invalidCode_throwsNotFound() {
        when(teamRepository.findByInviteCode("BADCODE")).thenReturn(Optional.empty());
        ApplyJoinReq req = new ApplyJoinReq();
        req.setInviteCode("BADCODE");
        assertThrows(BusinessException.class, () -> teamService.applyJoin(1L, req));
    }

    @Test
    void applyJoin_alreadyActive_throwsBadRequest() {
        Team team = new Team(); team.setId(10L);
        when(teamRepository.findByInviteCode("CODE1")).thenReturn(Optional.of(team));
        TeamMember existing = new TeamMember();
        existing.setStatus(MemberStatus.ACTIVE);
        when(teamMemberRepository.findByTeamIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));

        ApplyJoinReq req = new ApplyJoinReq();
        req.setInviteCode("CODE1");
        BusinessException ex = assertThrows(BusinessException.class,
            () -> teamService.applyJoin(1L, req));
        assertEquals(400, ex.getCode());
    }

    @Test
    void removeMember_captain_throwsBadRequest() {
        TeamMember captain = new TeamMember();
        captain.setStatus(MemberStatus.ACTIVE);
        captain.setRole(MemberRole.CAPTAIN);
        when(teamMemberRepository.findByTeamIdAndUserId(1L, 99L)).thenReturn(Optional.of(captain));
        assertThrows(BusinessException.class, () -> teamService.removeMember(1L, 99L));
    }
}
