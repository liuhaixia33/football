package com.football.team.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.football.team.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.core.io.ByteArrayResource;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContentSafetyService {

    private final WechatService wechatService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = buildRestTemplate();

    private static RestTemplate buildRestTemplate() {
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        return new RestTemplate(factory);
    }

    public void checkText(String openid, String text) {
        return;

//        if (wechatService.isDevMock() || text == null || text.isBlank()) return;
//
//        String token = wechatService.getAccessToken();
//        String url = "https://api.weixin.qq.com/wxa/msg_sec_check?access_token=" + token;
//
//        Map<String, Object> body = Map.of(
//            "openid", openid,
//            "scene", 1,
//            "version", 2,
//            "content", text
//        );
//
//        try {
//            String raw = restTemplate.postForObject(url, body, String.class);
//            parseAndThrow(raw);
//        } catch (BusinessException e) {
//            throw e;
//        } catch (Exception e) {
//            log.warn("内容安全检查调用失败，跳过检查: {}", e.getMessage());
//        }
    }

    public void checkImage(byte[] imageBytes) {
        return;

//        if (wechatService.isDevMock() || imageBytes == null || imageBytes.length == 0) return;
//
//        String token = wechatService.getAccessToken();
//        String url = "https://api.weixin.qq.com/wxa/img_sec_check?access_token=" + token;
//
//        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
//        form.add("media", new ByteArrayResource(imageBytes) {
//            @Override public String getFilename() { return "image.jpg"; }
//        });
//        HttpHeaders headers = new HttpHeaders();
//        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
//        HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(form, headers);
//
//        String raw = restTemplate.postForEntity(url, entity, String.class).getBody();
//        parseAndThrow(raw);
    }

    private void parseAndThrow(String raw) {
        if (raw == null) return;
        try {
            Map<?, ?> result = objectMapper.readValue(raw, Map.class);
            Object errcode = result.get("errcode");
            if (errcode instanceof Number && ((Number) errcode).intValue() == 87014) {
                throw BusinessException.badRequest("内容包含违规信息，请修改后重试");
            }
            Object detail = result.get("result");
            if (detail instanceof Map<?, ?> detailMap) {
                Object suggest = detailMap.get("suggest");
                if ("block".equals(suggest)) {
                    throw BusinessException.badRequest("内容包含违规信息，请修改后重试");
                }
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Content safety response parse failed, skipping check: {}", raw, e);
        }
    }
}
