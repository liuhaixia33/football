# 球队名片功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 队长生成带小程序码的绿色风格球队名片图片，外人扫码直接进入申请加入页。

**Architecture:** 后端用 Graphics2D 合成海报图片（750×1080px），小程序码通过微信 wxacode API 生成，结果上传 OSS 并用 Redis 缓存 24h。前端新增海报页，join-team 页支持从 scene 参数识别 teamId 直接申请。

**Tech Stack:** Java Graphics2D, Spring Redis (StringRedisTemplate), 微信 wxacode.getUnlimited API, 阿里云 OSS, Taro (saveImageToPhotosAlbum)

---

## 文件清单

| 操作 | 文件 |
|---|---|
| 新建 | `backend/src/main/java/com/football/team/service/PosterService.java` |
| 新建 | `backend/src/main/java/com/football/team/dto/res/TeamPublicRes.java` |
| 新建 | `backend/src/main/java/com/football/team/dto/res/PosterRes.java` |
| 新建 | `backend/src/test/java/com/football/team/service/PosterServiceTest.java` |
| 新建 | `frontend/src/pages/team-poster/index.tsx` |
| 新建 | `frontend/src/pages/team-poster/index.config.ts` |
| 修改 | `backend/src/main/java/com/football/team/service/WechatService.java` |
| 修改 | `backend/src/main/java/com/football/team/service/OssService.java` |
| 修改 | `backend/src/main/java/com/football/team/service/TeamService.java` |
| 修改 | `backend/src/main/java/com/football/team/controller/TeamController.java` |
| 修改 | `backend/src/main/java/com/football/team/config/WebConfig.java` |
| 修改 | `backend/src/test/java/com/football/team/service/TeamServiceTest.java` |
| 修改 | `frontend/src/api/team.ts` |
| 修改 | `frontend/src/pages/join-team/index.tsx` |
| 修改 | `frontend/src/pages/my/index.tsx` |
| 修改 | `frontend/src/app.config.ts` |

---

## Task 1：OssService — 支持上传 byte[]

**Files:**
- Modify: `backend/src/main/java/com/football/team/service/OssService.java`

- [ ] **Step 1: 在 OssService 中添加 `uploadBytes` 方法**

```java
// 在 OssService.java 现有 uploadAvatar 方法之后添加：

public String uploadBytes(byte[] data, String key) {
    ossClient.putObject(ossProperties.getBucketName(), key, new java.io.ByteArrayInputStream(data));
    return ossProperties.getBaseUrl() + "/" + key;
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/main/java/com/football/team/service/OssService.java
git commit -m "feat: add uploadBytes to OssService"
```

---

## Task 2：WechatService — access token + 小程序码生成

**Files:**
- Modify: `backend/src/main/java/com/football/team/service/WechatService.java`

- [ ] **Step 1: 写失败测试（WechatServiceTest 暂不存在，先确认编译通过即可，不需要集成测试）**

由于微信 API 需要真实 appId，此处以 dev_mock 分支覆盖为主，在 PosterServiceTest（Task 5）中 mock 整个 WechatService。

- [ ] **Step 2: 替换 WechatService 全文**

```java
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
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

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
```

- [ ] **Step 3: 编译验证**

```bash
cd backend && mvn compile -q
# 期望：BUILD SUCCESS，无编译错误
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/football/team/service/WechatService.java
git commit -m "feat: add access token cache and mini code generation to WechatService"
```

---

## Task 3：TeamService — 公开信息 + 按 teamId 申请

**Files:**
- Modify: `backend/src/main/java/com/football/team/service/TeamService.java`
- Create: `backend/src/main/java/com/football/team/dto/res/TeamPublicRes.java`
- Modify: `backend/src/test/java/com/football/team/service/TeamServiceTest.java`

- [ ] **Step 1: 创建 TeamPublicRes DTO**

```java
// backend/src/main/java/com/football/team/dto/res/TeamPublicRes.java
package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class TeamPublicRes {
    private Long teamId;
    private String name;
    private String logoUrl;
    private String description;
    private int memberCount;
}
```

