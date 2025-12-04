package com.rewear.user.entity;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MyPageInfo {
    private String name;
    private String nickname;
    private String email;
    private String phone;
    private String address;
}

