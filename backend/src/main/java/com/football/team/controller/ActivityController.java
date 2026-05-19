package com.football.team.controller;

import com.football.team.dto.req.CreateActivityReq;
import com.football.team.dto.req.RecordResultReq;
import com.football.team.dto.res.ActivityDetailRes;
import com.football.team.dto.res.ActivityRes;
import com.football.team.dto.res.ApiResponse;
import com.football.team.entity.Activity;
import com.football.team.entity.User;
import com.football.team.enums.MemberRole;
import com.football.team.security.RequireRole;
import com.football.team.service.ActivityService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping("/team/{teamId}")
    @RequireRole(MemberRole.PLAYER)
    public ApiResponse<List<ActivityRes>> list(HttpServletRequest req,
                                               @PathVariable Long teamId) {
        User user = (User) req.getAttribute("currentUser");
        return ApiResponse.ok(activityService.listActivities(teamId, user.getId()));
    }

    @GetMapping("/{activityId}")
    @RequireRole(MemberRole.PLAYER)
    public ApiResponse<ActivityDetailRes> detail(HttpServletRequest req,
                                                  @PathVariable Long activityId) {
        User user = (User) req.getAttribute("currentUser");
        Long teamId = (Long) req.getAttribute("currentTeamId");
        return ApiResponse.ok(activityService.getDetail(activityId, user.getId(), teamId));
    }

    @PostMapping("/team/{teamId}")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<Activity> create(HttpServletRequest req,
                                        @PathVariable Long teamId,
                                        @RequestBody @Valid CreateActivityReq body) {
        User user = (User) req.getAttribute("currentUser");
        return ApiResponse.ok(activityService.createActivity(teamId, user.getId(), body));
    }

    @PostMapping("/{activityId}/register")
    @RequireRole(MemberRole.PLAYER)
    public ApiResponse<Void> register(HttpServletRequest req, @PathVariable Long activityId) {
        User user = (User) req.getAttribute("currentUser");
        Long teamId = (Long) req.getAttribute("currentTeamId");
        activityService.register(activityId, user.getId(), teamId);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{activityId}/register")
    @RequireRole(MemberRole.PLAYER)
    public ApiResponse<Void> cancelRegister(HttpServletRequest req, @PathVariable Long activityId) {
        User user = (User) req.getAttribute("currentUser");
        Long teamId = (Long) req.getAttribute("currentTeamId");
        activityService.cancelRegister(activityId, user.getId(), teamId);
        return ApiResponse.ok(null);
    }

    @PutMapping("/{activityId}/close")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<Void> close(HttpServletRequest req, @PathVariable Long activityId) {
        Long teamId = (Long) req.getAttribute("currentTeamId");
        activityService.closeActivity(activityId, teamId);
        return ApiResponse.ok(null);
    }

    @PutMapping("/{activityId}/result")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<Void> result(HttpServletRequest req, @PathVariable Long activityId,
                                    @RequestBody @Valid RecordResultReq body) {
        Long teamId = (Long) req.getAttribute("currentTeamId");
        activityService.recordResult(activityId, body, teamId);
        return ApiResponse.ok(null);
    }

    @PutMapping("/{activityId}")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<ActivityRes> update(HttpServletRequest req,
                                           @PathVariable Long activityId,
                                           @RequestBody @Valid CreateActivityReq body) {
        Long teamId = (Long) req.getAttribute("currentTeamId");
        User user = (User) req.getAttribute("currentUser");
        Activity updated = activityService.updateActivity(activityId, teamId, body);
        return ApiResponse.ok(activityService.toActivityRes(updated, user.getId()));
    }
}
