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

afterEach(async () => {
  // Cleanup test data after each test
  // Order matters due to foreign key constraints
  await prisma.like.deleteMany()
  await prisma.fact.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

export { app, prisma }
