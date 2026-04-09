# Feature Specification: Choreography MVP

**Feature Branch**: `001-choreography-mvp`
**Created**: 2026-04-08
**Status**: Draft
**Input**: User description: "Get the MVP done for Choreography using mockup as design/UX reference. Fresh start, nothing set up."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Family Setup & Core Chore Loop (Priority: P1)

A parent creates a family account, adds kid profiles (e.g., Emma and Jake), and creates chores with a name, description, frequency (Daily or Weekly), coin reward, an emoji icon, and an optional kid assignment. A kid logs in, sees their personalized dashboard greeting ("Hey Emma!"), views their assigned and unassigned chores for today, and taps a checkmark to mark a chore complete. Completing a chore awards coins to the kid's balance, the chore card shows a green completed state, and the remaining-chore count updates.

**Why this priority**: This is the fundamental product loop — without family creation, chore management, and the kid completion flow, nothing else in the app has meaning. It maps directly to the mockup's primary screen.

**Independent Test**: Can be fully tested by creating a family with one parent and one kid, adding a chore, logging in as the kid, and completing it — verifying coin balance increases and the chore card transitions to the completed state.

**Acceptance Scenarios**:

1. **Given** no family exists, **When** a parent signs up and creates a family, **Then** the family is created and the parent can access a parent dashboard.
2. **Given** a parent is logged in, **When** they add a kid profile with a name and avatar emoji, **Then** the kid appears in the family and can log in.
3. **Given** a parent is logged in, **When** they create a chore with name, description, frequency (Daily/Weekly), coin value, emoji icon, and optional kid assignment, **Then** the chore appears in the chore list for the assigned kid (or all kids if unassigned).
4. **Given** a kid is logged in, **When** they view the Chores tab, **Then** they see a personalized greeting with their name and emoji, the count of chores remaining today, and a list of chore cards showing icon, title, frequency badge, description, coin value, and assignee tag.
5. **Given** a kid views a pending chore, **When** they tap the checkmark button, **Then** the chore card transitions to a green completed state, the kid's coin balance increases by the chore's coin value, and the remaining-chore count decreases.
6. **Given** a kid has completed all daily/weekly chores for today, **When** they view the Chores tab, **Then** they see a "0 chores to complete today" message and all chore cards show the completed state.
7. **Given** a parent is logged in, **When** they view a kid's chore status, **Then** they can see which chores each kid has completed today.

---

### User Story 2 - Prize Shop (Priority: P2)

A parent creates prizes (e.g., "Extra screen time", "Pick dinner") with a name, description, and coin cost. A kid navigates to the Prize Shop tab, browses available prizes, and redeems coins for a prize. The kid's coin balance decreases and the parent receives a notification or log entry that the prize was redeemed.

**Why this priority**: The coin economy needs a spending outlet to motivate kids. Without it, coins have no purpose beyond a number. This directly supports the Prize Shop tab visible in the mockup.

**Independent Test**: Can be tested by giving a kid a coin balance, creating a prize, having the kid redeem it, and verifying the balance decreases and the redemption is recorded.

**Acceptance Scenarios**:

1. **Given** a parent is logged in, **When** they create a prize with a name, description, and coin cost, **Then** the prize appears in the Prize Shop for all kids in the family.
2. **Given** a kid has enough coins, **When** they tap to redeem a prize, **Then** their coin balance decreases by the prize cost and the redemption is recorded.
3. **Given** a kid does not have enough coins, **When** they view a prize, **Then** the redeem action is disabled and the coin shortfall is visible.
4. **Given** a prize has been redeemed, **When** a parent views the activity log, **Then** the redemption is visible with the kid's name, prize name, coin cost, and timestamp.

---

### User Story 3 - Family Leaderboard (Priority: P3)

Kids (and parents) navigate to the Leaderboard tab and see a ranked list of family members ordered by coins earned. The leaderboard resets on a configurable cadence (weekly by default) to keep competition fresh.

**Why this priority**: Gamification and sibling competition are core engagement drivers. The Leaderboard tab is visible in the mockup and completes the three-tab navigation.

**Independent Test**: Can be tested by having two kids earn different coin amounts from chores and verifying the leaderboard ranks them correctly.

**Acceptance Scenarios**:

1. **Given** multiple kids exist in a family, **When** any family member views the Leaderboard tab, **Then** they see all kids ranked by coins earned in the current period.
2. **Given** a kid completes a chore, **When** the leaderboard is viewed, **Then** the ranking reflects the updated coin totals.
3. **Given** the leaderboard reset period has elapsed, **When** the leaderboard is viewed, **Then** totals are reset to zero for the new period while historical data is preserved.

---

### Edge Cases

