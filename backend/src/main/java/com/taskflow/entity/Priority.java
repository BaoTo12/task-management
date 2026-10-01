package com.taskflow.entity;

/**
 * PROVIDED. Same values, in the same ORDER, as the database ENUM('LOW', 'MEDIUM', 'HIGH'): MySQL sorts an ENUM column
 * by that order, so "order by priority" is LOW → HIGH without a CASE expression.
 */
public enum Priority {
  LOW,
  MEDIUM,
  HIGH;

  public static Priority parse(String value) {
    if (value == null) return null;
    for (Priority priority : values()) {
      if (priority.name().equals(value)) return priority;
    }
    return null;
  }
}
