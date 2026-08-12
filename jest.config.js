module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // Run tests sequentially to avoid database race conditions
  maxWorkers: 1,
  // Resolve path aliases to match tsconfig
  moduleNameMapper: {
    '@shared/(.*)': '<rootDir>/src/shared/$1',
    '@fact/(.*)': '<rootDir>/src/feature/facts/$1',
    '@likes/(.*)': '<rootDir>/src/feature/likes/$1',
    '@user/(.*)': '<rootDir>/src/feature/user/$1'
  }
}
