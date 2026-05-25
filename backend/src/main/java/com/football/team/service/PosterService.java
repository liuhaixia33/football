package com.football.team.service;

import com.football.team.dto.res.TeamPublicRes;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(PosterService.class);
    private static final int W = 750, H = 1080;
    private static final Color GREEN       = new Color(0x2e, 0xcc, 0x71);
    private static final Color GREEN_DARK  = new Color(0x27, 0xae, 0x60);
    private static final Color BG_TOP      = new Color(0xf8, 0xff, 0xfe);
    private static final Color BG_BOTTOM   = new Color(0xe8, 0xf8, 0xf0);
    private static final Color TEXT_MAIN   = new Color(0x1a, 0x1a, 0x1a);
    private static final Color TEXT_MUTED  = new Color(0x88, 0x88, 0x88);
    private static final Color DIVIDER     = new Color(0xd0, 0xea, 0xd8);

    public String generatePoster(Long teamId, boolean forceRefresh) {
        String cacheKey = "poster:url:" + teamId;
        if (forceRefresh) {
            redis.delete(cacheKey);
        } else {
            String cached = redis.opsForValue().get(cacheKey);
            if (cached != null) return cached;
        }

        TeamPublicRes info = teamService.getPublicInfo(teamId);
        byte[] miniCode = null;

        if (wechatService.isDevMock()) {
            log.info("dev_mock 模式，跳过小程序码生成 teamId={}", teamId);
        } else {
            try {
                // scene 上限 32 字符，用短 key: t=teamId&c=inviteCode
                String scene = "t=" + teamId + "&c=" + info.getInviteCode();
                miniCode = wechatService.generateMiniCode(scene, "pages/join-team/index");
                log.info("小程序码生成成功 teamId={} size={}", teamId, miniCode.length);
            } catch (Exception e) {
                log.warn("小程序码生成失败，将渲染占位符 teamId={}: {}", teamId, e.getMessage());
            }
        }

        byte[] logoBytes = fetchLogo(info.getLogoUrl());
        byte[] poster = renderPoster(info.getName(), info.getDescription(),
            info.getMemberCount(), logoBytes, miniCode);

        String key = "poster/" + teamId + "_" + System.currentTimeMillis() + ".png";
        String url = ossService.uploadBytes(poster, key);

        // 仅在小程序码成功生成时缓存（dev_mock 和失败时不缓存，下次可重试）
        if (miniCode != null) {
            redis.opsForValue().set(cacheKey, url, 24, TimeUnit.HOURS);
        }
        return url;
    }

    public String generatePoster(Long teamId) {
        return generatePoster(teamId, false);
    }

    /** 只生成小程序码图片并上传 OSS，缓存 24h；dev_mock 或失败时返回 null */
    public String generateJoinCode(Long teamId) {
        String cacheKey = "joincode:url:" + teamId;
        String cached = redis.opsForValue().get(cacheKey);
        if (cached != null) return cached;

        if (wechatService.isDevMock()) {
            log.info("dev_mock 模式，跳过小程序码生成 teamId={}", teamId);
            return null;
        }

        TeamPublicRes info = teamService.getPublicInfo(teamId);
        try {
            String scene = "t=" + teamId + "&c=" + info.getInviteCode();
            byte[] miniCode = wechatService.generateMiniCode(scene, "pages/join-team/index");
            String key = "joincode/" + teamId + ".png";
            String url = ossService.uploadBytes(miniCode, key);
            redis.opsForValue().set(cacheKey, url, 24, TimeUnit.HOURS);
            log.info("小程序码上传成功 teamId={} url={}", teamId, url);
            return url;
        } catch (Exception e) {
            log.warn("小程序码生成失败 teamId={}: {}", teamId, e.getMessage());
            return null;
        }
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
            String safeDesc = description == null ? "" : description;
            String desc = safeDesc.length() > 18 ? safeDesc.substring(0, 18) + "…" : safeDesc;
            g.setFont(new Font("SansSerif", Font.PLAIN, 28));
            g.setColor(TEXT_MUTED);
            g.drawString(desc, 50, 330);

            // 分隔线 1
            g.setColor(DIVIDER);
            g.fillRect(50, 360, W - 100, 2);

            // 队员数（左）+ 口号（右）
            g.setFont(new Font("SansSerif", Font.BOLD, 52));
            g.setColor(GREEN_DARK);
            g.drawString(String.valueOf(memberCount), 50, 430);
            g.setFont(new Font("SansSerif", Font.PLAIN, 24));
            g.setColor(TEXT_MUTED);
            g.drawString("活跃队员", 50, 470);

            // 口号居中于右侧区域 x=220..700
            g.setFont(new Font("SansSerif", Font.BOLD, 28));
            g.setColor(GREEN_DARK);
            FontMetrics fmSlogan = g.getFontMetrics();
            String slogan = "期待加入我们，一起碾压对手！";
            int sloganX = 220 + (480 - fmSlogan.stringWidth(slogan)) / 2;
            g.drawString(slogan, sloganX, 440);

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
