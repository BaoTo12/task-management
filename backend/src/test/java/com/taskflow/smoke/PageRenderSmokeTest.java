package com.taskflow.smoke;

import static org.assertj.core.api.Assertions.assertThat;

import com.taskflow.TestcontainersConfiguration;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.HttpCookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/**
 * SMOKE for the Admin Portal: a REAL embedded Tomcat on a random port, so the JSPs are actually COMPILED and RUN by
 * Jasper. MockMvc can't do that (it only records the view name), so an EL typo, a wrong taglib or a missing model
 * attribute would pass every MockMvc test and still be a 500 in the browser. Here every page must answer 200 and
 * render to the closing </html> (an error half-way through a page can leave a 200 with a cut-off body).
 * The client logs in like the React app does: GET /api/auth/csrf, then POST /api/auth/login with X-XSRF-TOKEN;
 * the session cookie it gets back is the same session the pages use.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "taskflow.secure-cookies=false")           // plain http in the test: Secure cookies wouldn't be sent back
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class PageRenderSmokeTest {

  @LocalServerPort
  int port;

  private HttpClient alice;
  private HttpClient admin;

  @BeforeEach
  void logIn() throws Exception {
    alice = loggedIn("alice", "alice123");
    admin = loggedIn("admin", "admin123");
  }

  @ParameterizedTest(name = "alice: {0}")
  @ValueSource(strings = {
      "/dashboard", "/tasks", "/tasks?page=2", "/tasks?status=DONE&q=report&category=1",
      "/tasks?sort=id", "/tasks?sort=newest", "/tasks?sort=due", "/tasks?sort=due&dir=desc", "/tasks?sort=priority",
      "/tasks?sort=title&dir=desc", "/tasks?sort=created", "/tasks?sort=updated&dir=desc",
      "/tasks/view?id=1", "/tasks/view?id=5", "/tasks/new", "/tasks/edit?id=1", "/react-board"})
  void everyUserPageRenders(String path) throws Exception {
    assertRendered(alice, path);
  }

  @ParameterizedTest(name = "admin: {0}")
  @ValueSource(strings = {
      "/dashboard", "/tasks?sort=due", "/tasks/view?id=23", "/categories", "/admin/users", "/admin/audit",
      "/admin/audit?page=2", "/admin/reports", "/admin/reports?from=2026-09-01&to=2026-10-31&projectId=1"})
  void everyAdminPageRenders(String path) throws Exception {
    assertRendered(admin, path);
  }

  @Test
  void theLoginPageRendersForAnonymousVisitors() throws Exception {
    assertRendered(HttpClient.newHttpClient(), "/login");
  }

  @Test
  void theErrorPagesRender() throws Exception {
    HttpResponse<String> notFound = alice.send(page("/nope").build(), HttpResponse.BodyHandlers.ofString());
    assertThat(notFound.statusCode()).isEqualTo(404);
    assertThat(notFound.body()).contains("</html>");
    HttpResponse<String> forbidden = alice.send(page("/admin/users").build(), HttpResponse.BodyHandlers.ofString());
    assertThat(forbidden.statusCode()).isEqualTo(403);
    assertThat(forbidden.body()).contains("</html>");
  }

  @Test
  void theCsvExportStreams() throws Exception {
    HttpResponse<String> response = alice.send(page("/tasks/export.csv").build(), HttpResponse.BodyHandlers.ofString());
    assertThat(response.statusCode()).isEqualTo(200);
    assertThat(response.body()).startsWith("id,");
  }

  // ── helpers ────────────────────────────────────────────────────────────────────────────────────────────────

  private void assertRendered(HttpClient client, String path) throws Exception {
    HttpResponse<String> response = client.send(page(path).build(), HttpResponse.BodyHandlers.ofString());
    assertThat(response.statusCode()).as(path + " → " + response.body()).isEqualTo(200);
    assertThat(response.body().stripTrailing()).as(path + " is cut off").endsWith("</html>");
  }

  private HttpClient loggedIn(String username, String password) throws Exception {
    CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
    HttpClient client = HttpClient.newBuilder().cookieHandler(cookies).followRedirects(HttpClient.Redirect.NEVER).build();
    client.send(request("/api/auth/csrf").build(), HttpResponse.BodyHandlers.discarding());
    String token = cookies.getCookieStore().getCookies().stream()
        .filter(cookie -> cookie.getName().equals("XSRF-TOKEN")).map(HttpCookie::getValue).findFirst().orElseThrow();
    HttpResponse<String> login = client.send(request("/api/auth/login")
            .header("Content-Type", "application/json").header("X-XSRF-TOKEN", token)
            .POST(HttpRequest.BodyPublishers.ofString("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
            .build(),
        HttpResponse.BodyHandlers.ofString());
    assertThat(login.statusCode()).as("login " + username + ": " + login.body()).isEqualTo(200);
    return client;
  }

  /** A page request the way a BROWSER sends it: Accept: text/html is what makes errors render as error/*.jsp, not JSON. */
  private HttpRequest.Builder page(String path) {
    return request(path).header("Accept", "text/html,application/xhtml+xml,*/*;q=0.8");
  }

  private HttpRequest.Builder request(String path) {
    return HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/taskflow" + path));
  }
}
