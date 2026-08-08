export const mockVerifyIdToken = jest.fn(async (token: string) => {
  if (token.startsWith('invalid')) {
    return await Promise.reject(new Error('Invalid token'))
  }

  // Map specific tokens to specific uids for authorization testing
  const tokenMap: Record<string, { uid: string, email: string }> = {
    'valid-test-token': { uid: 'test-uid', email: 'test@example.com' },
    'other-valid-token': { uid: 'other-uid', email: 'other@example.com' },
    'no-profile-token': { uid: 'no-profile-uid', email: 'noprofile@example.com' }
  }

  const user = tokenMap[token]
  if (user != null) {
    return await Promise.resolve(user)
  }

  // Default fallback for any other valid token
  return await Promise.resolve({ uid: 'test-uid', email: 'test@example.com' })
})

export const mockGetAuth = jest.fn(() => ({
  verifyIdToken: mockVerifyIdToken
}))
