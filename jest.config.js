module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/features/profile/utils/**/*.test.{js,ts}',
    '<rootDir>/src/features/nutrition/helpers/**/*.test.{js,ts}',
    '<rootDir>/src/features/nutrition/handlers/**/*.test.{js,ts}',
    '<rootDir>/src/features/nutrition/services/**/*.test.{js,ts}',
    '<rootDir>/src/features/progress/utils/**/*.test.{js,ts}',
    '<rootDir>/src/features/workout/utils/**/*.test.{js,ts}',
  ],
  moduleFileExtensions: ['js', 'ts', 'json'],
  transform: {
    '^.+\\.[jt]s$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'] }],
  },
  clearMocks: true,
};
