package com.football.team.service;

import com.football.team.dto.res.TeamPublicRes;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PosterServiceTest {

    @Mock TeamService teamService;
    @Mock WechatService wechatService;
    @Mock OssService ossService;
    @Mock StringRedisTemplate redis;
    @Mock ValueOperations<String, String> valueOps;
    @InjectMocks PosterService posterService;

    @BeforeEach
    void setup() {
        when(redis.opsForValue()).thenReturn(valueOps);
    }

    @Test
    void generatePoster_cacheHit_returnsCachedUrl() {
        when(valueOps.get("poster:url:1")).thenReturn("https://oss/cached.png");

        String url = posterService.generatePoster(1L);

        assertEquals("https://oss/cached.png", url);
        verify(wechatService, never()).generateMiniCode(any(), any());
        verify(ossService, never()).uploadBytes(any(), any());
    }

    @Test
    void generatePoster_cacheMiss_generatesAndCaches() {
        when(valueOps.get("poster:url:1")).thenReturn(null);

        TeamPublicRes pub = TeamPublicRes.builder()
            .teamId(1L).name("城南联队").logoUrl("").description("周末踢球")
            .memberCount(12).build();
        when(teamService.getPublicInfo(1L)).thenReturn(pub);
        when(wechatService.generateMiniCode("teamId=1", "pages/join-team/index"))
            .thenReturn(new byte[]{1, 2, 3});
        when(ossService.uploadBytes(any(), contains("poster/1_")))
            .thenReturn("https://oss/new.png");

        String url = posterService.generatePoster(1L);

        assertEquals("https://oss/new.png", url);
        verify(valueOps).set(eq("poster:url:1"), eq("https://oss/new.png"), anyLong(), any());
    }
}
