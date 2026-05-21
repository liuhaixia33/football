package com.football.team.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.football.team.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class WechatService {

    @Value("${wechat.app-id}")     private String appId;
    @Value("${wechat.app-secret}") private String appSecret;

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = buildRestTemplate();

    private static RestTemplate buildRestTemplate() {
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        return new RestTemplate(factory);
    }

    private static final String ACCESS_TOKEN_KEY = "wechat:access_token";

    public String getOpenid(String code) {
        if ("dev_mock".equals(appId)) return "mock_openid_" + code;
        String url = "https://api.weixin.qq.com/sns/jscode2session"
            + "?appid=" + appId + "&secret=" + appSecret
            + "&js_code=" + code + "&grant_type=authorization_code";
        String raw = restTemplate.getForObject(url, String.class);
        Map<?, ?> result = parseJson(raw);
        if (result == null || result.containsKey("errcode"))
            throw BusinessException.badRequest("微信登录失败：" + result);
        return (String) result.get("openid");
    }

    public boolean isDevMock() {
        return "dev_mock".equals(appId);
    }

    /** 获取 access_token，Redis 缓存 7100s（有效期 7200s） */
    public String getAccessToken() {
        String cached = redis.opsForValue().get(ACCESS_TOKEN_KEY);
        if (cached != null) return cached;

        String url = "https://api.weixin.qq.com/cgi-bin/token"
            + "?grant_type=client_credential&appid=" + appId + "&secret=" + appSecret;
        String raw = restTemplate.getForObject(url, String.class);
        Map<?, ?> result = parseJson(raw);
        if (result == null || result.containsKey("errcode"))
            throw BusinessException.badRequest("获取 access_token 失败：" + result);

        String token = (String) result.get("access_token");
        redis.opsForValue().set(ACCESS_TOKEN_KEY, token, 7100, TimeUnit.SECONDS);
        return token;
    }

    /**
     * 生成小程序码字节流。
     * scene 最长 32 字符，page 须在小程序中注册。
     * dev_mock 模式返回 1x1 透明 PNG。
     */
    public byte[] generateMiniCode(String scene, String page) {
        if ("dev_mock".equals(appId)) return MOCK_PNG;

        String token = getAccessToken();
        String url = "https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=" + token;

        Map<String, Object> body = Map.of(
            "scene", scene,
            "page", page,
            "width", 280,
            "auto_color", false,
            "line_color", Map.of("r", 39, "g", 174, "b", 96)
        );

        byte[] response = restTemplate.postForObject(url, body, byte[].class);
        if (response == null || response.length == 0)
            throw BusinessException.badRequest("生成小程序码失败：空响应");

        // 若返回 JSON（错误情况），微信会返回 {"errcode":...}
        if (response[0] == '{') {
            String err = new String(response);
            throw BusinessException.badRequest("生成小程序码失败：" + err);
        }
        return response;
    }

    private Map<?, ?> parseJson(String raw) {
        try {
            return objectMapper.readValue(raw, Map.class);
        } catch (Exception e) {
            throw BusinessException.badRequest("微信接口返回异常：" + raw);
        }
    }

    // 1x1 透明 PNG（dev mock 占位）
    private static final byte[] MOCK_PNG = new byte[]{
        (byte)0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
        0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x06,0x00,0x00,0x00,0x1F,0x15,(byte)0xC4,
        (byte)0x89,0x00,0x00,0x00,0x0B,0x49,0x44,0x41,0x54,0x78,(byte)0x9C,0x62,0x00,0x00,0x00,
        0x02,0x00,0x01,(byte)0xE2,0x21,(byte)0xBC,0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,
        (byte)0xAE,0x42,0x60,(byte)0x82
    };
}
