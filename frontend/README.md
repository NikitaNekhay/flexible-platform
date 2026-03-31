# Frontend Technical Specification
## Attack Scenario Constructor & Execution Platform

---

# 1. Overview

This document is the **complete implementation guide** for the frontend of the Attack Scenario Constructor & Execution Platform. It is written for Claude Code to implement from scratch with zero ambiguity.

The platform allows mentors to:
- Build attack scenario chains based on MITRE ATT&CK
- Execute them on a cyber range
- Monitor execution in real-time

The frontend communicates with the backend (Sliver Scenario Orchestrator) via REST API and SSE (Server-Sent Events).

---

# 2. Core Principles

- Single scenario execution at a time
- Scenarios are pre-built and must work on execution without modification
- Constructor is used for creation and validation only
- Execution view is read-only with optional step inspection/edit access
- UI must be production-grade, **dark mode only** — no light mode toggle
- Max steps per scenario: ~30
- Real-time streaming is critical

---

# 3. User Roles

## 3.1 Mentor (Full Access)
- Create/edit/delete scenarios
- Execute scenarios
- Upload files
- View logs
- Access all features

## 3.2 Viewer (Restricted)
- View scenarios
- Clone scenarios
- Build new scenarios from library
- Cannot modify existing validated scenarios

---

# 4. Tech Stack

## 4.1 Core Framework

| Package | Version | Purpose |
|---|---|---|
| `react` | `^18.3.1` | UI framework |
| `react-dom` | `^18.3.1` | DOM rendering |
| `typescript` | `^5.4.5` | Type safety |

**Rationale:** React 18 automatic batching prevents unnecessary re-renders from high-frequency SSE events (step_log bursts). TypeScript is mandatory — all domain types must be defined before any component code.

## 4.2 Build Tool

| Package | Version | Purpose |
|---|---|---|
| `vite` | `^5.2.11` | Build tool and dev server |
| `@vitejs/plugin-react` | `^4.3.1` | React HMR support |

Vite's dev server proxy handles `/api/v1` → backend and correctly passes SSE streams without buffering.

## 4.3 UI Component Library — Mantine v7

| Package | Version | Purpose |
|---|---|---|
| `@mantine/core` | `^7.11.1` | Core components |
| `@mantine/hooks` | `^7.11.1` | UI hooks |
| `@mantine/form` | `^7.11.1` | Form management |
| `@mantine/notifications` | `^7.11.1` | Toast notifications |
| `@mantine/modals` | `^7.11.1` | Modal manager |
| `@mantine/dates` | `^7.11.1` | Date formatting |

**Why Mantine:** First-class dark mode via CSS variable theming (`forceColorScheme="dark"`). Ships Modal, Drawer, Notification, Table, MultiSelect, FileInput, Badge, Tabs, Spotlight, ScrollArea, Code in one coherent design system with zero style conflicts. Covers 90% of component needs without additional UI libraries.

## 4.4 State Management

| Package | Version | Purpose |
|---|---|---|
| `@reduxjs/toolkit` | `^2.2.5` | Redux + RTK Query |
| `react-redux` | `^9.1.2` | React bindings |

RTK Query replaces manual Axios service calls for all REST endpoints (caching, loading/error states, cache invalidation). The `execution` slice is managed manually because SSE-driven state requires imperative dispatch.

## 4.5 Routing

| Package | Version |
|---|---|
| `react-router-dom` | `^6.24.1` |

Use `createBrowserRouter` with an authenticated layout shell via `Outlet`.

## 4.6 Form Validation

| Package | Version | Purpose |
|---|---|---|
| `zod` | `^3.23.8` | Schema validation + type inference |
| `mantine-form-zod-resolver` | `^1.1.0` | Bridge between Zod and `@mantine/form` |

A single Zod schema both validates and types each step action sub-form. No `react-hook-form` — `@mantine/form` integrates natively with all Mantine inputs.

## 4.7 Tables

| Package | Version | Purpose |
|---|---|---|
| `@tanstack/react-table` | `^8.17.3` | Headless table logic |

Headless approach: TanStack Table handles sorting/filtering/selection logic; Mantine `<Table>` provides markup. Used for Scenarios List, Sessions Selector, and Execution Steps view.

## 4.8 DAG Visualization

| Package | Version | Purpose |
|---|---|---|
| `@xyflow/react` | `^12.3.2` | Interactive node graph (React Flow v12) |
| `dagre` | `^0.8.5` | Auto-layout algorithm |

Used in Scenario Editor as a collapsible DAG view panel showing step dependencies. **Critical:** the container div must have an explicit pixel height — React Flow renders at 0px otherwise.

## 4.9 Drag & Drop

| Package | Version | Purpose |
|---|---|---|
| `@dnd-kit/core` | `^6.1.0` | DnD engine |
| `@dnd-kit/sortable` | `^8.0.0` | Sortable list primitives |
| `@dnd-kit/utilities` | `^3.2.2` | CSS transform helpers |

Used for drag-to-reorder step rows in the Scenario Editor table. `SortableContext` wraps `<tbody>`, not the full `<table>`. Each `StepRow` calls `useSortable({ id: step.id })`.

## 4.10 Terminal Log Viewer

| Package | Version | Purpose |
|---|---|---|
| `@xterm/xterm` | `^5.5.0` | Terminal emulator |
| `@xterm/addon-fit` | `^0.10.0` | Container resize fit |
| `@xterm/addon-search` | `^0.15.0` | In-terminal search |

Used in Execution Viewer to render streaming logs. Handles ANSI escape codes, auto-scroll, and large log volumes via canvas renderer without DOM explosion.

