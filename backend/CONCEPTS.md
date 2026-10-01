# TaskFlow backend: layers and concepts

Spring Boot 3.5 (Spring Framework 6, Jakarta EE 10) on Tomcat 10.1, packaged as a WAR. One application serves two
clients: the **Admin Portal** (Spring MVC controllers rendering JSP) and the **JSON API** for the React app.

## The layers (`src/main/java/com/taskflow`)

```text
config/            how the application is wired: Spring MVC, Spring Security, beans, typed settings
controller/
  api/             @RestController: JSON in, DTOs out (one per resource: tasks, projects, labels, …)
  web/             @Controller: request → model → JSP view name (the Admin Portal)
service/           @Service: the use cases and business rules; transactions start here (@Transactional)
repository/        Spring Data JPA interfaces (PROVIDED data layer)
  criteria/        TaskQuery (a list's filters), TaskSort (sort allow-list), TaskSpecifications (WHERE as code)
  projection/      interface projections for "group by" queries
entity/            JPA entities + enums (PROVIDED mappings)
dto/
  request/         what clients may SEND (records + Bean Validation; TaskInput for PATCH semantics)
  response/        what the API RETURNS (records, or Lombok @Value when a JSP reads it too)
  form/            JSP form-backing objects (bound by Spring MVC data binding)
  view/            view models for JSP pages and service results (TaskDetails, PageView, ProjectSummary)
event/             domain events (records)          event/listener/   who reacts to them
exception/         the exceptions services throw      exception/handler/ how the web layer answers them
security/          principal, authentication provider, filters/ and handlers/ plugged into Spring Security
web/               the servlet level under Spring MVC: filter/, listener/, servlet/, interceptor/, jsp/ (tags), support/
```

**Dependency direction:** `controller → service → repository → entity`. Controllers never call a repository;
services never see `HttpServletRequest`. DTOs are built in controllers (or by a service that returns a ready view).

## Lombok

