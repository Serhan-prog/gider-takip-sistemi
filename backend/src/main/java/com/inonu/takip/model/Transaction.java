package com.inonu.takip.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String transactionName;
    private String description;
    private BigDecimal totalAmount;
    private String type;
    private Integer splitCount;


    private String receiptPath;

    @ManyToOne
    @JoinColumn(name = "admin_id")
    private User admin;

    @ManyToOne
    @JoinColumn(name = "target_user_id")
    private User targetUser;

    private LocalDateTime createdAt = LocalDateTime.now();
}
