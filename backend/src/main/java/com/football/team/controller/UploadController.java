package com.football.team.controller;

import com.football.team.dto.res.ApiResponse;
import com.football.team.entity.User;
import com.football.team.exception.BusinessException;
import com.football.team.service.ContentSafetyService;
import com.football.team.service.OssService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    private final OssService ossService;
    private final ContentSafetyService contentSafetyService;

    @PostMapping("/avatar")
    public ApiResponse<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest req) {
        User user = (User) req.getAttribute("currentUser");
        if (file.isEmpty()) throw BusinessException.badRequest("文件不能为空");
        try {
            byte[] bytes = file.getBytes();
            contentSafetyService.checkImage(bytes);
            Long userId = user != null ? user.getId() : null;
            String url = ossService.uploadAvatar(file, userId);
            return ApiResponse.ok(Map.of("url", url));
        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            throw BusinessException.badRequest("上传失败");
        }
    }
}
