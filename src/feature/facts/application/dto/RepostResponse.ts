import { type CommentPreview } from '@comments/application/dto/CommentPreview'
import { type UserAvatarPreview } from '@shared/domain/types/UserAvatarPreview'
import { type FactAuthorPreview, type HashtagPreview } from './FactResponse'

export interface RepostResponse {
  id: string
  factId: string
  author: FactAuthorPreview
  title: string | null
  content: string
  hashtags: HashtagPreview[]
  repostCount: number
  repostedBy: {
    username: string
    displayName: string
    avatarUrl: string | null
    avatarColor: string | null
    isMe: boolean
  }
  repostLikeCount: number
  liked?: boolean
  likeBy: UserAvatarPreview[]
  repostCommentCount: number
  repostCommentsDetails: CommentPreview | null
  createdAt: string
}
