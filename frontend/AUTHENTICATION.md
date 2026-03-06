# Authentication Components

This document describes the authentication components implemented for the Document Upload & Management System.

## Components Created

### 1. LoginPage Component (`src/pages/LoginPage.js`)

The main login interface with the following features:

- **Form State Management**: Manages email and password input states
- **API Integration**: Calls `/api/auth/login` endpoint with credentials
- **Token Storage**: Stores JWT token in localStorage upon successful login
- **Error Display**: Shows error messages for failed login attempts
- **Loading State**: Displays loading indicator during authentication
- **Auto-redirect**: Navigates to dashboard after successful login

### 2. API Service Module (`src/services/api.js`)

Axios instance configured with:

- **Base URL**: Configured from environment variable `REACT_APP_API_URL`
- **Request Interceptor**: Automatically adds Authorization header with JWT token
- **Response Interceptor**: Handles 401 errors with automatic logout and redirect to login

### 3. ProtectedRoute Component (`src/components/ProtectedRoute.js`)

Route guard that:

- **Token Validation**: Checks for valid JWT token in localStorage
- **Role-Based Access**: Optionally checks user role against required roles
- **Auto-redirect**: Redirects to login if no valid token found

### 4. Dashboard Component (`src/pages/Dashboard.js`)

Simple dashboard placeholder that:

- **Displays User Info**: Shows logged-in user's name and role
- **Logout Functionality**: Clears token and redirects to login

## Testing

The LoginPage component has comprehensive unit tests covering:

- ✅ Form rendering with email and password fields
- ✅ Validation error display for empty fields
- ✅ Successful login with API call and token storage
- ✅ Error message display for failed login
- ✅ Loading state during authentication
- ✅ Error clearing when user starts typing

Run tests with:

```bash
npm test -- --testPathPattern=LoginPage.test.js
```

## Usage

### Starting the Frontend

```bash
cd frontend
npm start
```

The application will start on `http://localhost:3000` and redirect to the login page.

### Testing Login

1. Navigate to `http://localhost:3000`
2. You'll be redirected to `/login`
3. Enter valid credentials (backend must be running on port 5000)
4. Upon successful login, you'll be redirected to `/dashboard`

### Backend Requirements

The backend must be running on `http://localhost:5000` with the following endpoint:

**POST /api/auth/login**

- Request Body: `{ email: string, password: string }`
- Response: `{ token: string, user: { id, name, email, role } }`

## Environment Configuration

Create a `.env` file in the frontend directory:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Implementation Details

### Requirements Validated

This implementation satisfies:

- **Requirement 1.1**: Valid credentials create authenticated sessions
- **Requirement 1.2**: Invalid credentials are rejected with error messages

### Key Features

1. **JWT Token Management**: Token stored in localStorage and automatically included in API requests
2. **Error Handling**: Comprehensive error messages for different failure scenarios
3. **Loading States**: Visual feedback during async operations
4. **Responsive Design**: Tailwind CSS for mobile-friendly interface
5. **Automatic Logout**: 401 responses trigger automatic logout and redirect

### Security Considerations

- Passwords are never stored locally
- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- Automatic token cleanup on logout
- 401 error handling prevents unauthorized access
