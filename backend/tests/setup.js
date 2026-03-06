// Jest setup file for backend tests
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.DB_PATH = ":memory:";
process.env.UPLOAD_PATH = "./tests/temp-uploads";

// Global test utilities can be added here
