package com.football.team.service;

import com.football.team.dto.req.UpdateProfileReq;
import com.football.team.service.ContentSafetyService;
import com.football.team.dto.res.MyStatsRes;
import com.football.team.dto.res.TeamBriefRes;
import com.football.team.dto.res.UserProfileRes;
import com.football.team.entity.*;
import com.football.team.enums.*;
import com.football.team.exception.BusinessException;
import com.football.team.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final ActivityRegistrationRepository regRepository;
    private final ActivityRepository activityRepository;
    private final MatchResultRepository matchResultRepository;
    private final ContentSafetyService contentSafetyService;

    public UserProfileRes getProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        List<TeamBriefRes> teams = teamMemberRepository
            .findByUserIdAndStatus(userId, MemberStatus.ACTIVE)
            .stream().map(m -> {
                Team t = teamRepository.findById(m.getTeamId())
                    .orElseThrow(() -> BusinessException.notFound("球队不存在"));
                return TeamBriefRes.builder().teamId(t.getId()).teamName(t.getName())
                    .logoUrl(t.getLogoUrl()).role(m.getRole().name()).build();
            }).toList();

        return UserProfileRes.builder()
            .userId(user.getId()).nickname(user.getNickname())
            .avatarUrl(user.getAvatarUrl()).teams(teams).build();
    }

    public MyStatsRes getStats(Long userId, Long teamId) {
        List<Long> joinedActivityIds = regRepository
            .findByUserIdAndStatus(userId, RegStatus.JOINED)
            .stream().map(ActivityRegistration::getActivityId).toList();

        List<Long> matchIds = activityRepository.findAllById(joinedActivityIds).stream()
            .filter(a -> a.getTeamId().equals(teamId) && a.getType() == ActivityType.MATCH
                && a.getStatus() == ActivityStatus.FINISHED)
            .map(Activity::getId).toList();

        List<MatchResult> results = matchResultRepository.findByActivityIdIn(matchIds);
        int wins = (int) results.stream().filter(r -> r.getOutcome() == MatchOutcome.WIN).count();
        int draws = (int) results.stream().filter(r -> r.getOutcome() == MatchOutcome.DRAW).count();
        int losses = (int) results.stream().filter(r -> r.getOutcome() == MatchOutcome.LOSE).count();

        return MyStatsRes.builder()
            .totalMatches(results.size()).wins(wins).draws(draws).losses(losses).build();
    }

    @Transactional
    public void updateProfile(Long userId, UpdateProfileReq req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> BusinessException.notFound("用户不存在"));
        if (req.getNickname() != null) {
            contentSafetyService.checkText(user.getOpenid(), req.getNickname());
            user.setNickname(req.getNickname());
        }
        if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());
        userRepository.save(user);
    }
}
