package com.rewear.admin.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Admin {

    @Id
    @Column(nullable = false, unique = true, length = 12)
    private String username;

    @Column(nullable = false)
    private String password;
}
