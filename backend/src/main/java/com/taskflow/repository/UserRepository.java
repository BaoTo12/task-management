package com.taskflow.repository;

import com.taskflow.entity.User;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * PROVIDED data access for users. A Spring Data REPOSITORY is an interface: Spring generates the implementation at
 * startup, from the method NAMES (findAllByOrderByUsernameAsc) or from the @Query given. JpaRepository adds the CRUD
 * basics (findById, findAll, save, delete, count…).
 */
public interface UserRepository extends JpaRepository<User, Long> {

  /** What the login check needs. Never put this object in a session, a model attribute or a DTO. */
  interface Credentials {
    Long getId();
    String getUsername();
    String getDisplayName();
    String getRole();
    String getPasswordHash();
    boolean isEnabled();
  }

  /** The ONE query that reads a password hash (a native query + an interface projection: no entity has the column). */
  @Query(value = "SELECT id, username, display_name AS displayName, role, password_hash AS passwordHash, enabled"
      + " FROM users WHERE username = :username", nativeQuery = true)
  Optional<Credentials> findCredentials(@Param("username") String username);

  List<User> findAllByOrderByUsernameAsc();

  List<User> findByIdIn(Collection<Long> ids);

  /** The people picker (assignees, project members): enabled accounts whose username or name contains q. */
  @Query("select u from User u where u.enabled = true and (lower(u.username) like lower(concat('%', :q, '%'))"
      + " or lower(u.displayName) like lower(concat('%', :q, '%'))) order by u.displayName")
  List<User> search(@Param("q") String q, Pageable limit);

  /** clearAutomatically: the persistence context forgets its (now stale) copies of the user after the UPDATE. */
  @Modifying(clearAutomatically = true)
  @Query("update User u set u.enabled = :enabled where u.id = :id")
  int updateEnabled(@Param("id") long id, @Param("enabled") boolean enabled);

  /** The role must already be validated (USER or ADMIN). */
  @Modifying(clearAutomatically = true)
  @Query("update User u set u.role = :role where u.id = :id")
  int updateRole(@Param("id") long id, @Param("role") String role);
}
