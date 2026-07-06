# Task Checklist: Restore Workspace Persistence & Backend API Migration

## Phase 1: Shared Utilities & Repository Contracts
- [x] Create generic retry utility (`src/repositories/utils/retry.js`) with exponential backoff
- [x] Create repository performance metrics wrapper (`src/repositories/utils/metrics.js`)
- [x] Create pending operation queue manager (`src/repositories/utils/PendingQueue.js`)
- [x] Create tempId swapper utility (`src/application/utils/EntityIdentityResolver.js`)
- [x] Create repository base interface contracts:
  - [x] `src/repositories/contracts/IRepository.js`
  - [x] `src/repositories/contracts/IProjectRepository.js`
  - [x] `src/repositories/contracts/ITaskRepository.js`
  - [x] `src/repositories/contracts/IMeetingRepository.js`
  - [x] `src/repositories/contracts/ICatalogRepository.js`

## Phase 2: Backend Catalog API & Database Refinements
- [x] Create `backend/src/modules/catalog/` module files:
  - [x] `catalog.validators.js`
  - [x] `catalog.repository.js` (including idempotent creates checking for existing `tempId`)
  - [x] `catalog.service.js`
  - [x] `catalog.controller.js`
  - [x] `catalog.routes.js`
- [x] Mount catalog routes in `backend/src/app.js` under `/api/v1/catalog`
- [x] Update standard JSON response format in `backend/src/core/utils/responseFormatter.js` to auto-inject `workspaceId`, `timestamp`, and `apiVersion`
- [x] Enforce idempotency on existing repository `create` actions:
  - [x] `backend/src/modules/project/project.repository.js`
  - [x] `backend/src/modules/task/task.repository.js`
  - [x] `backend/src/modules/meeting/meeting.repository.js`
- [x] Update validators to allow optional schema properties `tempId`, `visibility`, and `ownerUid` for:
  - [x] `backend/src/modules/project/project.validators.js`
  - [x] `backend/src/modules/task/task.validators.js`
  - [x] `backend/src/modules/meeting/meeting.validators.js`

## Phase 3: Frontend API Clients & Concrete Repositories
- [x] Create API clients:
  - [x] `src/api/task.api.js`
  - [x] `src/api/meeting.api.js`
  - [x] `src/api/catalog.api.js`
- [x] Create concrete repositories implementing interfaces:
  - [x] `src/repositories/ProjectRepository.js`
  - [x] `src/repositories/TaskRepository.js`
  - [x] `src/repositories/MeetingRepository.js`
  - [x] `src/repositories/CatalogRepository.js`

## Phase 4: State Modules & Storage Refactoring
- [x] Refactor `WorkspaceStorageService.js` to structure local storage cache records with a metadata envelope
- [x] Rename and refactor `ScheduleModule.js` → `MeetingsModule.js` (pointing to `meetings` collection with listener validation)
- [x] Refactor `ProjectsModule.js` to validate schema and `updatedAt` on snapshot events
- [x] Refactor `TasksModule.js` to validate schema and `updatedAt` on snapshot events
- [x] Refactor `CatalogModule.js` to validate schema and `updatedAt` on snapshot events

## Phase 5: Hook Refactoring & UI Alignments
- [x] Refactor `useCloudSync.js` to remove generic syncing writes and client Firestore `setDoc()` routines
- [x] Refactor `useProjects.js` to use `ProjectRepository`
- [x] Refactor `useTodos.js` to use `TaskRepository`
- [x] Rename and refactor `useSchedule.js` → `useMeetings.js` (using `MeetingRepository`)
- [x] Refactor `useCatalog.js` to use `CatalogRepository`
- [x] Update `App.jsx` hooks binding (wire up `useTodos` state, use meetings state and handlers)
- [x] Search and replace all schedule naming and variables with meetings in UI views:
  - [x] `src/components/views/TodoView.jsx`
  - [x] `src/components/views/CommonModals.jsx`
  - [x] Other UI views
- [x] Perform audit check to remove any remaining client Firestore write APIs in business codebase
