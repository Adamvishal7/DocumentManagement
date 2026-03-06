# Utilities Module

This directory contains utility modules used throughout the backend application.

## File Validation Module

The `fileValidation.js` module provides comprehensive file validation for document uploads.

### Features

- **File Extension Validation**: Ensures only allowed file types (PDF, DOCX, XLSX, PNG, JPG, JPEG) are accepted
- **File Size Validation**: Enforces a maximum file size of 20MB
- **MIME Type Verification**: Uses the `file-type` library to verify file content matches the extension
- **Executable Content Detection**: Scans files for executable signatures and malicious code patterns

### Usage

```javascript
const { validateFile } = require("./utils/fileValidation");

// In your upload handler
try {
  const result = await validateFile(req.file);
  console.log("File is valid:", result);
  // Proceed with upload
} catch (error) {
  if (error.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      message: error.message,
      field: error.field,
      code: error.code,
    });
  }
  throw error;
}
```

### API Reference

#### `validateFile(file)`

Performs comprehensive validation on an uploaded file.

**Parameters:**

- `file` (Object): File object with the following properties:
  - `buffer` (Buffer): The file content as a buffer
  - `originalname` (string): The original filename
  - `size` (number): The file size in bytes

**Returns:** Promise<Object>

- `valid` (boolean): Always true if validation passes
- `extension` (string): The validated file extension
- `size` (number): The file size
- `filename` (string): The original filename

**Throws:**

- `FileExtensionError`: If file extension is not allowed
- `FileSizeError`: If file size exceeds 20MB
- `ExecutableContentError`: If executable content is detected
- `MimeTypeMismatchError`: If MIME type doesn't match extension
- `ValidationError`: For other validation failures

#### Individual Validation Functions

- `validateFileExtension(filename)`: Validates file extension only
- `validateFileSize(size)`: Validates file size only
- `validateMimeType(buffer, extension)`: Validates MIME type only
- `detectExecutableContent(buffer)`: Checks for executable content only

### Error Classes

All error classes extend `ValidationError` and include:

- `message`: Human-readable error description
- `field`: The field that failed validation (usually 'file')
- `code`: Machine-readable error code

**Error Codes:**

- `FILE_TOO_LARGE`: File exceeds 20MB limit
- `INVALID_FILE_TYPE`: File extension not allowed
- `MIME_TYPE_MISMATCH`: File content doesn't match extension
- `EXECUTABLE_CONTENT_DETECTED`: File contains executable code
- `INVALID_FILENAME`: Filename is invalid
- `INVALID_FILE_SIZE`: File size is invalid
- `EMPTY_FILE`: File has no content
- `NO_FILE`: No file was provided
- `INVALID_BUFFER`: File buffer is missing or invalid

### Configuration

Constants can be imported and used:

```javascript
const { MAX_FILE_SIZE, ALLOWED_EXTENSIONS } = require("./utils/fileValidation");

console.log("Max file size:", MAX_FILE_SIZE); // 20971520 (20MB)
console.log("Allowed extensions:", ALLOWED_EXTENSIONS); // ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg']
```

### Requirements Mapping

This module implements the following requirements:

- **Requirement 2.1**: File extension validation for allowed types
- **Requirement 2.2**: File size validation (max 20MB)
- **Requirement 12.1**: File extension verification
- **Requirement 12.2**: MIME type verification
- **Requirement 12.3**: MIME type mismatch detection
- **Requirement 12.4**: Executable content detection

### Testing

The module includes comprehensive unit tests covering:

- All allowed file types
- Invalid file types
- File size limits
- MIME type verification
- Executable content detection
- Error handling
- Edge cases

Run tests with:

```bash
npm test -- fileValidation.test.js
```
