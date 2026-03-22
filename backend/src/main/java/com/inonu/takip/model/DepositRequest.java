package com.inonu.takip.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "deposit_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepositRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private BigDecimal amount;

    private String status; // PENDING, APPROVED, REJECTED

    private String receiptPath;

    private LocalDateTime createdAt;
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {

        createdAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
    }
}