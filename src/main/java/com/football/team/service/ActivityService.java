package com.football.team.service;

import com.football.team.dto.req.CreateActivityReq;
import com.football.team.dto.req.RecordResultReq;
import com.football.team.dto.res.ActivityDetailRes;
import com.football.team.dto.res.ActivityRes;
import com.football.team.dto.res.MemberRes;
import com.football.team.dto.res.MatchResultRes;
import com.football.team.entity.*;
import com.football.team.enums.*;
import com.football.team.exception.BusinessException;
import com.football.team.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service @RequiredArgsConstructor @Transactional
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ActivityRegistrationRepository regRepository;
    private final MatchResultRepository matchResultRepository;
    private final UserRepository userRepository;

    public Activity createActivity(Long teamId, Long creatorId, CreateActivityReq req) {
        Activity a = new Activity();
        a.setTeamId(teamId);
        a.setCreatedBy(creatorId);
        a.setType(req.getType());
        a.setTitle(req.getTitle());
        a.setOpponent(req.getOpponent());
        a.setLocation(req.getLocation());
        a.setStartTime(req.getStartTime());
        a.setDeadline(req.getDeadline());
        a.setMaxPlayers(req.getMaxPlayers());
        return activityRepository.save(a);
    }

    @Transactional(readOnly = true)
    public List<ActivityRes> listActivities(Long teamId, Long currentUserId) {
        return activityRepository.findByTeamIdOrderByStartTimeDesc(teamId).stream()
            .map(a -> toRes(a, currentUserId))
            .toList();
    }

    @Transactional(readOnly = true)
    public ActivityDetailRes getDetail(Long activityId, Long currentUserId, Long teamId) {
        Activity a = activityRepository.findById(activityId)
            .orElseThrow(() -> BusinessException.notFound("活动不存在"));
        if (!a.getTeamId().equals(teamId))
            throw BusinessException.notFound("活动不存在");

        List<MemberRes> regs = regRepository.findByActivityIdAndStatus(activityId, RegStatus.JOINED)
            .stream().map(r -> {
                User u = userRepository.findById(r.getUserId()).orElseThrow();
                return MemberRes.builder().userId(u.getId())
                    .nickname(u.getNickname()).avatarUrl(u.getAvatarUrl()).build();
            }).toList();

        MatchResultRes result = matchResultRepository.findByActivityId(activityId)
            .map(mr -> MatchResultRes.builder()
                .ourScore(mr.getOurScore()).oppScore(mr.getOppScore())
                .outcome(mr.getOutcome().name()).notes(mr.getNotes()).build())
            .orElse(null);

        return ActivityDetailRes.builder()
            .activity(toRes(a, currentUserId))
            .registrations(regs)
            .result(result)
            .build();
    }

    public void register(Long activityId, Long userId, Long teamId) {
        Activity a = activityRepository.findById(activityId)
            .orElseThrow(() -> BusinessException.notFound("活动不存在"));
        if (!a.getTeamId().equals(teamId))
            throw BusinessException.notFound("活动不存在");
        if (a.getStatus() != ActivityStatus.OPEN)
            throw BusinessException.badRequest("报名已截止");
        if (a.getDeadline() != null && LocalDateTime.now().isAfter(a.getDeadline()))
            throw BusinessException.badRequest("报名已截止");

        long count = regRepository.countByActivityIdAndStatus(activityId, RegStatus.JOINED);
        if (a.getMaxPlayers() != null && count >= a.getMaxPlayers())
            throw BusinessException.badRequest("报名人数已满");

        regRepository.findByActivityIdAndUserId(activityId, userId).ifPresentOrElse(reg -> {
            if (reg.getStatus() == RegStatus.JOINED)
                throw BusinessException.badRequest("您已报名");
            reg.setStatus(RegStatus.JOINED);
            regRepository.save(reg);
        }, () -> {
            ActivityRegistration reg = new ActivityRegistration();
            reg.setActivityId(activityId);
            reg.setUserId(userId);
            reg.setStatus(RegStatus.JOINED);
            regRepository.save(reg);
        });
    }

    public void cancelRegister(Long activityId, Long userId, Long teamId) {
        Activity a = activityRepository.findById(activityId)
            .orElseThrow(() -> BusinessException.notFound("活动不存在"));
        if (!a.getTeamId().equals(teamId))
            throw BusinessException.notFound("活动不存在");
        ActivityRegistration reg = regRepository.findByActivityIdAndUserId(activityId, userId)
            .filter(r -> r.getStatus() == RegStatus.JOINED)
            .orElseThrow(() -> BusinessException.notFound("未找到报名记录"));
        reg.setStatus(RegStatus.CANCELLED);
        regRepository.save(reg);
    }

    public void closeActivity(Long activityId, Long teamId) {
        Activity a = activityRepository.findById(activityId)
            .orElseThrow(() -> BusinessException.notFound("活动不存在"));
        if (!a.getTeamId().equals(teamId))
            throw BusinessException.notFound("活动不存在");
        if (a.getStatus() != ActivityStatus.OPEN)
            throw BusinessException.badRequest("只有开放中的活动可以关闭");
        a.setStatus(ActivityStatus.CLOSED);
        activityRepository.save(a);
    }

    public void recordResult(Long activityId, RecordResultReq req, Long teamId) {
        Activity a = activityRepository.findById(activityId)
            .orElseThrow(() -> BusinessException.notFound("活动不存在"));
        if (!a.getTeamId().equals(teamId))
            throw BusinessException.notFound("活动不存在");
        if (a.getType() != ActivityType.MATCH)
            throw BusinessException.badRequest("仅比赛可记录结果");

        int our = req.getOurScore(), opp = req.getOppScore();
        MatchOutcome outcome = our > opp ? MatchOutcome.WIN
            : our < opp ? MatchOutcome.LOSE : MatchOutcome.DRAW;

        MatchResult result = matchResultRepository.findByActivityId(activityId)
            .orElse(new MatchResult());
        result.setActivityId(activityId);
        result.setOurScore(our);
        result.setOppScore(opp);
        result.setOutcome(outcome);
        result.setNotes(req.getNotes());
        matchResultRepository.save(result);

        a.setStatus(ActivityStatus.FINISHED);
        activityRepository.save(a);
    }

    private ActivityRes toRes(Activity a, Long currentUserId) {
        long count = regRepository.countByActivityIdAndStatus(a.getId(), RegStatus.JOINED);
        boolean iJoined = regRepository.findByActivityIdAndUserId(a.getId(), currentUserId)
            .map(r -> r.getStatus() == RegStatus.JOINED).orElse(false);
        return ActivityRes.builder()
            .id(a.getId()).type(a.getType().name()).title(a.getTitle())
            .opponent(a.getOpponent()).location(a.getLocation())
            .startTime(a.getStartTime()).deadline(a.getDeadline())
            .maxPlayers(a.getMaxPlayers()).registeredCount(count)
            .status(a.getStatus().name()).iJoined(iJoined)
            .build();
    }
}
