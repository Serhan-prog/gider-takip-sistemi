package com.inonu.takip.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.function.Function;

@Service
public class JwtService {


    @Value("${application.security.jwt.cookie-name:ddo_token}")
    private String cookieName;


    @Value("${application.security.jwt.cookie-secure:false}")
    private boolean cookieSecure;

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @Value("${application.security.jwt.expiration}")
    private long jwtExpiration;


    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }


    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(new HashMap<>())
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }


    public ResponseCookie generateJwtCookie(UserDetails userDetails) {
        String jwt = generateToken(userDetails);
        return ResponseCookie.from(cookieName, jwt)
                .path("/")
                .maxAge(jwtExpiration / 1000)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .build();
    }


    public String getJwtFromCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookieName.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    public ResponseCookie getCleanJwtCookie() {
        return ResponseCookie.from(cookieName, "")
                .path("/")
                .maxAge(0)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .build();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claimsResolver.apply(claims);
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}