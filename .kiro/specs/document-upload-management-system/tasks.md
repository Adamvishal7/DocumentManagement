# Implementation Plan: Document Upload & Management System

## Overview

This implementation plan breaks down the full-stack document management system into incremental coding tasks. The system uses React.js + Tailwind CSS for the frontend, Node.js + Express.js for the backend, SQLite for the database, and local file system for storage. Each task builds on previous work, with property-based tests using fast-check (minimum 100 iterations) integrated throughout to validate correctness properties early.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create backend directory structure (server, routes, services, middleware, models, utils)
  - Create frontend directory structure (src, components, services, pages, hooks)
  - Initialize package.json for backend with dependencies: express, sqlite3, bcryptjs, jsonwebtoken, multer, file-type, cors, dotenv
  - Initialize package.json for frontend with dependencies: react, react-router-dom, tailwindcss, axios
  - Add fast-check to both backend and frontend dev dependencies for property-based testing
  - Create .env.example files for configuration
  - Set up basic Express server entry point
  - Set up React app entry point with Tailwind CSS configuration
  - _Requirements: 13.1, 13.6_

- [x] 2. Implement database schema and initialization
  - [x] 2.1 Create database initialization script
    - Write SQL schema for Users table with indexes
    - Write SQL schema for Categories table with indexes
    - Write SQL schema for Documents table with foreign keys and indexes
    - Write SQL schema for Document_Versions table with unique constraint
    - Write SQL schema for Activity_Log table with indexes
    - Create database connection module with error handling
    - Implement schema verification on startup
    - Seed default categories (HR Documents, Finance, Legal, Projects, Reports)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 3.1_

  - [ ]\* 2.2 Write property test for referential integrity
    - **Property 39: Foreign key constraints are enforced**
    - **Validates: Requirements 13.5**

- [x] 3. Implement authentication system
  - [x] 3.1 Create User service with password hashing
    - Implement createUser function with bcrypt hashing (salt rounds = 10)
    - Implement authenticateUser function with password verification
    - Implement getUserById, getAllUsers, updateUser, deleteUser functions
    - Write database queries for user CRUD operations
    - _Requirements: 1.1, 1.2, 1.3, 7.5_

  - [ ]\* 3.2 Write property tests for authentication
    - **Property 1: Valid credentials create authenticated sessions**
    - **Validates: Requirements 1.1**

  - [ ]\* 3.3 Write property test for password hashing
    - **Property 3: Passwords are cryptographically hashed**
    - **Validates: Requirements 1.3**

  - [x] 3.4 Create authentication middleware
    - Implement JWT token generation with 24-hour expiration
    - Implement authenticateToken middleware to verify JWT
    - Implement token extraction from Authorization header
    - Handle token expiration and invalid token errors
    - _Requirements: 1.1, 1.4_

  - [ ]\* 3.5 Write property test for invalid credentials
    - **Property 2: Invalid credentials are rejected**
    - **Validates: Requirements 1.2**

  - [x] 3.6 Create authorization middleware
    - Implement requireRole middleware for role-based access control
    - Support multiple allowed roles per endpoint
    - Return 403 errors for insufficient permissions
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]\* 3.7 Write property test for unauthorized operations
    - **Property 22: Unauthorized operations are denied**
    - **Validates: Requirements 7.4**

  - [x] 3.8 Create authentication API endpoints
    - Implement POST /api/auth/login endpoint
    - Implement POST /api/auth/logout endpoint
    - Add error handling for authentication failures
    - _Requirements: 1.1, 1.2_

- [x] 4. Implement category management
  - [x] 4.1 Create Category service
    - Implement getAllCategories with document counts
    - Implement getCategoryById function
    - Implement createCategory function
    - Implement updateCategory function
    - Implement deleteCategory with validation for documents
    - Implement validateCategoryEmpty helper function
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ]\* 4.2 Write property tests for category management
    - **Property 10: Category creation stores name and timestamp**
    - **Validates: Requirements 3.2**

  - [ ]\* 4.3 Write property test for category deletion protection
    - **Property 11: Categories with documents cannot be deleted**
    - **Validates: Requirements 3.5, 13.5**

  - [x] 4.4 Create category API endpoints
    - Implement GET /api/categories endpoint (all users)
    - Implement POST /api/categories endpoint (Admin only)
    - Implement PUT /api/categories/:id endpoint (Admin only)
    - Implement DELETE /api/categories/:id endpoint (Admin only)
    - Add validation for category name uniqueness
    - _Requirements: 3.2, 3.4, 3.5_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement file validation utilities
  - [x] 6.1 Create file validation module
    - Implement file extension validation (PDF, DOCX, XLSX, PNG, JPG, JPEG)
    - Implement file size validation (max 20MB)
    - Implement MIME type verification using file-type library
    - Implement executable content detection
    - Create validation error classes with descriptive messages
    - _Requirements: 2.1, 2.2, 12.1, 12.2, 12.3, 12.4_

  - [ ]\* 6.2 Write property tests for file validation
    - **Property 4: Allowed file types are accepted**
    - **Validates: Requirements 2.1**

  - [ ]\* 6.3 Write property test for MIME type validation
    - **Property 8: MIME type matches file extension**
    - **Validates: Requirements 12.2**

  - [ ]\* 6.4 Write property test for executable content rejection
    - **Property 9: Executable content is rejected**
    - **Validates: Requirements 12.4**

