package com.football.team.service;

import com.football.team.dto.req.UpdateProfileReq;
import com.football.team.service.ContentSafetyService;
import com.football.team.dto.res.MonthStatRes;
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
import java.util.Set;

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
        // all FINISHED activities in team, desc by startTime
        List<Activity> teamFinished = activityRepository
            .findByTeamIdAndStatusOrderByStartTimeDesc(teamId, ActivityStatus.FINISHED);

        // user's JOINED activity IDs
        Set<Long> joinedIds = regRepository
            .findByUserIdAndStatus(userId, RegStatus.JOINED)
            .stream().map(ActivityRegistration::getActivityId)
            .collect(java.util.stream.Collectors.toSet());

        // attendance rate
        int total = teamFinished.size();
        int participated = (int) teamFinished.stream()
            .filter(a -> joinedIds.contains(a.getId())).count();
        double attendanceRate = total == 0 ? 0.0 : (double) participated / total;

        // consecutive streak (from latest, stop at first miss)
        int currentStreak = 0;
        for (Activity a : teamFinished) {
            if (joinedIds.contains(a.getId())) currentStreak++;
            else break;
        }

        // team ranking
        List<TeamMember> activeMembers = teamMemberRepository
            .findByTeamIdAndStatus(teamId, MemberStatus.ACTIVE);
        int teamMemberCount = activeMembers.size();

        int teamAttendanceRank = 1;
        for (TeamMember m : activeMembers) {
            if (m.getUserId().equals(userId)) continue;
            Set<Long> mJoined = regRepository
                .findByUserIdAndStatus(m.getUserId(), RegStatus.JOINED)
                .stream().map(ActivityRegistration::getActivityId)
                .collect(java.util.stream.Collectors.toSet());
            double mRate = total == 0 ? 0.0
                : (double) teamFinished.stream().filter(a -> mJoined.contains(a.getId())).count() / total;
            if (mRate > attendanceRate) teamAttendanceRank++;
        }

        // monthly stats (last 6 calendar months)
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

        // existing win/draw/loss stats (match type only)
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