**Critical implementation note:** xterm.js is NOT a React component. Use `useRef` for the `Terminal` instance and `useEffect` to init/dispose. Always call `terminal.dispose()` in cleanup. Call `fitAddon.fit()` after mount and on `window.resize`.

## 4.11 YAML Editor / Parser

| Package | Version | Purpose |
|---|---|---|
| `@uiw/react-codemirror` | `^4.22.1` | Embedded code editor |
| `@codemirror/lang-yaml` | `^6.1.1` | YAML syntax highlighting |
| `js-yaml` | `^4.1.0` | Parse/stringify YAML |

Used in YAML Import modal. `js-yaml` handles `Chain ↔ YAML string` conversion in `src/utils/yamlUtils.ts`.

## 4.12 i18n

| Package | Version | Purpose |
|---|---|---|
| `i18next` | `^23.12.2` | i18n core |
| `react-i18next` | `^14.1.2` | React bindings |
| `i18next-browser-languagedetector` | `^8.0.0` | Read from localStorage only |

Languages: **English (default)** and **Russian**. Manual toggle only — no auto-detection from browser locale. Detector configured with `order: ['localStorage']` only.

## 4.13 HTTP Client

| Package | Version | Purpose |
|---|---|---|
| `axios` | `^1.7.2` | HTTP client (via RTK Query axiosBaseQuery) |
| `@microsoft/fetch-event-source` | `^2.0.1` | SSE with auth headers support |

`@microsoft/fetch-event-source` is a fallback for native `EventSource` if the backend requires `Authorization` headers on the SSE stream (native `EventSource` cannot send custom headers).

---

# 5. Complete `package.json`

```json
{
  "name": "attack-scenario-platform",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.1",
    "@reduxjs/toolkit": "^2.2.5",
    "react-redux": "^9.1.2",
    "@mantine/core": "^7.11.1",
    "@mantine/hooks": "^7.11.1",
    "@mantine/form": "^7.11.1",
    "@mantine/notifications": "^7.11.1",
    "@mantine/modals": "^7.11.1",
    "@mantine/dates": "^7.11.1",
    "@tanstack/react-table": "^8.17.3",
    "@xyflow/react": "^12.3.2",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@xterm/xterm": "^5.5.0",
    "@xterm/addon-fit": "^0.10.0",
    "@xterm/addon-search": "^0.15.0",
    "@uiw/react-codemirror": "^4.22.1",
    "@codemirror/lang-yaml": "^6.1.1",
    "i18next": "^23.12.2",
    "react-i18next": "^14.1.2",
    "i18next-browser-languagedetector": "^8.0.0",
    "zod": "^3.23.8",
    "mantine-form-zod-resolver": "^1.1.0",
    "js-yaml": "^4.1.0",
    "dagre": "^0.8.5",
    "axios": "^1.7.2",
    "@microsoft/fetch-event-source": "^2.0.1"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "vite": "^5.2.11",
    "@vitejs/plugin-react": "^4.3.1",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/js-yaml": "^4.0.9",
    "@types/dagre": "^0.7.52",
    "eslint": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0"
  }
}
```

---

# 6. Project Setup Files

## `index.html`
Standard Vite entry. `<div id="root">` is the React mount point.

