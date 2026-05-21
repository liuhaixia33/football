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
        String prefix = userId != null ? "avatar/" + userId : "avatar/temp/anon";
        String key = prefix + "_" + System.currentTimeMillis() + ext;
        ossClient.putObject(ossProperties.getBucketName(), key, file.getInputStream());
        return ossProperties.getBaseUrl() + "/" + key;
    }

    public String uploadBytes(byte[] data, String key) {
        ossClient.putObject(ossProperties.getBucketName(), key, new java.io.ByteArrayInputStream(data));
        return ossProperties.getBaseUrl() + "/" + key;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }
}
