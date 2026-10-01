package com.taskflow.repository.projection;

/**
 * A Spring Data INTERFACE PROJECTION for "group by" queries: `select t.categoryId as id, count(t) as count …`.
 * Spring creates a proxy whose getters read the aliased columns. No entity, no extra class to fill by hand.
 */
public interface IdCount {

  Long getId();

  long getCount();
}
