package com.taskflow.web.filter;

import com.taskflow.security.filter.CspNonceFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * TaskFlow Web (the full React SPA, built by `npm run build:war`) lives in the WAR under /app/.
 *   /app/assets/…-hash.js|css, /app/locales/…  → real files: served as they are (hashed assets: cached for a year)
 *   /app, /app/, /app/tasks/5, /app/login …     → index.html: React Router (basename /taskflow/app/) renders the route.
 *                                                Without this, a reload on /app/tasks/5 would be a 404.
 * index.html is served with THIS response's CSP nonce in place of the build's placeholder (Vite's html.cspNonce writes
 * nonce="__CSP_NONCE__"), and never cached (it names the current hashed assets).
 * A classic jakarta.servlet HttpFilter: registered with URL patterns by WebMvcConfig.spaFallbackFilter().
 */
public class SpaFallbackFilter extends HttpFilter {

  static final String PLACEHOLDER = "__CSP_NONCE__";
  private static final String INDEX = "/app/index.html";

  @Override
  protected void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    String method = request.getMethod();
    if (!"GET".equals(method) && !"HEAD".equals(method)) {
      chain.doFilter(request, response);
      return;
    }
    String path = request.getServletPath() + (request.getPathInfo() == null ? "" : request.getPathInfo());
    if (path.equals("/app")) {                                   // relative URLs in index.html need the trailing slash
      response.sendRedirect(request.getContextPath() + "/app/");
      return;
    }
    ServletContext context = request.getServletContext();
    if (!path.endsWith("/") && !path.endsWith(".html") && isFile(context, path)) {
      if (path.startsWith("/app/assets/")) response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      chain.doFilter(request, response);
      return;
    }
    String html = readIndex(context);
    if (html == null) {
      response.sendError(HttpServletResponse.SC_NOT_FOUND);    // the SPA hasn't been built into the WAR
      return;
    }
    Object nonce = request.getAttribute(CspNonceFilter.NONCE_ATTRIBUTE);
    response.setContentType("text/html;charset=UTF-8");
    response.setHeader("Cache-Control", "no-store");
    response.getWriter().write(html.replace(PLACEHOLDER, nonce == null ? "" : nonce.toString()));
  }

  private static boolean isFile(ServletContext context, String path) throws IOException {
    URL resource = context.getResource(path);
    return resource != null && !path.substring(path.lastIndexOf('/') + 1).isEmpty();
  }

  private static String readIndex(ServletContext context) throws IOException {
    try (InputStream in = context.getResourceAsStream(INDEX)) {
      return in == null ? null : new String(in.readAllBytes(), StandardCharsets.UTF_8);
    }
  }
}
