package com.football.team.service;

import com.aliyun.oss.OSS;
import com.football.team.config.OssProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class OssService {

    private final OSS ossClient;
    private final OssProperties ossProperties;

    public String uploadAvatar(MultipartFile file, Long userId) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        String key = "avatar/" + userId + "_" + System.currentTimeMillis() + ext;
        ossClient.putObject(ossProperties.getBucketName(), key, file.getInputStream());
        return ossProperties.getBaseUrl() + "/" + key;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }
}