- [ ] 7. Implement document storage and version tracking
  - [x] 7.1 Create file storage module
    - Implement directory structure creation (uploads/{category}/)
    - Implement file naming with version identifiers (doc\_{id}\_v{version}.{ext})
    - Implement file write operations with error handling
    - Implement file read operations for downloads
    - Implement file deletion for cleanup
    - Handle disk space errors gracefully
    - _Requirements: 2.3, 6.2_

  - [ ]\* 7.2 Write property test for category-organized storage
    - **Property 5: Documents are stored in category-organized directories**
    - **Validates: Requirements 2.3**

  - [ ]\* 7.3 Write property test for version file identifiers
    - **Property 17: Version files include version identifiers**
    - **Validates: Requirements 6.2**

  - [ ] 7.4 Create Version service
    - Implement createVersion function
    - Implement getVersionHistory function
    - Implement getVersion function for specific version
    - Implement getNextVersionNumber function
    - Implement getAllVersionsForDocument for deletion
    - _Requirements: 6.1, 6.3, 6.4, 6.5_

  - [ ]\* 7.5 Write property tests for version tracking
    - **Property 16: Version numbers increment sequentially**
    - **Validates: Requirements 6.1**

  - [ ]\* 7.6 Write property test for version metadata
    - **Property 18: Version records contain complete metadata**
    - **Validates: Requirements 6.3**

  - [ ]\* 7.7 Write property test for version history completeness
    - **Property 19: Version history contains all versions**
    - **Validates: Requirements 6.4**

  - [ ]\* 7.8 Write property test for version preservation
    - **Property 21: Previous versions are preserved**
    - **Validates: Requirements 6.6**

