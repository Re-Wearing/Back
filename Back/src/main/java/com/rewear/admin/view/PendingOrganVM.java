package com.rewear.admin.view;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingOrganVM {

    private Long id;
    private String orgName;            // 엔티티 필드명과 맞추세요 (없으면 name 등으로 교체)
    private String businessNo;         // 엔티티 필드명과 맞추세요 (bizNo 등일 수도)
    private String requesterUsername;  // 현재는 null 반환(요청자 관계/감사 붙이면 채움)
    private LocalDateTime requestedAt; // createdAt 등 실제 필드로 대체 가능
    private String phone;              // 사용자 연락처
    private String email;               // 사용자 이메일
    private String contactName;         // 사용자 이름

    public static PendingOrganVM of(Long id,
                                    String orgName,
                                    String businessNo,
                                    String requesterUsername,
                                    LocalDateTime requestedAt,
                                    String phone,
                                    String email,
                                    String contactName) {
        PendingOrganVM vm = new PendingOrganVM();
        vm.setId(id);
        vm.setOrgName(orgName);
        vm.setBusinessNo(businessNo);
        vm.setRequesterUsername(requesterUsername);
        vm.setRequestedAt(requestedAt);
        vm.setPhone(phone);
        vm.setEmail(email);
        vm.setContactName(contactName);
        return vm;
    }
}
