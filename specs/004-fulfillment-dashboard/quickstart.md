# Quickstart: Fulfillment Dashboard

**Feature**: `004-fulfillment-dashboard`  
**Branch**: `004-add-redemption-dashboard`

## Prerequisites

1. Node.js 20 LTS
2. npm 10+
3. Branch `004-add-redemption-dashboard` checked out

## Setup

```bash
npm install
npm run db:migrate
npm run db:seed
```

## Run

```bash
npm run dev
```

App URL: `http://localhost:5173`

## Manual Verification Flow

1. Sign in as admin.
2. Open Manage page at `/admin` and verify Approvals card is visible.
3. Confirm badge value reflects count of pending redemptions.
4. Open `/admin/approvals` and verify table shows only pending requests.
5. Verify default sort is oldest first by requested time.
6. Click Fulfill on one row and verify:
   - Row is removed from pending table.
   - Activity log includes fulfilled event.
7. Click Dismiss on one row and verify:
   - Confirmation appears before action.
   - Row is deleted and removed from pending table.
   - No coin refund behavior is triggered.
8. Process all remaining rows and confirm empty-state message appears.

## Test Commands

```bash
npm test
npm run lint
```

Suggested focused runs after implementation:

```bash
npm test -- tests/integration/admin-approvals.test.ts
npm test -- tests/e2e/approvals-dashboard.test.ts
```

Full suite:

```bash
npm test
npm run lint
```
