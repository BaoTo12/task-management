package com.taskflow.web.debug;

import javax.servlet.Servlet;
import javax.servlet.ServletContext;
import javax.servlet.ServletRegistration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * S45 (45.A) programmatic registration: ServletContext.addServlet(...) instead of @WebServlet.
 *
 * An annotation is unconditional: the class is on the classpath, so the URL exists. Debug endpoints must not exist in
 * production (S50's checklist: "no debug surface"), and the loopback check inside each one is a SECOND line of defence,
 * not the first. Registered in code, they exist only when web.xml's context parameter says so:
 *
 *   taskflow.debugEndpoints = true   development and the test harness (the S30–S48 tests use them)
 *   taskflow.debugEndpoints = false  production: /debug/* is a plain 404, the classes are never instantiated
 *
 * Rules the container enforces: addServlet is allowed only while the application STARTS (from contextInitialized of a
 * listener declared in web.xml or with @WebListener), and a mapping that another servlet already owns is refused
 * (addMapping returns the conflicting patterns instead of throwing, so we check and log them).
 */
public final class DebugEndpoints {

  private static final Logger log = LoggerFactory.getLogger(DebugEndpoints.class);

  public static final String PARAM = "taskflow.debugEndpoints";

  private DebugEndpoints() {}

  public static void register(ServletContext application) {
    if (!Boolean.parseBoolean(application.getInitParameter(PARAM))) {
      log.info("Debug endpoints are OFF ({}=false): /debug/* is not mapped", PARAM);
      return;
    }
    add(application, "debugRequestInfo", RequestInfoServlet.class, "/debug/request-info", "/debug/request-info/*");
    add(application, "debugEl", ElDebugServlet.class, "/debug/el");
    add(application, "debugStats", StatsServlet.class, "/debug/stats");
    add(application, "debugMaintenance", MaintenanceSwitchServlet.class, "/debug/maintenance");
    add(application, "debugFail", FailServlet.class, "/debug/fail");
    add(application, "debugRace", RaceDemoServlet.class, "/debug/race");
    add(application, "debugSlow", SlowServlet.class, "/debug/slow");
    add(application, "debugContractDrift", ContractDriftSwitchServlet.class, "/debug/contract-drift");
    log.warn("Debug endpoints are ON ({}=true): turn them off in production", PARAM);
  }

  private static void add(ServletContext application, String name, Class<? extends Servlet> type, String... patterns) {
    ServletRegistration.Dynamic registration = application.addServlet(name, type);
    registration.setAsyncSupported(true); // every filter is async-supported; keep the chain consistent (45.13)
    var conflicts = registration.addMapping(patterns);
    if (!conflicts.isEmpty()) log.error("{} not mapped to {}: already taken", name, conflicts);
  }
}
