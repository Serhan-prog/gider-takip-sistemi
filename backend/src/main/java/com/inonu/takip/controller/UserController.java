package com.inonu.takip.controller;

import com.inonu.takip.dto.TransactionHistoryDto;
import com.inonu.takip.dto.UserResponse;
import com.inonu.takip.model.User;
import com.inonu.takip.model.Role;
import com.inonu.takip.service.AuthService;
import com.inonu.takip.service.UserService;
import com.inonu.takip.service.JwtService;
import com.inonu.takip.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class UserController {

    private final UserService userService;
    private final AuthService authService;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    public static class ForgotPasswordRequest {
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        private String token;
        private String newPassword;
    }

    // --- AUTH (GİRİŞ/ÇIKIŞ) ---

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Map<String, Object> authData = authService.login(loginRequest.getUsername(), loginRequest.getPassword());
        UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());
        ResponseCookie jwtCookie = jwtService.generateJwtCookie(userDetails);
        authData.remove("token");

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(authData);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie cookie = jwtService.getCleanJwtCookie();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Collections.singletonMap("message", "Başarıyla çıkış yapıldı."));
    }

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> register(@RequestBody User user) {
        authService.register(user);
        return ResponseEntity.ok(Collections.singletonMap("message", "Yeni personel başarıyla oluşturuldu."));
    }

    // --- PASSWORD RESET ---

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            authService.generateResetToken(request.getEmail());
            return ResponseEntity.ok(Collections.singletonMap("message", "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Collections.singletonMap("message", "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // --- PROFILE MANAGEMENT ---

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Oturum bulunamadı."));
        }

        User user = userOpt.get();
        UserResponse resp = new UserResponse();
        resp.setId(user.getId());
        resp.setUsername(user.getUsername());
        resp.setEmail(user.getEmail());
        resp.setRole(user.getRole().name());
        resp.setCurrentBalance(userService.getBalance(user.getId()));

        return ResponseEntity.ok(resp);
    }

    @PutMapping("/profile-update")
    @Transactional
    public ResponseEntity<?> updateMyProfile(@RequestBody Map<String, Object> updates) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(currentUsername);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Kullanıcı bulunamadı."));
        }

        User user = userOpt.get();
        try {
            if (updates.containsKey("username")) {
                user.setUsername(updates.get("username").toString());
            }
            if (updates.containsKey("email")) {
                user.setEmail(updates.get("email").toString());
            }
            if (updates.containsKey("password")) {
                String pass = updates.get("password").toString().trim();
                if (!pass.isEmpty()) {
                    user.setPassword(passwordEncoder.encode(pass));
                }
            }
            userRepository.save(user);
            return ResponseEntity.ok(Collections.singletonMap("message", "Profiliniz başarıyla güncellendi."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Güncelleme hatası: " + e.getMessage()));
        }
    }

    // --- LİSTELEME VE RAPORLAMA ---

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsersWithBalance());
    }

    @GetMapping("/{id}/balance")
    public ResponseEntity<BigDecimal> getBalance(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getBalance(id));
    }

    @GetMapping("/{userId}/history")
    public ResponseEntity<List<TransactionHistoryDto>> getHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserHistory(userId));
    }

    // ✅ GÜNCELLEME: Personel de raporları görebilsin diye hasRole('ADMIN') kaldırıldı veya hasAnyRole eklendi
    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONEL')")
    public ResponseEntity<List<TransactionHistoryDto>> getAllReports() {
        return ResponseEntity.ok(userService.getAllReports());
    }

    // ✅ YENİ: Dashboard KPI Kartları için genel istatistik özeti
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONEL')")
    public ResponseEntity<?> getSystemSummary() {
        List<TransactionHistoryDto> allReports = userService.getAllReports();

        BigDecimal totalIncome = allReports.stream()
                .filter(t -> "INCOME".equals(t.getType()))
                .map(TransactionHistoryDto::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = allReports.stream()
                .filter(t -> "EXPENSE".equals(t.getType()))
                .map(TransactionHistoryDto::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> summary = new HashMap<>();
        summary.put("currentBalance", totalIncome.subtract(totalExpense));
        summary.put("totalIncome", totalIncome);
        summary.put("totalExpense", totalExpense);
        summary.put("transactionCount", allReports.size());

        return ResponseEntity.ok(summary);
    }

    // --- GÜNCELLEME (ADMIN) ---

    @PutMapping("/{id}")
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Optional<User> userOpt = userRepository.findById(id);

        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        try {
            if (updates.containsKey("username")) {
                user.setUsername(updates.get("username").toString());
            }
            if (updates.containsKey("email")) {
                user.setEmail(updates.get("email").toString());
            }
            if (updates.containsKey("role")) {
                String roleStr = updates.get("role").toString().toUpperCase();
                user.setRole(Role.valueOf(roleStr));
            }
            if (updates.containsKey("password")) {
                String pass = updates.get("password").toString().trim();
                if (!pass.isEmpty()) {
                    user.setPassword(passwordEncoder.encode(pass));
                }
            }
            userRepository.save(user);
            return ResponseEntity.ok(Collections.singletonMap("message", "Kullanıcı başarıyla güncellendi."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Hata: " + e.getMessage()));
        }
    }

    // --- SİLME ---

    @DeleteMapping("/{id}")
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setEnabled(false);
            userRepository.save(user);
            return ResponseEntity.ok(Collections.singletonMap("message", "Personel pasif duruma getirildi."));
        }
        return ResponseEntity.status(404).body(Collections.singletonMap("message", "Kullanıcı bulunamadı."));
    }
}