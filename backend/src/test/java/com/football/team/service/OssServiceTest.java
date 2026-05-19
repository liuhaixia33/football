package com.football.team.service;

import com.aliyun.oss.OSS;
import com.football.team.config.OssProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OssServiceTest {

    @Mock OSS ossClient;
    @Mock OssProperties ossProperties;
    @InjectMocks OssService ossService;

    @Test
    void uploadAvatar_returnsOssUrlWithCorrectKeyAndExtension() throws IOException {
        when(ossProperties.getBucketName()).thenReturn("test-bucket");
        when(ossProperties.getBaseUrl()).thenReturn("https://test.oss.aliyuncs.com");

        MockMultipartFile file = new MockMultipartFile(
            "file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});

        String url = ossService.uploadAvatar(file, 42L);

        verify(ossClient).putObject(
            eq("test-bucket"),
            argThat(key -> key.startsWith("avatars/42_") && key.endsWith(".jpg")),
            any(InputStream.class)
        );
        assertThat(url).startsWith("https://test.oss.aliyuncs.com/avatars/42_");
        assertThat(url).endsWith(".jpg");
    }

    @Test
    void uploadAvatar_defaultsToJpgExtensionWhenNoExtension() throws IOException {
        when(ossProperties.getBucketName()).thenReturn("test-bucket");
        when(ossProperties.getBaseUrl()).thenReturn("https://test.oss.aliyuncs.com");

        MockMultipartFile file = new MockMultipartFile(
            "file", "photo", "image/jpeg", new byte[]{1, 2, 3});

        String url = ossService.uploadAvatar(file, 1L);

        assertThat(url).endsWith(".jpg");
    }
}