## `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/api/v1': {
        target: process.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
        changeOrigin: true,
        // SSE streams pass through correctly when not buffered
        configure: (proxy) => {
          proxy.on('error', (err) => console.error('[proxy error]', err));
        },
      },
    },
  },
});
```

## `.env.development`
```
VITE_API_BASE_URL=http://localhost:8080
```

## `tsconfig.json`
Standard React + Vite tsconfig. Include `"baseUrl": "."` and `"paths": { "@/*": ["src/*"] }`.

---

# 7. Folder Structure

```
src/
├── main.tsx                        # Bootstrap: i18n init → MantineProvider → Store → RouterProvider
├── App.tsx                         # RouterProvider wrapper
├── router.tsx                      # createBrowserRouter with all routes
├── i18n.ts                         # i18next configuration
│
├── theme/
│   ├── theme.ts                    # MantineTheme: cyan primary, dark, monospace fonts
│   └── globalStyles.css            # CSS resets, xterm.js container styles
│
├── types/                          # ALL TypeScript domain types (defined before any other src)
│   ├── chain.ts                    # Chain, Step, ActionType, all action payload types
│   ├── session.ts                  # Session
│   ├── atomic.ts                   # Atomic, AtomicTest, AtomicArgument
│   ├── execution.ts                # Execution, StepExecutionStatus, status enums
│   ├── sse.ts                      # SSEStepStart, SSEStepDone, SSEStepFailed, SSEStepLog, SSEChainDone, SSEChainFailed, SSEEvent union
│   ├── api.ts                      # API error shape, response wrappers
│   └── index.ts                    # Re-exports all types
│
├── store/
│   ├── index.ts                    # configureStore, RootState, AppDispatch
│   ├── hooks.ts                    # useAppDispatch, useAppSelector typed hooks
│   ├── api/
│   │   ├── baseApi.ts              # createApi with axiosBaseQuery (Axios bridge for RTK Query)
│   │   ├── chainsApi.ts            # getChains, getChain, createChain, updateChain, deleteChain, executeChain
│   │   ├── sessionsApi.ts          # getSessions
│   │   ├── atomicsApi.ts           # getAtomics, getAtomic
│   │   ├── executionsApi.ts        # getExecution, cancelExecution
│   │   └── healthApi.ts            # getHealth (pollingInterval: 30000)
│   └── slices/
│       ├── authSlice.ts            # token, role ('mentor'|'viewer'), login/logout
│       ├── scenariosSlice.ts       # selectedScenarioId (list data lives in RTK Query cache)
│       ├── editorSlice.ts          # steps[], validationState, isDirty
│       ├── executionSlice.ts       # executionId, stepsStatus map, streamStatus, sseEventReceived
│       └── uiSlice.ts              # language toggle, sidebar open state
│
├── services/
│   ├── axiosInstance.ts            # Axios instance: baseURL=/api/v1, auth interceptor, error interceptor
│   └── sseService.ts               # SSEService class: connect/disconnect, reconnect (max 3), EventSource lifecycle
│
├── hooks/
│   ├── useSSE.ts                   # Mounts SSE connection for executionId, dispatches to executionSlice
│   ├── useDAGValidation.ts         # Runs dagUtils on editorSlice.steps, writes to validationState
│   ├── useYAML.ts                  # Chain ↔ YAML string via js-yaml
│   ├── usePermissions.ts           # Role-based feature flag booleans from authSlice
│   └── useStepForm.ts              # @mantine/form instance with Zod resolver for Step editing
│
├── utils/
│   ├── dagUtils.ts                 # topologicalSort (Kahn's BFS), cycleDetection, missingDepsCheck
│   ├── yamlUtils.ts                # chainToYAML(chain: Chain): string, yamlToChain(yaml: string): Chain
│   ├── formatUtils.ts              # formatDuration(ms: number): string, formatTimestamp(iso: string): string
│   └── constants.ts                # ACTION_TYPES array, MITRE_TACTICS map, ON_FAIL_OPTIONS
│
├── components/                     # Shared reusable components (no page-specific logic)
│   ├── StatusBadge.tsx             # Colored badge: pending/running/done/failed/skipped
│   ├── MitreTacticBadge.tsx        # Badge colored by MITRE tactic category
│   ├── ConfirmModal.tsx            # Generic "Are you sure?" modal via @mantine/modals
│   ├── ErrorBoundary.tsx           # React error boundary with Mantine error display
│   ├── LoadingOverlay.tsx          # Mantine LoadingOverlay wrapper
│   ├── CodeBlock.tsx               # Mantine Code with copy-to-clipboard button
│   ├── TerminalPanel.tsx           # xterm.js wrapper: useRef Terminal, useEffect init/dispose, FitAddon
│   └── forms/
│       ├── ActionTypeSelect.tsx    # Mantine Select for ActionType enum
│       ├── DependsOnSelect.tsx     # Mantine MultiSelect populated from current step IDs
│       └── action-forms/
│           ├── CommandForm.tsx     # executor + command fields
│           ├── AtomicForm.tsx      # technique_id, test_index, arguments (dynamic from AtomicSelectorModal)
│           ├── BinaryForm.tsx      # source toggle (url/upload), destination_path, execute_after_upload
│           ├── UploadForm.tsx      # source toggle (url/upload), destination_path
│           ├── SliverRpcForm.tsx   # rpc_method + params (JSON key-value editor)
│           ├── PythonForm.tsx      # script (CodeMirror python) + args[]
│           └── ProbeForm.tsx       # probe_type, target, expected_result, timeout_seconds
│
├── pages/
│   ├── layout/
│   │   ├── AppShell.tsx            # Mantine AppShell: collapsible navbar + top header
│   │   ├── Navbar.tsx              # Navigation links to Dashboard, Scenarios; i18n aware
│   │   └── Header.tsx              # Language toggle (EN/RU button), user role badge
│   │
│   ├── Dashboard/
│   │   ├── index.tsx               # SimpleGrid layout: HealthCard + ActiveSessionCard + quick actions
│   │   ├── HealthCard.tsx          # Polls GET /health every 30s; green/red status dot + uptime
│   │   └── ActiveSessionCard.tsx   # Count of sessions from getSessions; "Start Execution" button
│   │
│   ├── ScenariosList/
│   │   ├── index.tsx               # Page wrapper, toolbar (New + Import YAML), ScenariosTable
│   │   ├── ScenariosTable.tsx      # TanStack Table: name, description, tags, MITRE tactics, Actions column
│   │   ├── ScenarioRow.tsx         # Row with ActionIcons: Edit, Execute, Clone, Delete
│   │   └── ImportYAMLButton.tsx    # Opens YAMLImportModal, creates chain on confirm
│   │
│   ├── ScenarioEditor/
│   │   ├── index.tsx               # Loads chain by ID, seeds editorSlice, layout: toolbar + table + DAG panel
│   │   ├── EditorToolbar.tsx       # Save, Validate (dry_run), Export YAML, Import YAML, Back buttons
│   │   ├── StepsTable.tsx          # dnd-kit SortableContext wrapping Mantine Table tbody
│   │   ├── StepRow.tsx             # useSortable row; drag handle, step name (click→modal), action icons
│   │   ├── DAGViewer.tsx           # Collapsible React Flow panel; dagre auto-layout; click node→StepEditorModal
│   │   └── modals/
│   │       ├── StepEditorModal.tsx         # Mantine ContextModal; Tabs: General | Action | Conditions | Output Vars
│   │       ├── AtomicSelectorModal.tsx     # Search input + scrollable list grouped by tactic; selection fills AtomicForm
│   │       └── YAMLImportModal.tsx         # CodeMirror YAML editor + parse preview + confirm/cancel
│   │
│   └── ExecutionViewer/
│       ├── index.tsx               # Mounts useSSE(executionId); layout: toolbar + steps table + log drawer
│       ├── SessionSelectorModal.tsx # Mantine Modal with TanStack Table of sessions; confirm → executeChain → navigate
│       ├── ExecutionStepsTable.tsx  # TanStack Table: step_id, name, StatusBadge, duration; row click → StepLogDrawer
│       ├── StepLogDrawer.tsx        # Mantine Drawer (position=bottom); contains TerminalPanel; writes logs on state change
│       └── ExecutionToolbar.tsx     # Overall StatusBadge, Cancel button (POST /executions/:id/cancel), stream indicator
│
└── locales/
    ├── en/
    │   ├── common.json             # nav, buttons, labels
    │   ├── editor.json             # editor-specific strings
    │   ├── execution.json          # execution view strings
    │   └── errors.json             # error messages
    └── ru/
        ├── common.json
        ├── editor.json
        ├── execution.json
        └── errors.json