- [ ] **Step 2: 写失败测试**

在 `TeamServiceTest.java` 末尾追加：

```java
// ---- 新增 import（已有则跳过）----
// import com.football.team.dto.res.TeamPublicRes;
// import com.football.team.entity.Team;
// import com.football.team.enums.MemberStatus;
// import java.util.List;

@Test
void getPublicInfo_teamNotFound_throwsNotFound() {
    when(teamRepository.findById(99L)).thenReturn(Optional.empty());
    assertThrows(BusinessException.class, () -> teamService.getPublicInfo(99L));
}

@Test
void getPublicInfo_success_returnsMemberCount() {
    Team team = new Team();
    team.setId(1L);
    team.setName("城南联队");
    team.setLogoUrl("http://logo.url");
    team.setDescription("每周末踢球");
    when(teamRepository.findById(1L)).thenReturn(Optional.of(team));

    TeamMember m1 = new TeamMember(); m1.setStatus(MemberStatus.ACTIVE);
    TeamMember m2 = new TeamMember(); m2.setStatus(MemberStatus.ACTIVE);
    when(teamMemberRepository.findByTeamIdAndStatus(1L, MemberStatus.ACTIVE))
        .thenReturn(List.of(m1, m2));

    TeamPublicRes res = teamService.getPublicInfo(1L);
    assertEquals("城南联队", res.getName());
    assertEquals(2, res.getMemberCount());
}

@Test
void applyJoinByTeamId_teamNotFound_throwsNotFound() {
    when(teamRepository.findById(99L)).thenReturn(Optional.empty());
    assertThrows(BusinessException.class, () -> teamService.applyJoinByTeamId(1L, 99L));
}

@Test
void applyJoinByTeamId_alreadyActive_throwsBadRequest() {
    Team team = new Team(); team.setId(5L);
    when(teamRepository.findById(5L)).thenReturn(Optional.of(team));
    TeamMember active = new TeamMember(); active.setStatus(MemberStatus.ACTIVE);
    when(teamMemberRepository.findByTeamIdAndUserId(5L, 1L)).thenReturn(Optional.of(active));

    assertThrows(BusinessException.class, () -> teamService.applyJoinByTeamId(1L, 5L));
}
```

- [ ] **Step 3: 运行测试确认失败**

```bash
cd backend && mvn test -pl . -Dtest=TeamServiceTest -q 2>&1 | tail -5
# 期望：FAILURE — getPublicInfo/applyJoinByTeamId 方法不存在
```

- [ ] **Step 4: 在 TeamService 添加两个方法**

在 `TeamService.java` 中，`getTeamByInviteCode` 方法之后追加：

```java
@Transactional(readOnly = true)
public TeamPublicRes getPublicInfo(Long teamId) {
    Team team = teamRepository.findById(teamId)
        .orElseThrow(() -> BusinessException.notFound("球队不存在"));
    int memberCount = teamMemberRepository.findByTeamIdAndStatus(teamId, MemberStatus.ACTIVE).size();
    return TeamPublicRes.builder()
        .teamId(team.getId())
        .name(team.getName())
        .logoUrl(team.getLogoUrl())
        .description(team.getDescription())
        .memberCount(memberCount)
        .build();
}

public void applyJoinByTeamId(Long userId, Long teamId) {
    Team team = teamRepository.findById(teamId)
        .orElseThrow(() -> BusinessException.notFound("球队不存在"));

    Optional<TeamMember> existing = teamMemberRepository.findByTeamIdAndUserId(team.getId(), userId);
    if (existing.isPresent()) {
        TeamMember m = existing.get();
        if (m.getStatus() == MemberStatus.ACTIVE)
            throw BusinessException.badRequest("您已是该球队成员");
        if (m.getStatus() == MemberStatus.PENDING)
            throw BusinessException.badRequest("您的申请正在审核中");
        m.setStatus(MemberStatus.PENDING);
        m.setJoinedAt(null);
        teamMemberRepository.save(m);
        return;
    }
    TeamMember member = new TeamMember();
    member.setTeamId(team.getId());
    member.setUserId(userId);
    teamMemberRepository.save(member);
}
```

