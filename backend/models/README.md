# Database Module

This module handles database initialization, schema management, and provides a connection interface for the Document Management System.

## Files

- **database.js**: Database connection module with promise-based query methods
- **schema.sql**: SQL schema definitions for all tables and indexes
- **initDatabase.js**: Database initialization and seeding logic

## Database Schema

### Tables

1. **Users**: User accounts with role-based access control
   - Roles: Admin, Employee, Viewer
   - Indexed on: email

2. **Categories**: Document categories for organization
   - Default categories: HR Documents, Finance, Legal, Projects, Reports
   - Indexed on: category_name

3. **Documents**: Document metadata
   - Foreign keys: category_id (RESTRICT), uploaded_by (CASCADE)
   - Indexed on: document_name, category_id, upload_date, uploaded_by

4. **Document_Versions**: Version history for documents
   - Foreign key: document_id (CASCADE)
   - Unique constraint: (document_id, version_number)
   - Indexed on: document_id

5. **Activity_Log**: Audit trail of user actions
   - Foreign key: user_id (CASCADE)
   - Indexed on: user_id, action, timestamp

## Usage

### Initialize Database

The database is automatically initialized when the server starts. You can also run initialization manually:

```bash
npm run init-db
```

Or directly:

```bash
node scripts/initDb.js
```

### Database Connection

```javascript
const { getDatabase, run, get, all } = require("./models/database");

// Run a query (INSERT, UPDATE, DELETE)
const result = await run(
  "INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
  ["John Doe", "john@example.com", "hash", "Employee"],
);
console.log("Inserted ID:", result.lastID);

// Get a single row
const user = await get("SELECT * FROM Users WHERE email = ?", [
  "john@example.com",
]);

// Get all rows
const users = await all("SELECT * FROM Users WHERE role = ?", ["Admin"]);
```

### Schema Verification

The system automatically verifies the database schema on startup:

```javascript
const { verifySchema } = require("./models/initDatabase");

const isValid = await verifySchema();
if (!isValid) {
  console.error("Database schema is invalid");
}
```

## Configuration

Set the database path in your `.env` file:

```
DB_PATH=./data/documents.db
```

For testing, you can use an in-memory database:

```javascript
process.env.DB_PATH = ":memory:";
```

## Foreign Key Constraints

Foreign key constraints are enabled by default:

- **ON DELETE RESTRICT**: Prevents deletion if referenced (Categories → Documents)
- **ON DELETE CASCADE**: Automatically deletes related records (Users → Documents, Documents → Versions)

## Indexes

All tables have appropriate indexes for optimal query performance:

- Users: email
- Categories: category_name
- Documents: document_name, category_id, upload_date, uploaded_by
- Document_Versions: document_id
- Activity_Log: user_id, action, timestamp

## Error Handling

All database operations use promises and should be wrapped in try-catch blocks:

```javascript
try {
  const result = await run("INSERT INTO Users ...", params);
} catch (error) {
  console.error("Database error:", error.message);
  // Handle error appropriately
}
```

## Testing

Run database tests:

```bash
npm test database.test.js
```

The test suite verifies:

- All tables exist
- Foreign key constraints are enabled
- Indexes are created
- Default categories are seeded
- Schema integrity
