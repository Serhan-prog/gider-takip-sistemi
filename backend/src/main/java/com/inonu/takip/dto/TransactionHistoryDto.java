package com.inonu.takip.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransactionHistoryDto {
    private LocalDateTime date;
    private String username;
    private String targetUsername;
    private String transactionName;
    private String description;
    private BigDecimal amount;
    private String type;
    private String receiptPath;
}