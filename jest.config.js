module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/features/profile/utils/**/*.test.js',
    '<rootDir>/src/features/nutrition/helpers/**/*.test.js',
  ],
  transform: {
    '^.+\\.js$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }],
  },
  clearMocks: true,
};