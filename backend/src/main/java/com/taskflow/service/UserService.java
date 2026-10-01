package com.taskflow.service;

import com.taskflow.entity.User;
import com.taskflow.repository.UserRepository;
import java.util.Collection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** The people directory: the assignee and member pickers, and resolving ids to names. */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class UserService {

  public static final int SEARCH_LIMIT = 20;
  public static final int MAX_IDS = 100;

  private final UserRepository users;

  /** Enabled people whose username or display name contains `text` (blank: the first ones by name). */
  public List<User> search(String text) {
    return users.search(text == null ? "" : text.strip(), PageRequest.of(0, SEARCH_LIMIT));
  }

  public List<User> byIds(Collection<Long> ids) {
    return users.findByIdIn(ids.stream().limit(MAX_IDS).toList());
  }

  /** Every enabled account, by name (the JSP form's assignee list: TaskFlow's teams are small). */
  public List<User> enabledUsers() {
    return users.search("", PageRequest.of(0, 200));
  }
}
