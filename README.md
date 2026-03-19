# ProjectFlow - Modern Project Management System

A modern project management system designed with a Monolith architecture (evolved from microservices), inspired by Jira and Linear.

- [English](README.md) | [Tiếng Việt](README_VI.md) | [中文](README_ZH.md)

---

## 🏗️ Architecture & Technology

### Overall Architecture

```mermaid
graph TD
    subgraph Client_Side [Frontend]
        FE[Next.js 15 App]
        WS_Client[WebSocket Client/STOMP]
    end

    subgraph Infrastructure [Auth & Backend]
        AUTH[Auth Service :8080 - Render]
        MONO[Monolith Service :8081]
    end

    subgraph Monolith_Components [Internal Modules]
        PS[Project Module]
        TS[Task Module]
        CS[Comment Module]
        NS[Notification Module]
        AS[Audit Module - Activity Log]
    end

    subgraph Storage [PostgreSQL Database]
        DB_P[(projectdb - AWS/Render)]
    end

    FE -->|REST API| MONO
    MONO -->|Auth Check| AUTH
    
    MONO --- PS
    MONO --- TS
    MONO --- CS
    MONO --- NS
    MONO --- AS

    NS -.->|Real-time| WS_Client
    
    MONO --- DB_P
```

### Data Model (ER Diagram)
Understand the relationships between entities in the system:

```mermaid
erDiagram
    PROJECT ||--o{ TASK : "manages"
    PROJECT ||--o{ PROJECT_MEMBER : "has"
    TASK ||--o{ COMMENT : "has"
    TASK }|--o{ TASK_LABEL : "tagged with"
    PROJECT_MEMBER ||--|| USER : "links to"
    AUDIT_LOG }|--|| USER : "performed by"
    AUDIT_LOG }|--|| TASK : "references"
```

### Task Status Update Flow (Sequence)
Describes how the system handles task status updates:

```mermaid
sequenceDiagram
    participant FE as Frontend (Next.js)
    participant BE as Monolith (Spring Boot)
    participant AU as Audit Module
    
    FE->>BE: PATCH /api/v1/tasks/{id}/status (New Status)
    BE->>BE: Validate Transition Logic (e.g. DONE -> RE_OPEN)
    alt Valid
        BE->>BE: Update Database
        BE->>AU: Create Audit Log (Action: UPDATE_STATUS)
        AU-->>AU: Records actor, timestamp, old/new values
        BE-->>FE: HTTP 200 OK (Updated Task)
    else Invalid
        BE-->>FE: HTTP 400 Bad Request
    end
```

### Technology Stack
- **Backend**: Spring Boot 3.2, Java 21, Spring Security (JWT RS256).
- **Frontend**: Next.js 15 (App Router), React 19, Zustand, TailwindCSS, Framer Motion.
- **Data**: PostgreSQL 16, Flyway (Migration).
- **Communication**: REST API, WebSocket (STOMP), Secure API Key Signatures.
- **Key Features**: 
  - **Activity Log**: Tracks every change (task creation, status updates, member additions) with an intuitive timeline interface.
  - **Smart Task Status**: Supports flexible "Re-open" workflows and automatic status transitions during drag-and-drop.
- **Deployment**: Docker & Render (Free Tier Optimized).

---

## 🚀 Installation & Getting Started

### 1. Running Locally (For Developers)
1. **Frontend**:
   ```bash
   cd frontend
   cp .env.example .env.local # Configure API URLs here
   npm install
   npm run dev
   ```
2. **Backend (Monolith)**:
   ```bash
   cd monolith-service
   cp .env.example .env # Configure Database & Auth API Key here
   mvn clean package -pl monolith-service -am -DskipTests
   java -jar target/monolith-service-1.0.0.jar
   ```

### 2. Running with Docker
The system is pre-configured with Docker Compose:
```powershell
docker-compose up --build
```

### 3. Deployment Guide

#### A. Backend (Monolith & Auth) -> [Render](https://render.com)
1. **Create Web Service**: Connect your GitHub repository.
2. **Configure Monolith**:
   - **Environment**: `Docker`
   - **Dockerfile Path**: `monolith-service/Dockerfile`
   - **Environment Variables**:
     - `PORT`: 8081
     - `SPRING_DATASOURCE_URL`: (Render Postgres URL)
     - `ALLOWED_ORIGINS`: (Your Vercel URL)
3. **Configure Auth Service**: Same as above but pointing to the `auth-src` project.

#### B. Frontend -> [Vercel](https://vercel.com)
1. **Create Project**: Select the `frontend` folder.
2. **Environment Variables**:
   - `NEXT_PUBLIC_AUTH_URL`: `https://pm-auth-service.onrender.com`
   - `NEXT_PUBLIC_API_URL`: `https://your-monolith-service.onrender.com`

---

## 🔐 Important Notes for Deployment
- **CORS**: Ensure `ALLOWED_ORIGINS` on the server matches your frontend domain.
- **HTTPS**: All Production URLs must use `https://`.
- **Database**: Use Cloud PostgreSQL (Render/Supabase) to persist data across restarts.

---

## 📂 Directory Structure

| Folder | Description |
|---|---|
| `monolith-service/` | Unified backend (Project, Task, Comment, Notification, Audit). |
| `common-lib/` | Shared libraries (JWT Validator, DTOs, Exceptions). |
| `frontend/` | Modern Next.js user interface. |

### Backend Monolith Details
```text
monolith-service/
├── src/main/java/com/projectmanager/
│   ├── project/         # Project & Member Management
│   ├── task/            # Task Management, Status, Labels
│   ├── comment/         # Task Discussion
│   ├── audit/           # Activity Log System (Audit)
│   ├── notification/    # Notifications (Real-time & DB)
│   └── common/          # Security, Exception, Base DTOs
└── src/main/resources/
    └── db/migration/    # Database History (Flyway)
```

---

## 👩‍💻 Default Credentials
- **Account**: `admin`
- **Password**: `Admin@123`

---

## 🔗 Reference Links
- **Auth System (Original)**: [https://github.com/Hikaru203/auth](https://github.com/Hikaru203/auth)
- **Project Manager Repo**: [https://github.com/Hikaru203/project-manager.git](https://github.com/Hikaru203/project-manager.git)
