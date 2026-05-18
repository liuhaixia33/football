package com.football.team.service;

import com.football.team.dto.req.*;
import com.football.team.dto.res.MemberRes;
import com.football.team.entity.*;
import com.football.team.enums.*;
import com.football.team.exception.BusinessException;
import com.football.team.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    public Team createTeam(Long userId, CreateTeamReq req) {
        Team team = new Team();
        team.setName(req.getName());
        team.setDescription(req.getDescription() != null ? req.getDescription() : "");
        team.setLogoUrl(req.getLogoUrl() != null ? req.getLogoUrl() : "");
        team.setInviteCode(generateCode());
        team = teamRepository.save(team);

        TeamMember captain = new TeamMember();
        captain.setTeamId(team.getId());
        captain.setUserId(userId);
        captain.setRole(MemberRole.CAPTAIN);
        captain.setStatus(MemberStatus.ACTIVE);
        captain.setJoinedAt(LocalDateTime.now());
        teamMemberRepository.save(captain);
        return team;
    }

    public void applyJoin(Long userId, ApplyJoinReq req) {
        Team team = teamRepository.findByInviteCode(req.getInviteCode())
            .orElseThrow(() -> BusinessException.notFound("邀请码无效"));

        teamMemberRepository.findByTeamIdAndUserId(team.getId(), userId).ifPresent(m -> {
            if (m.getStatus() == MemberStatus.ACTIVE)
                throw BusinessException.badRequest("您已是该球队成员");
            if (m.getStatus() == MemberStatus.PENDING)
                throw BusinessException.badRequest("您的申请正在审核中");
        });

        TeamMember member = new TeamMember();
        member.setTeamId(team.getId());
        member.setUserId(userId);
        teamMemberRepository.save(member);
    }

    public void reviewApply(Long teamId, ReviewApplyReq req) {
        TeamMember member = teamMemberRepository.findById(req.getMemberId())
            .filter(m -> m.getTeamId().equals(teamId))
            .orElseThrow(() -> BusinessException.notFound("申请记录不存在"));

        if (member.getStatus() != MemberStatus.PENDING)
            throw BusinessException.badRequest("该申请已处理");

        if (req.getApprove()) {
            member.setStatus(MemberStatus.ACTIVE);
            member.setJoinedAt(LocalDateTime.now());
        } else {
            member.setStatus(MemberStatus.REMOVED);
        }
        teamMemberRepository.save(member);
    }

    public void setRole(Long teamId, SetRoleReq req) {
        if (req.getRole() == MemberRole.CAPTAIN)
            throw BusinessException.badRequest("不能直接设置队长角色");

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, req.getUserId())
            .filter(m -> m.getStatus() == MemberStatus.ACTIVE)
            .orElseThrow(() -> BusinessException.notFound("队员不存在"));

        member.setRole(req.getRole());
        teamMemberRepository.save(member);
    }

    public void removeMember(Long teamId, Long userId) {
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
            .filter(m -> m.getStatus() == MemberStatus.ACTIVE)
            .orElseThrow(() -> BusinessException.notFound("队员不存在"));

        if (member.getRole() == MemberRole.CAPTAIN)
            throw BusinessException.badRequest("不能移除队长");

        member.setStatus(MemberStatus.REMOVED);
        teamMemberRepository.save(member);
    }

    public void leaveTeam(Long teamId, Long userId) {
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
            .filter(m -> m.getStatus() == MemberStatus.ACTIVE)
            .orElseThrow(() -> BusinessException.notFound("未找到成员记录"));

        if (member.getRole() == MemberRole.CAPTAIN)
            throw BusinessException.badRequest("队长不能直接退队，请先转让队长");

        member.setStatus(MemberStatus.REMOVED);
        teamMemberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public List<MemberRes> listMembers(Long teamId) {
        return teamMemberRepository.findByTeamIdAndStatusIn(
            teamId, List.of(MemberStatus.ACTIVE, MemberStatus.PENDING)
        ).stream().map(m -> {
            User u = userRepository.findById(m.getUserId()).orElseThrow();
            return MemberRes.builder()
                .memberId(m.getId()).userId(u.getId())
                .nickname(u.getNickname()).avatarUrl(u.getAvatarUrl())
                .role(m.getRole().name()).status(m.getStatus().name())
                .joinedAt(m.getJoinedAt()).build();
        }).toList();
    }

    private String generateCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
}
