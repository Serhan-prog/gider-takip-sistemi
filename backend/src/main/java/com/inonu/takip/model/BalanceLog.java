package com.inonu.takip.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "balance_logs")
@Data
public class BalanceLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "admin_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User admin;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    private BigDecimal amountAdded;
    private String receiptPath;
    private LocalDateTime createdAt = LocalDateTime.now();
}