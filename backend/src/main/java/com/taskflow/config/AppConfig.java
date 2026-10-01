package com.taskflow.config;

import java.time.Clock;
import org.springframework.boot.web.servlet.server.CookieSameSiteSupplier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Beans that aren't a class of ours: @Bean methods return objects Spring then manages and injects like any other.
 */
@Configuration
public class AppConfig {

  /** ONE clock for "today" and "now": services take it as a dependency, so tests can pass a fixed one. */
  @Bean
  Clock clock() {
    return Clock.systemDefaultZone();
  }

  /**
   * BCrypt with cost 12 (2^12 rounds, ~0.25 s): the seed hashes are "$2a$12$…". encode() salts every hash randomly;
   * matches() reads the salt and cost back from the stored hash. Spring Security's version of the old PasswordHasher.
   */
  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }

  /**
   * SameSite=Lax on EVERY cookie the embedded Tomcat writes (JSESSIONID, tf_theme, tf_lang): a second layer against
   * CSRF. The servlet era did this with context.xml's <CookieProcessor sameSiteCookies="lax"/>.
   */
  @Bean
  CookieSameSiteSupplier sameSiteLax() {
    return CookieSameSiteSupplier.ofLax();
  }
}
