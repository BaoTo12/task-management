package com.taskflow.repository;

import com.taskflow.entity.Category;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** PROVIDED: categories. A DERIVED query: Spring reads the method name and writes "… order by c.name asc". */
public interface CategoryRepository extends JpaRepository<Category, Long> {

  List<Category> findAllByOrderByNameAsc();
}
