package com.football.team.service;

import com.football.team.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContentSafetyServiceTest {

    @Mock WechatService wechatService;
    @InjectMocks ContentSafetyService contentSafetyService;

    @Test
    void checkText_devMock_skips() {
        when(wechatService.isDevMock()).thenReturn(true);
        assertDoesNotThrow(() -> contentSafetyService.checkText("openid1", "任意文本"));
        verify(wechatService, never()).getAccessToken();
    }

    @Test
    void checkImage_devMock_skips() {
        when(wechatService.isDevMock()).thenReturn(true);
        assertDoesNotThrow(() -> contentSafetyService.checkImage(new byte[]{1, 2, 3}));
        verify(wechatService, never()).getAccessToken();
    }
}
