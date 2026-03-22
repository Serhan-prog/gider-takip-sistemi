package com.inonu.takip.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class TransactionRequest {
    private String transactionName;
    private String description;
    private BigDecimal totalAmount;
    private List<Long> userIds;
}