- [ ] 8. Implement document service and upload functionality
  - [ ] 8.1 Create Document service
    - Implement uploadDocument function (handles new documents and versions)
    - Implement getDocumentById function
    - Implement getAllDocuments with pagination and sorting
    - Implement downloadDocument function (current version)
    - Implement downloadDocumentVersion function (specific version)
    - Implement deleteDocument function with file cleanup
    - Integrate with file validation, storage, and version services
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.5, 10.1, 10.2_

  - [ ]\* 8.2 Write property test for upload metadata creation
    - **Property 6: Upload creates complete metadata**
    - **Validates: Requirements 2.4**

  - [ ]\* 8.3 Write property test for category requirement
    - **Property 7: Category selection is required**
    - **Validates: Requirements 3.3**

  - [ ]\* 8.4 Write property test for download current version
    - **Property 14: Download retrieves current version**
    - **Validates: Requirements 5.1**

  - [ ]\* 8.5 Write property test for filename preservation
    - **Property 15: Downloaded files preserve original filenames**
    - **Validates: Requirements 5.2**

  - [ ]\* 8.6 Write property test for specific version download
    - **Property 20: Specific versions can be downloaded**
    - **Validates: Requirements 6.5**

  - [ ]\* 8.7 Write property test for document deletion
    - **Property 29: Document deletion removes all version files**
    - **Validates: Requirements 10.1**

  - [ ]\* 8.8 Write property test for deletion database cleanup
    - **Property 30: Document deletion removes all database records**
    - **Validates: Requirements 10.2**

  - [ ] 8.2 Create file upload middleware with Multer
    - Configure Multer with memory storage for validation
    - Set file size limit to 20MB
    - Implement file filter for allowed extensions
    - Handle multipart form data parsing
    - _Requirements: 2.1, 2.2_

  - [ ] 8.3 Create document API endpoints
    - Implement GET /api/documents endpoint with pagination and sorting
    - Implement POST /api/documents/upload endpoint (Admin, Employee)
    - Implement GET /api/documents/:id endpoint
    - Implement GET /api/documents/:id/download endpoint
    - Implement GET /api/documents/:id/versions endpoint
    - Implement GET /api/documents/:id/versions/:versionNumber/download endpoint
    - Implement DELETE /api/documents/:id endpoint (Admin only)
    - Add proper authorization checks for each endpoint
    - _Requirements: 2.1, 2.5, 5.1, 5.2, 5.3, 6.4, 6.5, 8.1, 10.1, 10.4_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement search functionality
  - [ ] 10.1 Create Search service
    - Implement searchDocuments function with multiple criteria
    - Implement buildSearchQuery helper for SQL construction
    - Support search by document name (LIKE)
    - Support search by category name (exact or LIKE)
    - Support search by uploader name (LIKE)
    - Support search by upload date range (BETWEEN)
    - Implement parseFilters helper for validation
    - Optimize queries with proper JOINs and indexes
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]\* 10.2 Write property test for multi-criteria search
    - **Property 12: Search matches multiple criteria**
    - **Validates: Requirements 4.1**

  - [ ]\* 10.3 Write property test for category filtering
    - **Property 13: Category filter returns only matching documents**
    - **Validates: Requirements 4.2**

  - [ ] 10.4 Create search API endpoint
    - Implement GET /api/documents/search endpoint
    - Support query parameters: q, category, dateFrom, dateTo
    - Return empty results with appropriate message when no matches
    - Ensure sub-2-second performance for 10,000 documents
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 11. Implement activity logging
  - [ ] 11.1 Create Activity service
    - Implement logActivity function with user, action, resource details
    - Implement getActivities function with filters and pagination
    - Implement convenience methods: logUpload, logDownload, logDeletion
    - Support filtering by user, action type, date range
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 10.3_

  - [ ]\* 11.2 Write property test for activity logging
    - **Property 31: All user actions are logged**
    - **Validates: Requirements 11.1, 11.2, 11.3, 10.3**

  - [ ]\* 11.3 Write property test for activity log filtering
    - **Property 32: Activity log filtering works correctly**
    - **Validates: Requirements 11.4**

  - [ ] 11.4 Integrate activity logging into services
    - Add logUpload calls to document upload operations
    - Add logDownload calls to document download operations
    - Add logDeletion calls to document and user deletion operations
    - Add logging for category creation and deletion
    - Add logging for user creation
    - _Requirements: 11.1, 11.2, 11.3, 10.3_

  - [ ] 11.5 Create activity log API endpoint
    - Implement GET /api/activities endpoint (Admin only)
    - Support query parameters: user, action, dateFrom, dateTo, page, limit
    - Return paginated results with total pages
    - _Requirements: 11.4_

- [ ] 12. Implement dashboard and statistics
  - [ ] 12.1 Create Dashboard service
    - Implement getDashboardStats function
    - Calculate total document count
    - Calculate total category count
    - Retrieve 10 most recent documents
    - Calculate total user count (Admin only)
    - Calculate user counts by role (Admin only)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]\* 12.2 Write property test for dashboard statistics accuracy
    - **Property 27: Dashboard statistics are accurate**
    - **Validates: Requirements 9.1, 9.2**

  - [ ]\* 12.3 Write property test for recent documents ordering
    - **Property 28: Recent documents are correctly ordered**
    - **Validates: Requirements 9.3**

  - [ ] 12.4 Create dashboard API endpoint
    - Implement GET /api/dashboard/stats endpoint
    - Return conditional fields based on user role
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 13. Implement user management
  - [ ] 13.1 Create user management API endpoints
    - Implement GET /api/users endpoint (Admin only)
    - Implement POST /api/users endpoint (Admin only)
    - Implement PUT /api/users/:id endpoint (Admin only)
    - Implement DELETE /api/users/:id endpoint (Admin only)
    - Add validation for email format and uniqueness
    - Add activity logging for user operations
    - _Requirements: 7.5_

