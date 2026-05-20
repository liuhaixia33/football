package com.football.team.exception;

import com.football.team.dto.res.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handle(BusinessException e) {
        log.warn("业务异常 [{}]: {}", e.getCode(), e.getMessage());
        return ResponseEntity.status(e.getCode())
            .body(ApiResponse.error(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handle(NoResourceFoundException e) {
        return ResponseEntity.status(404)
            .body(ApiResponse.error(404, "Not Found"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handle(Exception e) {
        log.error("服务器内部错误", e);
        return ResponseEntity.status(500)
            .body(ApiResponse.error(500, "服务器内部错误"));
    }
}
