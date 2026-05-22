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

    public String generatePoster(Long teamId) {
        String cacheKey = "poster:url:" + teamId;
        String cached = redis.opsForValue().get(cacheKey);
        if (cached != null) return cached;

        TeamPublicRes info = teamService.getPublicInfo(teamId);
        byte[] miniCode;
        try {
            miniCode = wechatService.generateMiniCode("teamId=" + teamId, "pages/join-team/index");
        } catch (Exception e) {
            log.warn("小程序码生成失败，将渲染占位符 teamId={}: {}", teamId, e.getMessage());
            miniCode = null;
        }
        byte[] logoBytes = fetchLogo(info.getLogoUrl());

        byte[] poster = renderPoster(info.getName(), info.getDescription(),
            info.getMemberCount(), logoBytes, miniCode);

        String key = "poster/" + teamId + "_" + System.currentTimeMillis() + ".png";
        String url = ossService.uploadBytes(poster, key);

        // 只在小程序码成功生成时才缓存，失败时不缓存以便下次重试
        if (miniCode != null) {
            redis.opsForValue().set(cacheKey, url, 24, TimeUnit.HOURS);
        }
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
            String safeDesc = description == null ? "" : description;
            String desc = safeDesc.length() > 18 ? safeDesc.substring(0, 18) + "…" : safeDesc;
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