- [ ] 14. Implement comprehensive error handling
  - [ ] 14.1 Create error classes and utilities
    - Create ValidationError class with field and code properties
    - Create UnauthorizedError class
    - Create ForbiddenError class with role information
    - Create error response formatter
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]\* 14.2 Write property tests for error handling
    - **Property 33: User errors return descriptive messages**
    - **Validates: Requirements 14.1**

  - [ ]\* 14.3 Write property test for system error handling
    - **Property 34: System errors are handled gracefully**
    - **Validates: Requirements 14.2**

  - [ ]\* 14.4 Write property test for upload error types
    - **Property 35: Upload failures indicate error type**
    - **Validates: Requirements 14.3**

  - [ ] 14.5 Create centralized error handling middleware
    - Implement errorHandler middleware
    - Categorize errors by type (validation, auth, authorization, system)
    - Format error responses with appropriate status codes
    - Log errors with context and request details
    - Return generic messages for system errors
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ] 14.6 Add error handling to all services
    - Wrap database operations in try-catch blocks
    - Wrap file system operations in try-catch blocks
    - Implement retry logic for database conflicts (up to 3 attempts)
    - Add disk space checks before file writes
    - _Requirements: 14.2, 15.4_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement document listing with pagination and sorting
  - [ ] 16.1 Enhance document list endpoint
    - Implement default sorting by upload_date DESC
    - Support sort parameters: column and direction
    - Implement pagination with 50 documents per page
    - Return pagination metadata (totalPages, currentPage)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]\* 16.2 Write property test for document list fields
    - **Property 23: Document list contains required fields**
    - **Validates: Requirements 8.1**

  - [ ]\* 16.3 Write property test for default sorting
    - **Property 24: Documents are sorted by upload date descending by default**
    - **Validates: Requirements 8.2**

  - [ ]\* 16.4 Write property test for custom sorting
    - **Property 25: Sorting reorders documents correctly**
    - **Validates: Requirements 8.3**

  - [ ]\* 16.5 Write property test for pagination
    - **Property 26: Pagination limits results per page**
    - **Validates: Requirements 8.4**

- [ ] 17. Implement concurrency handling
  - [ ] 17.1 Add concurrency safeguards
    - Implement database transaction handling for critical operations
    - Add retry logic for database write conflicts (up to 3 attempts)
    - Use atomic file operations (write to temp, then rename)
    - Add file locking for concurrent uploads
    - Test concurrent upload scenarios
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ]\* 17.2 Write property test for concurrent uploads
    - **Property 36: Concurrent uploads are processed independently**
    - **Validates: Requirements 15.1**

  - [ ]\* 17.3 Write property test for concurrent read/write
    - **Property 37: Concurrent read/write operations do not conflict**
    - **Validates: Requirements 15.2**

  - [ ]\* 17.4 Write property test for database conflict retries
    - **Property 38: Database conflicts trigger retries**
    - **Validates: Requirements 15.4**

- [x] 18. Build React frontend - Authentication
  - [x] 18.1 Create authentication components
    - Create LoginPage component with form state management
    - Implement handleLogin function with API call to /api/auth/login
    - Store JWT token in localStorage
    - Display error messages for failed login
    - Add loading state during authentication
    - _Requirements: 1.1, 1.2_

  - [x] 18.2 Create protected route component
    - Create ProtectedRoute component with role checking
    - Implement token validation from localStorage
    - Redirect to login if no valid token
    - Check user role against required role
    - _Requirements: 1.1, 7.1, 7.2, 7.3_

  - [x] 18.3 Create API service module
    - Create axios instance with base URL configuration
    - Implement request interceptor to add Authorization header
    - Implement response interceptor for error handling
    - Handle 401 errors with automatic logout and redirect
    - _Requirements: 1.1, 1.4_

- [ ] 19. Build React frontend - Document management
  - [ ] 19.1 Create DocumentList component
    - Display documents in table with required columns
    - Implement sorting by column with direction toggle
    - Implement pagination controls
    - Add delete button for Admin users
    - Add loading and error states
    - Fetch documents from GET /api/documents
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 10.4_

  - [ ] 19.2 Create DocumentUpload component
    - Create file upload form with file input and category selector
    - Implement client-side file validation (size, type)
    - Implement handleUpload with multipart form data
    - Display upload progress bar
    - Show success and error messages
    - Call POST /api/documents/upload
    - _Requirements: 2.1, 2.2, 3.3_

  - [ ] 19.3 Create DocumentSearch component
    - Create search form with query input and filters
    - Implement category filter dropdown
    - Implement date range filters
    - Display search results in table
    - Handle empty results with message
    - Call GET /api/documents/search
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 19.4 Create VersionHistory component
    - Display version history in timeline format
    - Show version number, upload date, uploader for each version
    - Add download button for each version
    - Fetch versions from GET /api/documents/:id/versions
    - Call GET /api/documents/:id/versions/:versionNumber/download
    - _Requirements: 6.4, 6.5_

