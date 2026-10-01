package com.taskflow.web.servlet;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.concurrent.atomic.AtomicLong;

/**
 * The Servlet API with NO framework, inside a Spring Boot app: GET /taskflow/hello[?name=…] → an HTML page.
 * Registered by @ServletComponentScan (TaskflowApplication). Tomcat creates ONE instance and calls it for every
 * request, on many threads at once: shared state must be thread-safe. Spring MVC's DispatcherServlet is a servlet just
 * like this one, mapped to "/"; this one wins for /hello because an exact mapping beats the default one.
 */
@WebServlet(urlPatterns = "/hello", loadOnStartup = 1)
public class HelloServlet extends HttpServlet {

  private final AtomicLong requestCount = new AtomicLong();

  @Override
  public void init() {
    log("init(): HelloServlet created once, at startup");
  }

  @Override
  protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String name = request.getParameter("name");
    String who = name == null || name.isBlank() ? "world" : name.strip();
    long count = requestCount.incrementAndGet();
    response.setContentType("text/html;charset=UTF-8");          // status and headers BEFORE the body
    PrintWriter out = response.getWriter();
    out.println("<!doctype html>");
    out.println("<html lang=\"en\"><head><meta charset=\"utf-8\"><title>Hello</title>");
    out.println("<link rel=\"stylesheet\" href=\"static/css/app.css\"></head><body><main class=\"page__main\">");
    out.println("<h1 class=\"page__title\">Hello, " + Html.escape(who) + "!</h1>");   // user input: escaped
    out.println("<p class=\"text-muted\">Request #" + count + " handled by " + Thread.currentThread().getName() + "</p>");
    out.println("</main></body></html>");
  }

  @Override
  public void destroy() {
    log("destroy(): the application is stopping; " + requestCount.get() + " requests served");
  }
}
