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
        return ApiResponse.ok(activityService.getDetail(activityId, user.getId()));
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
        activityService.register(activityId, user.getId());
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{activityId}/register")
    @RequireRole(MemberRole.PLAYER)
    public ApiResponse<Void> cancelRegister(HttpServletRequest req, @PathVariable Long activityId) {
        User user = (User) req.getAttribute("currentUser");
        activityService.cancelRegister(activityId, user.getId());
        return ApiResponse.ok(null);
    }

    @PutMapping("/{activityId}/close")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<Void> close(@PathVariable Long activityId) {
        activityService.closeActivity(activityId);
        return ApiResponse.ok(null);
    }

    @PutMapping("/{activityId}/result")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<Void> result(@PathVariable Long activityId,
                                    @RequestBody @Valid RecordResultReq body) {
        activityService.recordResult(activityId, body);
        return ApiResponse.ok(null);
    }
}
