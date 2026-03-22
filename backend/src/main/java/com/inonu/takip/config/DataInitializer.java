package com.inonu.takip.config;

import com.inonu.takip.model.User;
import com.inonu.takip.model.Role;
import com.inonu.takip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder; // PasswordEncoder eklendi
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String adminUsername = "Admin";
        String adminEmail = "Admin@gmail.com";

        if (userRepository.findByUsername(adminUsername).isEmpty()) {
            User admin = new User();
            admin.setUsername(adminUsername);
            admin.setEmail(adminEmail);


            String rawPassword = "1";
            admin.setPassword(passwordEncoder.encode(rawPassword));

            admin.setRole(Role.ADMIN);
            admin.setEnabled(true);

            userRepository.save(admin);
            log.info("🚀 Başlangıç verisi: ADMIN kullanıcısı ({}) başarıyla oluşturuldu. (Şifre otomatik hash'lendi)", adminUsername);
        } else {
            log.info("ℹ️ Sistem kontrolü: Varsayılan yönetici hesabı zaten aktif.");
        }
    }
}