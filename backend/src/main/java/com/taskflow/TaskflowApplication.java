package com.taskflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.web.servlet.ServletComponentScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * The application's entry point. What used to be AppContextListener (build every service by hand, share them through
 * the ServletContext) is now Spring's job: every @Component/@Service/@Repository/@Controller under com.taskflow is
 * found by component scanning, created ONCE (singleton scope) and injected throu~gh its constructor.
 *
 *   @SpringBootApplication     = @Configuration + @EnableAutoConfiguration + @ComponentScan(com.taskflow)
 *   @ServletComponentScan      registers the classic @WebServlet classes in com.taskflow.web.servlet (the Servlet API is
 *                              still underneath Spring MVC: DispatcherServlet is just one more servlet)
 *   @ConfigurationPropertiesScan  binds TaskflowProperties to the taskflow.* keys of application.yml
 *   @EnableCaching             makes @Cacheable/@CacheEvict work (CategoryCatalog)
 *   @EnableScheduling          makes @Scheduled work (NotificationStreams' heartbeat)
 */
@SpringBootApplication
@ServletComponentScan(basePackages = "com.taskflow.web.servlet")
@ConfigurationPropertiesScan
@EnableCaching
@EnableScheduling
public class TaskflowApplication {

  public static void main(String[] args) {
    SpringApplication.run(TaskflowApplication.class, args);
  }
}
