package com.taskflow;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.utility.MountableFile;

/**
 * A REAL MySQL 8.4 in Docker for tests and for local development (TestTaskflowApplication).
 * @ServiceConnection: Spring Boot reads the container's JDBC URL, user and password and builds the DataSource from them,
 * replacing spring.datasource.* (no ports or passwords to copy around).
 * db/01-database-and-users.sql runs inside the container at its first start, as root (the image runs every script in
 * /docker-entrypoint-initdb.d), so Flyway finds the taskflow_migrator account it is configured with in application.yml.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

  @Bean
  @ServiceConnection
  MySQLContainer<?> mysql() {
    return new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("taskflow")
        .withCopyFileToContainer(MountableFile.forHostPath("db/01-database-and-users.sql"),
            "/docker-entrypoint-initdb.d/00-database-and-users.sql")
        .withCommand("--character-set-server=utf8mb4", "--collation-server=utf8mb4_0900_ai_ci");
  }
}
