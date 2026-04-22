module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/__tests__"],
  setupFiles: ["<rootDir>/jest.setup.tsx"],
  moduleNameMapper: {
      "\\.(png|jpg|jpeg|gif|svg)$": "<rootDir>/__mocks__/fileMock.js"
    },
  restoreMocks: true,
  clearMocks: true,
  transformIgnorePatterns: [
      "node_modules/(?!react-native|react-native-element-dropdown|expo|@expo|@react-native|@clerk)"
    ],
};
