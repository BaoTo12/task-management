package com.taskflow.service;

import com.taskflow.entity.Category;
import com.taskflow.repository.CategoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

/**
 * The categories, CACHED for the whole application: they're read on almost every page and change rarely.
 * Spring's cache abstraction does what the servlet era wrote by hand (a volatile immutable snapshot):
 *   @Cacheable("categories")  the first call runs the query; later calls return the cached list without running the method
 *   @CacheEvict               after any change, the next all() reloads
 * Works through a PROXY around this bean: a call from INSIDE this class (this.all()) would bypass the cache. That's why
 * the cache lives in its own small bean that CategoryService calls.
 * The cache is in-memory (ConcurrentMapCache): one server only, like the rest of TaskFlow's in-memory state.
 */
@Component
@RequiredArgsConstructor
public class CategoryCatalog {

  private final CategoryRepository categories;

  @Cacheable("categories")
  public List<Category> all() {
    return List.copyOf(categories.findAllByOrderByNameAsc());   // immutable: callers can't change the cached list
  }

  @CacheEvict(value = "categories", allEntries = true)
  public void evict() {
    // the annotation does the work
  }
}