```

---

# 8. TypeScript Domain Types

## `src/types/chain.ts`

```typescript
export type ActionType =
  | 'command'
  | 'atomic'
  | 'binary'
  | 'upload'
  | 'sliver_rpc'
  | 'python'
  | 'probe';

export interface CommandAction {
  type: 'command';
  executor: string;       // "cmd" | "powershell" | "bash" | "sh"
  command: string;
}

export interface AtomicAction {
  type: 'atomic';
  technique_id: string;   // e.g. "T1059.001"
  test_index: number;
  arguments: Record<string, string>;
}

export interface BinaryAction {
  type: 'binary';
  source: 'url' | 'upload';
  url?: string;
  file_ref?: string;
  destination_path: string;
  execute_after_upload: boolean;
}

export interface UploadAction {
  type: 'upload';
  source: 'url' | 'upload';
  url?: string;
  file_ref?: string;
  destination_path: string;
}

export interface SliverRpcAction {
  type: 'sliver_rpc';
  rpc_method: string;
  params: Record<string, unknown>;
}

export interface PythonAction {
  type: 'python';
  script: string;
  args?: string[];
}

export interface ProbeAction {
  type: 'probe';
  probe_type: string;     // "tcp" | "http" | "process_exists"
  target: string;
  expected_result: string;
  timeout_seconds: number;
}

export type StepAction =
  | CommandAction | AtomicAction | BinaryAction
  | UploadAction | SliverRpcAction | PythonAction | ProbeAction;

export type OnFailBehavior = 'stop' | 'continue' | 'skip_dependents';

export interface StepCondition {
  variable: string;
  operator: 'eq' | 'neq' | 'contains' | 'regex';
  value: string;
}

export interface Step {
  id: string;
  name: string;
  depends_on: string[];
  action: StepAction;
  conditions?: StepCondition[];
  output_vars?: string[];
  on_fail: OnFailBehavior;
}

export interface Chain {
  id: string;
  name: string;
  description: string;
  tags: string[];
  mitre_tactics: string[];
  steps: Step[];
  created_at: string;
  updated_at: string;
  validated: boolean;
}

export type ChainCreatePayload = Omit<Chain, 'id' | 'created_at' | 'updated_at' | 'validated'>;
export type ChainUpdatePayload = Partial<ChainCreatePayload>;
```

## `src/types/session.ts`

```typescript
export interface Session {
  id: string;
  hostname: string;
  os: string;
  username: string;
  arch: string;
  pid: number;
  connected_at: string;
  last_seen: string;
}
```

## `src/types/atomic.ts`

```typescript
export interface AtomicArgument {
  name: string;
  description: string;
  type: 'string' | 'integer' | 'boolean' | 'path';
  default?: string;
  required: boolean;
}

export interface AtomicTest {
  test_index: number;
  name: string;
  description: string;
  platforms: string[];
  executor: string;
  arguments: AtomicArgument[];
}

export interface Atomic {
  technique_id: string;
  technique_name: string;
  tactic: string;
  tests: AtomicTest[];
}
```

## `src/types/execution.ts`

```typescript
export type StepStatusValue = 'pending' | 'running' | 'done' | 'failed' | 'skipped';
export type ExecutionStatusValue = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
export type StreamStatusValue = 'idle' | 'connecting' | 'connected' | 'error';

export interface StepExecutionStatus {
  step_id: string;
  step_name: string;
  status: StepStatusValue;
  started_at?: string;
  finished_at?: string;
  duration_ms?: number;
  exit_code?: number;
  logs: string[];           // append-only; each string is one raw log line
}

export interface Execution {
  id: string;
  chain_id: string;
  session_id: string;
  status: ExecutionStatusValue;
  started_at: string;
  finished_at?: string;
  steps: StepExecutionStatus[];
}

export interface ExecuteChainRequest {
  session_id: string;
  dry_run?: boolean;
}

export interface ExecuteChainResponse {
  execution_id: string;
}
```

## `src/types/sse.ts`

```typescript
export interface SSEStepStart {
  event: 'step_start';
  step_id: string;
  step_name: string;
  timestamp: string;
}

export interface SSEStepDone {
  event: 'step_done';
  step_id: string;
  exit_code: number;
  duration_ms: number;
  timestamp: string;
}

export interface SSEStepFailed {
  event: 'step_failed';
  step_id: string;
  error: string;
  exit_code?: number;
  duration_ms: number;
  timestamp: string;
}

export interface SSEStepLog {
  event: 'step_log';
  step_id: string;
  line: string;
  timestamp: string;
}

export interface SSEChainDone {
  event: 'chain_done';
  execution_id: string;
  duration_ms: number;
  timestamp: string;
}

export interface SSEChainFailed {
  event: 'chain_failed';
  execution_id: string;
  error: string;
  failed_step_id: string;
  timestamp: string;
}

export type SSEEvent =
  | SSEStepStart | SSEStepDone | SSEStepFailed
  | SSEStepLog | SSEChainDone | SSEChainFailed;