同时在 `TeamService.java` 顶部 import 列表中补充：
```java
import com.football.team.dto.res.TeamPublicRes;
```

- [ ] **Step 5: 运行测试确认通过**

```bash
cd backend && mvn test -pl . -Dtest=TeamServiceTest -q 2>&1 | tail -5
# 期望：BUILD SUCCESS，Tests run: 9, Failures: 0
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/football/team/dto/res/TeamPublicRes.java \
        backend/src/main/java/com/football/team/service/TeamService.java \
        backend/src/test/java/com/football/team/service/TeamServiceTest.java
git commit -m "feat: add getPublicInfo and applyJoinByTeamId to TeamService"
```

---

## Task 4：PosterService — 海报合成

**Files:**
- Create: `backend/src/main/java/com/football/team/service/PosterService.java`
- Create: `backend/src/main/java/com/football/team/dto/res/PosterRes.java`
- Create: `backend/src/test/java/com/football/team/service/PosterServiceTest.java`

- [ ] **Step 1: 创建 PosterRes DTO**

```java
// backend/src/main/java/com/football/team/dto/res/PosterRes.java
package com.football.team.dto.res;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class PosterRes {
    private String posterUrl;
}
```

- [ ] **Step 2: 写失败测试**

```java
// backend/src/test/java/com/football/team/service/PosterServiceTest.java
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
```

- [ ] **Step 3: 运行测试确认失败**

```bash
cd backend && mvn test -pl . -Dtest=PosterServiceTest -q 2>&1 | tail -5
# 期望：FAILURE — PosterService 类不存在
```

- [ ] **Step 4: 创建 PosterService**

