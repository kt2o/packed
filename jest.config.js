module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/__tests__"],
  setupFiles: ["<rootDir>/jest.setup.tsx"],
  moduleNameMapper: {
      "^src/(.*)$": "<rootDir>/src/$1"
    },
  restoreMocks: true,
  clearMocks: true,
  transformIgnorePatterns: [
    "node_modules/(?!(@react-native|react-native|expo|expo-modules-core)/)"
  ]
};
