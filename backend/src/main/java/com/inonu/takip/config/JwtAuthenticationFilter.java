package com.inonu.takip.config;

import com.inonu.takip.service.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {


        if (request.getServletPath().equals("/error")) {
            filterChain.doFilter(request, response);
            return;
        }


        final String jwt = jwtService.getJwtFromCookies(request);
        final String username;


        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            username = jwtService.extractUsername(jwt);


            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);


                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));


                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException e) {


            if (request.getServletPath().startsWith("/uploads/")) {
                filterChain.doFilter(request, response);
            } else {
                setErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Oturum süresi doldu, lütfen tekrar giriş yapın.");
            }

        } catch (Exception e) {
            filterChain.doFilter(request, response);
        }
    }


    private void setErrorResponse(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json; charset=UTF-8");
        String jsonResponse = String.format("{\"message\": \"%s\", \"status\": %d}", message, status);
        response.getWriter().write(jsonResponse);
    }
}