```java
// backend/src/main/java/com/football/team/service/PosterService.java
package com.football.team.service;

import com.football.team.dto.res.TeamPublicRes;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.Ellipse2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class PosterService {

    private final TeamService teamService;
    private final WechatService wechatService;
    private final OssService ossService;
    private final StringRedisTemplate redis;

    private static final int W = 750, H = 1080;
    private static final Color GREEN       = new Color(0x2e, 0xcc, 0x71);
    private static final Color GREEN_DARK  = new Color(0x27, 0xae, 0x60);
    private static final Color BG_TOP      = new Color(0xf8, 0xff, 0xfe);
    private static final Color BG_BOTTOM   = new Color(0xe8, 0xf8, 0xf0);
    private static final Color TEXT_MAIN   = new Color(0x1a, 0x1a, 0x1a);
    private static final Color TEXT_MUTED  = new Color(0x88, 0x88, 0x88);
    private static final Color DIVIDER     = new Color(0xd0, 0xea, 0xd8);

    public String generatePoster(Long teamId) {
        String cacheKey = "poster:url:" + teamId;
        String cached = redis.opsForValue().get(cacheKey);
        if (cached != null) return cached;

        TeamPublicRes info  = teamService.getPublicInfo(teamId);
        byte[] miniCode     = wechatService.generateMiniCode("teamId=" + teamId, "pages/join-team/index");
        byte[] logoBytes    = fetchLogo(info.getLogoUrl());

        byte[] poster = renderPoster(info.getName(), info.getDescription(),
            info.getMemberCount(), logoBytes, miniCode);

        String key = "poster/" + teamId + "_" + System.currentTimeMillis() + ".png";
        String url = ossService.uploadBytes(poster, key);

        redis.opsForValue().set(cacheKey, url, 24, TimeUnit.HOURS);
        return url;
    }

    private byte[] fetchLogo(String logoUrl) {
        if (logoUrl == null || logoUrl.isBlank()) return null;
        try {
            return URI.create(logoUrl).toURL().openStream().readAllBytes();
        } catch (Exception e) {
            return null;
        }
    }

    byte[] renderPoster(String teamName, String description, int memberCount,
                         byte[] logoBytes, byte[] miniCodeBytes) {
        try {
            BufferedImage img = new BufferedImage(W, H, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = img.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,      RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,  RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_RENDERING,          RenderingHints.VALUE_RENDER_QUALITY);

            // 背景渐变
            g.setPaint(new GradientPaint(0, 0, BG_TOP, 0, H, BG_BOTTOM));
            g.fillRect(0, 0, W, H);

            // 顶部绿色色块
            g.setColor(GREEN);
            g.fillRect(0, 0, W, 80);

            // FOOTBALL TEAM 顶部标签
            g.setColor(Color.WHITE);
            g.setFont(new Font("SansSerif", Font.BOLD, 22));
            g.drawString("⚽ FOOTBALL TEAM", 40, 52);

            // Logo（圆形）
            int logoSize = 120;
            int logoX = 50, logoY = 110;
            if (logoBytes != null) {
                BufferedImage logo = ImageIO.read(new ByteArrayInputStream(logoBytes));
                BufferedImage circle = new BufferedImage(logoSize, logoSize, BufferedImage.TYPE_INT_ARGB);
                Graphics2D lg = circle.createGraphics();
                lg.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                lg.setClip(new Ellipse2D.Float(0, 0, logoSize, logoSize));
                lg.drawImage(logo, 0, 0, logoSize, logoSize, null);
                lg.dispose();
                g.drawImage(circle, logoX, logoY, null);
            } else {
                g.setColor(GREEN);
                g.fillOval(logoX, logoY, logoSize, logoSize);
                g.setColor(Color.WHITE);
                g.setFont(new Font("SansSerif", Font.BOLD, 52));
                g.drawString("⚽", logoX + 30, logoY + 76);
            }

            // 球队名称
            g.setColor(TEXT_MAIN);
            g.setFont(new Font("SansSerif", Font.BOLD, 52));
            g.drawString(teamName, 50, 285);

            // 简介
            String desc = description.length() > 18 ? description.substring(0, 18) + "…" : description;
            g.setFont(new Font("SansSerif", Font.PLAIN, 28));
            g.setColor(TEXT_MUTED);
            g.drawString(desc, 50, 330);

            // 分隔线 1
            g.setColor(DIVIDER);
            g.fillRect(50, 360, W - 100, 2);

            // 数据行
            int[] xPos = {50, 290, 510};
            String[] values = {String.valueOf(memberCount), "—", "—"};
            String[] labels = {"活跃队员", "场比赛", "胜场"};
            for (int i = 0; i < 3; i++) {
                g.setFont(new Font("SansSerif", Font.BOLD, 52));
                g.setColor(GREEN_DARK);
                g.drawString(values[i], xPos[i], 430);
                g.setFont(new Font("SansSerif", Font.PLAIN, 24));
                g.setColor(TEXT_MUTED);
                g.drawString(labels[i], xPos[i], 470);
            }

            // 分隔线 2
            g.setColor(DIVIDER);
            g.fillRect(50, 500, W - 100, 2);

            // 小程序码
            int codeSize = 260;
            int codeX = (W - codeSize) / 2;
            int codeY = 540;
            if (miniCodeBytes != null) {
                BufferedImage code = ImageIO.read(new ByteArrayInputStream(miniCodeBytes));
                if (code != null) g.drawImage(code, codeX, codeY, codeSize, codeSize, null);
            } else {
                g.setColor(new Color(0xee, 0xee, 0xee));
                g.fillRect(codeX, codeY, codeSize, codeSize);
            }

            // CTA 文字
            g.setFont(new Font("SansSerif", Font.BOLD, 34));
            g.setColor(GREEN_DARK);
            FontMetrics fm = g.getFontMetrics();
            String cta = "扫码申请加入";
            g.drawString(cta, (W - fm.stringWidth(cta)) / 2, 840);

            // 页脚
            g.setFont(new Font("SansSerif", Font.PLAIN, 22));
            g.setColor(new Color(0xbb, 0xbb, 0xbb));
            FontMetrics fm2 = g.getFontMetrics();
            String footer = "Football Team · 球队管理小程序";
            g.drawString(footer, (W - fm2.stringWidth(footer)) / 2, 920);

            g.dispose();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(img, "png", out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("海报生成失败: " + e.getMessage(), e);
        }
    }
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
cd backend && mvn test -pl . -Dtest=PosterServiceTest -q 2>&1 | tail -5
# 期望：BUILD SUCCESS，Tests run: 2, Failures: 0
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/football/team/service/PosterService.java \
        backend/src/main/java/com/football/team/dto/res/PosterRes.java \
        backend/src/test/java/com/football/team/service/PosterServiceTest.java
git commit -m "feat: add PosterService with Graphics2D poster rendering and Redis caching"
```

