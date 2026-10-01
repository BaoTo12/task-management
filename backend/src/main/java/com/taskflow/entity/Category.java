package com.taskflow.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** PROVIDED: a task category (V1: categories). EL only ever calls PUBLIC GETTERS: ${category.name} → getName(). */
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Setter(AccessLevel.NONE)            // the database chooses the id
  private Long id;
  private String name;
  private String color;

  public Category(String name, String color) {
    this.name = name;
    this.color = color;
  }
}
