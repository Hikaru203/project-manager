package com.projectmanager.project.service;

import com.projectmanager.common.exception.*;
import com.projectmanager.common.security.UserContext;
import com.projectmanager.project.domain.*;
import com.projectmanager.project.dto.*;
import com.projectmanager.project.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final com.projectmanager.audit.service.AuditService auditService;

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request) {
        UUID userId = UserContext.getCurrentUserId();
        UUID tenantId = UserContext.getCurrentTenantId();
        String username = UserContext.getCurrentUsername();

        if (projectRepository.existsByTenantIdAndKey(tenantId, request.getKey())) {
            throw new BadRequestException("Project key already exists: " + request.getKey());
        }

        Project project = Project.builder()
                .tenantId(tenantId)
                .name(request.getName())
                .description(request.getDescription())
                .key(request.getKey())
                .ownerId(userId)
                .icon(request.getIcon())
                .color(request.getColor() != null ? request.getColor() : "#6366f1")
                .build();

        project = projectRepository.save(project);

        // Add creator as OWNER member
        ProjectMember ownerMember = ProjectMember.builder()
                .project(project)
                .userId(userId)
                .username(username)
                .role(ProjectRole.OWNER)
                .build();
        memberRepository.save(ownerMember);

        auditService.createLog(com.projectmanager.audit.dto.CreateAuditLogRequest.builder()
                .action("CREATE_PROJECT")
                .entityType("PROJECT")
                .entityId(project.getId())
                .newValue(Map.of("name", project.getName(), "key", project.getKey()))
                .build());

        return toResponse(project);
    }

    public List<ProjectResponse> getMyProjects() {
        UUID userId = UserContext.getCurrentUserId();
        UUID tenantId = UserContext.getCurrentTenantId();
        return projectRepository.findByTenantAndUser(tenantId, userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProject(UUID projectId) {
        Project project = findProjectInTenant(projectId);
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse updateProject(UUID projectId, UpdateProjectRequest request) {
        Project project = findProjectInTenant(projectId);
        checkProjectPermission(project, ProjectRole.ADMIN);

        Map<String, Object> oldVal = Map.of("name", project.getName());

        if (request.getName() != null) project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getIcon() != null) project.setIcon(request.getIcon());
        if (request.getColor() != null) project.setColor(request.getColor());
        if (request.getStatus() != null) project.setStatus(request.getStatus());

        project = projectRepository.save(project);
        
        auditService.createLog(com.projectmanager.audit.dto.CreateAuditLogRequest.builder()
                .action("UPDATE_PROJECT")
                .entityType("PROJECT")
                .entityId(project.getId())
                .oldValue(oldVal)
                .newValue(Map.of("name", project.getName()))
                .build());

        return toResponse(project);
    }

    @Transactional
    public void deleteProject(UUID projectId) {
        Project project = findProjectInTenant(projectId);
        if (!project.getOwnerId().equals(UserContext.getCurrentUserId())) {
            throw new ForbiddenException("Only project owner can delete the project");
        }
        projectRepository.delete(project);
        
        auditService.createLog(com.projectmanager.audit.dto.CreateAuditLogRequest.builder()
                .action("DELETE_PROJECT")
                .entityType("PROJECT")
                .entityId(projectId)
                .oldValue(Map.of("name", project.getName()))
                .build());
    }

    @Transactional
    public ProjectResponse.MemberResponse addMember(UUID projectId, AddMemberRequest request) {
        Project project = findProjectInTenant(projectId);
        checkProjectPermission(project, ProjectRole.ADMIN);

        if (memberRepository.existsByProjectIdAndUserId(projectId, request.getUserId())) {
            throw new BadRequestException("User is already a member");
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .userId(request.getUserId())
                .username(request.getUsername())
                .role(ProjectRole.valueOf(request.getRole().toUpperCase()))
                .build();
        member = memberRepository.save(member);

        auditService.createLog(com.projectmanager.audit.dto.CreateAuditLogRequest.builder()
                .action("ADD_MEMBER")
                .entityType("PROJECT")
                .entityId(projectId)
                .newValue(Map.of("username", member.getUsername(), "role", member.getRole().name()))
                .build());

        return toMemberResponse(member);
    }

    @Transactional
    public void removeMember(UUID projectId, UUID userId) {
        Project project = findProjectInTenant(projectId);
        checkProjectPermission(project, ProjectRole.ADMIN);

        if (project.getOwnerId().equals(userId)) {
            throw new BadRequestException("Cannot remove project owner");
        }

        memberRepository.deleteByProjectIdAndUserId(projectId, userId);
        
        auditService.createLog(com.projectmanager.audit.dto.CreateAuditLogRequest.builder()
                .action("REMOVE_MEMBER")
                .entityType("PROJECT")
                .entityId(projectId)
                .oldValue(Map.of("userId", userId.toString()))
                .build());
    }

    public List<ProjectResponse.MemberResponse> getMembers(UUID projectId) {
        findProjectInTenant(projectId); // verify access
        return memberRepository.findByProjectId(projectId).stream()
                .map(this::toMemberResponse)
                .collect(Collectors.toList());
    }

    // -- helpers --

    private Project findProjectInTenant(UUID projectId) {
        UUID tenantId = UserContext.getCurrentTenantId();
        return projectRepository.findByIdAndTenantId(projectId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));
    }

    private void checkProjectPermission(Project project, ProjectRole minRole) {
        UUID userId = UserContext.getCurrentUserId();
        if (project.getOwnerId().equals(userId)) return;

        ProjectMember member = memberRepository.findByProjectIdAndUserId(project.getId(), userId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this project"));

        if (minRole == ProjectRole.ADMIN &&
            member.getRole() != ProjectRole.OWNER &&
            member.getRole() != ProjectRole.ADMIN) {
            throw new ForbiddenException("Admin access required");
        }
    }

    private ProjectResponse toResponse(Project project) {
        List<ProjectMember> members = memberRepository.findByProjectId(project.getId());
        String ownerName = members.stream()
                .filter(m -> m.getUserId().equals(project.getOwnerId()))
                .findFirst()
                .map(ProjectMember::getUsername)
                .orElse("Unknown");

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .key(project.getKey())
                .ownerId(project.getOwnerId())
                .ownerName(ownerName)
                .status(project.getStatus())
                .icon(project.getIcon())
                .color(project.getColor())
                .memberCount(members.size())
                .members(members.stream().map(this::toMemberResponse).collect(Collectors.toList()))
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private ProjectResponse.MemberResponse toMemberResponse(ProjectMember m) {
        return ProjectResponse.MemberResponse.builder()
                .id(m.getId())
                .userId(m.getUserId())
                .username(m.getUsername())
                .role(m.getRole().name())
                .joinedAt(m.getJoinedAt())
                .build();
    }
}