---

## Task 5：TeamController — 三个新接口 + WebConfig

**Files:**
- Modify: `backend/src/main/java/com/football/team/controller/TeamController.java`
- Modify: `backend/src/main/java/com/football/team/config/WebConfig.java`

- [ ] **Step 1: 在 WebConfig 中排除公开接口**

在 `addInterceptors` 的 `excludePathPatterns` 中追加：

```java
// 原来：
.excludePathPatterns("/api/v1/auth/**", "/api/v1/upload/avatar");

// 改为：
.excludePathPatterns(
    "/api/v1/auth/**",
    "/api/v1/upload/avatar",
    "/api/v1/teams/*/public"   // 公开球队信息，无需团队上下文
);
```

- [ ] **Step 2: 在 TeamController 注入 PosterService 并添加三个接口**

在 `TeamController` 类中，修改构造参数并添加新接口：

```java
// 修改 controller 声明：
public class TeamController {
    private final TeamService teamService;
    private final PosterService posterService;   // 新增注入
    
    // ... 原有方法不变 ...

    /** 公开接口：无需登录，用于扫码后展示球队信息 */
    @GetMapping("/{teamId}/public")
    public ApiResponse<TeamPublicRes> getPublicInfo(@PathVariable Long teamId) {
        return ApiResponse.ok(teamService.getPublicInfo(teamId));
    }

    /** 扫码申请加入（需登录，不需要已是成员） */
    @PostMapping("/{teamId}/apply")
    public ApiResponse<Void> applyByTeamId(HttpServletRequest req,
                                            @PathVariable Long teamId) {
        User user = (User) req.getAttribute("currentUser");
        if (user == null) throw BusinessException.unauthorized("请先登录");
        teamService.applyJoinByTeamId(user.getId(), teamId);
        return ApiResponse.ok(null);
    }

    /** 生成球队名片（仅 ADMIN 及以上） */
    @GetMapping("/{teamId}/poster")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<PosterRes> getPoster(@PathVariable Long teamId) {
        String url = posterService.generatePoster(teamId);
        return ApiResponse.ok(new PosterRes(url));
    }
}
```

同时在 `TeamController.java` import 列表补充：
```java
import com.football.team.dto.res.PosterRes;
import com.football.team.dto.res.TeamPublicRes;
import com.football.team.service.PosterService;
```

- [ ] **Step 3: 编译验证**

```bash
cd backend && mvn compile -q
# 期望：BUILD SUCCESS
```

- [ ] **Step 4: 运行全量后端测试**

```bash
cd backend && mvn test -q 2>&1 | tail -10
# 期望：BUILD SUCCESS，所有测试通过
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/football/team/controller/TeamController.java \
        backend/src/main/java/com/football/team/config/WebConfig.java
git commit -m "feat: add public info, apply-by-teamId, and poster endpoints to TeamController"
```

---

## Task 6：前端 API 层

**Files:**
- Modify: `frontend/src/api/team.ts`

- [ ] **Step 1: 新增三个 API 方法**

在 `teamApi` 对象末尾（`getByInviteCode` 之后）追加：