- What happens when a parent deletes a chore that a kid has already completed today? The completed record and awarded coins persist; the chore no longer appears in future lists.
- What happens when a kid tries to complete the same chore twice in one period? The system prevents duplicate completion for the same chore within its frequency window (once per day for Daily, once per week for Weekly).
- What happens when a parent removes a kid profile? The kid can no longer log in; their historical data is retained for the parent but hidden from the leaderboard going forward.
- What happens when the family has only one kid? The leaderboard still shows their ranking (1st place) and the kid switcher in the header shows only one avatar.
- What happens if the app is accessed on a small screen? The layout adapts responsively — chore cards stack vertically, navigation tabs remain accessible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a parent to create a family account with email and password.
- **FR-002**: System MUST allow a parent to add kid profiles with a display name and avatar emoji.
- **FR-003**: System MUST allow a parent to create chores with: name, description, frequency (Daily or Weekly), coin reward value, emoji icon, and optional kid assignment.
- **FR-004**: System MUST allow a parent to edit and delete chores.
- **FR-005**: System MUST display a personalized kid dashboard showing a greeting with the kid's name and emoji, count of remaining chores for today, and a list of chore cards.
- **FR-006**: Each chore card MUST display: emoji icon, chore name, frequency badge (Daily/Weekly), description, coin value, and assignee tag (if assigned to a specific kid).
- **FR-007**: System MUST allow a kid to mark a chore as complete by tapping a checkmark button, transitioning the card to a green completed state.
- **FR-008**: System MUST award the chore's coin value to the kid's balance upon completion.
- **FR-009**: System MUST prevent a kid from completing the same chore more than once within its frequency window.
- **FR-010**: System MUST display the kid's current coin balance in the header.
- **FR-011**: System MUST allow switching between kid profiles via avatar tabs in the header (kid view shows siblings; parent view shows all kids).
- **FR-012**: System MUST support parent-created prizes with a name, description, and coin cost.
- **FR-013**: System MUST allow a kid to redeem a prize if they have sufficient coins, deducting the cost from their balance.
- **FR-014**: System MUST display a family leaderboard ranking kids by coins earned in the current period.
- **FR-015**: System MUST support a configurable leaderboard reset cadence (default: weekly).
- **FR-016**: System MUST distinguish between parent and kid roles with appropriate access controls (kids cannot create/edit chores or prizes).
- **FR-017**: System MUST allow a family to export their data (chores, kids, history) and delete their family account.
- **FR-018**: System MUST NOT send personal family data to third-party analytics by default.
- **FR-019**: System MUST be fully functional when self-hosted.

### Key Entities

- **Family**: A household group containing one or more parents and one or more kids. Owns all chores, prizes, and history.
- **Parent**: An adult user who manages the family, creates chores and prizes, and reviews kid activity. Authenticates with email/password.
- **Kid**: A child profile within a family. Has a display name, avatar emoji, and coin balance. Can view and complete chores, redeem prizes, and view the leaderboard.
- **Chore**: A task with a name, description, emoji icon, frequency (Daily/Weekly), coin reward, and optional kid assignment. Tracks completion per kid per frequency window.
- **Chore Completion**: A record that a specific kid completed a specific chore at a specific time, awarding a specific coin amount.
- **Prize**: A reward created by a parent with a name, description, and coin cost. Available to all kids in the family.
- **Prize Redemption**: A record that a specific kid redeemed a specific prize, deducting coins, at a specific time.
- **Leaderboard Entry**: A derived ranking of kids by coins earned within the current reset period.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A parent can set up a family with kids and chores and have a kid complete a chore within 5 minutes of first use.
- **SC-002**: A kid can view their chore list and complete a chore in under 10 seconds from the dashboard.
- **SC-003**: 90% of acceptance scenarios pass automated tests before the feature is considered done.
- **SC-004**: All user-facing flows are navigable using keyboard and meet basic WCAG 2.1 Level A contrast and labeling requirements.
- **SC-005**: The application runs fully self-hosted with a single container or process and no external service dependencies for core functionality.
- **SC-006**: Coin balances are always consistent — every coin earned or spent is traceable to a chore completion or prize redemption record.

## Assumptions

- Users access the application via a modern web browser on desktop or mobile; native mobile apps are out of scope for the MVP.
- Authentication for the MVP uses simple email/password for parents; kids log in via a family-scoped PIN or parent-managed session rather than a separate email account.
- The visual design follows the warm beige/cream background with orange/amber accents and green completion states shown in the mockup.
- The MVP targets a single-family experience; multi-family or social features are out of scope.
- No email or push notification system is required for the MVP; parents check activity within the app.
- The application stores data in a local database suitable for self-hosting (e.g., SQLite or PostgreSQL); cloud-managed database services are not required.
- Chore scheduling is limited to Daily and Weekly frequencies for the MVP; custom schedules are out of scope.
- The leaderboard reset cadence defaults to weekly; parent configuration of the cadence is a stretch goal within the MVP.
