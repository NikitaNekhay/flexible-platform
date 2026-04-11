# Flexible Platform — Frontend

React frontend for building, validating, and executing attack scenarios on a cyber range. Communicates with the backend orchestrator via REST API and SSE.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| UI | Mantine 7 (dark mode) |
| State | Redux Toolkit + RTK Query |
| Routing | React Router 6 |
| Streaming | SSE via EventSource |
| Graphs | React Flow + Dagre |
| Code editor | CodeMirror (YAML) |
| Drag & drop | dnd-kit |
| i18n | i18next (EN / RU) |
| Validation | Zod |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Backend orchestrator running (default `http://localhost:18080`)

### Manual Setup

```bash
# install dependencies
npm install

# copy env and adjust if needed
cp .env.example .env

# start dev server (port 3000)
npm run dev
```

The dev server proxies `/api/v1/*` requests to the backend URL defined in `VITE_API_BASE_URL`.

### Docker

```bash
# build
docker build -t flexible-platform-frontend .

# run (backend on host machine)
docker run -p 3000:80 \
  -e BACKEND_URL=http://host.docker.internal:18080 \
  flexible-platform-frontend
```

If the backend runs in Docker on the same network, use its container name:

```bash
docker run -p 3000:80 \
  -e BACKEND_URL=http://backend:18080 \
  flexible-platform-frontend
```

### Environment Variables

| Variable | Where | Default | Description |
|----------|-------|---------|-------------|
| `VITE_API_BASE_URL` | Build time (.env) | `http://localhost:18080` | Backend URL for Vite dev proxy |
| `BACKEND_URL` | Docker runtime | `http://host.docker.internal:18080` | Backend URL for Nginx reverse proxy |

## Project Structure

```
src/
  components/     shared UI components
  hooks/          custom React hooks
  i18n.ts         internationalization setup
  locales/        translation files (en, ru)
  pages/          page-level components
    Dashboard/
    ScenariosList/
    ScenarioEditor/
    ExecutionViewer/
    ExecutionsList/
    SessionsList/
    AtomicsList/
    layout/
  router.tsx      route definitions
  services/       axios instance, SSE service
  store/          Redux slices, RTK Query APIs, selectors
  theme/          Mantine dark theme config
  types/          TypeScript type definitions
  utils/          DAG validation, YAML parsing, formatting
```

## Workflows

### 1. Create a Scenario

A scenario (chain) is an ordered set of steps that execute sequentially or based on dependency rules.

1. Navigate to **Scenarios** and click **New Scenario**, or go to `/editor/new`
2. Fill in metadata: name, description, tags, MITRE tactics
3. Add steps using one of three methods:
   - **Add Step** — manually configure a step with one of the 7 action types
   - **Add Atomic** — browse the MITRE ATT&CK atomics library and pick a technique + test
   - **Import YAML** — paste a YAML definition to populate the entire chain
4. Configure each step:
   - Dependencies (`depends_on` with plain IDs or `any`/`all` operators)
   - Conditions (variable checks with operators)
   - Output capture (regex-based variable extraction)
   - Timeout and failure behavior (`abort`, `continue`, `skip_dependents`)
5. Reorder steps via drag and drop
6. Review the dependency graph in the **DAG Viewer**
7. Optionally run **Validate** (dry-run) to check the chain without executing
8. **Save** to persist to the backend

Drafts are auto-saved to session storage and restored within 1 hour.

### 2. Execute a Scenario

1. From the **Scenarios** list, click **Execute** on any scenario
2. The **Session Selector** modal appears — pick a target implant session
3. The platform redirects to the **Execution Viewer** (`/execution/:id`)
4. Real-time updates stream via SSE:
   - `step_start` — step begins
   - `step_done` — step completed with stdout/stderr/exit code
   - `step_failed` — step errored out
   - `step_skipped` — step skipped due to conditions or dependency failure
   - `chain_done` / `chain_failed` — execution finished
5. Click any step row to expand its full logs in a side drawer
6. Use the **Cancel** button to abort a running execution

The SSE connection auto-reconnects with exponential backoff (up to 5 retries).

### 3. Browse the Atomics Library