```typescript
  getPublicInfo: (teamId: number) =>
    api.get<{ teamId: number; name: string; logoUrl: string; description: string; memberCount: number }>(
      `/api/v1/teams/${teamId}/public`,
      false   // 不携带 X-Team-Id
    ),

  applyByTeamId: (teamId: number) =>
    api.post<void>(`/api/v1/teams/${teamId}/apply`, {}, false),

  getPoster: (teamId: number) =>
    api.get<{ posterUrl: string }>(`/api/v1/teams/${teamId}/poster`),
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/team.ts
git commit -m "feat: add getPublicInfo, applyByTeamId, getPoster to team API"
```

---

## Task 7：join-team 页改造 — 支持 scene 参数

**Files:**
- Modify: `frontend/src/pages/join-team/index.tsx`

- [ ] **Step 1: 替换 join-team 页面全文**

```typescript
import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useT } from '../../i18n/useT'
import { px } from '../../utils/style'

const C = {
  primary: '#22c55e', primaryDim: 'rgba(34,197,94,0.12)',
  bg: '#0f1010', surface: '#181c18', surface2: '#1e2420',
  border: 'rgba(255,255,255,0.09)', text: '#e8ede8',
  text2: '#8a9e8a', text3: '#4a5a4a',
}

export default function JoinTeamPage() {
  const [code, setCode]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [teamName, setTeamName]   = useState('')
  const [sceneTeamId, setSceneTeamId] = useState<number | null>(null)
  const t = useT()
  const router = useRouter()

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: t('join_team.title') })

    // 从小程序码 scene 参数解析 teamId（格式：teamId=123）
    const scene = router.params?.scene
    if (scene) {
      const decoded = decodeURIComponent(scene)
      const match = decoded.match(/teamId=(\d+)/)
      if (match) {
        const id = Number(match[1])
        setSceneTeamId(id)
        teamApi.getPublicInfo(id)
          .then(info => setTeamName(info.name))
          .catch(() => setTeamName('该球队'))
      }
    }
  }, [])

  // 扫码进入：直接按 teamId 申请
  const submitByTeamId = async () => {
    if (!sceneTeamId) return
    setLoading(true)
    try {
      await teamApi.applyByTeamId(sceneTeamId)
      Taro.showToast({ title: '申请已提交，等待队长审核', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '申请失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 手动输入邀请码申请
  const submitByCode = async () => {
    if (!code.trim()) {
      Taro.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      await teamApi.join(code.trim().toUpperCase())
      Taro.showToast({ title: t('join_team.success'), icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (e: unknown) {
      Taro.showToast({ title: e instanceof Error ? e.message : '加入失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ padding: px(20), background: C.bg, minHeight: '100%' }}>
      <View style={{
        background: C.surface, borderRadius: px(20), padding: px(24),
        border: `1px solid ${C.border}`,
      }}>
        <View style={{
          width: px(56), height: px(56), borderRadius: px(16),
          background: C.primaryDim, border: `1px solid rgba(0,228,114,0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: px(16),
        }}>
          <Text style={{ fontSize: px(52) }}>🔑</Text>
        </View>

        <Text style={{ fontSize: px(44), fontWeight: '800', color: C.text, marginBottom: px(6), display: 'block' }}>
          {t('join_team.title')}
        </Text>

        {sceneTeamId ? (
          // 扫码进入：展示球队名称，直接申请
          <>
            <Text style={{ fontSize: px(28), color: C.text2, marginBottom: px(32), display: 'block' }}>
              你正在申请加入「{teamName || '加载中…'}」
            </Text>
            <Button
              style={{
                background: C.primary, color: '#0f1010',
                borderRadius: px(14), border: 'none',
                fontSize: px(32), fontWeight: '700', padding: `${px(14)} 0`,
              }}
              loading={loading}
              onClick={submitByTeamId}
            >
              申请加入
            </Button>
          </>
        ) : (
          // 手动输入邀请码
          <>
            <Text style={{ fontSize: px(28), color: C.text2, marginBottom: px(32), display: 'block' }}>
              向球队管理员索取邀请码，输入后即可申请加入
            </Text>
            <Text style={{ fontSize: px(24), fontWeight: '600', color: C.text3, marginBottom: px(10), display: 'block' }}>
              {t('join_team.code')}
            </Text>
            <Input
              value={code}
              onInput={e => setCode(e.detail.value)}
              placeholder='请输入 8 位邀请码'
              maxlength={8}
              style={{
                border: `1.5px solid ${code ? 'rgba(34,197,94,0.4)' : C.border}`,
                borderRadius: px(14), padding: `${px(18)} ${px(14)}`,
                marginBottom: px(32), fontSize: px(52), letterSpacing: px(8),
                textAlign: 'center', background: C.surface2, color: C.primary,
                fontWeight: '800',
              }}
            />
            <Button
              style={{
                background: code.trim().length > 0 ? C.primary : 'rgba(255,255,255,0.07)',
                color: code.trim().length > 0 ? '#0f1010' : C.text3,
                borderRadius: px(14), border: 'none',
                fontSize: px(32), fontWeight: '700', padding: `${px(14)} 0`,
              }}
              loading={loading}
              onClick={submitByCode}
            >
              {t('join_team.submit')}
            </Button>
          </>
        )}
      </View>
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/join-team/index.tsx
git commit -m "feat: join-team supports scene param from QR code scan"
```

---

## Task 8：新建 team-poster 页

**Files:**
- Create: `frontend/src/pages/team-poster/index.config.ts`
- Create: `frontend/src/pages/team-poster/index.tsx`

- [ ] **Step 1: 创建页面配置**

```typescript
// frontend/src/pages/team-poster/index.config.ts
export default {
  navigationBarTitleText: '球队名片',
  navigationBarBackgroundColor: '#0f1010',
  navigationBarTextStyle: 'white' as const,
  backgroundColor: '#0f1010',
}
```

- [ ] **Step 2: 创建页面组件**

```typescript
// frontend/src/pages/team-poster/index.tsx
import { useState, useEffect } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { teamApi } from '../../api/team'
import { useAuthStore } from '../../store/auth'
import { px } from '../../utils/style'

