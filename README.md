# Document Upload & Management System

An enterprise document management solution that enables organizations to securely store, organize, version, and control access to business documents.

## Features

- User authentication with role-based access control (Admin, Employee, Viewer)
- Document upload with support for PDF, DOCX, XLSX, PNG, JPG, JPEG
- Document categorization and search
- Version tracking with full history
- Activity logging and audit trails
- Dashboard with system statistics

## Technology Stack

### Backend

- Node.js with Express.js
- SQLite database
- JWT authentication
- Multer for file uploads
- Bcrypt for password hashing

### Frontend

- React 18
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls

## Project Structure

```
.
├── backend/
│   ├── server.js           # Express server entry point
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── middleware/         # Authentication & authorization
│   ├── models/             # Database models
│   └── utils/              # Utility functions
│
└── frontend/
    ├── public/             # Static files
    └── src/
        ├── components/     # React components
        ├── services/       # API service functions
        ├── pages/          # Page components
        └── hooks/          # Custom React hooks
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration (especially JWT_SECRET)

5. Start the development server:
   ```bash
   npm run dev
   ```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## API Documentation

API endpoints will be documented as they are implemented. The base URL for all API endpoints is `/api`.

## License

ISC
