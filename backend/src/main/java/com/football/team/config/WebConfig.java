package com.football.team.config;

import com.football.team.security.JwtAuthFilter;
import com.football.team.security.TeamContextInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final TeamContextInterceptor teamContextInterceptor;
    private final JwtAuthFilter jwtAuthFilter;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(teamContextInterceptor)
            .addPathPatterns("/api/v1/**")
            .excludePathPatterns(
                "/api/v1/auth/**",
                "/api/v1/upload/avatar",
                "/api/v1/teams/*/public"
            );
    }

    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilterBean() {
        FilterRegistrationBean<JwtAuthFilter> bean = new FilterRegistrationBean<>(jwtAuthFilter);
        bean.addUrlPatterns("/api/v1/*");
        return bean;
    }
}
