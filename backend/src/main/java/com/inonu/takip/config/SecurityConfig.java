package com.inonu.takip.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
                .requestMatchers("/favicon.ico");
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                "/api/users/login",
                                "/api/users/forgot-password",
                                "/api/users/reset-password",
                                "/error"
                        ).permitAll()


                        .requestMatchers("/api/users/register").hasRole("ADMIN")
                        .requestMatchers("/api/finance/add-balance/**").hasRole("ADMIN")
                        .requestMatchers("/api/finance/pending-requests").hasRole("ADMIN")
                        .requestMatchers("/api/finance/approve-request/**").hasRole("ADMIN")
                        .requestMatchers("/api/finance/reject-request/**").hasRole("ADMIN")

                        .requestMatchers("/api/finance/split/**").hasAnyRole("ADMIN", "PERSONEL")
                        .requestMatchers("/api/finance/history").hasAnyRole("ADMIN", "PERSONEL")
                        .requestMatchers("/api/finance/summary").hasAnyRole("ADMIN", "PERSONEL")
                        .requestMatchers("/api/finance/transactions").hasAnyRole("ADMIN", "PERSONEL")
                        .requestMatchers("/api/finance/all-transactions").hasAnyRole("ADMIN", "PERSONEL")

                        .requestMatchers("/api/finance/request-balance").hasRole("PERSONEL")
                        .requestMatchers("/api/finance/split-personel").hasRole("PERSONEL")

                        .requestMatchers("/uploads/**").authenticated()
                        .requestMatchers("/api/users/reports").authenticated()
                        .requestMatchers("/api/users/**").authenticated()
                        .requestMatchers("/api/finance/user-history/**").authenticated()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With", "Cookie"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}