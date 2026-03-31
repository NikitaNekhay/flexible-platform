# Frontend Upgrade Tasks

> Attack Scenario Platform — audit & improvement plan  
> Generated: 2026-03-31 | Stack: React 18 + Vite 5 + Mantine 7 + RTK Query + TypeScript 5

---

## 1. Performance & Bundle Optimization

### 1.1 Vite build — chunk splitting strategy
- Add `build.rollupOptions.output.manualChunks` in `vite.config.ts`
- Split into: `vendor-mantine`, `vendor-react`, `vendor-codemirror`, `vendor-xyflow`, `vendor-xterm`
- Heavy libs (codemirror ~180KB, xyflow ~120KB, xterm ~200KB) are only used on 1-2 pages — must not load on Dashboard
- Add `rollup-plugin-visualizer` to devDependencies for bundle analysis

### 1.2 Lazy-load heavy components inside pages
- `TerminalPanel` (xterm.js) — wrap in `lazy()` + Suspense inside `ExecutionStreamLog` and `StepLogDrawer`
- `CodeMirror` editor — wrap in `lazy()` inside `ScenarioEditor`
- `ReactFlow` DAG viewer — already on a lazy page, but the component itself is ~120KB; consider dynamic import
- This prevents xterm/codemirror chunks from loading until actually needed

### 1.3 RTK Query polling optimization
- `ExecutionsListPage`: polling at 5s — add `skipPollingIfUnfocused: true` to stop polling when tab is hidden
- `HealthCard`: polling at 30s — same treatment
- `SessionsListPage`: add `pollingInterval: 10000` if not present + `skipPollingIfUnfocused`
- Use `refetchOnFocus: true` on baseApi to get fresh data when user returns to tab

### 1.4 Memoization audit
- `ExecutionStepsTable`: `columns` array recreated every render — move `columnHelper` definitions outside component or wrap in `useMemo` with empty deps (they only depend on `t`)
- `ScenariosTable`: same issue with column definitions
- `ExecutionStreamLog`: `allLogs` rebuilds from scratch every time `stepsStatus` changes — consider incremental append pattern
- `buildLayout()` in DAG editor: called inside `useMemo` correctly, no issue

### 1.5 Avoid unnecessary re-renders
- `useAppSelector((s) => s.execution.stepsStatus)` returns the full object — any step change re-renders all consumers. Use shallow equality selector or select specific step IDs
- `ExecutionStreamLog` and `ExecutionStepsTable` both subscribe to full `stepsStatus` — consider `createSelector` from RTK for derived data
- Context modals (`as Record<string, React.FC<any>>`) — move to a constant outside `main.tsx` render tree to avoid re-registration

### 1.6 Image & asset optimization
- Add `vite-plugin-compression` for gzip/brotli pre-compression of production build
- Ensure `@tabler/icons-react` tree-shakes properly — import individual icons (already done correctly)

---

## 2. UX/UI Improvements

### 2.1 Empty states & skeletons
- Replace `"Loading..."` text with Mantine `<Skeleton>` components on all list pages (Scenarios, Sessions, Executions)
- Add illustrated empty states (icon + message + action button) instead of plain `"No data available"` text
- `ExecutionStepsTable`: replace `"Waiting for steps to start..."` with a pulsing skeleton table

### 2.2 Responsive layout
- `ScenariosTable` / `ExecutionsListPage`: tables are not mobile-friendly — add card view for `sm` breakpoint using `useMediaQuery` from `@mantine/hooks`
- Navbar: already uses Mantine `AppShell` with burger — verify collapse works on mobile
- `ScenarioEditor`: metadata form + steps table side-by-side on desktop, stacked on mobile
- `ExecutionStreamLog`: terminal height should be responsive (`min-height: 200px`, `max-height: 60vh`)

### 2.3 Navigation & breadcrumbs
- Add `<Breadcrumbs>` to `ScenarioEditor` and `ExecutionViewer` pages (e.g., `Scenarios > My Scenario > Edit`)
- Add keyboard shortcut hints in navbar tooltips
- Highlight active nav item properly (verify `useLocation` match logic)

### 2.4 Table UX improvements
- Add sortable columns to `ScenariosTable` and `ExecutionsListPage` (click header to sort by name, date, status)
- Add pagination to `ExecutionsListPage` — currently renders all executions in one table
- Add column resizing or at minimum responsive column hiding on small screens
- `ExecutionStepsTable`: add exit code column, show `stdout` preview on hover (tooltip)

### 2.5 Toast & notification improvements
- Current error notifications auto-close in 8s — critical errors (execution failures) should be persistent
- Add success toasts for: scenario saved, scenario deleted, execution started, chain cloned
- Deduplicate identical error notifications (e.g., repeated polling failures)

### 2.6 Execution viewer UX
- Add auto-scroll toggle for `ExecutionStreamLog` terminal (scroll lock button)
- Show execution metadata header: chain name, session hostname, started at, elapsed time (live counter)
- Add "Back to executions" link at top
- Show overall progress indicator (e.g., 3/7 steps done) with a progress bar

