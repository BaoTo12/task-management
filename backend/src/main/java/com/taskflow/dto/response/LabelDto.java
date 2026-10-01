package com.taskflow.dto.response;

import com.taskflow.entity.Label;

public record LabelDto(long id, String name, String color, Long createdBy) {

  public static LabelDto from(Label l) {
    return new LabelDto(l.getId(), l.getName(), l.getColor(), l.getCreatedBy());
  }
}
