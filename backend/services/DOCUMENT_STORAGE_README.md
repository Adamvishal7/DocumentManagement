# Document Storage and Upload Implementation

## Overview

This document describes the implementation of Tasks 7 and 8 from the Document Upload & Management System spec, which provides complete document storage, versioning, and upload functionality.

## Implemented Components

### Task 7.1: File Storage Module (`services/fileStorage.js`)

Handles physical file storage operations:

- **Directory Structure**: Organizes files by category (e.g., `uploads/HR_Documents/`, `uploads/Finance/`)
- **File Naming**: Uses versioned filenames: `doc_{id}_v{version}.{ext}`
- **Operations**:
  - `storeFile()`: Writes file to disk with proper organization
  - `readFile()`: Retrieves file content from storage
  - `deleteFile()`: Removes file from storage
  - `deleteMultipleFiles()`: Batch file deletion
  - `fileExists()`: Checks file existence
  - `getFullPath()`: Gets absolute path for streaming

**Error Handling**:

- Disk space errors (ENOSPC)
- Permission errors (EACCES)
- File not found errors (ENOENT)

**Requirements**: 2.3, 6.2

### Task 7.4: Version Service (`services/versionService.js`)

Manages document version tracking:

- **Version Records**: Creates and maintains version metadata in database
- **Version History**: Retrieves complete version timeline for documents
- **Version Numbering**: Automatically calculates next version number (sequential)
- **Operations**:
  - `createVersion()`: Creates new version record
  - `getVersionHistory()`: Returns all versions for a document
  - `getVersion()`: Retrieves specific version metadata
  - `getNextVersionNumber()`: Calculates next version (incremental)
  - `getAllVersionsForDocument()`: Gets all versions for deletion
  - `deleteAllVersions()`: Removes all version records

**Requirements**: 6.1, 6.3, 6.4, 6.5

### Task 8.1: Document Service (`services/documentService.js`)

Core document management functionality:

- **Upload Handling**: Processes new documents and new versions
- **File Validation**: Integrates with file validation module
- **Storage Integration**: Coordinates with file storage module
- **Version Management**: Works with version service for tracking
- **Operations**:
  - `uploadDocument()`: Handles new document or version upload
  - `getDocumentById()`: Retrieves document metadata
  - `getAllDocuments()`: Lists documents with pagination and sorting
  - `downloadDocument()`: Streams document file for download
  - `deleteDocument()`: Removes document, versions, and files
  - `getDocumentsByName()`: Searches documents by name

**Features**:

- Automatic version numbering (starts at 1, increments sequentially)
- Complete metadata tracking (name, category, uploader, date, version)
- Pagination support (default 50 per page)
- Sorting support (by name, category, date, version)
- Cascading deletion (removes all versions and files)

**Requirements**: 2.1, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.5, 10.1, 10.2

### Task 8.2: File Upload Middleware (`middleware/upload.js`)

Multer configuration for multipart form handling:

- **Storage**: Memory storage for validation before disk write
- **Size Limit**: 20MB maximum file size
- **File Filter**: Pre-validation of file extensions
- **Error Handling**: Converts Multer errors to consistent format
- **Field Name**: Expects 'file' as the upload field

**Error Codes**:

- `FILE_TOO_LARGE`: File exceeds 20MB
- `UNEXPECTED_FIELD`: Wrong field name used
- `VALIDATION_ERROR`: File type not allowed

**Requirements**: 2.1, 2.2

### Task 8.3: Document API Endpoints (`routes/documents.js`)

RESTful API for document operations:

#### Endpoints

1. **GET /api/documents**
   - Lists all documents with pagination
   - Query params: `page`, `limit`, `sort`, `order`
   - Authorization: All authenticated users
   - Returns: `{ documents: [], pagination: {} }`

2. **POST /api/documents/upload**
   - Uploads new document or new version
   - Body: `categoryId` (required), `documentId` (optional for versioning)
   - File: multipart field 'file'
   - Authorization: Admin, Employee
   - Returns: `{ message, document }`

3. **GET /api/documents/:id**
   - Gets document details
   - Authorization: All authenticated users
   - Returns: `{ document }`

4. **GET /api/documents/:id/download**
   - Downloads current version
   - Authorization: All authenticated users
   - Returns: File stream with original filename

5. **GET /api/documents/:id/versions**
   - Gets version history
   - Authorization: All authenticated users
   - Returns: `{ versions: [] }`

6. **GET /api/documents/:id/versions/:versionNumber/download**
   - Downloads specific version
   - Authorization: All authenticated users
   - Returns: File stream with version indicator

7. **DELETE /api/documents/:id**
   - Deletes document and all versions
   - Authorization: Admin only
   - Returns: `{ message, result }`

**Error Handling**:

- 400: Validation errors
- 401: Authentication required
- 403: Insufficient permissions
- 404: Document/version not found
- 413: File too large
- 500: Server errors
- 507: Storage errors

**Requirements**: 2.1, 2.5, 5.1, 5.2, 5.3, 6.4, 6.5, 8.1, 10.1, 10.4

## File Storage Structure

```
backend/
  uploads/
    HR_Documents/
      doc_1_v1.pdf
      doc_1_v2.pdf
      doc_5_v1.docx
    Finance/
      doc_2_v1.xlsx
      doc_2_v2.xlsx
    Legal/
      doc_3_v1.pdf
    Projects/
      doc_4_v1.png
    Reports/
      doc_6_v1.pdf
```

