package com.taskflow.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.HttpCookie;
import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * The Part 4 additions that apply more of the course's backend concepts:
 * complete JSP i18n (Messages + fmt), CSV import (@MultipartConfig + Part), the parameter-trimming request wrapper,
 * and programmatically registered debug endpoints.
 */
class ConceptsCoverageTest extends TomcatTest {

  private static final String BOUNDARY = "----taskflowTestBoundary";

  /** A multipart/form-data body by hand: what a browser sends for <form enctype="multipart/form-data">. */
  private static String multipart(String csrf, String fileName, String csv) {
    return "--" + BOUNDARY + "\r\n"
        + "Content-Disposition: form-data; name=\"_csrf\"\r\n\r\n" + csrf + "\r\n"
        + "--" + BOUNDARY + "\r\n"
        + "Content-Disposition: form-data; name=\"file\"; filename=\"" + fileName + "\"\r\n"
        + "Content-Type: text/csv\r\n\r\n" + csv + "\r\n"
        + "--" + BOUNDARY + "--\r\n";
  }

  private static HttpResponse<String> postMultipart(String path, String body) throws Exception {
    return send(HttpRequest.newBuilder(uri(CONTEXT + path))
        .header("Content-Type", "multipart/form-data; boundary=" + BOUNDARY)
        .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8)).build());
  }

  @Test
  void csvImportCreatesValidRowsAndReportsInvalidOnes() throws Exception {
    String csv = "title,description,priority,due_date\r\n"
        + "Imported one,\"with, a comma\",high,2031-01-02\r\n"
        + "Imported two,,LOW,\r\n"
        + ",no title,MEDIUM,\r\n";
    HttpResponse<String> response = postMultipart("/tasks/import", multipart(csrfToken(), "tasks.csv", csv));
    assertEquals(303, response.statusCode()); // PRG, like every form
    String list = get(CONTEXT + "/tasks?q=Imported").body();
    assertTrue(list.contains("Imported one"), list);
    assertTrue(list.contains("Imported two"), list);
    assertTrue(list.contains("2 tasks imported; 1 line was skipped: line 4: title"), list); // the flash, shown once
  }

  @Test
  void csvImportWithoutTheCsrfTokenIsRejected() throws Exception {
    HttpResponse<String> response = postMultipart("/tasks/import", multipart("wrong-token", "tasks.csv", "title\r\nX,,LOW,\r\n"));
    assertEquals(403, response.statusCode());
  }

  @Test
  void formValuesArriveTrimmed() throws Exception {
    postForm(CONTEXT + "/tasks/new", "title=%20%20Trimmed%20by%20the%20wrapper%20%20&description=&priority=%20LOW%20&dueDate=&categoryId=");
    String list = get(CONTEXT + "/tasks?q=Trimmed").body();
    assertTrue(list.contains(">Trimmed by the wrapper<"), list);
  }

  @Test
  void viewsAndFlashMessagesFollowTheLanguageCookie() throws Exception {
    HttpCookie lang = new HttpCookie("tf_lang", "vi");
    lang.setPath("/");
    lang.setVersion(0);
    var browser = loggedInClient("bob", "bob123");
    ((java.net.CookieManager) browser.cookieHandler().orElseThrow()).getCookieStore().add(URI.create(uri("/").toString()), lang);
    String form = browser.send(HttpRequest.newBuilder(uri(CONTEXT + "/tasks/new")).build(),
        HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)).body();
    assertTrue(form.contains("Tạo công việc"), form);       // the submit button, from messages_vi
    assertTrue(form.contains("<title>Việc mới"), form);     // the page title, set by the servlet through Messages
    String notFound = browser.send(HttpRequest.newBuilder(uri(CONTEXT + "/no-such-page")).build(),
        HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)).body();
    assertTrue(notFound.contains("Không tìm thấy trang"), notFound);
  }

  @Test
  void debugEndpointsAreRegisteredInCodeWhenEnabled() throws Exception {
    // web.xml sets taskflow.debugEndpoints=true for development: DebugEndpoints mapped them at start-up.
    for (String path : List.of("/debug/request-info", "/debug/stats", "/debug/el")) {
      assertFalse(get(CONTEXT + path).statusCode() == 404, path);
    }
  }
}
