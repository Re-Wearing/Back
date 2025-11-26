package com.rewear.signup;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignupForm {

    public enum RegistrationType { USER, ORGAN }

    // 공통
    @NotBlank(message = "아이디는 필수입니다.")
    @Size(min = 5, max = 12, message = "아이디는 5~12자 사이여야 합니다.")
    @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "아이디는 영문, 숫자, ., _, - 만 사용할 수 있습니다.")
    private String username;
    
    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 5, message = "비밀번호는 최소 5자 이상이어야 합니다.")
    private String password;
    
    @NotBlank(message = "이름은 필수입니다.")
    private String name;
    
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    // 선택/서버에서 정규화
    @Pattern(regexp = "^$|^01[0-9]{8,9}$", message = "올바른 휴대전화 번호 형식이 아닙니다. (예: 01012345678)")
    private String phone;
    
    @Size(max = 255, message = "주소는 최대 255자까지 입력 가능합니다.")
    private String address;
    
    @Size(max = 50, message = "닉네임은 최대 50자까지 입력 가능합니다.")
    private String nickname;

    // 가입 유형
    @NotNull
    private RegistrationType registrationType = RegistrationType.USER;

    // 기관 회원 전용
    @Pattern(regexp = "^[0-9]{10}$", message = "사업자번호는 숫자 10자리여야 합니다.")
    private String businessNo; // 숫자만(예: 1234567890)
    
    @Size(max = 100, message = "기관명은 최대 100자까지 입력 가능합니다.")
    private String orgName;    // 기관명

    public boolean isOrgan() {
        return registrationType == RegistrationType.ORGAN;
    }
}
