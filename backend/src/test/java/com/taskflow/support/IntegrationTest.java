package com.taskflow.support;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;

import com.taskflow.TestcontainersConfiguration;
import com.taskflow.security.AuthUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * The base of every integration test: the WHOLE application (all beans, Spring Security, Flyway-migrated MySQL in
 * Docker), called through MockMvc: requests go through the real filter chain and DispatcherServlet, without a network.
 * Spring caches the context: every test class extending this shares ONE application and ONE container.
 * The tests don't roll back (no @Transactional), because the after-commit listeners must run: each test creates its
 * own data with unique names instead of relying on a clean database.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
public abstract class IntegrationTest {

  // The seed users (V2__demo_data.sql).
  protected static final AuthUser ALICE = new AuthUser(1, "alice", "Alice Nguyen", "USER");
  protected static final AuthUser BOB = new AuthUser(2, "bob", "Bob Tran", "USER");
  protected static final AuthUser ADMIN = new AuthUser(3, "admin", "Admin", "ADMIN");
  protected static final AuthUser CAROL = new AuthUser(4, "carol", "Carol Le", "USER");
  protected static final AuthUser DAVE = new AuthUser(5, "dave", "Dave Pham", "USER");

  @Autowired
  protected MockMvc mvc;

  /** Runs the request as this user: spring-security-test puts the Authentication in the SecurityContext. */
  protected static RequestPostProcessor as(AuthUser user) {
    return authentication(user.toAuthentication());
  }

  /** A title no other test (or earlier run) uses: the database is shared. */
  protected static String unique(String prefix) {
    return prefix + " " + System.nanoTime();
  }
}
