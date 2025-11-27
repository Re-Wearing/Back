package com.rewear.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.ModelAndView;
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

