package com.taskflow.dto.response;

import com.taskflow.entity.Category;

public record CategoryDto(long id, String name, String color) {

  public static CategoryDto from(Category c) {
    return new CategoryDto(c.getId(), c.getName(), c.getColor());
  }
}