```

---

# 9. Redux Store Architecture

## Store slices

| Slice | Managed by | Contents |
|---|---|---|
| `auth` | Manual | `token`, `role: 'mentor' \| 'viewer'` |
| `scenarios` | Manual | `selectedScenarioId` (list lives in RTK Query cache) |
| `editor` | Manual | `steps[]`, `validationState`, `isDirty`, `chainId` |
| `execution` | Manual | `executionId`, `stepsStatus: Record<string, StepExecutionStatus>`, `streamStatus` |
| `ui` | Manual | `language: 'en' \| 'ru'`, `sidebarOpen` |
| `api` | RTK Query | All remote data cache (chains, sessions, atomics, executions, health) |

## `src/store/api/baseApi.ts` — axiosBaseQuery pattern

```typescript
import axios from '@/services/axiosInstance';
import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig, AxiosError } from 'axios';

const axiosBaseQuery = (): BaseQueryFn<
  AxiosRequestConfig,
  unknown,
  { status?: number; data: unknown }
> => async (config) => {
  try {
    const result = await axios(config);
    return { data: result.data };
  } catch (e) {
    const err = e as AxiosError;
    return { error: { status: err.response?.status, data: err.response?.data ?? err.message } };
  }
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Chain', 'Session', 'Atomic', 'Execution', 'Health'],
  endpoints: () => ({}),
});
```

## `src/store/api/chainsApi.ts`

```typescript
export const chainsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChains:    builder.query<Chain[], void>({ query: () => ({ url: '/chains', method: 'GET' }), providesTags: ['Chain'] }),
    getChain:     builder.query<Chain, string>({ query: (id) => ({ url: `/chains/${id}`, method: 'GET' }), providesTags: (_r, _e, id) => [{ type: 'Chain', id }] }),
    createChain:  builder.mutation<Chain, ChainCreatePayload>({ query: (data) => ({ url: '/chains', method: 'POST', data }), invalidatesTags: ['Chain'] }),
    updateChain:  builder.mutation<Chain, { id: string; body: ChainUpdatePayload }>({ query: ({ id, body }) => ({ url: `/chains/${id}`, method: 'PUT', data: body }), invalidatesTags: (_r, _e, { id }) => [{ type: 'Chain', id }, 'Chain'] }),
    deleteChain:  builder.mutation<void, string>({ query: (id) => ({ url: `/chains/${id}`, method: 'DELETE' }), invalidatesTags: ['Chain'] }),
    executeChain: builder.mutation<ExecuteChainResponse, { id: string; body: ExecuteChainRequest }>({ query: ({ id, body }) => ({ url: `/chains/${id}/execute`, method: 'POST', data: body }) }),
  }),
});

export const { useGetChainsQuery, useGetChainQuery, useCreateChainMutation,
  useUpdateChainMutation, useDeleteChainMutation, useExecuteChainMutation } = chainsApi;
```

Apply same `injectEndpoints` pattern to `sessionsApi`, `atomicsApi`, `executionsApi`, `healthApi`.

## `src/store/slices/executionSlice.ts` — SSE event routing

```typescript
sseEventReceived: (state, action: PayloadAction<SSEEvent>) => {
  const event = action.payload;
  switch (event.event) {
    case 'step_start':
      state.stepsStatus[event.step_id] = {
        step_id: event.step_id, step_name: event.step_name,
        status: 'running', started_at: event.timestamp, logs: [],
      };
      break;
    case 'step_done':
      if (state.stepsStatus[event.step_id]) {
        state.stepsStatus[event.step_id].status = 'done';
        state.stepsStatus[event.step_id].exit_code = event.exit_code;
        state.stepsStatus[event.step_id].duration_ms = event.duration_ms;
        state.stepsStatus[event.step_id].finished_at = event.timestamp;
      }
      break;
    case 'step_failed':
      if (state.stepsStatus[event.step_id]) {
        state.stepsStatus[event.step_id].status = 'failed';
        state.stepsStatus[event.step_id].exit_code = event.exit_code;
        state.stepsStatus[event.step_id].duration_ms = event.duration_ms;
      }
      break;
    case 'step_log':
      state.stepsStatus[event.step_id]?.logs.push(event.line);
      break;
    case 'chain_done':
      state.status = 'done';
      break;
    case 'chain_failed':
      state.status = 'failed';
      break;
  }
},
```

---

# 10. SSE Implementation

## `src/services/sseService.ts`

```typescript
// Singleton SSEService — NOT a React component
// Wraps native EventSource with reconnect logic

const SSE_EVENTS = ['step_start', 'step_done', 'step_failed', 'step_log', 'chain_done', 'chain_failed'] as const;
const MAX_RECONNECT = 3;

class SSEService {
  private source: EventSource | null = null;
  private reconnectAttempts = 0;

  connect(executionId: string, onEvent: (e: SSEEvent) => void, onStatus: (s: StreamStatusValue) => void): void {
    this.disconnect();
    onStatus('connecting');
    this.source = new EventSource(`/api/v1/executions/${executionId}/stream`);

    SSE_EVENTS.forEach((name) => {
      this.source!.addEventListener(name, (e: MessageEvent) => {
        onEvent({ ...JSON.parse(e.data), event: name });
      });
    });

    this.source.onopen = () => { this.reconnectAttempts = 0; onStatus('connected'); };
    this.source.onerror = () => {
      if (++this.reconnectAttempts >= MAX_RECONNECT) { this.disconnect(); onStatus('error'); }
    };
  }

  disconnect(): void { this.source?.close(); this.source = null; }
}

