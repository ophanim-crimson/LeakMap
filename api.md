# LeakMap API Documentation

Base URL: `http://localhost:8000` (local) or `https://your-backend.onrender.com` (production)

---

## POST `/api/reports`

Create a new water issue report.

### Request Body

```json
{
  "issue_type": "Leak",
  "description": "Pipeline leaking near the main road.",
  "latitude": 30.2672,
  "longitude": -97.7431,
  "photo_url": "/uploads/2026/06/abcdef123456.webp"
}
```

| Field        | Type     | Required | Constraints                                                             |
|--------------|----------|----------|-------------------------------------------------------------------------|
| issue_type   | string   | Yes      | One of: Leak, Overflow, Damaged Tap, Broken Valve, Water Supply Issue, Other |
| description  | string   | No       | Max 500 characters                                                      |
| latitude     | float    | Yes      | -90 to 90                                                               |
| longitude    | float    | Yes      | -180 to 180                                                             |
| photo_url    | string   | No       | URL returned by POST /api/uploads                                       |

### Response (201)

```json
{
  "id": 51,
  "report_code": "LM-AB12CD",
  "issue_type": "Leak",
  "description": "Pipeline leaking near the main road.",
  "latitude": 30.2672,
  "longitude": -97.7431,
  "status": "Active",
  "created_at": "2026-06-19T10:00:00Z",
  "photos": [
    {
      "id": 1,
      "report_id": 51,
      "image_url": "/uploads/2026/06/abcdef123456.webp",
      "uploaded_at": "2026-06-19T10:00:00Z"
    }
  ],
  "updates": [],
  "verification_counts": {
    "confirmed": 0,
    "duplicate": 0,
    "resolved": 0
  }
}
```

### Errors

- `422 Unprocessable Entity` — Validation error (invalid issue_type, coordinates out of range, etc.)

---

## GET `/api/reports`

List, search, and filter reports with pagination.

### Query Parameters

| Param      | Type   | Default | Description                           |
|------------|--------|---------|---------------------------------------|
| q          | string | —       | Search keyword (description, code)    |
| issue_type | string | —       | Filter by issue type                  |
| status     | string | —       | Filter: "Active" or "Resolved"        |
| min_lat    | float  | —       | Map bounds south                      |
| max_lat    | float  | —       | Map bounds north                      |
| min_lng    | float  | —       | Map bounds west                       |
| max_lng    | float  | —       | Map bounds east                       |
| page       | int    | 1       | Page number (1-indexed)               |
| limit      | int    | 20      | Items per page (max 100)              |

### Response (200)

Array of ReportResponse objects (same shape as POST response above).

---

## GET `/api/reports/{id}`

Get full details for a single report by ID.

### Response (200)

Single ReportResponse object.

### Errors

- `404 Not Found` — Report does not exist.

---

## POST `/api/reports/{id}/verify`

Submit a community verification vote.

### Request Body

```json
{
  "verification_type": "Confirmed",
  "session_id": "session_abc123def456"
}
```

| Field              | Type   | Required | Constraints                              |
|--------------------|--------|----------|------------------------------------------|
| verification_type  | string | Yes      | One of: Confirmed, Duplicate, Resolved   |
| session_id         | string | Yes      | Unique session identifier (from localStorage) |

### Response (200)

Updated ReportResponse object.

### Errors

- `404 Not Found` — Report not found.
- `409 Conflict` — Duplicate vote from the same session.

---

## POST `/api/reports/{id}/updates`

Add a community text update to a report.

### Request Body

```json
{
  "update_text": "Municipal crew has arrived and started repairs."
}
```

| Field       | Type   | Required | Constraints        |
|-------------|--------|----------|--------------------|
| update_text | string | Yes      | Max 1000 characters |

### Response (200)

Updated ReportResponse object with the new update included.

### Errors

- `404 Not Found` — Report not found.

---

## GET `/api/statistics`

Get dashboard-level aggregate statistics.

### Response (200)

```json
{
  "total": 50,
  "active": 30,
  "confirmed": 18,
  "resolved": 20
}
```

---

## POST `/api/uploads`

Upload and compress an image file.

### Request

Multipart form data with `file` field.

Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`

Max file size: 5 MB

### Response (200)

```json
{
  "image_url": "/uploads/2026/06/a1b2c3d4e5f6.webp"
}
```

### Errors

- `400 Bad Request` — Invalid file type or file too large.
- `500 Internal Server Error` — Image processing failure.
