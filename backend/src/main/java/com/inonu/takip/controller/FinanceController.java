package com.inonu.takip.controller;

import com.inonu.takip.dto.BalanceRequest;
import com.inonu.takip.dto.TransactionRequest;
import com.inonu.takip.model.DepositRequest;
import com.inonu.takip.model.Transaction;
import com.inonu.takip.model.TransactionDetail;
import com.inonu.takip.model.User;
import com.inonu.takip.repository.DepositRequestRepository;
import com.inonu.takip.repository.TransactionRepository;
import com.inonu.takip.service.FinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;
    private final TransactionRepository transactionRepository;
    private final DepositRequestRepository depositRequestRepository;

    @Value("${upload.storage.path}")
    private String uploadStoragePath;

    @GetMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN','PERSONEL')")
    public ResponseEntity<List<Transaction>> getAllBulkTransactions() {
        return ResponseEntity.ok(transactionRepository.findAllByOrderByCreatedAtDesc());
    }


    @PostMapping("/split")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> splitExpense(
            @RequestParam("transactionName") String transactionName,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("totalAmount") BigDecimal totalAmount,
            @RequestParam("userIds") List<Long> userIds,
            @RequestParam(value = "receipt", required = false) MultipartFile file,
            @AuthenticationPrincipal User currentAdmin
    ) throws IOException {

        String dbPath = null;


        if (file != null && !file.isEmpty()) {
            financeService.validateFile(file);

            Path uploadPath = Paths.get(uploadStoragePath, "receipts").toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFileName = file.getOriginalFilename();
            String extension = StringUtils.getFilenameExtension(originalFileName);
            String fileName = UUID.randomUUID().toString() + (extension != null ? "." + extension : "");
            Path filePath = uploadPath.resolve(fileName);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            dbPath = "uploads/receipts/" + fileName;
        }


        financeService.createSplitTransactionWithReceipt(
                transactionName,
                description,
                totalAmount,
                userIds,
                currentAdmin,
                dbPath
        );

        return ResponseEntity.ok("Harcama başarıyla bölüştürüldü.");
    }

    @PostMapping("/add-balance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> addBalance(
            @RequestBody BalanceRequest request,
            @AuthenticationPrincipal User currentAdmin
    ) {
        financeService.addBalance(request, currentAdmin);
        return ResponseEntity.ok("Bakiye başarıyla yüklendi.");
    }

    @PostMapping("/split-personel")
    @PreAuthorize("hasRole('PERSONEL')")
    public ResponseEntity<String> splitExpenseByPersonel(
            @RequestParam("transactionName") String transactionName,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("totalAmount") BigDecimal totalAmount,
            @RequestParam("userIds") List<Long> userIds,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser
    ) throws IOException {

        financeService.validateFile(file);

        Path uploadPath = Paths.get(uploadStoragePath, "receipts").toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFileName = file.getOriginalFilename();
        String extension = StringUtils.getFilenameExtension(originalFileName);
        String fileName = UUID.randomUUID().toString() + (extension != null ? "." + extension : "");
        Path filePath = uploadPath.resolve(fileName);

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        String dbPath = "uploads/receipts/" + fileName;

        financeService.createSplitTransactionWithReceipt(
                transactionName,
                description,
                totalAmount,
                userIds,
                currentUser,
                dbPath
        );

        return ResponseEntity.ok("Harcama kaydedildi ve fiş yüklendi.");
    }

    @PostMapping("/request-balance")
    @PreAuthorize("hasRole('PERSONEL')")
    public ResponseEntity<String> requestBalance(
            @RequestParam("amount") BigDecimal amount,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser
    ) throws IOException {

        financeService.validateFile(file);

        Path uploadPath = Paths.get(uploadStoragePath, "receipts").toAbsolutePath().normalize();

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFileName = file.getOriginalFilename();
        String extension = StringUtils.getFilenameExtension(originalFileName);
        String fileName = UUID.randomUUID().toString() + (extension != null ? "." + extension : "");
        Path filePath = uploadPath.resolve(fileName);

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        String dbPath = "uploads/receipts/" + fileName;
        financeService.createDepositRequest(currentUser, amount, dbPath);

        System.out.println("DEBUG: Güvenli dosya kaydedildi: " + dbPath);

        return ResponseEntity.ok("Bakiye talebiniz ve dekontunuz başarıyla alındı. Admin onayı bekleniyor.");
    }

    @GetMapping("/pending-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DepositRequest>> getPendingRequests() {
        return ResponseEntity.ok(depositRequestRepository.findByStatus("PENDING"));
    }

    @PostMapping("/approve-request/{requestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> approveRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal User currentAdmin
    ) {
        financeService.approveDepositRequest(requestId, currentAdmin);
        return ResponseEntity.ok("Talep onaylandı ve bakiye kullanıcıya eklendi.");
    }

    @PostMapping("/reject-request/{requestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> rejectRequest(@PathVariable Long requestId) {
        financeService.rejectDepositRequest(requestId);
        return ResponseEntity.ok("Bakiye talebi reddedildi.");
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Transaction>> getAllHistory() {
        return ResponseEntity.ok(transactionRepository.findAll(Sort.by(Sort.Direction.DESC, "id")));
    }

    @GetMapping("/user-history/{userId}")
    public ResponseEntity<List<TransactionDetail>> getUserHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(financeService.getUserHistory(userId));
    }
}