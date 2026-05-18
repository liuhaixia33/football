package com.football.team.service;

import com.football.team.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@Service
public class WechatService {

    @Value("${wechat.app-id}")   private String appId;
    @Value("${wechat.app-secret}") private String appSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getOpenid(String code) {
        if ("dev_mock".equals(appId)) {
            return "mock_openid_" + code;
        }
        String url = "https://api.weixin.qq.com/sns/jscode2session"
            + "?appid=" + appId
            + "&secret=" + appSecret
            + "&js_code=" + code
            + "&grant_type=authorization_code";
        Map<?, ?> result = restTemplate.getForObject(url, Map.class);
        if (result == null || result.containsKey("errcode"))
            throw BusinessException.badRequest("微信登录失败：" + result);
        return (String) result.get("openid");
    }
}
