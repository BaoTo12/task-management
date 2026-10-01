package com.taskflow.dto.view;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * One page of a list, as the JSP pagination tag (WEB-INF/tags/pagination.tag) reads it: the page NUMBER is 1-based
 * (what users see), plus the derived values. JavaBean getters so EL can read them: ${taskPage.totalPages}.
 * Built from Spring Data's Page (0-based), which is what repositories return.
 */
public record PageView<T>(List<T> items, int number, int size, long total) {

  public static <T> PageView<T> of(Page<T> page) {
    return new PageView<>(page.getContent(), page.getNumber() + 1, page.getSize(), page.getTotalElements());
  }

  public List<T> getItems() { return items; }
  public int getNumber() { return number; }
  public int getSize() { return size; }
  public long getTotal() { return total; }
  public int getTotalPages() { return lastPage(total, size); }
  public boolean isHasPrevious() { return number > 1; }
  public boolean isHasNext() { return number < getTotalPages(); }
  /** How many rows come before this page: the row numbers continue across pages (1–10, 11–20, …). */
  public int getOffset() { return (number - 1) * size; }

  /** The last page number for `total` rows (1 for an empty list: "page 1 of 1"). */
  public static int lastPage(long total, int size) {
    return total == 0 ? 1 : (int) ((total + size - 1) / size);
  }

  /** A requested page number, made valid: below 1 → 1, beyond the last page → the last page. */
  public static int clamp(int requested, long total, int size) {
    return Math.max(1, Math.min(requested, lastPage(total, size)));
  }
}
