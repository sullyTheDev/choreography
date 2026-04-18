# REST API Documentation

**Version:** 1.0  
**Status:** ✅ Implemented  
**Authentication:** Bearer Token (API Key)  
**Base URL:** `/api/v1`

## Overview

The Choreography REST API provides programmatic access to family chore and prize data. All requests are family-scoped and require a valid API key issued through the Admin Settings UI.

### Key Points

- **Family-Scoped:** All data is isolated per family
- **One Active Key Per Family:** Only one API key can be active at a time
- **Bearer Token Auth:** Use `Authorization: Bearer <key>` header
- **Status-Based Workflow:** Redemptions use status updates (no hard deletes)
- **Pagination:** List endpoints support limit/offset parameters

## Authentication

### Generating an API Key

1. Sign in to your family account
2. Navigate to **Admin → Settings**
3. Click **"Generate API Key"**
4. Copy the key and save it securely (shown only once)

### Using the API Key

Include the key in all requests:

```bash
curl -H "Authorization: Bearer choreo_xyzabc..." https://yourapp.com/api/v1/chores
```

### Key Rotation

To rotate your API key:

1. Go to **Admin → Settings**
2. Click **"Rotate Key"**
3. A new key is generated; the old key immediately stops working
4. Update any integrations with the new key

### Revoking an API Key

1. Go to **Admin → Settings**
2. Click **"Delete"** next to your API key
3. The key is revoked immediately

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Wash Dishes",
    ...
  }
}
```

Or on error:

```json
{
  "success": false,
  "error": "Chore not found",
  "code": "NOT_FOUND"
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (POST) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid key) |
| 404 | Not Found |
| 405 | Method Not Allowed |
| 500 | Server Error |

## Endpoints

### Chores

#### List Chores
```
GET /api/v1/chores
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ulid1",
      "familyId": "...",
      "name": "Wash Dishes",
      "description": "Wash all dishes in the sink",
      "emoji": "πŸ›'",
      "createdAt": "2026-04-18T...",
      "updatedAt": "2026-04-18T..."
    }
  ]
}
```

#### Get Chore
```
GET /api/v1/chores?id=<choreId>
```

#### Create Chore
```
POST /api/v1/chores
Content-Type: application/json

{
  "name": "Wash Dishes",
  "description": "Wash all dishes in the sink",
  "emoji": "πŸ›'"
}
```

**Response:** `201 Created`

#### Update Chore
```
PUT /api/v1/chores?id=<choreId>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "emoji": "πŸ§'β€πŸ³"
}
```

#### Delete Chore
```
DELETE /api/v1/chores?id=<choreId>
```

### Prizes

#### List Prizes
```
GET /api/v1/prizes
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ulid1",
      "familyId": "...",
      "name": "Ice Cream",
      "description": "Get a free scoop",
      "emoji": "πŸ¨",
      "costPoints": 100,
      "createdAt": "2026-04-18T...",
      "updatedAt": "2026-04-18T..."
    }
  ]
}
```

#### Get Prize
```
GET /api/v1/prizes?id=<prizeId>
```

#### Create Prize
```
POST /api/v1/prizes
Content-Type: application/json

{
  "name": "Ice Cream",
  "description": "Get a free scoop",
  "emoji": "πŸ¨",
  "costPoints": 100
}
```

**Response:** `201 Created`

#### Update Prize
```
PUT /api/v1/prizes?id=<prizeId>
Content-Type: application/json

{
  "name": "Updated Prize",
  "costPoints": 150
}
```

#### Delete Prize
```
DELETE /api/v1/prizes?id=<prizeId>
```

### Family Members

#### List Members
```
GET /api/v1/members
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "memberId": "user-id",
      "familyId": "...",
      "displayName": "Alice",
      "memberRole": "admin",
      "createdAt": "2026-04-18T...",
      "user": {
        "id": "user-id",
        "email": "alice@example.com",
        "displayName": "Alice"
      }
    }
  ]
}
```

#### Get Member
```
GET /api/v1/members?id=<memberId>
```

**Note:** Members endpoint is read-only for now.

### Prize Redemptions

#### List Redemptions
```
GET /api/v1/redemptions
GET /api/v1/redemptions?status=available
GET /api/v1/redemptions?status=pending
GET /api/v1/redemptions?status=fulfilled
GET /api/v1/redemptions?status=dismissed
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ulid1",
      "familyId": "...",
      "memberId": "user-id",
      "prizeId": "prize-id",
      "status": "available",
      "createdAt": "2026-04-18T...",
      "updatedAt": "2026-04-18T...",
      "fulfilledAt": null,
      "dismissedAt": null
    }
  ]
}
```

#### Get Redemption
```
GET /api/v1/redemptions?id=<redemptionId>
```

