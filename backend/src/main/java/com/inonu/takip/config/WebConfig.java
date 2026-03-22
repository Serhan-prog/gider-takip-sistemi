package com.inonu.takip.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${upload.storage.path}")
    private String uploadStoragePath;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {

        registry.addMapping("/**")
                .allowedOrigins(frontendUrl)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path path = Paths.get(uploadStoragePath).toAbsolutePath().normalize();
        String location = path.toUri().toString();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location)
                .setCachePeriod(0)
                .resourceChain(true)
                .addResolver(new PathResourceResolver());

        System.out.println("🚀 [DEBUG] Statik Dosya Erişimi Aktif!");
        System.out.println("🚀 [DEBUG] İzin Verilen Origin: " + frontendUrl);
        System.out.println("🚀 [DEBUG] Fiziksel Konum: " + location);
    }
}