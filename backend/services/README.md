# Services

This directory contains the business logic layer for the Document Upload & Management System.

## User Service

The User Service handles user account management, authentication, and password hashing.

### Features

- **Password Security**: Uses bcrypt with 10 salt rounds for secure password hashing
- **User CRUD Operations**: Create, read, update, and delete user accounts
- **Authentication**: Verify user credentials with email and password
- **Role-Based Access**: Supports Admin, Employee, and Viewer roles

### API

#### `createUser(name, email, password, role)`

Creates a new user with hashed password.

**Parameters:**

- `name` (string): User's full name
- `email` (string): User's email (must be unique)
- `password` (string): Plain text password (will be hashed)
- `role` (string): One of 'Admin', 'Employee', or 'Viewer'

**Returns:** User object without password hash

**Example:**

```javascript
const user = await userService.createUser(
  "John Doe",
  "john@example.com",
  "securePassword123",
  "Employee",
);
```

#### `authenticateUser(email, password)`

Authenticates a user with email and password.

**Parameters:**

- `email` (string): User's email
- `password` (string): Plain text password

**Returns:** User object if authenticated, null otherwise

**Example:**

```javascript
const user = await userService.authenticateUser(
  "john@example.com",
  "securePassword123",
);
if (user) {
  console.log("Authentication successful:", user);
} else {
  console.log("Invalid credentials");
}
```

#### `getUserById(id)`

Retrieves a user by their ID.

**Parameters:**

- `id` (number): User ID

**Returns:** User object or null if not found

#### `getAllUsers()`

Retrieves all users ordered by creation date (newest first).

**Returns:** Array of user objects

#### `updateUser(id, updates)`

Updates user details.

**Parameters:**

- `id` (number): User ID
- `updates` (object): Fields to update (name, email, role, password)

**Returns:** Updated user object or null if not found

**Example:**

```javascript
const updatedUser = await userService.updateUser(1, {
  name: "John Updated",
  role: "Admin",
});
```

#### `deleteUser(id)`

Deletes a user account.

**Parameters:**

- `id` (number): User ID

**Returns:** Boolean indicating success

#### `hashPassword(password)`

Hashes a password using bcrypt (utility function).

**Parameters:**

- `password` (string): Plain text password

**Returns:** Hashed password string

#### `verifyPassword(password, hash)`

Verifies a password against a hash (utility function).

**Parameters:**

- `password` (string): Plain text password
- `hash` (string): Hashed password

**Returns:** Boolean indicating if password matches

### Security Notes

- Passwords are never stored in plain text
- Each password is salted with a unique salt (bcrypt handles this automatically)
- Password hashes use bcrypt with 10 salt rounds as specified in requirements
- User objects returned by the service never include password hashes
- Email addresses must be unique (enforced by database constraint)

### Error Handling

The service throws errors for:

- Invalid roles (not Admin, Employee, or Viewer)
- Duplicate email addresses
- Database errors

All errors should be caught and handled by the calling code.
