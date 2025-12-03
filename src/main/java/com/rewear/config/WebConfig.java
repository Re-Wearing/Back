package com.rewear.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private final NotificationModelAttribute notificationModelAttribute;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 디렉토리가 없으면 생성
        File uploadDirFile = new File(uploadDir);
        if (!uploadDirFile.exists()) {
            uploadDirFile.mkdirs();
            log.info("업로드 디렉토리 생성: {}", uploadDirFile.getAbsolutePath());
        }
        
        // 절대 경로로 변환 (프로젝트 루트 기준)
        String absolutePath = uploadDirFile.getAbsolutePath();
        
        // Windows 경로 구분자를 /로 변환 (file: 프로토콜은 / 사용)
        absolutePath = absolutePath.replace("\\", "/");
        if (!absolutePath.endsWith("/")) {
            absolutePath += "/";
        }
        
        // Windows 드라이브 경로 처리
        String resourceLocation;
        if (absolutePath.matches("^[A-Z]:/.*")) {
            // Windows: file:///C:/path/ 형식 사용
            resourceLocation = "file:///" + absolutePath;
        } else {
            // Unix/Linux: file:/path/ 형식 사용
            resourceLocation = "file:" + absolutePath;
        }
        
        log.info("이미지 리소스 핸들러 설정: /uploads/** -> {}", resourceLocation);
        log.info("업로드 디렉토리 절대 경로: {}", uploadDirFile.getAbsolutePath());
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation)
                .setCachePeriod(0); // 캐시 비활성화 (개발 시 디버깅 용이)
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(notificationModelAttribute)
                .addPathPatterns("/**")
                .excludePathPatterns("/api/**", "/static/**", "/css/**", "/js/**", "/images/**", "/uploads/**");
    }
}
