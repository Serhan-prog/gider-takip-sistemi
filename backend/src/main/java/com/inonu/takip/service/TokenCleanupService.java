package com.inonu.takip.service;

import com.inonu.takip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenCleanupService {

    private final UserRepository userRepository;

    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredTokens() {
        log.info("Süresi dolmuş şifre sıfırlama tokenları temizleniyor...");
        try {
            userRepository.clearExpiredTokens(LocalDateTime.now());
            log.info("Temizlik işlemi başarıyla tamamlandı.");
        } catch (Exception e) {
            log.error("Token temizliği sırasında bir hata oluştu: ", e);
        }
    }
}