export const sseService = new SSEService();
```

## `src/hooks/useSSE.ts`

```typescript
export function useSSE(executionId: string | null): void {
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!executionId) return;
    sseService.connect(
      executionId,
      (event) => dispatch(sseEventReceived(event)),
      (status) => dispatch(setStreamStatus(status)),
    );
    return () => sseService.disconnect();
  }, [executionId, dispatch]);
}
```

Mount `useSSE` at the top of `ExecutionViewer/index.tsx`. It automatically disconnects when the component unmounts (navigation away).

---

# 11. i18n Configuration

## `src/i18n.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Static imports — Vite bundles these; no lazy loading needed
import enCommon from './locales/en/common.json';
import enEditor from './locales/en/editor.json';
import enExecution from './locales/en/execution.json';
import enErrors from './locales/en/errors.json';
import ruCommon from './locales/ru/common.json';
import ruEditor from './locales/ru/editor.json';
import ruExecution from './locales/ru/execution.json';
import ruErrors from './locales/ru/errors.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, editor: enEditor, execution: enExecution, errors: enErrors },
      ru: { common: ruCommon, editor: ruEditor, execution: ruExecution, errors: ruErrors },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    detection: {
      order: ['localStorage'],    // ONLY localStorage — no browser locale detection
      caches: ['localStorage'],
      lookupLocalStorage: 'app_language',
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
```

## `src/main.tsx` bootstrap order

```typescript
import './i18n';  // Must be first import — i18next is sync with static imports
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import { theme } from './theme/theme';
import { StepEditorModal, AtomicSelectorModal, YAMLImportModal } from './pages/ScenarioEditor/modals';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <MantineProvider theme={theme} forceColorScheme="dark">
        <ModalsProvider modals={{ stepEditor: StepEditorModal, atomicSelector: AtomicSelectorModal, yamlImport: YAMLImportModal }}>
          <Notifications />
          <App />
        </ModalsProvider>
      </MantineProvider>
    </Provider>
  </React.StrictMode>
);
```

Language toggle in `Header.tsx`:
```typescript
import i18n from '@/i18n';
const toggleLang = () => i18n.changeLanguage(i18n.language === 'en' ? 'ru' : 'en');
```

---

# 12. Theme Configuration

## `src/theme/theme.ts`

```typescript
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'cyan',
  fontFamily: "'Inter', system-ui, sans-serif",
  fontFamilyMonospace: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  defaultRadius: 'sm',
  // Mantine dark color scheme is applied via forceColorScheme="dark" in MantineProvider
  // No light mode tokens needed
});
```

---

# 13. Pages — Detailed Specifications

## 13.1 Dashboard

**Route:** `/`

**Layout:** Mantine `SimpleGrid cols={{ base: 1, sm: 2 }}`, centered with max width 900px.

**Components:**
- `HealthCard`: Polls `useGetHealthQuery` with `pollingInterval: 30000`. Shows green/red status dot + response time. On error shows red "Backend Unreachable" state.
- `ActiveSessionCard`: Uses `useGetSessionsQuery`. Shows count of active sessions. Button "Go to Scenarios" navigates to `/scenarios`.
- Quick action buttons: "New Scenario" → `/editor/new`, "Open Scenarios" → `/scenarios`.

---

## 13.2 Scenarios List

**Route:** `/scenarios`

**Toolbar:** "New Scenario" button + "Import YAML" button (opens `YAMLImportModal` context modal, on confirm calls `createChain` mutation, navigates to `/editor/:id`).

**Global filter:** Mantine `TextInput` with search icon. Filters by name, description, tags using TanStack Table's `globalFilterFn`.

**Table columns:**
| Column | Content |
|---|---|
| Name | Bold text |
| Description | Truncated to 60 chars |
| Tags | `MitreTacticBadge` per tag |
| MITRE Tactics | `Badge` per tactic (cyan) |
| Actions | Edit / Execute / Clone / Delete `ActionIcon` buttons |

**Actions:**
- **Edit** → navigate to `/editor/:id`
- **Execute** → open `SessionSelectorModal`, on session select → call `executeChain`, navigate to `/execution/:executionId`
- **Clone** → call `createChain` with cloned chain data (name: `"Copy of ${original.name}"`), navigate to `/editor/:newId`
- **Delete** → open `ConfirmModal`, on confirm call `deleteChain`, show Mantine notification

---

## 13.3 Scenario Editor

**Routes:** `/editor/new` (create) | `/editor/:id` (edit)

**On load:** If `:id` route, fetch chain via `useGetChainQuery(id)`, seed `editorSlice` with the chain's steps. If `/new`, seed with empty steps array.

### Toolbar (`EditorToolbar`)
- **Save**: Call `createChain` or `updateChain`. Show success/error notification. Mark `isDirty = false`.
- **Validate (dry_run)**: Call `executeChain({ id, body: { session_id: '', dry_run: true } })`. Show result notification.
- **Export YAML**: Call `chainToYAML(currentChain)`, trigger browser download of `{name}.yaml`.
- **Import YAML**: Open `YAMLImportModal` context modal. On confirm, replace `editorSlice.steps` with parsed steps.
- **Back**: Navigate to `/scenarios`. If `isDirty`, show `ConfirmModal` first.

### Steps Table (`StepsTable`)
- `@dnd-kit/core` `DndContext` + `SortableContext` wrapping Mantine `Table`
- Each `StepRow` uses `useSortable({ id: step.id })`
- Apply `transform: CSS.Transform.toString(transform)` + `transition` to `<tr>` style
- Drag handle: `ActionIcon` with grip icon on left side of row
- Row click (on name) → open `StepEditorModal` context modal
- Row actions: Edit (same modal), Duplicate (copy step with new ID), Delete

**Columns:** Drag Handle | Order | ID | Name | Action Type | Depends On | On Fail | Actions

### DAG Viewer (`DAGViewer`)
- Collapsible `Collapse` panel at bottom of editor page
- `ReactFlow` with `dagre` auto-layout (left-to-right direction)
- Node shows: step ID + name + action type badge
- Edge shows: dependency arrow (source depends_on target)
- Clicking a node opens `StepEditorModal` for that step
- Validation errors (cycles, missing deps) shown as red node highlights

### Step Editor Modal (`StepEditorModal`)
Registered as Mantine `ContextModal` key `'stepEditor'`. Open via:
```typescript
modals.openContextModal({ modal: 'stepEditor', title: 'Edit Step', innerProps: { stepId } });
```

**Tabs:**
1. **General**: `id` (text, required), `name` (text, required), `on_fail` (Select: stop/continue/skip_dependents), `depends_on` (`DependsOnSelect` — MultiSelect of all other step IDs)
2. **Action**: `ActionTypeSelect` (Select enum), then dynamic sub-form component based on selected type
3. **Conditions**: List of `StepCondition` items (variable, operator, value). Add/remove rows.
4. **Output Vars**: Tag-style input for `output_vars` string array.

### Atomic Selector Modal (`AtomicSelectorModal`)
Registered as Mantine `ContextModal` key `'atomicSelector'`. Opened from `AtomicForm`.

- `TextInput` search filters atomics by technique_id and technique_name
- Results grouped by tactic using Mantine `Accordion`
- Each item shows technique_id, name, platforms, test count
- Selecting an item: closes modal, calls `innerProps.onSelect(atomic)` callback, which fills `AtomicForm` fields

### YAML Import Modal (`YAMLImportModal`)
Registered as Mantine `ContextModal` key `'yamlImport'`.

- `CodeMirror` editor with YAML language support
- "Parse" button: calls `js-yaml.load()`, validates as `Chain` type, shows parse errors inline
- On valid parse: shows preview (step count, name, tactics)
- "Confirm Import" button: calls `innerProps.onImport(parsedChain)` callback

---

## 13.4 Execution Viewer

**Route:** `/execution/:executionId`

**On mount:** Dispatch `setExecutionId(executionId)` to `executionSlice`. Mount `useSSE(executionId)`.

**On unmount:** `useSSE` cleanup calls `sseService.disconnect()`.

### Execution Toolbar (`ExecutionToolbar`)
- Overall execution `StatusBadge` (pending/running/done/failed)
- Stream status dot (connecting: yellow pulse, connected: green, error: red)
- Cancel button (only visible when status = 'running'): calls `POST /executions/:id/cancel`

### Steps Table (`ExecutionStepsTable`)
- TanStack Table — data sourced from `Object.values(execution.stepsStatus)` from Redux
- Columns: Step ID | Name | Status (StatusBadge) | Duration (formatDuration)
- Row click: set `selectedStepId` in local state → open `StepLogDrawer`
- Rows update live as SSE events arrive (React re-renders on Redux state change)

### Step Log Drawer (`StepLogDrawer`)
- Mantine `Drawer` position `'bottom'` height `50vh`
- Title: step name + current status badge
- Contains `TerminalPanel` component
- On `selectedStepId` change: load existing logs into terminal via `terminal.writeln()`
- On new `step_log` SSE events: append new lines to terminal (detect via `useEffect` comparing `logs.length`)
- Auto-scroll: xterm.js scrolls to bottom on new line automatically

---

# 14. API Integration

## Base URL
```
/api/v1
```

## Endpoints

### Health
```
GET  /health
```

### Sessions
```
GET  /sessions
```

### Atomics
```
GET  /atomics
GET  /atomics/{id}
```

### Chains
```
GET    /chains
POST   /chains
PUT    /chains/{id}
DELETE /chains/{id}
POST   /chains/{id}/execute     body: { session_id, dry_run? }
```

### Executions
```
GET  /executions/{id}
GET  /executions/{id}/stream    → SSE stream
POST /executions/{id}/cancel
```

## File Upload

File uploads (for `binary` and `upload` action types) use `multipart/form-data`. The upload endpoint is not in the primary spec — use `POST /upload` as the assumed endpoint. Return value is a `file_ref` string stored in the action payload. `BinaryForm` and `UploadForm` handle both URL input and local file upload via Mantine `FileInput`.

---

# 15. Utility Implementations

## `src/utils/dagUtils.ts`

```typescript
// Kahn's algorithm (BFS topological sort)
export function detectCycle(steps: Step[]): string[] | null {
  const inDegree = new Map(steps.map((s) => [s.id, 0]));
  const adj = new Map(steps.map((s) => [s.id, [] as string[]]));

  for (const step of steps) {
    for (const dep of step.depends_on) {
      adj.get(dep)?.push(step.id);
      inDegree.set(step.id, (inDegree.get(step.id) ?? 0) + 1);
    }
  }

  const queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
  const sorted: string[] = [];

  while (queue.length) {
    const node = queue.shift()!;
    sorted.push(node);
    for (const neighbor of adj.get(node) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // If not all nodes sorted, cycle exists
  return sorted.length === steps.length ? null : steps.map((s) => s.id).filter((id) => !sorted.includes(id));
}

export function findMissingDeps(steps: Step[]): Array<{ stepId: string; missingDep: string }> {
  const ids = new Set(steps.map((s) => s.id));
  const missing: Array<{ stepId: string; missingDep: string }> = [];
  for (const step of steps) {
    for (const dep of step.depends_on) {
      if (!ids.has(dep)) missing.push({ stepId: step.id, missingDep: dep });
    }
  }
  return missing;
}
```

---

# 16. Critical Implementation Notes

These are gotchas that will cause silent failures or runtime errors if missed:

1. **xterm.js lifecycle**: Always `terminal.dispose()` in `useEffect` cleanup. Call `fitAddon.fit()` after the container div renders (use a `ResizeObserver` or `window.resize` listener). The container div needs `height: 100%` set explicitly in CSS.

2. **React Flow height**: The `ReactFlow` component renders at 0px if the parent has no explicit height. Set `height: 400px` or wrap in a flex container with `flex: 1`.

3. **dnd-kit + Mantine Table**: Wrap `<tbody>` (not `<table>` or `<thead>`) with `SortableContext`. Apply drag transform via inline style on `<tr>`.

4. **Mantine ContextModals**: ALL context modals must be registered in `ModalsProvider`'s `modals` prop in `main.tsx` before they can be opened by key. If a modal is registered after render, it will not be found.

5. **RTK Query cache invalidation**: After `executeChain` (dry_run), do NOT invalidate Chain tags — the chain is not modified by validation. Only `createChain`/`updateChain`/`deleteChain` should invalidate.

6. **SSE and Vite proxy**: SSE requires the proxy to NOT buffer the response body. Vite's proxy passes through `text/event-stream` correctly by default. Do not add response transformers to the proxy config.

7. **i18n init order**: `import './i18n'` must be the first import in `main.tsx`. With static JSON imports (no lazy loading), `i18next.init()` resolves synchronously, so no async init dance is needed.

8. **Auth on SSE stream**: Native `EventSource` cannot send `Authorization` headers. If the backend requires auth on `GET /executions/:id/stream`, replace `new EventSource(...)` with `fetchEventSource(...)` from `@microsoft/fetch-event-source` and pass headers manually.

9. **Redux and xterm.js**: Do NOT store log lines in Redux as DOM/object references. Store them as plain strings (`string[]`). The `TerminalPanel` reads from Redux state via `useSelector` and calls `terminal.writeln()` in a `useEffect` that tracks `logs.length`.

10. **File upload content type**: Set `'Content-Type': 'multipart/form-data'` per-request when uploading files. Do NOT set it globally in the Axios instance — it will break JSON requests.

---

# 17. Edge Cases

- **Execution fails** → `chain_failed` SSE event received → set execution status to `'failed'` → show error notification with failed step ID
- **Session disconnects** → SSE `onerror` fires → reconnect up to 3 times → show "Connection Lost" badge in `ExecutionToolbar` on max retries
- **Invalid YAML** → `js-yaml.load()` throws → show parse error inline in `YAMLImportModal` → block Confirm button
- **Missing `depends_on` IDs** → `findMissingDeps` in `useDAGValidation` returns errors → show red validation banner in editor → block Save and Validate
- **DAG cycle detected** → `detectCycle` returns cycle node IDs → highlight those nodes red in `DAGViewer` → block Save
- **SSE disconnect mid-execution** → after MAX_RECONNECT failures → set `streamStatus = 'error'` → show reconnect button in `ExecutionToolbar` that calls `sseService.connect()` again

---

# 18. Performance Constraints

- Max 30 steps per scenario — no virtualization needed for the steps table
- Single execution at a time — no concurrent SSE connections
- Real-time SSE log updates must not lag — xterm.js canvas renderer handles this; do NOT use DOM-based log rendering for `step_log` events
- TanStack Table for scenarios list — no server-side pagination needed (assume <500 scenarios)

---

# 19. Security Considerations

- No antivirus scanning required in frontend
- File upload allowed (binary/upload action types) — no client-side file type restriction beyond what the action form requires
- No sandboxing required in frontend
- Auth token stored in `localStorage`; injected via Axios request interceptor

---

# 20. Implementation Sequencing

Implement in this exact order to avoid import dependency issues:

1. **Scaffold**: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx` (stub), `src/theme/theme.ts`, `src/i18n.ts`, empty locale JSON files
2. **Types**: All files in `src/types/` — no imports from other `src/` modules
3. **Utils**: `dagUtils.ts`, `yamlUtils.ts`, `formatUtils.ts`, `constants.ts` — pure functions, no React
4. **Services**: `axiosInstance.ts`, `sseService.ts`
5. **Store**: `store/api/baseApi.ts` → each `*Api.ts` (inject endpoints) → each slice → `store/index.ts`
6. **Hooks**: `useSSE.ts`, `useDAGValidation.ts`, `useYAML.ts`, `usePermissions.ts`, `useStepForm.ts`
7. **Shared Components**: `TerminalPanel.tsx`, `StatusBadge.tsx`, `MitreTacticBadge.tsx`, `ConfirmModal.tsx`, all action sub-forms
8. **Pages**: Dashboard (simplest) → ScenariosList → ScenarioEditor (most complex) → ExecutionViewer
9. **Router + AppShell**: Wire all pages in `router.tsx`, implement `AppShell.tsx`, `Navbar.tsx`, `Header.tsx`
10. **i18n strings**: Fill all locale JSON files after all UI strings are finalized

---

# 21. Definition of Done

Frontend is complete when:

- [ ] Scenario can be created with all 7 action types (command, atomic, binary, upload, sliver_rpc, python, probe)
- [ ] YAML import and export work correctly (round-trip: export → re-import produces identical chain)
- [ ] DAG validation detects cycles and missing dependencies before save
- [ ] Scenario validates successfully via `dry_run` API call
- [ ] Session selector shows live sessions and allows selection
- [ ] Scenario executes on selected session
- [ ] Execution is visible in real-time (steps update as SSE events arrive)
- [ ] Logs stream correctly into xterm.js terminal per step
- [ ] SSE reconnect logic works (disconnect → retry → show error after 3 failures)
- [ ] Both English and Russian translations are complete and toggle correctly
- [ ] UI is dark mode only — no light mode, no flicker on load
- [ ] Mentor can perform all CRUD operations on scenarios
- [ ] Viewer cannot edit validated scenarios (gated by `usePermissions`)
- [ ] All TypeScript errors are resolved (`tsc --noEmit` passes clean)
