# Feature Specification: Fulfillment Dashboard

**Feature Branch**: `004-add-redemption-dashboard`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "Parent/admin fulfillment dashboard for pending prize redemptions"

## Clarifications

### Session 2026-04-16

- Q: What data scope should the approvals dashboard expose to an authenticated parent/admin? → A: Scope approvals strictly to the currently authenticated parent's family only.
- Q: What should the default table sort order be for pending requests? → A: Default sort by request time ascending (oldest first).
- Q: How should the UI behave if another admin processes a request before the current parent action completes? → A: Show "already processed" notice and refresh list automatically.
- Q: Should destructive-action confirmation be required for Fulfill and/or Dismiss? → A: Confirm Dismiss only; Fulfill stays single-tap.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review Pending Requests (Priority: P1)

As a parent, I can open a dedicated approvals page and see only pending prize requests with enough context to decide quickly.

**Why this priority**: Without a clear pending queue, parents cannot reliably fulfill rewards and the core redemption loop stalls.

**Independent Test**: Create pending and non-pending redemption records, then confirm the page shows only pending records with child name, prize name, request time, and coin cost.

**Acceptance Scenarios**:

1. **Given** pending and fulfilled redemption records exist, **When** a parent opens the approvals page, **Then** only pending records are listed.
2. **Given** pending records exist, **When** the list is shown, **Then** each row displays prize emoji, "[Child Name] redeemed [Prize Name]", relative request time, and coin cost.
3. **Given** many pending records exist, **When** the parent uses sorting and pagination controls, **Then** the list order and page contents update correctly.

---

### User Story 2 - Fulfill a Request Fast (Priority: P1)

As a parent, I can mark a pending request as fulfilled with one primary action so I can clear the queue quickly.

**Why this priority**: Fast fulfillment is the primary business goal for this dashboard.

**Independent Test**: From a pending list with at least one record, click Fulfill and verify the record status changes to fulfilled, an activity event is recorded, and the row is removed from the pending view.

**Acceptance Scenarios**:

1. **Given** a pending redemption is visible, **When** the parent clicks Fulfill, **Then** the request is marked fulfilled and no longer appears in the pending list.
2. **Given** a pending redemption is fulfilled, **When** the action completes, **Then** a fulfillment activity entry is created for family history/audit visibility.

---

### User Story 3 - Dismiss Mistaken Requests (Priority: P2)

As a parent, I can dismiss an accidental request so it no longer clutters the pending queue.

**Why this priority**: Dismissal prevents queue noise and supports inbox-zero behavior for admins.

**Independent Test**: From a pending list with at least one record, click Dismiss and verify the record is deleted and removed from the list without any coin refund behavior.

**Acceptance Scenarios**:

1. **Given** a pending redemption is visible, **When** the parent clicks Dismiss, **Then** the request is deleted and disappears from the list.
2. **Given** a dismissal is completed, **When** the child account is reviewed, **Then** coin balance is unchanged by the dismissal action.
3. **Given** a pending redemption is visible, **When** the parent selects Dismiss, **Then** the system asks for confirmation before deleting the request.

---

### Edge Cases

- A request is fulfilled or dismissed by another admin while the current parent is viewing the list.
- Multiple pending requests exist for the same child and same prize at different times.
- The final item on the current page is acted on, requiring pagination to shift to a valid page.
- No pending items exist at page load or after the last item is acted on.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an admin-only approvals route for pending prize redemption management, scoped to the currently authenticated parent's family only.
- **FR-002**: System MUST expose an entry point from the existing admin/manage landing grid to the approvals route.
- **FR-003**: System MUST display a numeric badge on the admin/manage approvals card showing the current total count of pending redemption requests.
- **FR-004**: System MUST present pending requests in a full-width vertical table view with sorting and pagination controls, defaulting to request time ascending (oldest first).
- **FR-005**: System MUST display only redemption records with a current status of pending on the approvals page.
- **FR-006**: System MUST render each row with prize emoji, child name, prize name, relative request time, and prize coin cost.
- **FR-007**: System MUST provide a primary Fulfill action for each row.
- **FR-008**: When Fulfill is selected, system MUST change the redemption status to fulfilled.
- **FR-009**: When Fulfill is selected, system MUST record a fulfillment activity log entry linked to the child and redemption.
- **FR-010**: When Fulfill is selected, system MUST remove the item from the active pending list and refresh pending counts.
- **FR-011**: System MUST provide a secondary Dismiss action that permanently deletes the pending redemption request.
- **FR-012**: When Dismiss is selected, system MUST remove the request from the list and refresh pending counts without applying any coin refund or coin recalculation.
- **FR-013**: System MUST display a friendly empty state message when no pending requests remain.
- **FR-014**: If a parent attempts to Fulfill or Dismiss a request that has already been processed by another admin, system MUST show an "already processed" notice and automatically refresh the pending list.
- **FR-015**: System MUST require a confirmation step for Dismiss before permanently deleting a redemption request.
- **FR-016**: System MUST keep Fulfill as a single-tap action without a confirmation dialog.

### Key Entities *(include if feature involves data)*

- **Redemption Request**: A prize request made by a child, including status, requested timestamp, prize reference, child reference, and coin cost snapshot.
- **Prize**: A redeemable reward definition containing name, emoji, and coin cost.
- **Child Profile**: A family member identity used to display who requested a redemption.
- **Activity Event**: A recorded event showing fulfillment actions for family history and accountability.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In usability testing, parents complete a single pending request fulfillment in 5 seconds or less in at least 95% of attempts.
- **SC-002**: 100% of fulfilled or dismissed requests are removed from the active pending list immediately after action completion.
- **SC-003**: The pending-count badge on the admin/manage card matches the actual number of pending requests in at least 99% of sampled page loads.
- **SC-004**: When no pending requests exist, 100% of parent sessions on the approvals page show the empty-state message instead of an empty table.

## Assumptions

- Parent/admin authentication and authorization already exists and is enforced consistently for admin routes.
- Existing redemption and activity data models are available for status updates, deletion, and activity recording.
- Relative time display follows existing app conventions for human-readable timestamps.
- This feature is scoped to parent/admin experiences only; child-facing views and notification channels are out of scope.
- Dismissal is a quiet cancellation and does not trigger any refund workflow for this MVP.