package com.taskflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** PROVIDED: a label (V4: labels), shared by everyone; tasks reference labels through task_labels (Task.labelIds). */
@Entity
@Table(name = "labels")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Label {

  public static final int NAME_MAX = 30;

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Setter(AccessLevel.NONE)
  private Long id;
  private String name;
  private String color;
  @Column(name = "created_by", updatable = false)
  @Setter(AccessLevel.NONE)
  private Long createdBy;

  public Label(String name, String color, Long createdBy) {
    this.name = name;
    this.color = color;
    this.createdBy = createdBy;
  }
}