### 2.7 Scenario editor UX
- Add unsaved changes warning (`beforeunload` + route navigation guard)
- Add undo/redo for step operations (add, delete, reorder)
- Add step drag handle visual indicator (currently uses dnd-kit but affordance may be unclear)
- YAML import: add syntax error highlighting in preview before applying

### 2.8 Dark mode polish
- Terminal panel background (`#1A1B1E`) should match Mantine `dark.7` variable, not a hardcoded hex
- DAG editor node colors are hardcoded hex — migrate to CSS variables for potential theme switching
- Scrollbar styles only target WebKit — add Firefox `scrollbar-color` support

---

## 3. Architecture & Code Quality

### 3.1 Type safety improvements
- `main.tsx` line 23: `as Record<string, React.FC<any>>` — create typed `ContextModalMap` interface for each modal's `innerProps`
- All action forms accept `value: StepAction` and cast internally — create discriminated union guard functions (`isCommandAction`, `isAtomicAction`, etc.)
- `sseEventReceived` payload is `SSEEvent` union — add runtime validation (Zod) for SSE data before dispatch
- `executionsApi.ts` normalization: replace inline field mapping with a Zod schema + `transform`

### 3.2 Remove dead code
- `scenariosSlice.ts`: `selectedScenarioId` state is set but never consumed — remove or implement
- `SearchAddon` loaded in `TerminalPanel` but no search UI exposed — remove addon or add Ctrl+F search
- `usePermissions` hook: verify it's actually consumed; if roles aren't enforced by backend, remove
- Check for any unused imports across all files (`eslint no-unused-imports` rule)

### 3.3 Error handling gaps
- SSE parse failures (`catch` in `sseService.ts` line 39) — silently logged; should dispatch a user-visible warning after N failures
- `yamlToChain()` throws on bad YAML — call sites must wrap in try-catch with notification
- `axiosInstance` 401 handler does `window.location.href = '/'` — this is a hard reload; use router navigation instead
- Add error boundary per page (not just the global one) so one page crash doesn't blank the entire app

### 3.4 State management cleanup
- `editorSlice` likely duplicates chain data that could come from RTK Query cache — audit whether editor state can derive from query cache + local form state
- `authSlice` reads/writes localStorage in reducers (side effect in reducer is an anti-pattern) — move to a listener middleware or thunk
- `uiSlice` stores only `sidebarOpened` — consider using Mantine's `useDisclosure` locally instead of Redux for this

### 3.5 API layer improvements
- `chainsApi`: `executeChain` is a mutation but doesn't invalidate `Execution` tags — add `invalidatesTags: ['Execution']`
- Add `onQueryStarted` optimistic updates for delete operations (remove from list before server confirms)
- Add request deduplication — if user double-clicks Execute, two requests fire; disable button on pending mutation
- `sessionsApi`: no `transformResponse` for PascalCase normalization — likely needs same treatment as `executionsApi`

### 3.6 File organization
- Move `SessionSelectorModal` from `pages/ExecutionViewer/` to `components/modals/` — it's used from scenario page too
- Move all form sub-components from `components/forms/action-forms/` to `pages/ScenarioEditor/forms/` — they're only used in the editor
- Group types: merge `api.ts` into relevant feature types or keep a single `types/index.ts` barrel

---

## 4. Reliability & Resilience

### 4.1 SSE reconnection improvements
- Current: 3 retries then permanent error — add exponential backoff (1s, 3s, 9s)
- After max retries, show a "Reconnect" button instead of silent failure
- On reconnect success, re-fetch execution state from REST to sync missed events
- Handle browser `offline`/`online` events — auto-pause/resume SSE

### 4.2 Form data persistence
- `ScenarioEditor`: if browser crashes mid-edit, all work is lost — persist draft to `sessionStorage`
- Restore draft on page load if unsaved data exists (with "Restore draft?" prompt)

### 4.3 Backend null safety
- Create a utility `safeArray<T>(val: T[] | null | undefined): T[]` and apply consistently
- Better: add `transformResponse` in `chainsApi` that normalizes `tags: null` → `tags: []`, `steps: null` → `steps: []` at the API layer instead of patching every consumer

### 4.4 Concurrency guards
- Prevent double-submit on all mutation buttons (save, delete, execute, clone)
- RTK Query mutations expose `isLoading` — pass to button `loading` prop everywhere
- `ExecutionToolbar` cancel button: guard against cancelling already-finished executions

---

## 5. Developer Experience

### 5.1 Linting & formatting
- Add `eslint-plugin-react-hooks` rules (verify `exhaustive-deps` is on)
- Add `eslint-plugin-import` for import ordering and no-unused-imports
- Add Prettier config (`.prettierrc`) if not present — enforce consistent formatting
- Add `lint-staged` + `husky` for pre-commit linting

