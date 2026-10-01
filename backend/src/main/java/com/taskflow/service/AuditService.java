package com.taskflow.service;

import com.taskflow.dto.view.PageView;
import com.taskflow.entity.AuditEvent;
import com.taskflow.repository.AuditRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * The security audit log. Event types: LOGIN_OK, LOGIN_FAIL, LOGIN_THROTTLED, LOGOUT, ACCESS_DENIED, USER_ENABLED,
 * USER_DISABLED, ROLE_CHANGED, SESSION_REVOKED, SESSION_EXPIRED, SLOW_REQUEST. Never a password, a session id or a token.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

  public static final List<String> TYPES = List.of("LOGIN_OK", "LOGIN_FAIL", "LOGIN_THROTTLED", "LOGOUT", "ACCESS_DENIED",
      "USER_ENABLED", "USER_DISABLED", "ROLE_CHANGED", "SESSION_REVOKED", "SESSION_EXPIRED", "SLOW_REQUEST");
  public static final int PAGE_SIZE = 25;

  private final AuditRepository audit;

  /**
   * REQUIRES_NEW: the event is written in its OWN transaction, committed at once. An ACCESS_DENIED recorded while a
   * request's transaction is failing must survive that transaction's rollback.
   */
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void record(String type, String username, String ip, String details) {
    audit.save(new AuditEvent(type, username, ip, details));
  }

  /** One page of the log, admins only: the URL rule (/admin/**) protects the page, @PreAuthorize the method too. */
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional(readOnly = true)
  public PageView<AuditEvent> page(String type, String username, int requestedPage) {
    String typeFilter = type != null && TYPES.contains(type) ? type : null;   // an allow-list (List.of().contains(null) throws)
    Page<AuditEvent> page = audit.search(typeFilter, username, PageRequest.of(Math.max(0, requestedPage - 1), PAGE_SIZE));
    if (page.getContent().isEmpty() && page.getTotalElements() > 0) {         // past the end → the last page
      page = audit.search(typeFilter, username, PageRequest.of(page.getTotalPages() - 1, PAGE_SIZE));
    }
    return PageView.of(page);
  }
}
