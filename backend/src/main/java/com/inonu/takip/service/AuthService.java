package com.inonu.takip.service;

import com.inonu.takip.model.User;
import com.inonu.takip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public String register(User request) {
        if (userRepository.findByUsernameAndEnabledTrue(request.getUsername()).isPresent()) {
            throw new RuntimeException("Bu kullanıcı adı zaten alınmış!");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setEnabled(true);

        userRepository.save(user);
        return jwtService.generateToken(user);
    }

    public Map<String, Object> login(String username, String password) {
        System.out.println("Giriş isteği geldi: " + username);

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
        } catch (Exception e) {
            System.out.println("Doğrulama hatası: " + e.getMessage());
            throw new RuntimeException("Kullanıcı adı veya şifre hatalı!");
        }

        var user = userRepository.findByUsernameAndEnabledTrue(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı veya hesabı pasif!"));

        String jwtToken = jwtService.generateToken(user);

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwtToken);
        response.put("role", user.getRole());
        response.put("username", user.getUsername());
        response.put("userId", user.getId());

        System.out.println("Giriş başarılı: " + username + " [Role: " + user.getRole() + "]");
        return response;
    }



    @Transactional
    public void generateResetToken(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı."));


        String token = UUID.randomUUID().toString();


        user.setResetPasswordToken(token);
        user.setResetPasswordTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);
        emailService.sendPasswordResetEmail(user.getEmail(), token);

        System.out.println("Sıfırlama maili gönderildi: " + email);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {

        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new RuntimeException("Geçersiz veya süresi dolmuş token!"));


        if (user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Şifre sıfırlama linkinin süresi dolmuş!");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);

        userRepository.save(user);
        System.out.println("Şifre başarıyla güncellendi: " + user.getUsername());
    }
}