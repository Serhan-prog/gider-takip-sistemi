package com.inonu.takip.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BalanceRequest {
    private Long userId;
    private BigDecimal amount;
}