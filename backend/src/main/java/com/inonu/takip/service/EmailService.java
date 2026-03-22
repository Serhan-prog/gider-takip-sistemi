package com.inonu.takip.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String to, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String subject = "Şifre Sıfırlama İsteği";
        String body = "Şifrenizi sıfırlamak için lütfen aşağıdaki bağlantıya tıklayın:\n\n" + resetLink;

        sendEmail(to, subject, body);
    }
}