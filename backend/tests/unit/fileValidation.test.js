const {
  validateFile,
  validateFileExtension,
  validateFileSize,
  validateMimeType,
  detectExecutableContent,
  ValidationError,
  FileSizeError,
  FileExtensionError,
  MimeTypeMismatchError,
  ExecutableContentError,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
} = require("../../utils/fileValidation");

describe("File Validation Module", () => {
  describe("validateFileExtension", () => {
    test("should accept valid PDF extension", () => {
      const result = validateFileExtension("document.pdf");
      expect(result).toBe("pdf");
    });

    test("should accept valid DOCX extension", () => {
      const result = validateFileExtension("document.docx");
      expect(result).toBe("docx");
    });

    test("should accept valid XLSX extension", () => {
      const result = validateFileExtension("spreadsheet.xlsx");
      expect(result).toBe("xlsx");
    });

    test("should accept valid PNG extension", () => {
      const result = validateFileExtension("image.png");
      expect(result).toBe("png");
    });

    test("should accept valid JPG extension", () => {
      const result = validateFileExtension("photo.jpg");
      expect(result).toBe("jpg");
    });

    test("should accept valid JPEG extension", () => {
      const result = validateFileExtension("photo.jpeg");
      expect(result).toBe("jpeg");
    });

    test("should handle uppercase extensions", () => {
      const result = validateFileExtension("DOCUMENT.PDF");
      expect(result).toBe("pdf");
    });

    test("should handle mixed case extensions", () => {
      const result = validateFileExtension("file.PdF");
      expect(result).toBe("pdf");
    });

    test("should reject invalid extension", () => {
      expect(() => validateFileExtension("malware.exe")).toThrow(
        FileExtensionError,
      );
    });

    test("should reject .txt files", () => {
      expect(() => validateFileExtension("document.txt")).toThrow(
        FileExtensionError,
      );
    });

    test("should reject .zip files", () => {
      expect(() => validateFileExtension("archive.zip")).toThrow(
        FileExtensionError,
      );
    });

    test("should reject files without extension", () => {
      expect(() => validateFileExtension("noextension")).toThrow(
        FileExtensionError,
      );
    });

    test("should throw ValidationError for null filename", () => {
      expect(() => validateFileExtension(null)).toThrow(ValidationError);
    });

    test("should throw ValidationError for undefined filename", () => {
      expect(() => validateFileExtension(undefined)).toThrow(ValidationError);
    });

    test("should throw ValidationError for empty string", () => {
      expect(() => validateFileExtension("")).toThrow(ValidationError);
    });
  });

  describe("validateFileSize", () => {
    test("should accept file size of 1MB", () => {
      expect(() => validateFileSize(1024 * 1024)).not.toThrow();
    });

    test("should accept file size of 10MB", () => {
      expect(() => validateFileSize(10 * 1024 * 1024)).not.toThrow();
    });

    test("should accept file size exactly at 20MB limit", () => {
      expect(() => validateFileSize(MAX_FILE_SIZE)).not.toThrow();
    });

    test("should accept small file of 1KB", () => {
      expect(() => validateFileSize(1024)).not.toThrow();
    });

    test("should reject file size exceeding 20MB", () => {
      expect(() => validateFileSize(MAX_FILE_SIZE + 1)).toThrow(FileSizeError);
    });

    test("should reject file size of 25MB", () => {
      expect(() => validateFileSize(25 * 1024 * 1024)).toThrow(FileSizeError);
    });

    test("should reject file size of 0 bytes", () => {
      expect(() => validateFileSize(0)).toThrow(ValidationError);
      expect(() => validateFileSize(0)).toThrow("File is empty");
    });

    test("should reject negative file size", () => {
      expect(() => validateFileSize(-1)).toThrow(ValidationError);
    });

    test("should throw ValidationError for non-number size", () => {
      expect(() => validateFileSize("1024")).toThrow(ValidationError);
    });

    test("should throw ValidationError for null size", () => {
      expect(() => validateFileSize(null)).toThrow(ValidationError);
    });

    test("FileSizeError should include size information", () => {
      try {
        validateFileSize(25 * 1024 * 1024);
        fail("Should have thrown FileSizeError");
      } catch (error) {
        expect(error).toBeInstanceOf(FileSizeError);
        expect(error.size).toBe(25 * 1024 * 1024);
        expect(error.message).toContain("25.00MB");
      }
    });
  });

  describe("detectExecutableContent", () => {
    test("should not throw for PDF content", () => {
      const pdfBuffer = Buffer.from("%PDF-1.4\n");
      expect(() => detectExecutableContent(pdfBuffer)).not.toThrow();
    });

    test("should not throw for PNG content", () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      expect(() => detectExecutableContent(pngBuffer)).not.toThrow();
    });

    test("should not throw for JPEG content", () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      expect(() => detectExecutableContent(jpegBuffer)).not.toThrow();
    });

    test("should detect Windows executable (MZ header)", () => {
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
      expect(() => detectExecutableContent(exeBuffer)).toThrow(
        ExecutableContentError,
      );
    });

    test("should detect ELF executable", () => {
      const elfBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46]);
      expect(() => detectExecutableContent(elfBuffer)).toThrow(
        ExecutableContentError,
      );
    });

    test("should detect Mach-O executable (32-bit)", () => {
      const machoBuffer = Buffer.from([0xcf, 0xfa, 0xed, 0xfe]);
      expect(() => detectExecutableContent(machoBuffer)).toThrow(
        ExecutableContentError,
      );
    });

    test("should detect shell script with shebang", () => {
      const scriptBuffer = Buffer.from('#!/bin/bash\necho "test"');
      expect(() => detectExecutableContent(scriptBuffer)).toThrow(
        ExecutableContentError,
      );
    });

    test("should detect HTML with script tag", () => {
      const htmlBuffer = Buffer.from(
        '<html><script>alert("xss")</script></html>',
      );
      expect(() => detectExecutableContent(htmlBuffer)).toThrow(
        ExecutableContentError,
      );
    });

    test("should detect PHP code", () => {
      const phpBuffer = Buffer.from('<?php echo "test"; ?>');
      expect(() => detectExecutableContent(phpBuffer)).toThrow(
        ExecutableContentError,
      );
    });

    test("should detect eval() pattern", () => {
      const evalBuffer = Buffer.from('var x = eval("malicious code");');
      expect(() => detectExecutableContent(evalBuffer)).toThrow(
        ExecutableContentError,
      );
    });

    test("should throw ValidationError for non-buffer input", () => {
      expect(() => detectExecutableContent("not a buffer")).toThrow(
        ValidationError,
      );
    });

    test("should handle empty buffer", () => {
      const emptyBuffer = Buffer.from([]);
      expect(() => detectExecutableContent(emptyBuffer)).not.toThrow();
    });
  });

  describe("validateMimeType", () => {
    test("should validate PDF MIME type", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4\n%âãÏÓ\n");
      await expect(validateMimeType(pdfBuffer, "pdf")).resolves.not.toThrow();
    });

    test("should validate PNG MIME type", async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52,
      ]);
      await expect(validateMimeType(pngBuffer, "png")).resolves.not.toThrow();
    });

    test("should validate JPEG MIME type", async () => {
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      ]);
      await expect(validateMimeType(jpegBuffer, "jpg")).resolves.not.toThrow();
    });

    test("should validate DOCX as ZIP-based format", async () => {
      // DOCX files start with PK (ZIP signature)
      const docxBuffer = Buffer.from([
        0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00,
      ]);
      await expect(validateMimeType(docxBuffer, "docx")).resolves.not.toThrow();
    });

    test("should validate XLSX as ZIP-based format", async () => {
      // XLSX files start with PK (ZIP signature)
      const xlsxBuffer = Buffer.from([
        0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00,
      ]);
      await expect(validateMimeType(xlsxBuffer, "xlsx")).resolves.not.toThrow();
    });

    test("should reject PDF buffer with PNG extension", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4\n");
      await expect(validateMimeType(pdfBuffer, "png")).rejects.toThrow(
        MimeTypeMismatchError,
      );
    });

    test("should reject PNG buffer with PDF extension", async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52,
      ]);
      await expect(validateMimeType(pngBuffer, "pdf")).rejects.toThrow(
        MimeTypeMismatchError,
      );
    });

    test("should reject executable with PDF extension", async () => {
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
      await expect(validateMimeType(exeBuffer, "pdf")).rejects.toThrow(
        MimeTypeMismatchError,
      );
    });

    test("should throw ValidationError for non-buffer input", async () => {
      await expect(validateMimeType("not a buffer", "pdf")).rejects.toThrow(
        ValidationError,
      );
    });

    test("should throw ValidationError for invalid extension", async () => {
      const buffer = Buffer.from("test");
      await expect(validateMimeType(buffer, "exe")).rejects.toThrow(
        ValidationError,
      );
    });

    test("should throw ValidationError for null extension", async () => {
      const buffer = Buffer.from("test");
      await expect(validateMimeType(buffer, null)).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("validateFile - comprehensive validation", () => {
    test("should validate a valid PDF file", async () => {
      const file = {
        buffer: Buffer.from("%PDF-1.4\n%âãÏÓ\n"),
        originalname: "document.pdf",
        size: 1024,
      };

      const result = await validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.extension).toBe("pdf");
      expect(result.size).toBe(1024);
      expect(result.filename).toBe("document.pdf");
    });

    test("should validate a valid PNG file", async () => {
      const file = {
        buffer: Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
          0x0d, 0x49, 0x48, 0x44, 0x52,
        ]),
        originalname: "image.png",
        size: 2048,
      };

      const result = await validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.extension).toBe("png");
    });

    test("should validate a valid JPEG file", async () => {
      const file = {
        buffer: Buffer.from([
          0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00,
          0x01,
        ]),
        originalname: "photo.jpg",
        size: 3072,
      };

      const result = await validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.extension).toBe("jpg");
    });

    test("should validate a valid DOCX file", async () => {
      const file = {
        buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]),
        originalname: "document.docx",
        size: 5120,
      };

      const result = await validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.extension).toBe("docx");
    });

    test("should reject file with invalid extension", async () => {
      const file = {
        buffer: Buffer.from("test content"),
        originalname: "malware.exe",
        size: 1024,
      };

      await expect(validateFile(file)).rejects.toThrow(FileExtensionError);
    });

    test("should reject file exceeding size limit", async () => {
      const file = {
        buffer: Buffer.from("%PDF-1.4\n"),
        originalname: "large.pdf",
        size: MAX_FILE_SIZE + 1,
      };

      await expect(validateFile(file)).rejects.toThrow(FileSizeError);
    });

    test("should reject file with executable content", async () => {
      const file = {
        buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00]),
        originalname: "fake.pdf",
        size: 1024,
      };

      await expect(validateFile(file)).rejects.toThrow(ExecutableContentError);
    });

    test("should reject file with MIME type mismatch", async () => {
      const file = {
        buffer: Buffer.from("%PDF-1.4\n"),
        originalname: "fake.png",
        size: 1024,
      };

      await expect(validateFile(file)).rejects.toThrow(MimeTypeMismatchError);
    });

    test("should reject null file", async () => {
      await expect(validateFile(null)).rejects.toThrow(ValidationError);
    });

    test("should reject undefined file", async () => {
      await expect(validateFile(undefined)).rejects.toThrow(ValidationError);
    });

    test("should reject file without buffer", async () => {
      const file = {
        originalname: "document.pdf",
        size: 1024,
      };

      await expect(validateFile(file)).rejects.toThrow(ValidationError);
    });

    test("should reject file with invalid buffer", async () => {
      const file = {
        buffer: "not a buffer",
        originalname: "document.pdf",
        size: 1024,
      };

      await expect(validateFile(file)).rejects.toThrow(ValidationError);
    });

    test("should reject empty file", async () => {
      const file = {
        buffer: Buffer.from([]),
        originalname: "empty.pdf",
        size: 0,
      };

      await expect(validateFile(file)).rejects.toThrow(ValidationError);
    });
  });

  describe("Error classes", () => {
    test("ValidationError should have correct properties", () => {
      const error = new ValidationError(
        "Test message",
        "testField",
        "TEST_CODE",
      );
      expect(error.name).toBe("ValidationError");
      expect(error.message).toBe("Test message");
      expect(error.field).toBe("testField");
      expect(error.code).toBe("TEST_CODE");
      expect(error).toBeInstanceOf(Error);
    });

    test("FileSizeError should extend ValidationError", () => {
      const error = new FileSizeError(25 * 1024 * 1024);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(FileSizeError);
      expect(error.code).toBe("FILE_TOO_LARGE");
      expect(error.field).toBe("file");
    });

    test("FileExtensionError should extend ValidationError", () => {
      const error = new FileExtensionError("exe");
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(FileExtensionError);
      expect(error.code).toBe("INVALID_FILE_TYPE");
      expect(error.extension).toBe("exe");
    });

    test("MimeTypeMismatchError should extend ValidationError", () => {
      const error = new MimeTypeMismatchError("pdf", "image/png");
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(MimeTypeMismatchError);
      expect(error.code).toBe("MIME_TYPE_MISMATCH");
      expect(error.extension).toBe("pdf");
      expect(error.detectedMime).toBe("image/png");
    });

    test("ExecutableContentError should extend ValidationError", () => {
      const error = new ExecutableContentError();
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(ExecutableContentError);
      expect(error.code).toBe("EXECUTABLE_CONTENT_DETECTED");
    });
  });

  describe("Constants", () => {
    test("MAX_FILE_SIZE should be 20MB", () => {
      expect(MAX_FILE_SIZE).toBe(20 * 1024 * 1024);
    });

    test("ALLOWED_EXTENSIONS should contain all required types", () => {
      expect(ALLOWED_EXTENSIONS).toContain("pdf");
      expect(ALLOWED_EXTENSIONS).toContain("docx");
      expect(ALLOWED_EXTENSIONS).toContain("xlsx");
      expect(ALLOWED_EXTENSIONS).toContain("png");
      expect(ALLOWED_EXTENSIONS).toContain("jpg");
      expect(ALLOWED_EXTENSIONS).toContain("jpeg");
      expect(ALLOWED_EXTENSIONS).toHaveLength(6);
    });
  });
});