const C = {
  bg: '#0f1010', surface: '#181c18', border: 'rgba(255,255,255,0.07)',
  text: '#e8ede8', text2: '#8a9e8a', primary: '#22c55e',
}

export default function TeamPosterPage() {
  const [posterUrl, setPosterUrl] = useState('')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const { currentTeamId } = useAuthStore()

  useEffect(() => {
    if (!currentTeamId) return
    teamApi.getPoster(currentTeamId)
      .then(res => setPosterUrl(res.posterUrl))
      .catch(e => Taro.showToast({ title: e.message || '生成失败', icon: 'none' }))
      .finally(() => setLoading(false))
  }, [currentTeamId])

  const saveToAlbum = async () => {
    if (!posterUrl) return
    setSaving(true)
    try {
      // 先下载到本地临时路径，再保存相册
      const { tempFilePath } = await Taro.downloadFile({ url: posterUrl })
      await Taro.saveImageToPhotosAlbum({ filePath: tempFilePath })
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '保存失败'
      // scope 未授权时引导用户开启
      if (msg.includes('auth deny') || msg.includes('authorize')) {
        Taro.showModal({
          title: '需要相册权限',
          content: '请在设置中开启相册访问权限',
          confirmText: '去设置',
          success: ({ confirm }) => {
            if (confirm) Taro.openSetting()
          },
        })
      } else {
        Taro.showToast({ title: msg, icon: 'none' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ padding: px(20), background: C.bg, minHeight: '100%' }}>
      {loading ? (
        <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: px(600) }}>
          <Text style={{ color: C.text2, fontSize: px(28) }}>生成中…</Text>
        </View>
      ) : posterUrl ? (
        <>
          <Image
            src={posterUrl}
            style={{
              width: '100%', borderRadius: px(16),
              border: `1px solid ${C.border}`, display: 'block',
              marginBottom: px(24),
            }}
            mode='widthFix'
          />
          <Button
            style={{
              background: C.primary, color: '#0f1010',
              borderRadius: px(14), border: 'none',
              fontSize: px(32), fontWeight: '700', padding: `${px(14)} 0`,
            }}
            loading={saving}
            onClick={saveToAlbum}
          >
            保存到相册
          </Button>
          <Text style={{ fontSize: px(24), color: C.text2, textAlign: 'center', display: 'block', marginTop: px(16) }}>
            保存后可分享到朋友圈或微信群
          </Text>
        </>
      ) : (
        <Text style={{ color: C.text2, fontSize: px(28), textAlign: 'center', display: 'block', marginTop: px(100) }}>
          生成失败，请返回重试
        </Text>
      )}
    </View>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/team-poster/
git commit -m "feat: add team-poster page with save-to-album"
```

---

## Task 9：注册页面路由 + my 页入口

**Files:**
- Modify: `frontend/src/app.config.ts`
- Modify: `frontend/src/pages/my/index.tsx`

- [ ] **Step 1: 在 app.config.ts 注册新页面**

在 `pages` 数组中添加 `'pages/team-poster/index'`（位置随意，放在 join-team 附近）：

```typescript
// 在现有 pages 数组中追加：
'pages/team-poster/index',
```

- [ ] **Step 2: 在 my 页添加「生成球队名片」入口**

在 `my/index.tsx` 中，找到球队管理相关的按钮区域（`editingTeam` 相关逻辑附近），在 CAPTAIN 或 ADMIN 角色下展示按钮。

在渲染函数中的球队管理卡片里，追加此按钮（放在「编辑球队信息」之后）：

```typescript
{(currentRole === 'CAPTAIN' || currentRole === 'ADMIN') && (
  <Button
    style={{
      background: 'rgba(34,197,94,0.1)',
      border: '1px solid rgba(34,197,94,0.3)',
      color: C.primary,
      borderRadius: px(12), fontSize: px(28),
      fontWeight: '600', padding: `${px(10)} 0`,
      marginTop: px(12),
    }}
    onClick={() => Taro.navigateTo({ url: '/pages/team-poster/index' })}
  >
    生成球队名片
  </Button>
)}
```

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npm run build:weapp 2>&1 | tail -10
# 期望：Compiled successfully
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app.config.ts frontend/src/pages/my/index.tsx
git commit -m "feat: register team-poster page and add entry in my page"
```

---

## Task 10：服务器中文字体确认（部署前置条件）

- [ ] **Step 1: 检查服务器是否有中文字体**

```bash
ssh root@8.152.193.56 "fc-list :lang=zh | head -5"
# 若无输出，执行安装：
ssh root@8.152.193.56 "apt-get install -y fonts-wqy-zenhei fontconfig && fc-cache -fv"
```

- [ ] **Step 2: 验证 Graphics2D 可渲染中文**

安装字体后重启服务即可生效，无需代码改动。

- [ ] **Step 3: 部署**

```bash
./scripts/deploy.sh backend
```

- [ ] **Step 4: 冒烟测试**

```bash
# 用真实 token（CAPTAIN 角色）调用接口
curl -s "https://ball.xiyanziran.top/api/v1/teams/{teamId}/poster" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "X-Team-Id: <TEAM_ID>"
# 期望：返回 { "code": 200, "data": { "posterUrl": "https://ball-mini.oss-..." } }
```

---

## 自检清单

- [ ] spec 要求的「清爽绿色风格」→ Task 4 renderPoster 中 GREEN = #2ecc71 ✅
- [ ] 海报包含：Logo / 队名 / 简介 / 队员数 / 小程序码 / 扫码文案 ✅
- [ ] 小程序码 scene 携带 teamId，page 指向 join-team ✅
- [ ] join-team 支持扫码直接申请（sceneTeamId 分支）✅
- [ ] join-team 保留邀请码手动输入（兼容旧流程）✅
- [ ] 海报 Redis 缓存 24h，避免重复调用微信 API ✅
- [ ] dev_mock 模式 WechatService 返回占位数据，本地开发可运行 ✅
- [ ] 权限：只有 ADMIN 及以上可生成海报，外部用户可访问 public 接口 ✅