The atomics library provides searchable MITRE ATT&CK techniques with pre-built test definitions.

1. Go to **Atomics** (`/atomics`)
2. Switch between **Flat list** and **Grouped by family** views
3. Search by technique ID or name
4. Expand a row to see test details: description, platforms, executor, arguments
5. Click **Add to Scenario** to jump to a new editor with the step pre-configured

### 4. Manage Sessions

Sessions represent active implant connections to target machines.

1. Go to **Sessions** (`/sessions`)
2. The sessions table auto-refreshes every 5 seconds
3. To deploy a new implant:
   - Open the **Implant Builder** panel
   - Select platform (Linux / Windows)
   - Configure: C2 callback host, name, architecture, listener port
   - Click **Build & Download** to get the binary
   - Copy the deployment command (one-liner or persistent service)
   - Run it on the target
   - The session appears in the table once the implant checks in

### 5. Review Execution History

1. Go to **Executions** (`/executions`)
2. Browse all past and active executions with status, duration, and error info
3. Filter by scenario name
4. Click any row to open the full execution viewer with logs
5. The list auto-refreshes every 5 seconds for running executions

### 6. YAML Import & Export

Scenarios can be fully represented as YAML.

- **Export**: In the editor toolbar, click **Export YAML** to download a `.yaml` file
- **Import**: From the scenarios list, click **Import YAML**, paste the content, and the editor opens with the chain pre-populated
- **In-editor YAML panel**: Toggle the YAML side panel to edit raw YAML with syntax highlighting. Use **Refresh** to sync form-to-YAML, or **Apply** to sync YAML-to-form

### 7. DAG Validation

The editor continuously validates the step dependency graph:

- Detects **cycles** in the dependency chain
- Flags **missing dependencies** (referencing non-existent step IDs)
- Warns about **duplicate step IDs**
- Computes **topological sort** for execution order

Validation errors block saving. The **Validate** button also triggers a server-side dry-run check.

## Supported Action Types

Each step in a scenario uses one of these action types:

| Type | Description |
|------|-------------|
| `command` | Run a shell command (sh, bash, powershell, cmd) |
| `atomic` | Execute a MITRE ATT&CK atomic test by technique ID + test index |
| `binary` | Deploy and run a binary on the target (URL or upload) |
| `upload` | Upload a file to the target with optional execution |
| `sliver_rpc` | Call a Sliver C2 RPC method directly |
| `python` | Run a Python script (inline or file) with args and env vars |
| `probe` | Check for software/conditions on the target before proceeding |

## API Integration

All API calls go through `/api/v1` (proxied in dev, reverse-proxied in Docker via Nginx).

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Backend health check |
| `/chains` | GET | List all scenarios |
| `/chains` | POST | Create a scenario |
| `/chains/:id` | GET | Fetch a scenario |
| `/chains/:id` | PUT | Update a scenario |
| `/chains/:id` | DELETE | Delete a scenario |
| `/chains/:id/execute` | POST | Execute (or dry-run validate) |
| `/executions` | GET | List all executions |
| `/executions/:id` | GET | Fetch execution detail |
| `/executions/:id/cancel` | POST | Cancel a running execution |
| `/executions/:id/stream` | GET | SSE stream for real-time updates |
| `/sessions` | GET | List active implant sessions |
| `/implant/:platform` | GET | Download implant binary |
| `/atomics` | GET | List MITRE atomics |
| `/atomics/:id` | GET | Fetch atomic detail |

## Scripts

```bash
npm run dev            # start dev server (port 3000)
npm run build          # typecheck + production build
npm run preview        # preview production build
npm run lint           # run ESLint
npm run lint:fix       # run ESLint with auto-fix
npm run format         # format with Prettier
npm run format:check   # check formatting
npm run test           # run tests (watch mode)
npm run test:run       # run tests once
npm run test:coverage  # run tests with coverage
npm run analyze        # build with bundle visualizer
```

## Auth

The frontend supports two roles:

- **Mentor** — full access: create, edit, delete, execute scenarios
- **Viewer** — read-only: view and clone scenarios

Auth token is stored in `localStorage` and attached to every request as a `Bearer` token. A `401` response triggers automatic logout.

## License

Internal use only.
