---
id: submodule-web-shell-layout-sync
type: submodule-design
status: active
title: shell/layoutSync — layout hydration and commit synchronization
parent: submodule-web-shell
tags: [layout, synchronization, optimistic]
---

## Responsibility

The browser side of the host-synchronized layout protocol: hydrate the accepted workspace snapshot,
serialize optimistic full-document commits, settle accepted broadcasts/responses, and reconcile device-local
attention when the structural document changes.

## Boundary

- **Owns:** per-workspace hydration and commit single-flights; captured expected revisions for queued
  replacements; conflict handling; lost-response settlement from a matching broadcast; connected-generation
  and workspace-removal guards; attention load/persist/reconciliation; and the React lifecycle that starts
  hydration for the mounted workspace.
- **Public surface (`index.ts`):** the mounted synchronization hook, `commitWorkspaceLayout`, attention
  persistence, the read-only layout prewarm (function + shell-mounted hook), and deterministic test seams
  for commit/hydration ordering. Conflict-specific commit errors
  and internal attention/hydration classifiers remain implementation details of returned promises and hooks.
- **External deps:** contracts layout types/results; store layout state/actions; transport requests/errors;
  shell-neutral `lib` attention/id helpers; React.
- **Forbidden:** feature panels, chat/session or terminal lifetime, resource placement policy beyond calling
  the pure layout preset/attention surface, server/shared/pi imports, or automatic retry/rebase of a stale
  full document.

Prewarm is **read-only warming, never creation**: for every **expanded** project's workspace list (not only
the currently selected project — a project's row can be expanded, and its worktrees visible for picking,
before it becomes the selected project), the shell-mounted prewarm hook fetches the accepted snapshot for
the first few workspaces (same limit spirit as the watcher prewarm, applied per project) and installs it plus
attention into the store, so switching to a warmed workspace — including the first switch into a different,
just-expanded project — never shows the full-screen restore placeholder. This runs **once per expansion**, not
on every subsequent change to that project's workspace list: the hook remembers which expanded project ids it
has already swept (a plain ref, cleared when a project collapses so re-expanding sweeps again) and skips a
project already in that set even when its workspace list later grows — a workspace that appears afterward
(this client's own creation takes the separate `freshWorkspaceIds` fast path instead; a peer's creation or
attach reaching this client live) is warmed lazily on its first real visit instead. Sweeping on every list
mutation would call `layout.get` for a workspace the instant this client merely learns it exists, which is
never worth a host round trip for a workspace nobody here is about to open, and — because `getWorkspaceLayout`
caches an absent read for the process lifetime — would permanently poison that cache against a layout written
afterward by another path (a legacy migration, a restore). A workspace without a host layout is left untouched
— only a real visit's hydration may instantiate and commit the default preset (with its possible settings side
effects) — and prewarm never overwrites an already-hydrated document, is single-flight per workspace/connection
generation, and swallows failures (the real visit surfaces them).

A workspace this client just created (`workspace.create`, an attached existing worktree, never `enterDefaultWorkspace`
returning the pre-existing singleton) has no host layout to ask for — `store.freshWorkspaceIds` marks it, set by
the panel that made the create/attach call before activating it. `hydrateWorkspaceLayout` checks the mark before
issuing the host read: when set, it skips `requestLayoutGet` entirely and falls straight into the same
default-preset instantiate-and-commit path a `null` response would have reached, so the first activation of a
brand-new workspace installs its document in the same synchronous tick as `activateWorkspace` (no restore-skeleton
window) instead of after a network round trip that can only ever come back empty. The mark is consumed (cleared)
on that first hydration attempt regardless of outcome, so a later reconnect or reload for the same workspace goes
through the normal host read.

The mounted synchronization hook is **retargetable**: one component instance survives `workspaceId`
changes (the shell intentionally does not remount the workbench per workspace), so the hook's
attention-reconciliation baseline is workspace-stamped — switching workspaces re-enters the
first-document path (install attention for the new document) and never reconciles one workspace's
attention against another workspace's previous document.

A conflict is expected synchronization: install the returned current snapshot (including `null`) unless a
newer accepted broadcast already overtook that response, cancel the conflicting optimistic mutation and its
dependents, and reject with a conflict-specific local error without the generic save-failure toast. A queued
dependent removed by rollback never reaches the host. A matching broadcast that already settled the mutation
remains proof of success when the response is lost.
