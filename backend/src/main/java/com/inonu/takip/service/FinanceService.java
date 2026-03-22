package com.inonu.takip.service;

import com.inonu.takip.dto.BalanceRequest;
import com.inonu.takip.dto.TransactionRequest;
import com.inonu.takip.model.*;
import com.inonu.takip.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class FinanceService {
    private final TransactionRepository transactionRepository;
    private final TransactionDetailRepository detailRepository;
    private final BalanceLogRepository balanceLogRepository;
    private final UserRepository userRepository;
    private final DepositRequestRepository depositRequestRepository;

    @Transactional
    public void createSplitTransaction(TransactionRequest request, User admin) {
        Transaction transaction = new Transaction();
        transaction.setTransactionName(request.getTransactionName());
        transaction.setDescription(request.getDescription());
        transaction.setTotalAmount(request.getTotalAmount());
        transaction.setSplitCount(request.getUserIds().size());
        transaction.setAdmin(admin);
        transactionRepository.save(transaction);

        BigDecimal perPerson = request.getTotalAmount()
                .divide(BigDecimal.valueOf(request.getUserIds().size()), 2, RoundingMode.HALF_UP);

        for (Long userId : request.getUserIds()) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + userId));

            TransactionDetail detail = new TransactionDetail();
            detail.setTransaction(transaction);
            detail.setUser(user);
            detail.setAmountPaid(perPerson);
            detailRepository.save(detail);
        }
    }

    @Transactional
    public void createSplitTransactionWithReceipt(
            String transactionName,
            String description,
            BigDecimal totalAmount,
            List<Long> userIds,
            User currentUser,
            String receiptPath
    ) {
        if (userIds == null || userIds.isEmpty()) {
            throw new RuntimeException("En az 1 personel seçmelisiniz.");
        }

        Transaction transaction = new Transaction();
        transaction.setTransactionName(transactionName);
        transaction.setDescription(description);
        transaction.setTotalAmount(totalAmount);
        transaction.setSplitCount(userIds.size());


        transaction.setAdmin(currentUser);


        transaction.setReceiptPath(receiptPath);

        transactionRepository.save(transaction);

        BigDecimal perPerson = totalAmount
                .divide(BigDecimal.valueOf(userIds.size()), 2, RoundingMode.HALF_UP);

        for (Long userId : userIds) {
            User u = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + userId));

            TransactionDetail detail = new TransactionDetail();
            detail.setTransaction(transaction);
            detail.setUser(u);
            detail.setAmountPaid(perPerson);
            detailRepository.save(detail);
        }
    }

    @Transactional
    public void addBalance(BalanceRequest request, User admin) {
        User user = userRepository.findById(request.getUserId()).orElseThrow();

        BalanceLog log = new BalanceLog();
        log.setAdmin(admin);
        log.setUser(user);
        log.setAmountAdded(request.getAmount());
        balanceLogRepository.save(log);
    }

    public List<TransactionDetail> getUserHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        return detailRepository.findByUserIdOrderByTransactionCreatedAtDesc(userId);
    }

    @Transactional
    public void createDepositRequest(User user, BigDecimal amount, String filePath) {
        DepositRequest request = DepositRequest.builder()
                .user(user)
                .amount(amount)
                .receiptPath(filePath)
                .status("PENDING")
                .build();
        depositRequestRepository.save(request);
    }

    // ✅ Dosya Doğrulama Metodu
    public void validateFile(MultipartFile file) {
        long maxSize = 5 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new RuntimeException("Dosya boyutu çok büyük! Maksimum 5MB yükleyebilirsiniz.");
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null || fileName.isEmpty()) {
            throw new RuntimeException("Geçersiz dosya!");
        }

        String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        List<String> allowedExtensions = Arrays.asList("jpg", "jpeg", "png", "pdf");

        if (!allowedExtensions.contains(extension)) {
            throw new RuntimeException("Sadece JPG, PNG veya PDF formatında dekont yükleyebilirsiniz.");
        }
    }

    @Transactional
    public void approveDepositRequest(Long requestId, User admin) {
        DepositRequest request = depositRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Bakiye talebi bulunamadı."));

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Bu talep zaten işlenmiş (Onaylanmış veya Reddedilmiş).");
        }

        request.setStatus("APPROVED");
        request.setProcessedAt(LocalDateTime.now());
        depositRequestRepository.save(request);

        BalanceLog log = new BalanceLog();
        log.setAdmin(admin);
        log.setUser(request.getUser());
        log.setAmountAdded(request.getAmount());
        log.setReceiptPath(request.getReceiptPath());
        balanceLogRepository.save(log);
    }

    @Transactional
    public void rejectDepositRequest(Long requestId) {
        DepositRequest request = depositRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Bakiye talebi bulunamadı."));

        request.setStatus("REJECTED");
        request.setProcessedAt(LocalDateTime.now());
        depositRequestRepository.save(request);
    }
}
