import { mockGetAuth } from './mocks/firebase'

// Mock firebase-admin/auth before app loads
jest.mock('firebase-admin/auth', () => ({
  getAuth: mockGetAuth
}))

// Mock firebase-admin/app to prevent real initialization
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  cert: jest.fn()
}))

// Mock @scalar/express-api-reference (ESM module)
jest.mock('@scalar/express-api-reference', () => ({
  apiReference: jest.fn(() => (_req: any, _res: any, next: any) => next())
}))

// eslint-disable-next-line import/first
import app from '../src/app'
// eslint-disable-next-line import/first
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Only UIDs that tests are allowed to create/cleanup.
// Never delete real user data — filter by these test fixtures.
const TEST_UIDS = [
  'test-uid',
  'other-uid',
  'no-profile-uid',
  'public-user-uid',
  'another-user-uid'
]

afterEach(async () => {
  // Cleanup ONLY data created by tests (filtered by test UIDs).
  // Never touch rows belonging to real users.
  // Reposts reference facts, so delete them before facts/users.
  await prisma.repost.deleteMany({ where: { authorId: { in: TEST_UIDS } } })
  await prisma.comment.deleteMany({ where: { authorId: { in: TEST_UIDS } } })
  await prisma.like.deleteMany({ where: { userId: { in: TEST_UIDS } } })
  await prisma.fact.deleteMany({ where: { authorId: { in: TEST_UIDS } } })
  await prisma.user.deleteMany({ where: { firebaseUid: { in: TEST_UIDS } } })
})

afterAll(async () => {
  await prisma.$disconnect()
})

export { app, prisma }
