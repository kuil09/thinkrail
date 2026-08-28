---
id: submodule-web-components
type: submodule-design
status: active
title: components — ErrorBoundary primitive (+ ui/)
parent: module-web
tags: [v1, ui, resilience]
---

## Responsibility

The app's single **error-boundary primitive** — the one thing that keeps a panel's render crash or a
failed lazy chunk from unmounting the React root — plus the **`CustomIcon`** primitive for the few
project-custom glyphs Remix lacks and the shared **loading-skeleton primitive**. Also houses the `ui/`
sub-module (shadcn primitives), which has its own spec.

## Boundary

- **Owns:** `ErrorBoundary.tsx` — a class boundary (`getDerivedStateFromError`) that renders a themed,
  self-contained fallback instead of propagating a throw to the root. It:
  - resets a caught error when any `resetKeys` value changes (wire to the subtree's identity —
    workspace/tab id — so navigating away auto-recovers);
  - classifies failed dynamic `import()`s via the pure, unit-tested **`isChunkLoadError`** (stale Vite
    chunk / 504 / Safari "module script failed") and steers those to a page **reload** (re-fetches the
    chunk) rather than an in-place retry;
  - logs the crash to the console (`componentDidCatch`) — the UI already degrades gracefully.
- **`CustomIcon.tsx`** — renders an SVG from `public/custom-icons/` as a themeable `currentColor` glyph
  via a CSS `mask-image` span (`.custom-icon*` classes in `index.css`), so a custom glyph sizes with
  `size-*` and colours with `text-*` exactly like a Remix icon. Names are a typed union
  (`CustomIconName`); today: `file-diff-line`/`file-diff-fill` (the Changes tool glyph).
- **Also owns:** `Skeleton.tsx` — `SkeletonRows`, the one pulsing-rows placeholder every loading surface
  uses (tool panels, project tree expansion, Monaco editor/diff boot, settings lists, plan tabs, the
  shell's workbench restore skeleton). One primitive, not per-panel ad-hoc "Loading…" lines: a loading
  state must occupy content-shaped space so the arriving data replaces it without the layout jumping.
  The app's loading vocabulary is exactly **two-tier**: `SkeletonRows` for a *content region* — any area
  that will fill with substantial content, however that region is framed (a tool panel, a dialog's list,
  a menu's list section, **or a tab body/Suspense fallback restoring a chat, plan, or editor** — size of
  surface, not its container, decides the tier) — and a `Loader2` spinner (usually beside a short label)
  for an *in-flight action or transient state* pinned to its control (a button, a single menu item, an
  icon). A spinner centred in a large empty region reads as a different, heavier kind of wait than the
  content-shaped skeleton used one panel over for the same "data is on the way" situation, so it is never
  the right choice for a region — `shell/WorkspaceWorkbench.tsx`'s `MissingResource` (the chat/plan/editor
  tab-body and Suspense fallback), `panels/ExistingWorktreeDialog.tsx`'s worktree-candidate list, and
  `panels/ChangesScopeMenu.tsx`'s commit list all render `SkeletonRows` for exactly this reason. Bare
  "Loading…" text without either is a defect.
- **Public surface:** `ErrorBoundary`, `isChunkLoadError`, `SkeletonRows` — imported directly via
  `@/components/ErrorBoundary` / `@/components/Skeleton` (no barrel); `CustomIcon`, `CustomIconName` via
  `@/components/CustomIcon`. The `ui/` primitives are their own sub-module
  ([components/ui/SPEC.md](ui/SPEC.md)).
- **Allowed deps:** React, `@remixicon/react`, `lib` (`shallowEqualArrays` — the reset-keys comparison, shared
  rather than re-stated). Kept dependency-light on purpose, and `lib` is a leaf, so *any* region (shell,
  panels, `main.tsx`) can still wrap in it without creating a cycle.
- **Forbidden:** `store`/`transport`/`panels`/`shell`/`chat`/`contracts`; `server`/`shared`/`pi`; inline
  `style` objects or raw hex (fallback is themed with token utilities only).

## Get right

- **Scope of protection:** React boundaries catch **render + lazy-import** throws only — **not** errors in
  event handlers, effects, or rejected promises (e.g. `transport.request`). Those surface through
  `transport`'s `errorText()` as an error turn/notice, not here. The shell's "panels can't blank the app"
  guarantee is about render/lazy-load; async failures are a separate path.
- Where the boundary is mounted (each region + the last-resort root wrap) is owned by `shell/SPEC.md` and
  the parent dependency graph in `apps/web/SPEC.md`, not repeated here.
