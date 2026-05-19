package com.football.team.config;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Data
@Validated
@ConfigurationProperties(prefix = "oss")
public class OssProperties {
    @NotBlank private String endpoint;
    @NotBlank private String accessKeyId;
    @NotBlank private String accessKeySecret;
    @NotBlank private String bucketName;
    @NotBlank private String baseUrl;
}
