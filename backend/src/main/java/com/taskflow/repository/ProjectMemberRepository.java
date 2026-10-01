package com.taskflow.repository;

import com.taskflow.entity.ProjectMember;
import com.taskflow.entity.ProjectMemberId;
import com.taskflow.entity.ProjectRole;
import com.taskflow.repository.projection.IdCount;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * PROVIDED: memberships. Derived queries can walk INTO the embedded id: findByIdProjectId → "where m.id.projectId = ?".
 */
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {

  @Query("select m.role from ProjectMember m where m.id.projectId = :projectId and m.id.userId = :userId")
  Optional<ProjectRole> findRole(@Param("projectId") long projectId, @Param("userId") long userId);

  List<ProjectMember> findByIdProjectIdOrderByJoinedAtAsc(long projectId);

  List<ProjectMember> findByIdUserId(long userId);

  long countByIdProjectIdAndRole(long projectId, ProjectRole role);

  @Query("select m.id.projectId as id, count(m) as count from ProjectMember m group by m.id.projectId")
  List<IdCount> countByProject();

  /** Everyone in the project except one user (whom to notify about a project change). */
  @Query("select m.id.userId from ProjectMember m where m.id.projectId = :projectId and m.id.userId <> :exceptUserId")
  List<Long> memberIdsExcept(@Param("projectId") long projectId, @Param("exceptUserId") long exceptUserId);
}