| Annotation | Where | What it writes |
|---|---|---|
| `@RequiredArgsConstructor` | every service, controller, handler | a constructor for the `final` fields: constructor injection without boilerplate |
| `@Getter` / `@Setter` (+ `@Setter(AccessLevel.NONE)` per field) | entities, forms | JavaBean accessors (EL and JPA need them); ids and timestamps stay read-only |
| `@NoArgsConstructor(access = PROTECTED)` | entities | the constructor JPA needs, hidden from application code |
| `@Builder` | `Notification`, `ActivityEvent`, `TaskDetails`, `ReportSummaryDto` | named construction for many fields |
| `@Value` | `ReportSummaryDto` (+ nested) | an immutable class WITH getters (a record has none, and JSP's EL needs them) |
| `@EqualsAndHashCode` | `ProjectMemberId` | value equality for a composite key (never on entities: it breaks Hibernate) |
| `@Slf4j` | `RequestLoggingFilter`, `NotificationStreams`, `TaskCsvController` | `private static final Logger log` |

`lombok.config` copies `@Qualifier` onto generated constructor parameters (see `AuthApiController`). Not used on
purpose: `@Data` on entities, `@SneakyThrows`, `@AllArgsConstructor` on beans.

## Spring concepts → where

| Concept | Where |
|---|---|
| Component scanning, constructor injection, singleton scope | every `@Service` / `@Component` |
| `@Configuration` + `@Bean`, `@ConfigurationProperties` (typed `taskflow.*`) | `config/AppConfig`, `config/TaskflowProperties` |
| Session-scoped bean behind a proxy | `web/support/RecentTasks` |
| Caching abstraction (`@Cacheable`, `@CacheEvict`, the self-invocation trap) | `service/CategoryCatalog` |
| `@Transactional`: read-only default, write overrides, `REQUIRES_NEW` | `service/*Service`, `AuditService.record` |
| Domain events: `@EventListener` (same transaction) vs `@TransactionalEventListener` (after commit) | `event/listener/ActivityRecorder`, `NotificationDispatcher` |
| `TransactionSynchronization.afterCommit` | `NotificationService.deliver` (push only what committed) |
| `@Scheduled` | `NotificationStreams.heartbeat` |
| Bean Validation (`@Valid`, `@NotBlank`, messages from the i18n bundle) | `dto/request/*`, `dto/form/*`, `ApiExceptionHandler` |
| `@RestControllerAdvice` / `@ControllerAdvice` | `exception/handler/ApiExceptionHandler`, `PageExceptionHandler` |

## Spring MVC

| Concept | Where |
|---|---|
| View names → JSP (`InternalResourceViewResolver`), 303 redirects | `config/WebMvcConfig.defaultViewResolver` |
| `Model`, `@RequestParam`, `@PathVariable` with a regex, `forward:` / `redirect:` | `controller/web/*` (`AdminUsersController`, `TaskPageController.latest`) |
| Data binding + `BindingResult` + `rejectValue` + Spring form tags | `TaskFormController` + `views/tasks/form.jsp` |
| Flash attributes (Post/Redirect/Get) | `RedirectAttributes` in every POST handler; `web/support/Flash` outside MVC |
| `LocaleResolver` (cookie allow-list → Accept-Language), `MessageSource` | `web/support/TaskflowLocaleResolver`, `web/support/Messages` |
| `HandlerInterceptor` | `web/interceptor/ViewGlobalsInterceptor` |
| `ResponseEntity`, 201 + `Location`, 204 | `controller/api/*` |
| Method validation on parameters (`@Min`, `@Max`) | `TaskApiController.list` |
| Async: `StreamingResponseBody`, Server-Sent Events (`SseEmitter`) | `TaskCsvController.export`, `NotificationApiController.stream` |
| Multipart upload (`MultipartFile`, size limits) | `TaskCsvController.importCsv`, `application.yml` |
| A catch-all JSON 404 | `controller/api/ApiFallbackController` |

## Spring Security

| Concept | Where |
|---|---|
| Two `SecurityFilterChain`s (API: JSON, pages: form login) | `config/SecurityConfig` |
| A custom `AuthenticationProvider` (throttle, BCrypt, audit) | `security/TaskflowAuthenticationProvider`, `service/AuthService` |
| JSON login by hand: session fixation, CSRF rotation, `SecurityContextRepository` | `controller/api/AuthApiController` |
| CSRF: session token + `_csrf` field (pages), cookie double-submit (API) | `SecurityConfig`, every JSP form |
| CORS, security headers, CSP with a per-request nonce | `SecurityConfig`, `security/filter/CspNonceFilter` |
| Entry points and access-denied handlers (JSON vs pages) | `security/handler/*` |
| URL rules + method security (`@PreAuthorize`) | `SecurityConfig`, `UserAdminService`, `AuditService` |
| A custom filter in the chain (revoke disabled accounts, refresh roles) | `security/filter/AccountStateFilter` |
| `@AuthenticationPrincipal`, JSP `sec:authorize` | controllers, `views/common/nav.jspf` |

## Data (PROVIDED: used, not taught)

Spring Data JPA repositories, derived queries, `@Query` (JPQL and native), Specifications, interface projections,
constructor expressions, cursor pagination, `@ElementCollection`, a composite key (`@EmbeddedId`).
Flyway migrations `V1…V5` own the schema; the app runs as a least-privilege account (`db/01-database-and-users.sql`).

## The Servlet API underneath

| Concept | Where |
|---|---|
| A plain `HttpServlet` inside Spring Boot (`@ServletComponentScan`), init params, context params | `web/servlet/HelloServlet`, `TimeServlet` |
| Filters as beans (`@Component` + `@Order`) and with URL patterns (`FilterRegistrationBean`) | `web/filter/*`, `WebMvcConfig.spaFallbackFilter` |
| Request wrapper | `web/filter/ParameterTrimmingFilter` |
| Request, session, session-id and attribute listeners as Spring beans | `web/listener/*` |
| JSP: tag files, a custom TLD (tags + EL functions), JSTL 3.0 (`jakarta.tags.*`) | `WEB-INF/tags`, `WEB-INF/tlds/taskflow.tld`, `web/jsp/*` |

## Tests

`src/test/java` mirrors the layers. `support/IntegrationTest` starts the whole app against MySQL in Docker
(Testcontainers + `@ServiceConnection`) and drives it with MockMvc; unit tests (`TaskInputTest`, `LoginThrottleTest`,
`ScriptJsonTest`, `CsvLinesTest`) need neither Spring nor Docker. `TestTaskflowApplication` is the dev server.
