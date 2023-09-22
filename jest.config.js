// For a detailed explanation regarding each configuration property, please visit:
// https://jestjs.io/docs/configuration

module.exports = {
  roots: ["<rootDir>/src/"],
  collectCoverage: true,
  testResultsProcessor: "jest-sonar-reporter",
  preset: "ts-jest/presets/js-with-ts",
  testPathIgnorePatterns: ["/node_modules/", "/__utils__/"],
};
