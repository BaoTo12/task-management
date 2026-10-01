package com.taskflow.web.servlet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebInitParam;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

/**
 * The time, with
 *   a PER-SERVLET setting: init parameter "format" (ServletConfig)
 *   a PER-APPLICATION setting: context parameter "greeting" (ServletContext; set in application.yml under
 *   server.servlet.context-parameters, Spring Boot's replacement for web.xml's <context-param>)
 */
@WebServlet(urlPatterns = "/time", initParams = @WebInitParam(name = "format", value = "HH:mm:ss, EEEE d MMMM yyyy"))
public class TimeServlet extends HttpServlet {

  private DateTimeFormatter formatter;   // built once in init(), read-only afterwards: thread-safe

  @Override
  public void init() throws ServletException {
    String pattern = getInitParameter("format");
    try {
      formatter = DateTimeFormatter.ofPattern(pattern);
    } catch (IllegalArgumentException e) {
      throw new ServletException("Invalid 'format' init parameter: " + pattern, e);   // fail at startup, loudly
    }
  }

  @Override
  protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String greeting = getServletContext().getInitParameter("greeting");
    response.setContentType("text/html;charset=UTF-8");          // BEFORE getWriter(): the Vietnamese greeting needs UTF-8
    PrintWriter out = response.getWriter();
    out.println("<!doctype html><html lang=\"vi\"><head><meta charset=\"utf-8\"><title>Time</title></head><body>");
    out.println("<h1>" + Html.escape(greeting) + "</h1>");
    out.println("<p>" + Html.escape(ZonedDateTime.now().format(formatter)) + "</p>");
    out.println("</body></html>");
  }
}
