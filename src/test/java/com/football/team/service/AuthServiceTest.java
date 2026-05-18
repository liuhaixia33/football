package com.football.team.service;

import com.football.team.dto.req.LoginReq;
import com.football.team.dto.res.LoginRes;
import com.football.team.entity.User;
import com.football.team.enums.MemberStatus;
import com.football.team.repository.TeamMemberRepository;
import com.football.team.repository.TeamRepository;
import com.football.team.repository.UserRepository;
import com.football.team.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock WechatService wechatService;
    @Mock UserRepository userRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock TeamRepository teamRepository;
    @Mock JwtUtil jwtUtil;
    @InjectMocks AuthService authService;

    @Test
    void login_newUser_createsUserAndReturnsToken() {
        LoginReq req = new LoginReq();
        req.setCode("wx_code_123");
        req.setNickname("张三");

        when(wechatService.getOpenid("wx_code_123")).thenReturn("openid_abc");
        when(userRepository.findByOpenid("openid_abc")).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(teamMemberRepository.findByUserIdAndStatus(1L, MemberStatus.ACTIVE)).thenReturn(List.of());
        when(jwtUtil.generate(1L)).thenReturn("jwt_token");

        LoginRes res = authService.login(req);

        assertEquals("jwt_token", res.getToken());
        assertEquals("张三", res.getNickname());
        assertTrue(res.getTeams().isEmpty());
    }

    @Test
    void login_existingUser_returnsToken() {
        LoginReq req = new LoginReq();
        req.setCode("wx_code_456");

        User existing = new User();
        existing.setId(2L);
        existing.setOpenid("openid_def");
        existing.setNickname("李四");

        when(wechatService.getOpenid("wx_code_456")).thenReturn("openid_def");
        when(userRepository.findByOpenid("openid_def")).thenReturn(Optional.of(existing));
        when(teamMemberRepository.findByUserIdAndStatus(2L, MemberStatus.ACTIVE)).thenReturn(List.of());
        when(jwtUtil.generate(2L)).thenReturn("jwt_token_2");

        LoginRes res = authService.login(req);
        assertEquals(2L, res.getUserId());
    }
}
