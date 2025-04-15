# EBL MCP Server Development Plan

This document outlines the planned phases and tasks for building the EBL MCP Server, which acts as a **gateway** to a backend Business Unit (BU) API defined in `external/bu/api.yaml`. The server uses the Model Context Protocol TypeScript SDK.

## Phase 1: Project Setup & Core Structure (Completed)

*   [x] Define project scope and core features (Issue, Query, Transfer, Surrender eBL via MCP gateway).
*   [x] Choose technology stack (TypeScript, pnpm, Node.js, **@modelcontextprotocol/sdk**, Zod).
*   [x] Create basic project directory structure (`src`, `services`, `models`, `schemas`).
*   [x] Create initial `README.md`.
*   [x] Create initial `PLAN.md`.
*   [ ] Initialize project using `pnpm init`.
*   [ ] Set up TypeScript configuration (`tsconfig.json`).
*   [ ] Install base dependencies (`typescript`, `@types/node`, `@modelcontextprotocol/sdk`, `zod`).
*   [ ] Install development runner
*   [ ] Set up linting and formatting (ESLint, Prettier).
*   [ ] Initialize `McpServer` instance in `src/index.ts`.
*   [ ] Implement a basic 'ping' MCP Tool.

## Phase 2: EBL Data Model & Schemas (In Progress)

*   [x] Define TypeScript interfaces/classes for the eBL structure (`src/models/ebl.model.ts`) based on backend API.
*   [x] **Define Zod schemas (`src/schemas/ebl.schema.ts`) for validating inputs/outputs of MCP Tools/Resources.**
    *   [x] `issue_ebl` input and output schemas.
    *   [ ] `get_ebl` output schema.
    *   [ ] `list_ebls` output schema.
    *   [ ] `transfer_ebl` input schema.
    *   [ ] `surrender_ebl` input schema.
*   [ ] Define helper types/schemas for backend API requests/responses if needed.

## Phase 3: MCP Resource & Tool Implementation (Gateway Logic)

*   [ ] **Set up HTTP client logic using native `fetch`** to communicate with the backend BU server.
*   [ ] **Implement `issue_ebl` MCP Tool:**
    *   Validate MCP input using `refinedIssueEblInputSchema` (requires `authentication_id`, `requester_bu_id`, `draft`, `file_content`, etc.).
    *   Transform input into the format expected by the backend `POST /ebl` request body (including header `X-Business-Unit-ID` from `requester_bu_id`).
    *   Call the backend `POST /ebl` endpoint using native `fetch`.
    *   Handle backend response (success/error).
    *   Transform backend success response (`BillOfLadingRecord`) to match the simplified `issueEblOutputSchema` (containing `{ id, version, holder }`).
    *   Return the transformed confirmation data as the MCP tool result.
*   [ ] **Implement `get_ebl` MCP Resource:**
    *   Define resource template (e.g., `ebl://{id}`).
    *   Extract eBL ID from the MCP resource request.
    *   Call the backend `GET /ebl/{id}` endpoint.
    *   Handle backend response.
    *   Transform backend response to match the `EblSchema`.
    *   Return transformed eBL data.
*   [ ] **Implement `list_ebls` MCP Resource (Optional):**
    *   Define resource template (e.g., `ebl://list`).
    *   Handle potential query parameters (filtering/pagination).
    *   Call the backend `GET /ebl` endpoint (passing necessary query params).
    *   Handle backend response.
    *   Transform backend response (list of eBLs) into appropriate MCP format.
*   [ ] **Implement `transfer_ebl` MCP Tool:**
    *   Validate MCP input (define schema first).
    *   Extract eBL ID and new holder info.
    *   Call the backend `POST /ebl/{id}/transfer` endpoint (or similar, based on `api.yaml`).
    *   Handle backend response.
    *   Return confirmation/status.
*   [ ] **Implement `surrender_ebl` MCP Tool:**
    *   Validate MCP input (define schema first).
    *   Extract eBL ID.
    *   Call the backend `POST /ebl/{id}/surrender` endpoint (or similar).
    *   Handle backend response.
    *   Return confirmation/status.
*   [ ] Implement robust error handling for both MCP interactions and backend API calls.
*   [ ] Add logging for MCP requests and backend interactions.

## Phase 4: Server Configuration & Transport (No Change)

*   [ ] **Configure the MCP Server instance** (name, version, capabilities).
*   [ ] **Choose and configure a transport mechanism** (e.g., `StdioServerTransport`).
*   [ ] Implement server startup logic in `src/index.ts` to connect the server instance to the chosen transport.
*   [ ] *Future:* Investigate integration with external MCP components (Identity Registry, Service Registry) if required by the target environment.
*   [ ] *Future:* Implement security measures (pass authentication details from MCP context to backend?).

## Phase 5: Testing & Deployment (Adjusted)

*   [ ] Write unit tests for schema transformations and helper functions.
*   [ ] Write integration tests simulating MCP client calls and verifying interactions with a *mock* backend server.
*   [ ] Prepare build scripts (`pnpm build`).
*   [ ] Document deployment procedures.
*   [ ] Set up CI/CD pipeline (Optional).
