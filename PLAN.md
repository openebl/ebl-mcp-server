# EBL MCP Server Development Plan

This document outlines the planned phases and tasks for building the EBL MCP Server, which acts as a **gateway** to a backend Business Unit (BU) API defined in `external/bu/api.yaml`.

## Phase 1: Project Setup & Core Structure (Completed)

*   [x] Define project scope and core features (Issue, Query, Transfer, Surrender eBL via MCP gateway).
*   [x] Choose technology stack (TypeScript, pnpm, Node.js, Zod).
*   [x] Create basic project directory structure (`src`, `models`, `schemas`, `tools`, `util`).
*   [x] Create initial `README.md`.
*   [x] Create initial `PLAN.md`.
*   [x] Initialize project using `pnpm init`.
*   [x] Set up TypeScript configuration (`tsconfig.json`).
*   [x] Install base dependencies (`typescript`, `@types/node`, `zod`).
*   [x] Set up linting and formatting (ESLint, Prettier).
*   [x] Implement a basic 'ping' MCP Tool.

## Phase 2: API Integration Setup (Completed)

*   [x] Install API integration dependencies (`openapi-fetch`, `openapi-typescript`).
*   [x] Generate OpenAPI TypeScript definitions from `external/bu/api.yaml` with `openapi-typescript`.
*   [x] Create client utility (`src/util/client.ts`) with strongly-typed API operations.
*   [x] Implement authentication utilities (`src/util/auth.ts`) for BU API integration.
*   [x] Set up error handling for API interactions.

## Phase 3: EBL Core Data Model (Completed)

*   [x] Define TypeScript interfaces for the eBL structure (`src/models/ebl.model.ts`) based on the backend API.
*   [x] Define core enums for eBL states and types.

## Phase 4: Issue EBL Implementation (Completed)

*   [x] Define Zod schemas for issue_ebl input validation (`src/schemas/ebl.schema.ts`).
*   [x] Implement refined schema with conditional validation for issue requirements.
*   [x] Define issue_ebl output schema for tool response.
*   [x] Implement `issue_ebl` MCP Tool:
    *   [x] Input validation with the refined schema.
    *   [x] Transform MCP input to backend API format.
    *   [x] API integration using OpenAPI-typed client.
    *   [x] Proper error handling.
    *   [x] Response transformation to MCP format.

## Phase 5: Additional EBL Operations (Not Started)

*   [ ] **Transfer EBL Implementation:**
    *   [ ] Define transfer_ebl input schema.
    *   [ ] Implement transfer_ebl MCP Tool.
*   [ ] **Surrender EBL Implementation:**
    *   [ ] Define surrender_ebl input schema.
    *   [ ] Implement surrender_ebl MCP Tool.
*   [ ] **Get EBL Implementation:**
    *   [ ] Define get_ebl output schema.
    *   [ ] Implement get_ebl MCP Resource or Tool.
*   [ ] **List EBLs Implementation (Optional):**
    *   [ ] Define list_ebls output schema.
    *   [ ] Implement list_ebls MCP Resource or Tool.

## Phase 6: Testing & Deployment (Not Started)

*   [ ] Write unit tests for schema transformations and helper functions.
*   [ ] Write integration tests simulating API calls with mock backend.
*   [ ] Document API and tool usage.
*   [ ] Prepare for deployment.
