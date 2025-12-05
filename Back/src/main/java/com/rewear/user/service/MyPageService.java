package com.rewear.user.service;

import com.rewear.user.entity.MyPageInfo;

public interface MyPageService {
    MyPageInfo getMyPageInfo(String userId);

    void updateAll(String userId, MyPageInfo updatedInfo);

    boolean checkPassword(String userId, String password);
    
    void updatePassword(String userId, String currentPassword, String newPassword);
}
