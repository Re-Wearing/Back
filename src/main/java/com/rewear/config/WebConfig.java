package com.rewear.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private final NotificationModelAttribute notificationModelAttribute;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 절대 경로로 변환
        String absolutePath = uploadDir;
        if (!absolutePath.startsWith("/") && !absolutePath.matches("^[A-Za-z]:.*")) {
            // 상대 경로인 경우 절대 경로로 변환
            try {
                absolutePath = new java.io.File(uploadDir).getAbsolutePath();
            } catch (Exception e) {
                // 변환 실패 시 원래 경로 사용
            }
        }
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + absolutePath + "/");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(notificationModelAttribute)
                .addPathPatterns("/**")
                .excludePathPatterns("/api/**", "/static/**", "/css/**", "/js/**", "/images/**", "/uploads/**");
    }
}
