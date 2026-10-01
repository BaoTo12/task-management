package com.taskflow;

import org.springframework.boot.SpringApplication;

/**
 * Runs the REAL application against a MySQL container: the development server (the servlet era's DevServer).
 *   mvn spring-boot:test-run          (Docker Desktop must be running)
 * SpringApplication.from(...).with(...) starts TaskflowApplication's main() with the test configuration ADDED: the
 * container starts first, Flyway migrates it, then Tomcat listens on http://localhost:8081/taskflow.
 * It lives in src/test because the container support is a test dependency: it never ships in the WAR.
 */
public class TestTaskflowApplication {

  public static void main(String[] args) {
    SpringApplication.from(TaskflowApplication::main).with(TestcontainersConfiguration.class).run(args);
  }
}