## Database Schema

### Documents Table

```sql
CREATE TABLE Documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_name TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  current_version INTEGER DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (uploaded_by) REFERENCES Users(id) ON DELETE CASCADE
);
```

### Document_Versions Table

```sql
CREATE TABLE Document_Versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES Documents(id) ON DELETE CASCADE,
  UNIQUE(document_id, version_number)
);
```

## Usage Examples

### Upload New Document

```javascript
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

categoryId: 1
file: <binary data>
```

Response:

```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": 1,
    "documentName": "report.pdf",
    "category": "Finance",
    "uploadedBy": "John Doe",
    "uploadDate": "2024-01-15T10:30:00Z",
    "currentVersion": 1
  }
}
```

### Upload New Version

```javascript
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

categoryId: 1
documentId: 1
file: <binary data>
```

Response:

```json
{
  "message": "New version uploaded successfully",
  "document": {
    "id": 1,
    "documentName": "report.pdf",
    "category": "Finance",
    "uploadedBy": "John Doe",
    "uploadDate": "2024-01-15T11:00:00Z",
    "currentVersion": 2
  }
}
```

### List Documents

```javascript
GET /api/documents?page=1&limit=50&sort=upload_date&order=DESC
Authorization: Bearer <token>
```

Response:

```json
{
  "documents": [
    {
      "id": 1,
      "documentName": "report.pdf",
      "category": "Finance",
      "uploadedBy": "John Doe",
      "uploadDate": "2024-01-15T11:00:00Z",
      "currentVersion": 2
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalDocuments": 1,
    "documentsPerPage": 50
  }
}
```

### Download Document

```javascript
GET /api/documents/1/download
Authorization: Bearer <token>
```

Returns file stream with headers:

```
Content-Disposition: attachment; filename="report.pdf"
Content-Type: application/octet-stream
```

### Get Version History

```javascript
GET /api/documents/1/versions
Authorization: Bearer <token>
```

Response:

```json
{
  "versions": [
    {
      "id": 1,
      "documentId": 1,
      "versionNumber": 1,
      "filePath": "Finance/doc_1_v1.pdf",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "uploadedBy": "John Doe"
    },
    {
      "id": 2,
      "documentId": 1,
      "versionNumber": 2,
      "filePath": "Finance/doc_1_v2.pdf",
      "uploadedAt": "2024-01-15T11:00:00Z",
      "uploadedBy": "John Doe"
    }
  ]
}
```

### Download Specific Version

```javascript
GET /api/documents/1/versions/1/download
Authorization: Bearer <token>
```

Returns file stream with version indicator in filename.

### Delete Document (Admin Only)

```javascript
DELETE /api/documents/1
Authorization: Bearer <admin-token>
```

Response:

```json
{
  "message": "Document deleted successfully",
  "result": {
    "success": true,
    "documentId": 1,
    "documentName": "report.pdf",
    "versionsDeleted": 2,
    "filesDeleted": 2,
    "filesFailed": []
  }
}
```

## Integration with Existing Components

### File Validation

- Uses `fileValidation.js` for comprehensive validation
- Validates extension, size, MIME type, executable content
- Returns detailed error messages for validation failures

### Authentication & Authorization

- Uses `auth.js` middleware for JWT token verification
- Uses `authorization.js` middleware for role-based access control
- Upload restricted to Admin and Employee roles
- Delete restricted to Admin role only

### Database

- Uses existing database connection module
- Leverages foreign key constraints for referential integrity
- Supports cascading deletes for cleanup

## Testing

Comprehensive integration tests verify:

- ✅ Document upload (new documents)
- ✅ Version upload (new versions)
- ✅ Document listing with pagination
- ✅ Document download (current version)
- ✅ Version history retrieval
- ✅ Specific version download
- ✅ Document deletion (Admin only)
- ✅ Authentication enforcement
- ✅ Authorization enforcement
- ✅ Validation error handling

All 13 integration tests pass successfully.

## Environment Configuration

Add to `.env`:

```
UPLOAD_PATH=./uploads
```

Default: `backend/uploads/`

## Security Considerations

1. **File Validation**: All files validated before storage
2. **Authentication**: All endpoints require valid JWT token
3. **Authorization**: Role-based access control enforced
4. **Path Traversal**: File paths sanitized to prevent directory traversal
5. **Executable Detection**: Files scanned for executable content
6. **MIME Validation**: File content verified against extension

## Performance

- **Pagination**: Default 50 documents per page
- **Streaming**: Files streamed for download (no memory buffering)
- **Indexing**: Database indexes on frequently queried columns
- **Async Operations**: All I/O operations are asynchronous

## Error Recovery

- **Disk Space**: Graceful handling of ENOSPC errors
- **Missing Files**: Returns 404 with clear error message
- **Partial Uploads**: Failed uploads don't leave orphaned records
- **Deletion Failures**: Reports which files failed to delete

## Next Steps

The document upload and management system is now fully functional. The Quick Actions buttons on the dashboard can now:

- Upload documents
- Download documents
- View version history
- Manage documents

Future enhancements could include:

- Activity logging integration (Task 11)
- Search functionality (Task 10)
- Dashboard statistics (Task 12)
- Frontend components (Tasks 18-22)
