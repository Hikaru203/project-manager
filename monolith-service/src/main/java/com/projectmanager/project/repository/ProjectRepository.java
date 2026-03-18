package com.projectmanager.project.repository;

import com.projectmanager.project.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN p.members m " +
           "WHERE p.tenantId = :tenantId AND (p.ownerId = :userId OR m.userId = :userId)")
    List<Project> findByTenantAndUser(@Param("tenantId") UUID tenantId, @Param("userId") UUID userId);

    Optional<Project> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantIdAndKey(UUID tenantId, String key);
}
