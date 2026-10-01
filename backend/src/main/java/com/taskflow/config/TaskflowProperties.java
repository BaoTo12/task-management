package com.taskflow.config;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * TaskFlow's own settings, bound from the taskflow.* keys of application.yml (or environment variables).
 * A record = immutable, type-safe configuration: "15m" becomes a Duration, "a,b" a List, and a typo fails at startup
 * instead of being a null somewhere. Replaces the servlet era's web.xml <context-param> + getInitParameter("…").
 */
@ConfigurationProperties("taskflow")
public record TaskflowProperties(
    @DefaultValue("false") boolean secureCookies,
    @DefaultValue Cors cors,
    @DefaultValue("500") long slowRequestMillis,
    @DefaultValue LoginThrottle loginThrottle,
    @DefaultValue CsvImport csvImport) {

  /** Origins whose JavaScript may call /api/** with the user's cookies. Never "*" together with credentials. */
  public record Cors(@DefaultValue("http://localhost:5173") List<String> allowedOrigins) {}

  /** Failed logins allowed per account and per IP within one period, before logins are refused for a while. */
  public record LoginThrottle(@DefaultValue("5") int maxPerAccount, @DefaultValue("20") int maxPerIp,
                              @DefaultValue("15m") Duration period) {}

  public record CsvImport(@DefaultValue("500") int maxRows) {}
}
