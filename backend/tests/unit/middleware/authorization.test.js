const { requireRole } = require("../../../middleware/authorization");

describe("Authorization Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    // Mock request, response, and next function
    req = {
      user: null,
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe("requireRole", () => {
    describe("when user is not authenticated", () => {
      it("should return 401 if req.user is not set", () => {
        const middleware = requireRole("Admin");
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: "Authentication required",
          message: "User authentication is required to access this resource",
          code: "UNAUTHORIZED",
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe("when user has no role", () => {
      it("should return 403 if user.role is not defined", () => {
        req.user = { id: 1, email: "test@example.com" };
        const middleware = requireRole("Admin");
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: "Insufficient permissions",
          message: "User role is not defined",
          code: "NO_ROLE",
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe("when user has insufficient permissions", () => {
      it("should return 403 if user role is not in allowed roles (single role)", () => {
        req.user = { id: 1, email: "viewer@example.com", role: "Viewer" };
        const middleware = requireRole("Admin");
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: "Insufficient permissions",
          message:
            "You do not have permission to access this resource. Required role: Admin",
          requiredRole: "Admin",
          currentRole: "Viewer",
          code: "FORBIDDEN",
        });
        expect(next).not.toHaveBeenCalled();
      });

      it("should return 403 if user role is not in allowed roles (multiple roles)", () => {
        req.user = { id: 1, email: "viewer@example.com", role: "Viewer" };
        const middleware = requireRole("Admin", "Employee");
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: "Insufficient permissions",
          message:
            "You do not have permission to access this resource. Required role: Admin or Employee",
          requiredRole: ["Admin", "Employee"],
          currentRole: "Viewer",
          code: "FORBIDDEN",
        });
        expect(next).not.toHaveBeenCalled();
      });

      it("should return 403 for Employee trying to access Admin-only endpoint", () => {
        req.user = { id: 2, email: "employee@example.com", role: "Employee" };
        const middleware = requireRole("Admin");
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: "Insufficient permissions",
          message:
            "You do not have permission to access this resource. Required role: Admin",
          requiredRole: "Admin",
          currentRole: "Employee",
          code: "FORBIDDEN",
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe("when user has sufficient permissions", () => {
      it("should call next() if user has the required role (single role)", () => {
        req.user = { id: 1, email: "admin@example.com", role: "Admin" };
        const middleware = requireRole("Admin");
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      });

      it("should call next() if user has one of the required roles (multiple roles)", () => {
        req.user = { id: 2, email: "employee@example.com", role: "Employee" };
        const middleware = requireRole("Admin", "Employee");
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      });

      it("should allow Admin to access Admin-only endpoint", () => {
        req.user = { id: 1, email: "admin@example.com", role: "Admin" };
        const middleware = requireRole("Admin");
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it("should allow Employee to access Employee/Admin endpoint", () => {
        req.user = { id: 2, email: "employee@example.com", role: "Employee" };
        const middleware = requireRole("Admin", "Employee");
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it("should allow Viewer to access Viewer/Employee/Admin endpoint", () => {
        req.user = { id: 3, email: "viewer@example.com", role: "Viewer" };
        const middleware = requireRole("Admin", "Employee", "Viewer");
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });
    });

    describe("role-based access scenarios", () => {
      it("should enforce Admin-only access for user management", () => {
        // Viewer tries to access user management
        req.user = { id: 3, email: "viewer@example.com", role: "Viewer" };
        const middleware = requireRole("Admin");
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
      });

      it("should enforce Admin/Employee access for document upload", () => {
        // Viewer tries to upload
        req.user = { id: 3, email: "viewer@example.com", role: "Viewer" };
        const middleware = requireRole("Admin", "Employee");
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
      });

      it("should allow all authenticated users to download documents", () => {
        // Test each role
        const roles = ["Admin", "Employee", "Viewer"];
        roles.forEach((role) => {
          const testReq = { user: { id: 1, email: "test@example.com", role } };
          const testRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };
          const testNext = jest.fn();

          const middleware = requireRole("Admin", "Employee", "Viewer");
          middleware(testReq, testRes, testNext);

          expect(testNext).toHaveBeenCalled();
        });
      });
    });

    describe("error handling", () => {
      it("should handle unexpected errors gracefully", () => {
        // Create a scenario that causes an error
        req.user = { id: 1, email: "admin@example.com", role: "Admin" };

        // Mock next to throw an error
        const errorNext = jest.fn(() => {
          throw new Error("Unexpected error");
        });

        const middleware = requireRole("Admin");

        // This should not throw, but handle the error
        expect(() => {
          middleware(req, res, errorNext);
        }).not.toThrow();
      });
    });
  });
});
