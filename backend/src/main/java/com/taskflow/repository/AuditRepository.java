package com.taskflow.repository;

import com.taskflow.entity.AuditEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/**
 * PROVIDED. The audit log is APPEND-ONLY: this repository extends the bare Repository marker, not JpaRepository, and
 * declares only "save" and a search. There is no update and no delete for anyone to call by mistake.
 */
public interface AuditRepository extends Repository<AuditEvent, Long> {

  AuditEvent save(AuditEvent event);

  /** Newest first; a null type or username means "any". Spring Data derives the count query for the Page itself. */
  @Query("select e from AuditEvent e where (:type is null or e.type = :type)"
      + " and (:username is null or e.username = :username) order by e.at desc, e.id desc")
  Page<AuditEvent> search(@Param("type") String type, @Param("username") String username, Pageable pageable);
}
