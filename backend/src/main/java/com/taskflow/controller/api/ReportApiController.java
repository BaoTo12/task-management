package com.taskflow.controller.api;

import com.taskflow.dto.response.ReportSummaryDto;
import com.taskflow.security.AuthUser;
import com.taskflow.service.ReportService;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api/reports/summary?from=2026-09-01&to=2026-09-30&projectId=1 → ReportSummaryDto (default: the last 30 days).
 * @DateTimeFormat(iso = DATE) tells Spring how to convert "2026-09-01" into a LocalDate; a bad date → 400.
 */
@RestController
@RequiredArgsConstructor
public class ReportApiController {

  private final ReportService reports;

  @GetMapping("/api/reports/summary")
  ReportSummaryDto summary(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                           @RequestParam(required = false) @Min(1) Long projectId,
                           @AuthenticationPrincipal AuthUser user) {
    return reports.summary(user, from, to, projectId);
  }
}