- [ ] 20. Build React frontend - Dashboard and admin features
  - [ ] 20.1 Create Dashboard component
    - Display total documents count
    - Display total categories count
    - Display 10 most recent documents in card layout
    - Display user statistics for Admin role
    - Fetch data from GET /api/dashboard/stats
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 20.2 Create CategoryManager component (Admin only)
    - Display categories in table with document counts
    - Add create category form
    - Add edit category inline editing
    - Add delete button with confirmation
    - Show error when deleting category with documents
    - Call category API endpoints
    - _Requirements: 3.2, 3.4, 3.5_

  - [ ] 20.3 Create UserManager component (Admin only)
    - Display users in table with role badges
    - Add create user form with role selection
    - Add edit user functionality
    - Add delete button with confirmation
    - Call user API endpoints
    - _Requirements: 7.5_

  - [ ] 20.4 Create ActivityLog component (Admin only)
    - Display activity log in table with filters
    - Implement filter by user dropdown
    - Implement filter by action type dropdown
    - Implement date range filter
    - Implement pagination
    - Fetch data from GET /api/activities
    - _Requirements: 11.4_

- [ ] 21. Implement frontend routing and layout
  - [ ] 21.1 Set up React Router
    - Configure routes for all pages (login, dashboard, documents, search, admin)
    - Wrap protected routes with ProtectedRoute component
    - Implement role-based route protection
    - Add 404 page for unknown routes
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 21.2 Create navigation and layout components
    - Create navigation bar with role-based menu items
    - Add logout button with token clearing
    - Create main layout wrapper component
    - Add responsive design with Tailwind CSS
    - Display current user name and role
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 22. Implement frontend error handling and user feedback
  - [ ] 22.1 Create error handling utilities
    - Create toast notification component for errors and success
    - Implement error message extraction from API responses
    - Add retry logic for network errors (3 attempts with backoff)
    - Handle offline detection
    - _Requirements: 14.1, 14.3, 14.4_

  - [ ] 22.2 Add loading states and feedback
    - Add loading spinners for async operations
    - Disable submit buttons during processing
    - Show upload progress for file uploads
    - Add skeleton loaders for data fetching
    - _Requirements: 14.1_

- [ ] 23. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Integration and final wiring
  - [ ] 24.1 Connect all frontend components
    - Wire DocumentUpload success callback to refresh DocumentList
    - Wire search results to DocumentList display
    - Wire version upload to refresh VersionHistory
    - Wire category creation to refresh category dropdowns
    - Test all user workflows end-to-end
    - _Requirements: All_

  - [ ] 24.2 Add environment configuration
    - Create .env file for backend (JWT_SECRET, PORT, DB_PATH, UPLOAD_PATH)
    - Create .env file for frontend (REACT_APP_API_URL)
    - Document required environment variables
    - Add .env to .gitignore
    - _Requirements: 13.6_

  - [ ] 24.3 Create seed data script
    - Create script to initialize database with test data
    - Add sample users (Admin, Employee, Viewer)
    - Add sample categories
    - Add sample documents with versions
    - Document how to run seed script
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 24.4 Add logging configuration
    - Configure Winston or similar logger for backend
    - Implement log rotation with 30-day retention
    - Create separate error log file
    - Add request logging middleware
    - _Requirements: 14.2_

- [ ] 25. Final testing and validation
  - [ ]\* 25.1 Run all property-based tests
    - Execute all 39 property tests with 100 iterations each
    - Verify all properties pass
    - Review any failing test cases
    - Fix any discovered issues

  - [ ]\* 25.2 Run integration tests
    - Test complete upload → version → download → delete workflow
    - Test multi-user scenarios with different roles
    - Test search with various filter combinations
    - Test concurrent operations

  - [ ] 25.3 Perform manual testing
    - Test all user workflows in browser
    - Verify role-based access control
    - Test error handling and user feedback
    - Verify responsive design on different screen sizes
    - Test with large files and many documents

  - [ ] 25.4 Performance validation
    - Test search performance with 10,000 documents (must be <2 seconds)
    - Test concurrent upload with 50 simultaneous users
    - Test dashboard load time
    - Verify pagination performance

- [ ] 26. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP, but are highly recommended for production quality
- Each task references specific requirements for traceability
- Property-based tests use fast-check with minimum 100 iterations per test
- All 39 correctness properties from the design document are covered
- Checkpoints ensure incremental validation throughout implementation
- Backend and frontend can be developed in parallel after task 5
- The system supports three user roles: Admin (full access), Employee (upload/download), Viewer (read-only)
- File storage uses organized directory structure: uploads/{category}/doc\_{id}\_v{version}.{ext}
- JWT tokens expire after 24 hours requiring re-authentication
- Database uses SQLite with foreign key constraints and indexes for performance
- Error handling provides descriptive messages for user errors and generic messages for system errors
- Activity logging tracks all user actions for audit trails
- Search must complete within 2 seconds for databases with 10,000 documents
- System supports concurrent access with up to 50 simultaneous users
