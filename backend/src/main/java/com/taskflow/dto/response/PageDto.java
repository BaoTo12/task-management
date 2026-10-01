package com.taskflow.dto.response;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/**
 * The list envelope of the API: {"items":[…],"page":0,"size":20,"totalItems":22,"totalPages":2}. `page` is 0-based,
 * like Spring Data's Page. Never serialise a Spring Data Page directly: its JSON shape is an implementation detail.
 */
public record PageDto<T>(List<T> items, int page, int size, long totalItems, int totalPages) {

  public static <E, T> PageDto<T> from(Page<E> page, Function<E, T> mapper) {
    return new PageDto<>(page.getContent().stream().map(mapper).toList(), page.getNumber(), page.getSize(),
        page.getTotalElements(), page.getTotalPages());
  }
}
