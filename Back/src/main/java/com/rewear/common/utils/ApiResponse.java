package com.rewear.common.utils;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 모든 API 응답을 위한 공통 래퍼 클래스
 * @param <T> 응답 데이터의 타입
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // new ApiResponse() 직접 생성을 막음
public class ApiResponse<T> {

    private static final String STATUS_SUCCESS = "success";
    private static final String STATUS_FAIL = "fail";
    private static final String STATUS_ERROR = "error";

    private String status; // 'success', 'fail', 'error'
    private T data;        // (성공 시) 실제 응답 데이터
    private String message;  // (실패/오류 시) 응답 메시지

    // private 생성자들
    private ApiResponse(String status, T data, String message) {
        this.status = status;
        this.data = data;
        this.message = message;
    }

    /**
     * API 요청 성공 시 사용하는 정적 팩토리 메서드
     * @param data 본문에 포함될 데이터
     * @return ApiResponse 객체
     */
    public static <T> ApiResponse<T> ok(T data) {
        // 성공 시 'data'는 null일 수 있으나 (예: Void), status는 항상 success
        return new ApiResponse<>(STATUS_SUCCESS, data, null);
    }

    /**
     * API 요청 실패(비즈니스 로직 오류) 시 사용하는 정적 팩토리 메서드
     * (예: 유효성 검사 실패, 인증 코드 불일치)
     * @param message 실패 메시지
     * @return ApiResponse 객체
     */
    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(STATUS_FAIL, null, message);
    }

    /**
     * API 요청 오류(서버 오류) 시 사용하는 정적 팩토리 메서드
     * (예: 예측하지 못한 500 에러)
     * @param message 오류 메시지
     * @return ApiResponse 객체
     */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(STATUS_ERROR, null, message);
    }

    // (참고) AuthController에서는 ok()와 fail()만 사용했습니다.
}
