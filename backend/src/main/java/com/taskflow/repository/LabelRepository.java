package com.taskflow.repository;

import com.taskflow.entity.Label;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** PROVIDED: labels. */
public interface LabelRepository extends JpaRepository<Label, Long> {

  List<Label> findAllByOrderByNameAsc();
}
