package com.taskflow.controller.api;

import com.taskflow.dto.response.CategoryDto;
import com.taskflow.service.CategoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** GET /api/categories → [CategoryDto], from the cache. */
@RestController
@RequiredArgsConstructor
public class CategoryApiController {

  private final CategoryService categories;

  @GetMapping("/api/categories")
  List<CategoryDto> list() {
    return categories.list().stream().map(CategoryDto::from).toList();
  }
}
