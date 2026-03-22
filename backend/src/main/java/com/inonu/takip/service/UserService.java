package com.inonu.takip.service;

import com.inonu.takip.dto.TransactionHistoryDto;
import com.inonu.takip.dto.UserResponse;
import com.inonu.takip.repository.BalanceLogRepository;
import com.inonu.takip.repository.TransactionDetailRepository;
import com.inonu.takip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final BalanceLogRepository balanceLogRepository;
    private final TransactionDetailRepository transactionDetailRepository;

    public BigDecimal getBalance(Long userId) {
        BigDecimal balance = userRepository.calculateCurrentBalance(userId);
        return balance != null ? balance : BigDecimal.ZERO;
    }

    public List<UserResponse> getAllUsersWithBalance() {
        return userRepository.findAllByEnabledTrue().stream().map(user -> {
            UserResponse resp = new UserResponse();
            resp.setId(user.getId());
            resp.setUsername(user.getUsername());
            resp.setEmail(user.getEmail());
            resp.setRole(user.getRole().name());
            resp.setCurrentBalance(getBalance(user.getId()));
            return resp;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransactionHistoryDto> getUserHistory(Long userId) {
        List<TransactionHistoryDto> history = new ArrayList<>();
        balanceLogRepository.findByUserId(userId).forEach(log -> {
            history.add(new TransactionHistoryDto(
                    log.getCreatedAt(),
                    log.getAdmin() != null ? log.getAdmin().getUsername() : "Sistem",
                    log.getUser().getUsername(),
                    "Bakiye Yükleme",
                    "Sisteme bakiye eklendi",
                    log.getAmountAdded(),
                    "GELİR",
                    log.getReceiptPath()
            ));
        });

        transactionDetailRepository.findByUserId(userId).forEach(detail -> {
            history.add(new TransactionHistoryDto(
                    detail.getTransaction().getCreatedAt(),
                    detail.getTransaction().getAdmin() != null ? detail.getTransaction().getAdmin().getUsername() : "Sistem",
                    detail.getUser().getUsername(),
                    detail.getTransaction().getTransactionName(),
                    detail.getTransaction().getDescription(),
                    detail.getAmountPaid().negate(),
                    "GİDER",
                    detail.getTransaction().getReceiptPath()
            ));
        });

        history.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        return history;
    }

    @Transactional(readOnly = true)
    public List<TransactionHistoryDto> getAllReports() {
        List<TransactionHistoryDto> history = new ArrayList<>();
        balanceLogRepository.findAll().forEach(log -> {
            history.add(new TransactionHistoryDto(
                    log.getCreatedAt(),
                    log.getAdmin() != null ? log.getAdmin().getUsername() : "Sistem",
                    log.getUser() != null ? log.getUser().getUsername() : "Bilinmeyen",
                    "Bakiye Yükleme",
                    "Bakiye Yüklendi",
                    log.getAmountAdded(),
                    "GELİR",
                    log.getReceiptPath()
            ));
        });

        transactionDetailRepository.findAll().forEach(detail -> {
            history.add(new TransactionHistoryDto(
                    detail.getTransaction().getCreatedAt(),
                    detail.getTransaction().getAdmin() != null ? detail.getTransaction().getAdmin().getUsername() : "Sistem",
                    detail.getUser() != null ? detail.getUser().getUsername() : "Bilinmeyen",
                    detail.getTransaction().getTransactionName(),
                    detail.getTransaction().getDescription(),
                    detail.getAmountPaid().negate(),
                    "GİDER",
                    detail.getTransaction().getReceiptPath()
            ));
        });

        history.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        return history;
    }
}