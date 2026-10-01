package com.taskflow.config;

import com.taskflow.exception.handler.ApiErrorWriter;
import com.taskflow.security.TaskflowAuthenticationProvider;
import com.taskflow.security.filter.AccountStateFilter;
import com.taskflow.security.handler.AuditLogoutHandler;
import com.taskflow.security.handler.JsonAccessDeniedHandler;
import com.taskflow.security.handler.JsonAuthenticationEntryPoint;
import com.taskflow.security.handler.LoginEntryPoint;
import com.taskflow.security.handler.LoginFailureHandler;
import com.taskflow.security.handler.LoginSuccessHandler;
import com.taskflow.security.handler.PageAccessDeniedHandler;
import com.taskflow.security.handler.PageLogoutSuccessHandler;
import com.taskflow.service.AccountRegistry;
import com.taskflow.service.AuditService;
import com.taskflow.web.support.Flash;
import com.taskflow.web.support.Messages;
import jakarta.servlet.DispatcherType;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.DelegatingSecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfAuthenticationStrategy;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.header.writers.CrossOriginOpenerPolicyHeaderWriter.CrossOriginOpenerPolicy;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Spring Security replaces the servlet era's hand-written filters (Authentication-, Authorization-, Csrf-,
 * CsrfDoubleSubmit-, Cors-, SecurityHeaders-Filter). Two SecurityFilterChains, tried in @Order; the first whose
 * securityMatcher matches the request handles it alone:
 *
 *   1. apiChain  /api/**   JSON only: 401/403 as error JSON (never a redirect), CSRF = double-submit cookie
 *                          (XSRF-TOKEN cookie → X-XSRF-TOKEN header, what Axios sends), CORS for the Vite dev server
 *   2. pageChain  the rest  the JSP Admin Portal: form login, a login PAGE for anonymous users, CSRF = a token in
 *                          the session and a hidden _csrf field in every form, /admin/** for ADMINs only
 *
 * Both chains store the SecurityContext in the SAME HttpSession: one login (JSESSIONID) for the portal and the SPA.
 * @EnableMethodSecurity turns on @PreAuthorize: services check the role themselves (defence in depth).
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  // ── Shared pieces ─────────────────────────────────────────────────────────────────────────────────────────

  /** ONE way to authenticate: AuthService (throttle, BCrypt, audit) behind Spring's AuthenticationProvider API. */
  @Bean
  AuthenticationManager authenticationManager(TaskflowAuthenticationProvider provider) {
    return new ProviderManager(provider);
  }

  /** Where the logged-in user lives between requests: the session (and a request attribute for error dispatches). */
  @Bean
  SecurityContextRepository securityContextRepository() {
    return new DelegatingSecurityContextRepository(
        new RequestAttributeSecurityContextRepository(), new HttpSessionSecurityContextRepository());
  }

  /**
   * The SPA's CSRF token: cookie XSRF-TOKEN (NOT HttpOnly: JavaScript must read it), header X-XSRF-TOKEN, Path=/ so
   * the React app's pages see it too. A cross-site page can make the browser SEND the cookie but can't READ it, so it
   * can't copy it into the header.
   */
  @Bean
  CookieCsrfTokenRepository apiCsrfTokenRepository(TaskflowProperties properties) {
    CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
    repository.setCookieCustomizer(cookie -> cookie.path("/").sameSite("Lax").secure(properties.secureCookies()));
    return repository;
  }

  /** The PLAIN token (Spring Security 6's default XORs it per request, which a cookie-reading SPA can't reproduce). */
  @Bean
  CsrfTokenRequestAttributeHandler apiCsrfRequestHandler() {
    return new CsrfTokenRequestAttributeHandler();
  }

  /**
   * What the JSON login does after a successful authentication (form login does the same by itself):
   * a NEW session id (session fixation) and a NEW CSRF token (a token from before the login isn't reused after it).
   */
  @Bean
  SessionAuthenticationStrategy apiSessionAuthenticationStrategy(CookieCsrfTokenRepository apiCsrfTokenRepository,
                                                                 CsrfTokenRequestAttributeHandler apiCsrfRequestHandler) {
    CsrfAuthenticationStrategy csrf = new CsrfAuthenticationStrategy(apiCsrfTokenRepository);
    csrf.setRequestHandler(apiCsrfRequestHandler);
    return new CompositeSessionAuthenticationStrategy(List.of(new ChangeSessionIdAuthenticationStrategy(), csrf));
  }

  /** CORS: which OTHER origins' JavaScript may read /api responses sent with the user's cookies (the Vite dev server). */
  @Bean
  CorsConfigurationSource corsConfigurationSource(TaskflowProperties properties) {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(properties.cors().allowedOrigins());
    config.setAllowCredentials(true);                                  // cookies: never together with "*"
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
    config.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN", "X-Request-Id"));
    config.setExposedHeaders(List.of("Location", "X-Request-Id", "Retry-After"));
    config.setMaxAge(600L);                                            // the browser caches a preflight for 10 minutes
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
  }

  // ── 1. The JSON API ───────────────────────────────────────────────────────────────────────────────────────

  @Bean
  @Order(1)
  SecurityFilterChain apiChain(HttpSecurity http,
                               CookieCsrfTokenRepository apiCsrfTokenRepository,
                               CsrfTokenRequestAttributeHandler apiCsrfRequestHandler,
                               SecurityContextRepository securityContextRepository,
                               JsonAuthenticationEntryPoint entryPoint,
                               JsonAccessDeniedHandler accessDeniedHandler,
                               AuditLogoutHandler auditLogoutHandler,
                               AccountRegistry accounts, AuditService audit, Flash flash, Messages messages,
                               ApiErrorWriter errors) throws Exception {
    http
        .securityMatcher("/api/**")
        .cors(Customizer.withDefaults())
        .csrf(csrf -> csrf
            .csrfTokenRepository(apiCsrfTokenRepository)
            .csrfTokenRequestHandler(apiCsrfRequestHandler))
        .securityContext(context -> context.securityContextRepository(securityContextRepository))
        .authorizeHttpRequests(auth -> auth
            .dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()  // SSE / errors: already authorized
            .requestMatchers("/api/auth/**").permitAll()                // csrf, login, me (me answers 401 itself)
            .anyRequest().authenticated())
        .exceptionHandling(exceptions -> exceptions
            .authenticationEntryPoint(entryPoint)                       // 401 UNAUTHENTICATED (JSON), never a redirect
            .accessDeniedHandler(accessDeniedHandler))                  // 403 CSRF_TOKEN_INVALID / FORBIDDEN (JSON)
        .logout(logout -> logout
            .logoutUrl("/api/auth/logout")                              // POST, CSRF-protected
            .addLogoutHandler(auditLogoutHandler)
            .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
        .requestCache(cache -> cache.disable())                         // never "remember where you wanted to go" for XHR
        .formLogin(form -> form.disable())
        .httpBasic(basic -> basic.disable())
        .addFilterBefore(new AccountStateFilter(accounts, audit, flash, messages, errors, securityContextRepository),
            AuthorizationFilter.class)
        .headers(this::securityHeaders);
    return http.build();
  }

  // ── 2. The JSP Admin Portal ───────────────────────────────────────────────────────────────────────────────

  @Bean
  @Order(2)
  SecurityFilterChain pageChain(HttpSecurity http,
                                SecurityContextRepository securityContextRepository,
                                LoginSuccessHandler loginSuccessHandler,
                                LoginFailureHandler loginFailureHandler,
                                AuditLogoutHandler auditLogoutHandler,
                                PageLogoutSuccessHandler logoutSuccessHandler,
                                PageAccessDeniedHandler accessDeniedHandler,
                                AccountRegistry accounts, AuditService audit, Flash flash, Messages messages,
                                ApiErrorWriter errors) throws Exception {
    http
        .securityContext(context -> context.securityContextRepository(securityContextRepository))
        .authorizeHttpRequests(auth -> auth
            // InternalResourceView FORWARDS to the JSP, <jsp:include> INCLUDES, errors are an ERROR dispatch:
            // the original request was already authorized, so these internal dispatches are allowed.
            .dispatcherTypeMatchers(DispatcherType.FORWARD, DispatcherType.INCLUDE, DispatcherType.ERROR,
                DispatcherType.ASYNC).permitAll()
            .requestMatchers("/login", "/static/**", "/app", "/app/**", "/hello", "/time", "/favicon.ico",
                "/actuator/health").permitAll()
            .requestMatchers("/admin/**").hasRole("ADMIN")              // URL rule; the services check again
            .anyRequest().authenticated())
        .formLogin(form -> form
            .loginPage("/login")                                        // GET: our JSP; POST: Spring checks the password
            .successHandler(loginSuccessHandler)                        // flash + 303 to the page they wanted
            .failureHandler(loginFailureHandler)                        // flash + 303 back to /login (429 when throttled)
            .permitAll())
        .logout(logout -> logout
            .logoutUrl("/logout")                                       // POST with the form's _csrf
            .addLogoutHandler(auditLogoutHandler)
            .logoutSuccessHandler(logoutSuccessHandler))
        .exceptionHandling(exceptions -> exceptions
            .authenticationEntryPoint(new LoginEntryPoint("/login"))    // anonymous → /login (?expired=1 for a stale session)
            .accessDeniedHandler(accessDeniedHandler))                  // a USER on /admin/** → audit + the 403 page
        .addFilterBefore(new AccountStateFilter(accounts, audit, flash, messages, errors, securityContextRepository),
            AuthorizationFilter.class)
        .headers(this::securityHeaders);
    return http.build();
  }

  /**
   * Security headers on every response, written by Spring Security's HeaderWriterFilter. The Content-Security-Policy
   * is NOT here: it carries a per-request nonce, set by CspNonceFilter (com.taskflow.security).
   */
  private void securityHeaders(HeadersConfigurer<HttpSecurity> headers) {
    headers
        .contentTypeOptions(Customizer.withDefaults())                          // X-Content-Type-Options: nosniff
        .frameOptions(frame -> frame.deny())                                    // X-Frame-Options: DENY
        .referrerPolicy(referrer -> referrer.policy(ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
        .crossOriginOpenerPolicy(coop -> coop.policy(CrossOriginOpenerPolicy.SAME_ORIGIN))
        .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31_536_000).includeSubDomains(false)) // HTTPS only
        .addHeaderWriter(new StaticHeadersWriter("Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=()"));
  }
}
