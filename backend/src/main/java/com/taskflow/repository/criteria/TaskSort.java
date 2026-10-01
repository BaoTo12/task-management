package com.taskflow.repository.criteria;

import java.util.Locale;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.domain.Sort.NullHandling;
import org.springframework.data.domain.Sort.Order;
import org.springframework.data.domain.Sort;

/**
 * The ALLOW-LIST of sort orders. The request chooses a CONSTANT by name; the Sort comes from the constant, never from
 * the request ("order by " + request.getParameter("sort") would be injectable, and Sort.by(userInput) would let anyone
 * sort by any property). Every order ends with the id, so equal values keep a stable order across pages.
 */
public enum TaskSort {
  ID,
  NEWEST,
  DUE,
  PRIORITY,
  TITLE,
  CREATED,
  UPDATED;

  /** "due" → DUE; null, "", unknown or malicious → ID (the default). */
  public static TaskSort parse(String value) {
    if (value == null) return ID;
    for (TaskSort sort : values()) {
      if (sort.getParam().equals(value)) return sort;
    }
    return ID;
  }

  /** The value in URLs: ?sort=due. */
  public String getParam() {
    return name().toLowerCase(Locale.ROOT);
  }

  public Sort toSort(boolean descending) {
    Direction dir = descending ? Direction.DESC : Direction.ASC;
    Direction reversed = descending ? Direction.ASC : Direction.DESC;
    return switch (this) {
      case ID -> Sort.by(dir, "id");
      case NEWEST -> Sort.by(reversed, "id");
      // Tasks without a due date stay LAST in both directions.
      case DUE -> Sort.by(new Order(dir, "dueDate", NullHandling.NULLS_LAST), new Order(dir, "id"));
      // In the list, "ascending" priority means the most important first: HIGH, MEDIUM, LOW.
      case PRIORITY -> Sort.by(reversed, "priority").and(Sort.by(reversed, "id"));
      case TITLE -> Sort.by(dir, "title").and(Sort.by(dir, "id"));
      case CREATED -> Sort.by(dir, "createdAt").and(Sort.by(dir, "id"));
      case UPDATED -> Sort.by(dir, "updatedAt").and(Sort.by(dir, "id"));
    };
  }
}
