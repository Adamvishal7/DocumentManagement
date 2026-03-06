module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "services/**/*.js",
    "middleware/**/*.js",
    "utils/**/*.js",
    "routes/**/*.js",
    "!**/node_modules/**",
    "!**/tests/**",
  ],
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.property.test.js"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 10000,
};
