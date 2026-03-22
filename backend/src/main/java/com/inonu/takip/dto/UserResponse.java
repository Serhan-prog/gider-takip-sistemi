package com.inonu.takip.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class UserResponse {
    private Long id;
    private String username;

    private String email;

    private String role;
    private BigDecimal currentBalance;
}