# API Endpoints Reference

## Base URL

**Development**: `http://localhost:3000`  
**Production**: `https://your-app.vercel.app`

## Products

### GET /api/products

Fetch all products with real-time warehouse inventory.

**Response:**
```json
[
  {
    "id": "cuid-string",
    "name": "iPhone 15 Pro",
    "price": 134900,
    "description": "Titanium design, A17 Pro chip",
    "imageUrl": null,
    "category": "Smartphones",
    "totalAvailable": 12,
    "inventory": [
      {
        "warehouseId": "cuid-string",
        "warehouseName": "Mumbai Central",
        "location": "Mumbai, Maharashtra",
        "totalStock": 3,
        "reservedStock": 0,
        "availableStock": 3
      }
    ]
  }
]
```

**Status Codes:**
- `200` - Success

---

## Warehouses

### GET /api/warehouses

Fetch all warehouse locations.

**Response:**
```json
[
  {
    "id": "cuid-string",
    "name": "Mumbai Central",
    "location": "Mumbai, Maharashtra",
    "createdAt": "2024-01-20T10:00:00Z"
  }
]
```

**Status Codes:**
- `200` - Success

---

## Reservations

### POST /api/reservations

Create a new 10-minute hold on inventory.

**Request:**
```json
{
  "productId": "cuid-string",
  "warehouseId": "cuid-string",
  "quantity": 1
}
```

**Response (201):**
```json
{
  "id": "cuid-string",
  "productId": "cuid-string",
  "warehouseId": "cuid-string",
  "quantity": 1,
  "status": "pending",
  "expiresAt": "2024-01-20T10:10:00Z",
  "createdAt": "2024-01-20T10:00:00Z",
  "product": { "id": "...", "name": "iPhone 15 Pro", ... },
  "warehouse": { "id": "...", "name": "Mumbai Central", ... }
}
```

**Status Codes:**
- `201` - Created successfully
- `409` - Insufficient stock available
- `404` - Inventory not found
- `400` - Invalid request body
- `500` - Server error

---

### GET /api/reservations/[id]

Fetch reservation details.

**Response (200):**
```json
{
  "id": "cuid-string",
  "productId": "cuid-string",
  "warehouseId": "cuid-string",
  "quantity": 1,
  "status": "pending|confirmed|released|expired",
  "expiresAt": "2024-01-20T10:10:00Z",
  "createdAt": "2024-01-20T10:00:00Z",
  "product": { ... },
  "warehouse": { ... }
}
```

**Status Codes:**
- `200` - Found
- `404` - Reservation not found
- `500` - Server error

---

### POST /api/reservations/[id]/confirm

Complete and confirm a pending reservation.
- Permanently deducts inventory (totalStock -= quantity, reservedStock -= quantity)
- Must be pending and not expired

**Response (200):**
```json
{
  "id": "cuid-string",
  "status": "confirmed",
  ...
}
```

**Status Codes:**
- `200` - Confirmed
- `404` - Reservation not found
- `410` - Reservation expired
- `400` - Invalid status (already confirmed/released)
- `500` - Server error

---

### POST /api/reservations/[id]/release

Cancel and release a pending reservation.
- Restores reserved stock (reservedStock -= quantity)
- Must be pending

**Response (200):**
```json
{
  "id": "cuid-string",
  "status": "released",
  ...
}
```

**Status Codes:**
- `200` - Released
- `404` - Reservation not found
- `400` - Invalid status (already confirmed/released/expired)
- `500` - Server error

---

## Chat

### POST /api/chat

Stream responses from Groq AI assistant.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "How do reservations work?" },
    { "role": "assistant", "content": "Reservations hold stock for..." }
  ]
}
```

**Response (200):**
Streamed text response with `Content-Type: text/event-stream`

```
data: Hello!

data: How can I help?

...
```

**Status Codes:**
- `200` - Stream established
- `502` - AI service unavailable
- `500` - Server error

**Notes:**
- Streaming with Server-Sent Events (SSE)
- Runs on Vercel Edge Runtime
- Requires valid GROQ_API_KEY

---

## Cron

### GET /api/cron/cleanup

🔒 **Protected** - Requires `Authorization: Bearer CRON_SECRET` header

Cleans up expired reservations and restores stock.
Automatically called by Vercel every 5 minutes.

**Request:**
```bash
curl https://your-app.vercel.app/api/cron/cleanup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Response (200):**
```json
{
  "expired": 5,
  "timestamp": "2024-01-20T10:30:00Z"
}
```

**Status Codes:**
- `200` - Cleanup completed
- `401` - Missing or invalid CRON_SECRET
- `500` - Cleanup failed

**What it does:**
1. Finds all pending reservations where `expiresAt < now()`
2. Marks them as `expired`
3. Restores `reservedStock` for each
4. Logs count of processed reservations

---

## Error Handling

All errors return JSON format:

```json
{
  "error": "Descriptive error message"
}
```

**Common Errors:**
```json
{ "error": "Insufficient stock available" }
{ "error": "Reservation not found" }
{ "error": "Reservation has expired" }
{ "error": "Failed to fetch products" }
{ "error": "Invalid request body", "details": [...] }
```

---

## Rate Limiting

**Current Limits:** None implemented (add before production if needed)

**Recommendations for production:**
- Max 100 requests/minute per IP
- Max 10 concurrent reservations per user
- Groq API rate limits apply

---

## Examples

### Full Reservation Flow

```bash
# 1. Get products
curl https://your-app.vercel.app/api/products

# 2. Create reservation (10-min hold)
curl -X POST https://your-app.vercel.app/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"productId":"abc123","warehouseId":"xyz789","quantity":1}'
# Returns: reservation with id "res_123"

# 3. User confirms purchase
curl -X POST https://your-app.vercel.app/api/reservations/res_123/confirm

# Stock is now permanently deducted! ✓

# Alternative: User cancels
curl -X POST https://your-app.vercel.app/api/reservations/res_123/release
# Stock released back to inventory ✓
```

### Chat with AI

```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role":"user","content":"What are the warehouse locations?"}
    ]
  }' \
  --no-buffer  # Show streaming responses

# Returns streamed text from Groq
```

---

## Database Transactions

All reservation operations use database transactions with:
- **Row-level locking**: `SELECT ... FOR UPDATE`
- **Isolation level**: `Serializable`
- **Prevents**: Race conditions and overselling

This ensures data integrity even with concurrent requests.

---

## Environment Variables

Required for API functionality:

```
DATABASE_URL          # PostgreSQL pooler (port 6543)
DIRECT_URL           # PostgreSQL direct (port 5432)
GROQ_API_KEY         # For chat endpoint
CRON_SECRET          # For cron endpoint protection
RESERVATION_EXPIRY_MINUTES  # Default: 10
```

---

## Status Codes Summary

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Fix your request |
| 401 | Unauthorized | Missing/invalid auth |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Stock conflict (oversell attempt) |
| 410 | Gone | Reservation expired |
| 500 | Server Error | Server problem |
| 502 | Bad Gateway | External service error |

---

Last updated: January 2024
