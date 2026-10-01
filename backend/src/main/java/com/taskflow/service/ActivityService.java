package com.taskflow.service;

import com.taskflow.dto.response.ActivityDto;
import com.taskflow.dto.response.CursorPageDto;
import com.taskflow.entity.ActivityEvent;
import com.taskflow.repository.ActivityRepository;
import com.taskflow.security.AuthUser;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Reading the activity feed (writing it is ActivityRecorder's job). Visibility is part of the query itself. */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ActivityService {

  public static final int MAX_LIMIT = 50;

  private final ActivityRepository activity;

  public CursorPageDto<ActivityDto> feed(AuthUser caller, Long projectId, Long taskId, Long before, int limit) {
    int size = Math.max(1, Math.min(limit, MAX_LIMIT));
    List<ActivityEvent> rows = activity.feed(caller.getId(), caller.isAdmin(), projectId, taskId, before,
        PageRequest.of(0, size + 1));
    List<ActivityDto> items = rows.stream().limit(size).map(ActivityDto::from).toList();
    Long next = rows.size() > size ? items.get(items.size() - 1).id() : null;
    return new CursorPageDto<>(items, next, null);
  }
}