#### Create Redemption
```
POST /api/v1/redemptions
Content-Type: application/json

{
  "memberId": "user-id",
  "prizeId": "prize-id"
}
```

**Response:** `201 Created`  
**Initial Status:** `available`

#### Update Redemption Status
```
PUT /api/v1/redemptions?id=<redemptionId>
Content-Type: application/json

{
  "status": "pending"
}
```

**Valid Statuses:**
- `available` - Initial state
- `pending` - Being prepared
- `fulfilled` - Completed (sets `fulfilledAt`)
- `dismissed` - Cancelled/ignored (sets `dismissedAt`)

**Important:** Status updates persist timestamps. Dismissals don't delete records—they mark status as dismissed and record the time.

### Completions (Read-Only)

#### List Completions
```
GET /api/v1/completions?limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "completions": [
      {
        "id": "ulid1",
        "choreId": "chore-id",
        "choreName": "Wash Dishes",
        "choreEmoji": "πŸ›'",
        "memberId": "user-id",
        "memberDisplayName": "Alice",
        "completedAt": "2026-04-18T...",
        "pointsEarned": 10
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 42,
      "hasMore": false
    }
  }
}
```

**Parameters:**
- `limit` (optional): Max 100, default 50
- `offset` (optional): Default 0

### Activity (Read-Only)

#### Get Activity Feed
```
GET /api/v1/activity?limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "type": "completion",
        "id": "ulid1",
        "choreName": "Wash Dishes",
        "choreEmoji": "πŸ›'",
        "memberDisplayName": "Alice",
        "timestamp": "2026-04-18T...",
        "pointsEarned": 10
      },
      {
        "type": "redemption",
        "id": "ulid2",
        "prizeName": "Ice Cream",
        "prizeEmoji": "πŸ¨",
        "memberDisplayName": "Bob",
        "timestamp": "2026-04-18T...",
        "status": "fulfilled"
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 156,
      "hasMore": true
    }
  }
}
```

**Parameters:**
- `limit` (optional): Max 100, default 50
- `offset` (optional): Default 0

**Event Types:**
- `completion` - Chore completed
- `redemption` - Prize redeemed

## Error Codes

| Code | Meaning |
|------|---------|
| `UNAUTHORIZED` | Missing or invalid API key |
| `NOT_FOUND` | Resource not found or belongs to different family |
| `INVALID_INPUT` | Validation error (missing field, wrong type) |
| `INVALID_JSON` | Request body is not valid JSON |
| `METHOD_NOT_ALLOWED` | HTTP method not supported for endpoint |
| `INTERNAL_ERROR` | Server-side error |

## Testing Locally

The development server uses a self-signed SSL certificate. When testing with curl, add the `-k` or `--insecure` flag to skip certificate verification:

```bash
curl -k -H "Authorization: Bearer <your-key>" https://localhost:5173/api/v1/chores
```

Or use the insecure flag explicitly:

```bash
curl --insecure -H "Authorization: Bearer <your-key>" https://localhost:5173/api/v1/chores
```

**For Production:** Always use valid SSL certificates and proper HTTPS.

## Examples

### Create a Chore and Assign It

```bash
# Create chore
curl -k -X POST https://localhost:5173/api/v1/chores \
  -H "Authorization: Bearer choreo_xyzabc..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vacuum Living Room",
    "emoji": "🧹"
  }'

# Response:
# {"success":true,"data":{"id":"ulid...","name":"Vacuum Living Room",...}}
```

### Create a Prize and a Redemption

```bash
# Create prize
curl -k -X POST https://localhost:5173/api/v1/prizes \
  -H "Authorization: Bearer choreo_xyzabc..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Movie Night",
    "costPoints": 200,
    "emoji": "🎬"
  }'

# Create redemption
curl -k -X POST https://localhost:5173/api/v1/redemptions \
  -H "Authorization: Bearer choreo_xyzabc..." \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "user123",
    "prizeId": "prize456"
  }'

# Update status to fulfilled
curl -k -X PUT "https://localhost:5173/api/v1/redemptions?id=redemption789" \
  -H "Authorization: Bearer choreo_xyzabc..." \
  -H "Content-Type: application/json" \
  -d '{"status": "fulfilled"}'
```

### Get Activity Feed

```bash
curl -k https://localhost:5173/api/v1/activity?limit=20 \
  -H "Authorization: Bearer choreo_xyzabc..."

# Response:
# {"success":true,"data":{"events":[...]},"pagination":{...}}
```

## Rate Limiting

Currently, there is no built-in rate limiting. Consider adding it if needed for public APIs.

## Deprecation Policy

API changes will be announced with at least 30 days notice. Breaking changes will use new API versions (e.g., `/api/v2`).

## Support

For issues, questions, or feature requests, please create an issue in the project repository.
