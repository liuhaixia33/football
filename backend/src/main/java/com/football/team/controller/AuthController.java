package com.football.team.controller;

import com.football.team.dto.req.LoginReq;
import com.football.team.dto.res.ApiResponse;
import com.football.team.dto.res.LoginRes;
import com.football.team.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<LoginRes> login(@RequestBody @Valid LoginReq req) {
        return ApiResponse.ok(authService.login(req));
    }
}
