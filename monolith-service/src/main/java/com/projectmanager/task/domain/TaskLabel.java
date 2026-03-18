package com.projectmanager.task.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "task_labels")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TaskLabel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 7)
    @Builder.Default
    private String color = "#6366f1";
}
