package com.taskflow.config;

import com.taskflow.web.filter.SpaFallbackFilter;
import com.taskflow.web.interceptor.ViewGlobalsInterceptor;
import com.taskflow.web.support.TaskflowLocaleResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.web.servlet.WebMvcProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.view.InternalResourceViewResolver;

/**
 * Spring MVC settings: how view names become JSPs, the locale decision, interceptors, and one servlet filter
 * registered with an explicit URL pattern.
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

  private final ViewGlobalsInterceptor viewGlobals;

  /**
   * "tasks/list" → forward to /WEB-INF/views/tasks/list.jsp. With JSTL on the classpath this resolver creates JstlViews,
   * which hand Spring's MessageSource and locale to <fmt:message> (the old web.xml localizationContext context-param).
   * redirectHttp10Compatible=false: "redirect:/tasks" answers 303 See Other, the correct status for Post/Redirect/Get
   * (a 302 is the HTTP/1.0 behaviour). Replaces Spring Boot's default resolver (same bean type).
   */
  @Bean
  InternalResourceViewResolver defaultViewResolver(WebMvcProperties mvc) {
    InternalResourceViewResolver resolver = new InternalResourceViewResolver();
    resolver.setPrefix(mvc.getView().getPrefix());
    resolver.setSuffix(mvc.getView().getSuffix());
    resolver.setRedirectHttp10Compatible(false);
    return resolver;
  }

  /** Bean name "localeResolver" is what DispatcherServlet looks up: tf_lang cookie → Accept-Language → English. */
  @Bean
  LocaleResolver localeResolver(TaskflowProperties properties) {
    return new TaskflowLocaleResolver(properties.secureCookies());
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    // Request attributes every JSP layout reads (currentUser, lang, currentPath…). Not for JSON or files.
    registry.addInterceptor(viewGlobals).excludePathPatterns("/api/**", "/static/**", "/app/**", "/actuator/**");
  }

  @Override
  public void addViewControllers(ViewControllerRegistry registry) {
    registry.addRedirectViewController("/", "/dashboard");   // a controller without a class: GET / → 303 /dashboard
  }

  /**
   * The SPA fallback as a servlet filter on /app and /app/* only: FilterRegistrationBean is the Spring Boot way to set
   * URL patterns and order (the servlet era wrote <filter-mapping> in web.xml). Runs after Spring Security (whose
   * filter has order -100), so the CSP nonce and the security headers are already decided.
   */
  @Bean
  FilterRegistrationBean<SpaFallbackFilter> spaFallbackFilter() {
    FilterRegistrationBean<SpaFallbackFilter> registration = new FilterRegistrationBean<>(new SpaFallbackFilter());
    registration.addUrlPatterns("/app", "/app/*");
    registration.setOrder(0);
    return registration;
  }
}
