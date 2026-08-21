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
  // E2E suites hit a real DB over HTTP; raise the default per-test timeout
  testTimeout: 20000,
  // Resolve path aliases to match tsconfig
  moduleNameMapper: {
    '@shared/(.*)': '<rootDir>/src/shared/$1',
    '@fact/(.*)': '<rootDir>/src/feature/facts/$1',
    '@likes/(.*)': '<rootDir>/src/feature/likes/$1',
    '@comments/(.*)': '<rootDir>/src/feature/comments/$1',
    '@reposts/(.*)': '<rootDir>/src/feature/reposts/$1',
    '@commentLikes/(.*)': '<rootDir>/src/feature/commentLikes/$1',
    '@user/(.*)': '<rootDir>/src/feature/user/$1',
    '@avatar/(.*)': '<rootDir>/src/feature/avatar/$1',
    '@hashtag/(.*)': '<rootDir>/src/feature/hashtag/$1',
    '@mentions/(.*)': '<rootDir>/src/feature/mentions/$1'
  }
}
