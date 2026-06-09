# Kid Chore Modal, Undo, and Photo Proof Design

## Goal

Replace direct chore completion from the child chore list with a focused bottom-sheet modal. Let a child undo an accidental submission while the chore is still waiting for parent approval. Add a later Premium phase for one-photo proof with private, temporary storage.

## Scope

This work is delivered in two phases:

1. Phase 1: chore detail modal and secure submission undo.
2. Phase 2: Premium photo requirements, upload, parent review, saving, and deletion.

Phase 1 must not depend on unfinished photo infrastructure. Phase 2 extends the same modal and RPC boundaries without changing the approved undo behavior.

## Child Experience

Tapping any chore row opens a focused bottom-sheet modal. A row tap never submits a chore directly.

The modal content depends on the chore state:

- `assigned` or `sent_back`: show title, reward, sent-back reason when present, photo requirement when available, and an explicit **Mark as finished** action.
- `submitted`: show **Waiting for parent**, any submitted photo preview, and **Undo finished**.
- `approved`: show the approved state and reward as read-only. No undo action is available.

Selecting **Undo finished** opens a confirmation:

> Move this chore back to To do?

Confirming closes the parent review request by changing the chore from `submitted` to `assigned`. Any proof photo attached to that submission is deleted. Cancelling leaves the chore unchanged.

Children never see billing, an upgrade screen, or Premium sales messaging. The modal only presents photo controls when the parent has configured them and the household is entitled to use them.

## Phase 1: Modal and Undo

### UI Boundaries

`KidHomeScreen` changes from an `onToggleChore` contract to an `onOpenChore` contract. It owns row presentation but does not perform mutations.

A dedicated child chore modal component owns:

- state-specific labels and actions;
- submit and undo confirmation interactions;
- disabled/loading state while a mutation is running;
- inline mutation errors without silently closing the modal.

The route remains responsible for calling child chore actions and replacing the changed chore in local state after a successful response.

### Secure Undo RPC

Add `undo_child_chore_submission(input_access_code text, input_chore_id uuid)`.

The security-definer RPC:

- normalizes and verifies the child access code;
- verifies the chore belongs to that child profile;
- updates only a chore whose current status is `submitted`;
- changes its status to `assigned`;
- does not alter ledger balances because only `approved` creates earnings;
- returns the same child-facing chore shape used by submit and list actions.

No undo is permitted for `approved`, `assigned`, or `sent_back` chores. A stale or invalid transition returns no row, which the client maps to a clear failure instead of pretending the undo succeeded.

### Concurrency

The database status predicate is the authority. If a parent approves the chore before the child's undo reaches the server, the undo affects no row and the UI refreshes to show the approved state. Client-side checks improve feedback but do not replace the database guard.

## Phase 2: Premium Photo Proof

### Parent Configuration

Each chore has one photo requirement:

- `none`
- `optional`
- `required`

Only Premium parent accounts can configure `optional` or `required`. Existing and non-Premium chores default to `none`.

The selected requirement is copied onto each chore instance so a later template change does not rewrite an already assigned chore's submission rules. Parent configuration and assignment operations enforce the household's Premium entitlement on the server.

### Child Submission

The child may attach at most one image. Before upload, the client corrects orientation, removes metadata, converts the image to JPEG, limits the longest edge to 1600 pixels, and uses 0.75 quality. The server rejects an uploaded result larger than 5 MB.

- `none`: no photo control is shown.
- `optional`: the child may submit with or without a photo.
- `required`: **Mark as finished** remains blocked until upload succeeds.

The submit RPC enforces the requirement server-side. A required-photo chore can transition to `submitted` only when its proof metadata row is in the ready state. UI validation alone is insufficient.

### Storage and Access

Proof images use a private storage bucket. Database rows store metadata and the private object path, not a public URL.

Supabase Edge Functions own proof upload, viewing, and deletion operations because they can authorize the request and use server credentials without exposing them to either app. Child requests provide the access code and chore ID; parent requests use the authenticated session. Each function verifies household membership or the matching child profile before issuing a short-lived signed URL.

The proof record tracks:

- chore instance;
- private storage path;
- upload state (`uploading`, `ready`, or `deletion_pending`);
- first parent view time;
- deletion deadline.

No server-side `saved` flag is required because saving is a device action and does not change retention.

### Retention

The first successful parent view sets `first_viewed_at` and `delete_after` to 24 hours later. Later views do not extend the deadline.

The parent can select **Save photo** to copy the image into device Photos. Saving does not extend server retention.

A scheduled Edge Function removes expired or deletion-pending storage objects and their metadata. Cleanup must be idempotent so retries are safe.

Proof access is revoked in the same database transaction and physical deletion is queued immediately when:

- the child undoes the submission; or
- a parent sends the chore back.

The proof disappears from both apps immediately. The cleanup worker then removes the private object. This avoids reporting a chore as still submitted merely because Storage deletion needs a retry.

The 24-hour retention window applies only after a parent views a still-active submission or approved chore.

## Data Model

Phase 2 adds:

- a `photo_requirement` enum with `none`, `optional`, and `required`;
- `photo_requirement` on chore templates and chore instances, defaulting to `none`;
- one proof metadata row per chore instance, enforced by a unique constraint.

## Error Handling

- Submit and undo actions disable while pending to prevent duplicate requests.
- Mutation failure keeps the modal open and shows a retryable error.
- Upload failure never marks a required-photo chore as submitted.
- Missing or expired proof shows a neutral unavailable state to the parent.
- Device photo-library denial reports that saving failed but does not affect the server copy or chore status.
- Cleanup treats an already missing storage object as successfully deleted and still removes stale metadata.

## Testing

### Phase 1

- Component tests verify every modal state and available action.
- UI tests verify row taps open the modal and never submit directly.
- Action tests verify submit and undo RPC mapping and failures.
- Database tests verify only the assigned child can undo and only from `submitted`.
- Database concurrency coverage verifies an approved chore cannot be undone.
- Route tests verify successful mutations replace the correct local chore.

### Phase 2

- Tests cover all three photo requirements and Premium configuration gates.
- Database tests prove required-photo submission cannot bypass server validation.
- Authorization tests prove unrelated children and households cannot obtain proof access.
- Retention tests verify first view sets one fixed 24-hour deadline.
- Cleanup tests cover expired, unexpired, already missing, undone, and sent-back proofs.
- Device integration tests cover save success and permission denial.

## Acceptance Criteria

- Every child chore opens the focused bottom-sheet modal.
- Completing a chore requires the explicit modal action.
- A submitted chore can be undone before parent approval.
- An approved chore cannot be undone, including under a race with parent approval.
- Undo removes the parent review request and any attached proof.
- Photo proof supports exactly one compressed image and respects `none`, `optional`, and `required`.
- Required photo validation is enforced by the server.
- Parent first view begins a fixed 24-hour deletion timer.
- Parent saving to device does not alter server deletion.
- Children never encounter billing or upgrade UI.
