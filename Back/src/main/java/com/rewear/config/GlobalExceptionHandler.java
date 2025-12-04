package com.rewear.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.thymeleaf.exceptions.TemplateProcessingException;
import jakarta.servlet.http.HttpServletRequest;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(TemplateProcessingException.class)
    public ModelAndView handleTemplateProcessingException(
            TemplateProcessingException e, 
            HttpServletRequest request) {
        log.error("템플릿 처리 오류 발생 - URI: {}, 메시지: {}", 
                request.getRequestURI(), e.getMessage(), e);
        
        ModelAndView mav = new ModelAndView("error");
        mav.addObject("error", "페이지를 렌더링하는 중 오류가 발생했습니다.");
        mav.addObject("message", e.getMessage());
        return mav;
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public void handleNoResourceFoundException(
            NoResourceFoundException e, 
            HttpServletRequest request) {
        // favicon.ico 등 정적 리소스가 없을 때는 로그만 남기고 무시
        String uri = request.getRequestURI();
        if (uri != null && (uri.equals("/favicon.ico") || uri.endsWith(".ico"))) {
            // favicon 요청은 조용히 무시
            return;
        }
        log.warn("리소스를 찾을 수 없음 - URI: {}", uri);
    }

    @ExceptionHandler(Exception.class)
    public ModelAndView handleException(Exception e, HttpServletRequest request) {
        log.error("예상치 못한 오류 발생 - URI: {}, 메시지: {}", 
                request.getRequestURI(), e.getMessage(), e);
        
        ModelAndView mav = new ModelAndView("error");
        mav.addObject("error", "오류가 발생했습니다.");
        mav.addObject("message", e.getMessage());
        return mav;
    }
}

