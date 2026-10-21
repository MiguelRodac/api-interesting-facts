const moduleNameMapper = {
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

module.exports = {
  testTimeout: 20000,
  maxWorkers: 1,
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': 'ts-jest'
      },
      moduleNameMapper
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': 'ts-jest'
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      moduleNameMapper
    }
  ]
}
