package com.football.team.controller;

import com.football.team.dto.req.UpdateProfileReq;
import com.football.team.dto.res.ApiResponse;
import com.football.team.dto.res.MyStatsRes;
import com.football.team.dto.res.UserProfileRes;
import com.football.team.entity.User;
import com.football.team.exception.BusinessException;
import com.football.team.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserProfileRes> me(HttpServletRequest req) {
        User user = (User) req.getAttribute("currentUser");
        if (user == null) throw BusinessException.unauthorized("请先登录");
        return ApiResponse.ok(userService.getProfile(user.getId()));
    }

    @GetMapping("/me/stats")
    public ApiResponse<MyStatsRes> stats(HttpServletRequest req,
                                         @RequestParam Long teamId) {
        User user = (User) req.getAttribute("currentUser");
        if (user == null) throw BusinessException.unauthorized("请先登录");
        return ApiResponse.ok(userService.getStats(user.getId(), teamId));
    }

    @PutMapping("/me")
    public ApiResponse<Void> updateProfile(@RequestBody UpdateProfileReq req,
                                           HttpServletRequest request) {
        User user = (User) request.getAttribute("currentUser");
        if (user == null) throw BusinessException.unauthorized("请先登录");
        userService.updateProfile(user.getId(), req);
        return ApiResponse.ok(null);
    }
}
