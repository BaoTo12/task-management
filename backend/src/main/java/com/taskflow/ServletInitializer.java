package com.taskflow;

import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * The entry point when taskflow.war is deployed to a STANDALONE Tomcat 10.1 (docker-compose.yml).
 * There is no main() there: Tomcat finds this class through the Servlet 3.0 ServletContainerInitializer mechanism
 * (Spring's SpringServletContainerInitializer → WebApplicationInitializer), and it starts the same application
 * that `java -jar taskflow.war` starts with an embedded Tomcat.
 */
public class ServletInitializer extends SpringBootServletInitializer {

  @Override
  protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
    return application.sources(TaskflowApplication.class);
  }
}
