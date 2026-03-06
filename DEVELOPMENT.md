# Development Guide

## Project Overview

This is a full-stack document management system with a React frontend and Express.js backend. The system implements role-based access control, document versioning, and comprehensive activity logging.

## Development Workflow

### Initial Setup

1. Run the setup script:
   - **Linux/Mac**: `bash setup.sh`
   - **Windows**: `setup.bat`

2. Configure environment variables:
   - Edit `backend/.env` and set a secure `JWT_SECRET`
   - Adjust other settings as needed

### Running the Application

#### Backend Development Server

```bash
cd backend
npm run dev
```

The backend API will be available at `http://localhost:5000`

#### Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will be available at `http://localhost:3000`

### Testing

#### Backend Tests

```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

#### Frontend Tests

```bash
cd frontend
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
```

## Project Structure

### Backend Structure

```
backend/
├── server.js              # Express server entry point
├── routes/                # API route handlers
│   ├── auth.js           # Authentication routes
│   ├── documents.js      # Document management routes
│   ├── categories.js     # Category management routes
│   ├── users.js          # User management routes
│   ├── dashboard.js      # Dashboard routes
│   └── activities.js     # Activity log routes
├── services/              # Business logic layer
│   ├── userService.js    # User operations
│   ├── documentService.js # Document operations
│   ├── categoryService.js # Category operations
│   ├── versionService.js  # Version tracking
│   ├── searchService.js   # Search functionality
│   └── activityService.js # Activity logging
├── middleware/            # Express middleware
│   ├── auth.js           # JWT authentication
│   ├── authorization.js  # Role-based access control
│   ├── upload.js         # File upload handling
│   └── errorHandler.js   # Error handling
├── models/                # Database models
│   └── database.js       # Database initialization
├── utils/                 # Utility functions
│   └── fileValidation.js # File validation utilities
└── tests/                 # Test files
    ├── unit/             # Unit tests
    ├── property/         # Property-based tests
    └── integration/      # Integration tests
```

### Frontend Structure

```
frontend/src/
├── index.js              # React entry point
├── App.js                # Main application component
├── components/           # Reusable components
│   ├── LoginPage.jsx    # Login component
│   ├── DocumentList.jsx # Document listing
│   ├── DocumentUpload.jsx # Upload component
│   ├── DocumentSearch.jsx # Search component
│   ├── VersionHistory.jsx # Version history
│   ├── Dashboard.jsx    # Dashboard component
│   ├── CategoryManager.jsx # Category management
│   ├── UserManager.jsx  # User management
│   └── ActivityLog.jsx  # Activity log viewer
├── services/             # API service layer
│   └── api.js           # Axios configuration and API calls
├── pages/                # Page components
│   ├── LoginPage.jsx    # Login page
│   ├── DashboardPage.jsx # Dashboard page
│   ├── DocumentsPage.jsx # Documents page
│   └── AdminPage.jsx    # Admin page
└── hooks/                # Custom React hooks
    └── useAuth.js       # Authentication hook
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Documents

- `GET /api/documents` - List documents (paginated)
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get document metadata
- `GET /api/documents/:id/download` - Download document
- `GET /api/documents/:id/versions` - Get version history
- `GET /api/documents/:id/versions/:versionNumber/download` - Download specific version
- `DELETE /api/documents/:id` - Delete document (Admin only)
- `GET /api/documents/search` - Search documents

### Categories

- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

### Users

- `GET /api/users` - List all users (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics

### Activity Log

- `GET /api/activities` - Get activity log (Admin only)

## User Roles

### Admin

- Full system access
- Can upload, download, search, view, and delete documents
- Can manage users and categories
- Can view activity logs

### Employee

- Can upload, download, search, and view documents
- Cannot delete documents or manage users/categories

### Viewer

- Can only view and download documents
- Cannot upload or delete documents

## Database Schema

### Users Table

- id (INTEGER PRIMARY KEY)
- name (TEXT)
- email (TEXT UNIQUE)
- password_hash (TEXT)
- role (TEXT: Admin, Employee, Viewer)
- created_at (DATETIME)

### Categories Table

- id (INTEGER PRIMARY KEY)
- category_name (TEXT UNIQUE)
- created_at (DATETIME)

### Documents Table

- id (INTEGER PRIMARY KEY)
- document_name (TEXT)
- category_id (INTEGER FK)
- uploaded_by (INTEGER FK)
- upload_date (DATETIME)
- current_version (INTEGER)

### Document_Versions Table

- id (INTEGER PRIMARY KEY)
- document_id (INTEGER FK)
- version_number (INTEGER)
- file_path (TEXT)
- uploaded_at (DATETIME)

### Activity_Log Table

- id (INTEGER PRIMARY KEY)
- user_id (INTEGER FK)
- action (TEXT)
- resource_type (TEXT)
- resource_name (TEXT)
- timestamp (DATETIME)

## File Storage

Documents are stored in the `backend/uploads/` directory, organized by category:

```
uploads/
├── HR_Documents/
├── Finance/
├── Legal/
├── Projects/
└── Reports/
```

File naming convention: `doc_{id}_v{version}.{extension}`

## Testing Strategy

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Focus on specific scenarios and edge cases

### Property-Based Tests

- Use fast-check library
- Test universal properties across random inputs
- Minimum 100 iterations per test
- All 39 correctness properties from design document

### Integration Tests

- Test complete workflows
- Test API endpoints end-to-end
- Test database operations

## Code Style

### Backend

- Use ES6+ features
- Use async/await for asynchronous operations
- Follow Express.js best practices
- Use meaningful variable and function names

### Frontend

- Use functional components with hooks
- Follow React best practices
- Use Tailwind CSS for styling
- Keep components small and focused

## Security Considerations

1. **Authentication**: JWT tokens with 24-hour expiration
2. **Password Storage**: Bcrypt hashing with salt
3. **File Validation**: Extension, MIME type, and executable content checks
4. **Role-Based Access**: Middleware enforces permissions
5. **SQL Injection**: Use parameterized queries
6. **CORS**: Configured for specific origin

## Performance Considerations

1. **Database Indexes**: On frequently queried columns
2. **Pagination**: Limit results to 50 per page
3. **Search Performance**: Must complete within 2 seconds for 10,000 documents
4. **File Upload**: 20MB size limit
5. **Concurrent Access**: Support for 50 simultaneous users

## Troubleshooting

### Backend won't start

- Check if port 5000 is available
- Verify `.env` file exists and is configured
- Check database connection

### Frontend won't start

- Check if port 3000 is available
- Verify `.env` file exists
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Tests failing

- Ensure test database is in-memory (`:memory:`)
- Check test environment variables in `tests/setup.js`
- Clear test artifacts: `rm -rf coverage/`

## Contributing

1. Create a feature branch
2. Write tests for new functionality
3. Ensure all tests pass
4. Update documentation
5. Submit pull request

## Next Steps

After completing Task 1 (project setup), the next tasks are:

1. Implement database schema and initialization (Task 2)
2. Implement authentication system (Task 3)
3. Implement category management (Task 4)
4. Continue with remaining tasks as per the implementation plan
