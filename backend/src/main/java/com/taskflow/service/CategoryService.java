package com.taskflow.service;

import com.taskflow.entity.Category;
import com.taskflow.exception.DuplicateException;
import com.taskflow.repository.CategoryRepository;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.projection.IdCount;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Category management. The rule it owns: a category that tasks still use can't be deleted (the schema would allow it,
 * setting their category to NULL; the business decided otherwise). create/rename throw DuplicateException when the
 * name is taken (case-insensitively: the _ci collation).
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CategoryService {

  public enum DeleteResult { DELETED, NOT_FOUND, IN_USE }

  private final CategoryRepository categories;
  private final CategoryCatalog catalog;
  private final TaskRepository tasks;

  public List<Category> list() {
    return catalog.all();                                         // from the cache
  }

  public Set<Long> ids() {
    return list().stream().map(Category::getId).collect(Collectors.toUnmodifiableSet());
  }

  public Optional<Category> byId(Long id) {
    return id == null ? Optional.empty() : list().stream().filter(c -> c.getId().equals(id)).findFirst();
  }

  /** Task count per category id (absent = 0). */
  public Map<Long, Long> taskCounts() {
    return tasks.countByCategory().stream().collect(Collectors.toMap(IdCount::getId, IdCount::getCount));
  }

  @Transactional
  public Category create(String name, String color) {
    try {
      Category created = categories.saveAndFlush(new Category(name, color));   // flush: the UNIQUE check happens NOW
      catalog.evict();
      return created;
    } catch (DataIntegrityViolationException e) {
      throw new DuplicateException("name", "A category named \"" + name + "\" already exists");
    }
  }

  @Transactional
  public boolean rename(long id, String name, String color) {
    Optional<Category> found = categories.findById(id);
    if (found.isEmpty()) return false;
    found.get().setName(name);                                    // a MANAGED entity: the change is saved at flush/commit
    found.get().setColor(color);
    try {
      categories.flush();
    } catch (DataIntegrityViolationException e) {
      throw new DuplicateException("name", "A category named \"" + name + "\" already exists");
    }
    catalog.evict();
    return true;
  }

  @Transactional
  public DeleteResult delete(long id) {
    if (!categories.existsById(id)) return DeleteResult.NOT_FOUND;
    if (taskCounts().getOrDefault(id, 0L) > 0) return DeleteResult.IN_USE;
    categories.deleteById(id);
    catalog.evict();
    return DeleteResult.DELETED;
  }
}
