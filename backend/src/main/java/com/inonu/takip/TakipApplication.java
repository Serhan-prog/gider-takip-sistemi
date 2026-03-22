package com.inonu.takip;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class TakipApplication {

	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("Europe/Istanbul"));
	}

	public static void main(String[] args) {
		SpringApplication.run(TakipApplication.class, args);
	}

}