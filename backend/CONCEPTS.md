# Where each backend concept lives (S28–S50)

A study map for the Java side: open the file, find the lecture number in its comments. Tests that prove a section's
behaviour are in `src/test/java/com/taskflow/web/S<nn>*Test.java`; the additions below are covered by
`ConceptsCoverageTest`.

## Servlets and the container (S29–S31, S45)

| Concept | Where |
|---|---|
| `@WebServlet`, `doGet`/`doPost`, parameters, redirect vs forward | `web/tasks/*Servlet.java` |
| `init()`, services from the `ServletContext` | every servlet's `init()`, `web/AppContextListener.java` |
| Listeners: context, request, session | `AppContextListener`, `StatsListener`, `SessionRegistry`, `SlowRequestListener` |
| Programmatic registration (`addListener`, `addServlet`, `addMapping`) | `AppContextListener` → `web/debug/DebugEndpoints.java` |
| Async servlets (`startAsync`, `complete`, `setTimeout`) + `AsyncListener` | `web/tasks/TaskExportServlet.java` |
| File upload (`@MultipartConfig`, `Part`, size limits) | `web/tasks/TaskImportServlet.java` (+ the form in `views/tasks/list.jsp`) |
| `sendError`, error pages, the error dispatch | `web/filters/ErrorHandlingFilter.java`, `views/errors/`, `web.xml` |

## Filters (S40)

| Concept | Where |
|---|---|
| A filter chain in a fixed order (`web.xml`) | `WEB-INF/web.xml` |
| `HttpFilter` + `HttpServletRequestWrapper` | `web/filters/ParameterTrimmingFilter.java` |
| `HttpServletResponseWrapper` | `web/filters/RequestLoggingFilter.java` |
| Security headers, CSP nonces | `web/filters/SecurityHeadersFilter.java` |
| Authentication, authorization, CSRF (form tokens + double submit) | `AuthenticationFilter`, `AuthorizationFilter`, `CsrfFilter`, `CsrfDoubleSubmitFilter` |

## JSP, EL, JSTL (S32–S35, S39, S44)

| Concept | Where |
|---|---|
| Static include (`.jspf`) vs `<jsp:include>` + `<jsp:param>` | `views/common/header.jspf`, `views/categories/list.jsp` |
| Tag files, `<jsp:doBody/>`, custom tags + EL functions (TLD) | `WEB-INF/tags/*.tag`, `web/tags/*`, `WEB-INF/tlds/taskflow.tld` |
| `c:forEach` + `varStatus`, `c:choose`, `c:url`/`c:param`, `c:set` | `views/tasks/list.jsp`, `views/tasks/view.jsp` |
| `c:forTokens` | `views/dashboard.jsp` (status counts) |
| `c:import` + `c:catch` | `views/dashboard.jsp` (optional `static/notice.html`; see `notice.html.example`) |
| `c:remove` | `views/admin/users.jsp` |
| `fmt:message` + `fmt:param`, `var=` for attributes and `<jsp:param>` | every view; `categories/list.jsp`, `admin/users.jsp` |
| `fmt:formatNumber` (grouping, percent) | `views/categories/list.jsp`, `views/dashboard.jsp` |
| `fmt:timeZone`, `fmt:parseDate`, `fmt:formatDate` | comment times in `views/tasks/view.jsp`, `views/admin/audit.jsp` |

## i18n on the server (S44)

| Concept | Where |
|---|---|
| Locale decided once per request (cookie shared with the React app) | `web/filters/LocaleFilter.java` |
| Bundles, UTF-8, MessageFormat, `choice` plurals | `src/main/resources/i18n/messages*.properties` |
| The SAME bundle for texts created in Java (page titles, flash messages) | `web/Messages.java`, used by every controller |

## MVC, forms, scopes, security (S36–S43, S46–S47, S50)

| Concept | Where |
|---|---|
| Controller → service → provided data layer | `web/*`, `service/TaskService.java`, `dao/` (provided) |
| Form objects, validation, PRG with 303 + flash | `web/tasks/TaskForm.java`, `web/Flash.java`, `web/Http.java` |
| Scopes and thread safety | `web/AppStats.java`, `web/RecentTasks.java`, `service/CategoryCatalog.java` |
| Sessions, BCrypt, throttling, safe redirects, ownership checks, audit | `security/`, `service/AuthService.java`, `web/Redirects.java`, `service/AuditService.java` |
| JSON API, DTOs, error JSON, CORS | `web/api/`, `web/filters/ApiExceptionFilter.java`, `CorsFilter.java` |
| No debug surface in production | `taskflow.debugEndpoints` in `web.xml` + `DebugEndpoints` |
