-- Users Table
-- Stores user account information with role-based access control
CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Admin', 'Employee', 'Viewer')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast email lookups during authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);

-- Categories Table
-- Stores document categories for organization
CREATE TABLE IF NOT EXISTS Categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast category name lookups
CREATE INDEX IF NOT EXISTS idx_categories_name ON Categories(category_name);

-- Documents Table
-- Stores document metadata with foreign key relationships
CREATE TABLE IF NOT EXISTS Documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_name TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  current_version INTEGER DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (uploaded_by) REFERENCES Users(id) ON DELETE CASCADE
);

-- Indexes for search and filtering performance
CREATE INDEX IF NOT EXISTS idx_documents_name ON Documents(document_name);
CREATE INDEX IF NOT EXISTS idx_documents_category ON Documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON Documents(upload_date);
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON Documents(uploaded_by);

-- Document_Versions Table
-- Stores version history for documents
CREATE TABLE IF NOT EXISTS Document_Versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES Documents(id) ON DELETE CASCADE,
  UNIQUE(document_id, version_number)
);

-- Index for fast version history lookups
CREATE INDEX IF NOT EXISTS idx_versions_document ON Document_Versions(document_id);

-- Activity_Log Table
-- Stores audit trail of user actions
CREATE TABLE IF NOT EXISTS Activity_Log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Indexes for activity log filtering and queries
CREATE INDEX IF NOT EXISTS idx_activity_user ON Activity_Log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON Activity_Log(action);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON Activity_Log(timestamp);
