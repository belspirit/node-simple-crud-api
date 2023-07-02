module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["jest-extended/all"],
  testPathIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/?(*.)+(test).ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  restoreMocks: true,
  resetMocks: true,
  moduleDirectories: ["node_modules", "<rootDir>/src"],
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  testTimeout: 30000,
};
