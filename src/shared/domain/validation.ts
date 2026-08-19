import { ValidationError } from './errors/ValidationError'

export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,30}$/

export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
export const EMAIL_MAX_LENGTH = 254

export const DISPLAY_NAME_MAX_LENGTH = 50

export const FACT_TITLE_MAX_LENGTH = 100
export const FACT_CONTENT_MIN_LENGTH = 10
export const FACT_CONTENT_MAX_LENGTH = 1000

export const COMMENT_CONTENT_MIN_LENGTH = 10
export const COMMENT_CONTENT_MAX_LENGTH = 500

export function validateMentions (content: string): void {
  const mentions = content.match(/@([a-zA-Z0-9_.]+)/g) ?? []
  for (const mention of mentions) {
    const username = mention.slice(1)
    if (!USERNAME_PATTERN.test(username)) {
      throw new ValidationError('Invalid mention: @username must be 3-30 characters and only contain letters, numbers, underscores or dots', [
        { field: 'content', message: `Invalid mention @${username}` }
      ])
    }
  }
}