### 5.2 Testing setup
- Install `vitest` + `@testing-library/react` + `@testing-library/jest-dom`
- Priority test targets (pure logic, high value):
  1. `dagUtils.ts` — cycle detection, topological sort, missing deps
  2. `yamlUtils.ts` — round-trip YAML serialization
  3. `formatUtils.ts` — duration/timestamp formatting edge cases
  4. `executionSlice.ts` — SSE event handling state transitions
  5. `executionsApi.ts` — PascalCase normalization
- Add MSW (`msw`) for API mocking in component tests
- Add `vitest` to `package.json` scripts: `"test": "vitest"`, `"test:coverage": "vitest --coverage"`

### 5.3 Storybook (optional, low priority)
- Add Storybook for isolated component development of: `StatusBadge`, `TerminalPanel`, `CodeBlock`, `MitreTacticBadge`
- Useful for design review without running full app + backend

### 5.4 Environment & config
- `.env` is not in `.gitignore` — it shows as untracked in git status. Add `.env` and `.env.local` to `.gitignore`
- Create `.env.example` with documented variables
- Validate required env vars at startup in `vite.config.ts` (throw if `VITE_API_BASE_URL` is missing)

---

## 6. Accessibility

### 6.1 Keyboard navigation
- `ScenariosTable` / `ExecutionsListPage` table rows use `onClick` but no `onKeyDown` — add `Enter`/`Space` handling and `tabIndex={0}` for keyboard navigation
- Step drag-and-drop (`dnd-kit`): verify keyboard DnD works (dnd-kit supports it, but may need `KeyboardSensor` added)
- Modal focus trap: Mantine handles this, but verify with screen reader

### 6.2 Screen reader support
- Add `aria-label` to icon-only buttons (e.g., step delete, edit, clone icons)
- `StatusBadge`: add `aria-live="polite"` for status changes in execution viewer
- `TerminalPanel`: add `role="log"` and `aria-label="Execution output"` to container
- Tables: ensure `<caption>` or `aria-label` on each table

### 6.3 Color contrast
- Verify status colors (especially yellow/skipped on dark background) meet WCAG AA contrast ratio
- Terminal ANSI colors: `#fab005` (yellow) on `#1A1B1E` background — check contrast

---

## 7. Security Hardening

### 7.1 XSS prevention
- `TerminalPanel` writes raw strings to xterm.js — xterm handles escaping, but verify no HTML injection through `stdout`/`stderr` fields
- YAML import parses user-provided YAML — ensure no prototype pollution via `js-yaml` (use `yaml.load` with `JSON_SCHEMA` if possible)

### 7.2 Auth token handling
- Token stored in `localStorage` — vulnerable to XSS. Consider `httpOnly` cookie flow if backend supports it
- 401 handler does hard `window.location.href` reload — leaves no trace in React state; use controlled logout flow

### 7.3 Input validation
- Step IDs, chain names: validate on frontend before sending to prevent injection into backend queries
- `session_id` field in execute request: validate UUID format before sending

---

## Priority Matrix

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| P0 | 4.3 Backend null safety (centralize in API layer) | Prevents crashes | Low |
| P0 | 4.4 Double-submit guards on mutations | Prevents data corruption | Low |
| P0 | 5.4 .env in .gitignore | Security | Trivial |
| P1 | 1.1 Chunk splitting | 30-50% faster initial load | Low |
| P1 | 1.2 Lazy-load xterm/codemirror | Faster page transitions | Low |
| P1 | 1.3 Polling optimization (skipPollingIfUnfocused) | Reduces idle CPU/network | Trivial |
| P1 | 2.1 Skeleton loaders | Perceived performance boost | Low |
| P1 | 2.6 Execution viewer metadata + progress | Core UX gap | Medium |
| P1 | 3.3 Error handling gaps | Reliability | Medium |
| P1 | 4.1 SSE reconnection with backoff | Reliability for long runs | Medium |
| P2 | 1.4-1.5 Memoization & selector optimization | Reduces re-renders | Medium |
| P2 | 2.2 Responsive layout for mobile | Broader device support | Medium |
| P2 | 2.4 Table sorting & pagination | Scales to many executions | Medium |
| P2 | 2.7 Unsaved changes warning | Prevents data loss | Low |
| P2 | 3.1 Type safety improvements | Developer confidence | Medium |
| P2 | 3.5 API layer improvements | Correctness | Medium |
| P2 | 5.1 Linting & formatting setup | DX consistency | Low |
| P2 | 5.2 Testing setup + core util tests | Long-term quality | Medium |
| P3 | 2.3 Breadcrumbs | Navigation clarity | Low |
| P3 | 2.5 Notification improvements | Polish | Low |
| P3 | 2.8 Dark mode CSS variable migration | Maintainability | Low |
| P3 | 3.2 Dead code removal | Cleanliness | Low |
| P3 | 3.4 State management cleanup | Architecture purity | Medium |
| P3 | 3.6 File reorganization | Maintainability | Low |
| P3 | 4.2 Draft persistence in sessionStorage | Nice-to-have | Low |
| P3 | 6.x Accessibility improvements | Compliance | Medium |
| P3 | 7.x Security hardening | Defense in depth | Medium |
