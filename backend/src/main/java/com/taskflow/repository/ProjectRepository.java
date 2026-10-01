package com.taskflow.repository;

import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectMember;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** PROVIDED: projects. */
public interface ProjectRepository extends JpaRepository<Project, Long> {

  List<Project> findAllByOrderByNameAsc();

  /** The projects a user is a member of (any role), by name. A JPQL subquery on the memberships. */
  @Query("select p from Project p where p.id in"
      + " (select m.id.projectId from ProjectMember m where m.id.userId = :userId) order by p.name")
  List<Project> findForMember(@Param("userId") long userId);
}
