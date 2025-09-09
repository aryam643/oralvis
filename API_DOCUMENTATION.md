# OralVis Healthcare - API Documentation

## Base URL
\`\`\`
http://localhost:3000/api
\`\`\`

## Authentication

All API endpoints require authentication via Supabase JWT tokens, except for public authentication endpoints.

### Headers
\`\`\`
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
\`\`\`

## Endpoints

### Authentication

#### POST /auth/login
Login user and get JWT token.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "patient"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
\`\`\`

#### POST /auth/register
Register new user account.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "patient",
  "name": "John Doe",
  "patientId": "P001"
}
\`\`\`

#### POST /auth/logout
Logout current user session.

### Submissions

#### GET /submissions
Get submissions (filtered by user role).

**Query Parameters:**
- `status` (optional): Filter by status (uploaded, annotated, reported)
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page

**Response:**
\`\`\`json
{
  "submissions": [
    {
      "id": "uuid",
      "patient_id": "P001",
      "name": "John Doe",
      "email": "patient@example.com",
      "image_url": "https://...",
      "status": "uploaded",
      "created_at": "2024-01-01T00:00:00Z",
      "notes": "Patient notes here"
    }
  ],
  "total": 10,
  "page": 1,
  "totalPages": 2
}
\`\`\`

#### POST /submissions
Create new submission (Patient only).

**Request Body (multipart/form-data):**
\`\`\`
name: John Doe
patientId: P001
email: patient@example.com
notes: Patient notes
image: [File]
\`\`\`

**Response:**
\`\`\`json
{
  "id": "uuid",
  "message": "Submission created successfully"
}
\`\`\`

#### GET /submissions/:id
Get specific submission details.

**Response:**
\`\`\`json
{
  "id": "uuid",
  "patient_id": "P001",
  "name": "John Doe",
  "email": "patient@example.com",
  "image_url": "https://...",
  "annotated_image_url": "https://...",
  "report_url": "https://...",
  "status": "annotated",
  "annotations": {
    "shapes": [...],
    "colors": {...}
  },
  "created_at": "2024-01-01T00:00:00Z",
  "notes": "Patient notes"
}
\`\`\`

#### PUT /submissions/:id/annotations
Save annotations for submission (Admin only).

**Request Body:**
\`\`\`json
{
  "annotations": {
    "shapes": [
      {
        "type": "rectangle",
        "x": 100,
        "y": 100,
        "width": 50,
        "height": 30,
        "color": "#ff0000"
      }
    ]
  },
  "annotatedImageData": "data:image/png;base64,..."
}
\`\`\`

### Reports

#### POST /generate-report
Generate PDF report for submission (Admin only).

**Request Body:**
\`\`\`json
{
  "submissionId": "uuid",
  "findings": [
    {
      "category": "Inflamed/Red gums",
      "description": "Visible inflammation in upper gums",
      "treatment": "Scaling and root planing recommended"
    }
  ],
  "recommendations": "Follow-up in 2 weeks"
}
\`\`\`

**Response:**
\`\`\`json
{
  "reportUrl": "https://...",
  "message": "Report generated successfully"
}
\`\`\`

#### GET /reports/:submissionId
Download PDF report.

**Response:** PDF file download

## Error Responses

### 400 Bad Request
\`\`\`json
{
  "error": "Invalid request data",
  "details": "Specific validation errors"
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "error": "Authentication required"
}
\`\`\`

### 403 Forbidden
\`\`\`json
{
  "error": "Insufficient permissions"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "error": "Resource not found"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "error": "Internal server error",
  "message": "Something went wrong"
}
\`\`\`

## Rate Limits

- Authentication endpoints: 5 requests per minute
- File upload endpoints: 10 requests per minute
- General API endpoints: 100 requests per minute

## File Upload Specifications

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### File Size Limits
- Maximum file size: 10MB
- Recommended resolution: 1920x1080 or higher

### Storage
- Original images: Stored in `dental-images` bucket
- Annotated images: Stored in `annotated-images` bucket
- PDF reports: Stored in `reports` bucket

## Sample Requests

### Upload Dental Image (cURL)
\`\`\`bash
curl -X POST http://localhost:3000/api/submissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=John Doe" \
  -F "patientId=P001" \
  -F "email=patient@example.com" \
  -F "notes=Routine checkup" \
  -F "image=@/path/to/dental-image.jpg"
\`\`\`

### Save Annotations (cURL)
\`\`\`bash
curl -X PUT http://localhost:3000/api/submissions/SUBMISSION_ID/annotations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "annotations": {
      "shapes": [
        {
          "type": "rectangle",
          "x": 100,
          "y": 100,
          "width": 50,
          "height": 30,
          "color": "#ff0000"
        }
      ]
    },
    "annotatedImageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }'
\`\`\`

### Generate Report (cURL)
\`\`\`bash
curl -X POST http://localhost:3000/api/generate-report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": "SUBMISSION_ID",
    "findings": [
      {
        "category": "Inflamed/Red gums",
        "description": "Visible inflammation in upper gums",
        "treatment": "Scaling and root planing recommended"
      }
    ],
    "recommendations": "Follow-up in 2 weeks"
  }'
