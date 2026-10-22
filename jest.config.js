module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx,ts,tsx}'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  clearMocks: true,
  testTimeout: 15000,
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.test.{js,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*Style.ts',
    '!src/**/*Styles.ts',
    '!src/**/types.ts',
    '!src/**/*.types.ts',
  ],
  coverageReporters: ['text-summary', 'json-summary', 'lcov'],
};
