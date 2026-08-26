import { type RepostRepository } from '../../domain/ports/RepostRepository'
import { type FactRepository } from '../../../facts/domain/ports/FactRepository'
import { type LikeRepository } from '../../../likes/domain/ports/LikeRepository'
import { type CommentRepository } from '../../../comments/domain/ports/CommentRepository'
import { type RepostResponse } from '../../../facts/application/dto/RepostResponse'
import { RepostNotFoundError } from '../../domain/errors/RepostNotFoundError'
import { FactNotFoundError } from '../../../facts/domain/errors/FactNotFoundError'

export class GetRepostById {
  private readonly repostRepository: RepostRepository
  private readonly factRepository: FactRepository
  private readonly likeRepository: LikeRepository
  private readonly commentRepository: CommentRepository

  constructor (repostRepository: RepostRepository, factRepository: FactRepository, likeRepository: LikeRepository, commentRepository: CommentRepository) {
    this.repostRepository = repostRepository
    this.factRepository = factRepository
    this.likeRepository = likeRepository
    this.commentRepository = commentRepository
  }

  async execute (repostId: string, viewerId?: string): Promise<RepostResponse> {
    const repost = await this.repostRepository.findByIdWithAuthor(repostId)
    if (repost == null) {
      throw new RepostNotFoundError()
    }

    const originalFact = await this.factRepository.findById(repost.originalFactId)
    if (originalFact == null) {
      throw new FactNotFoundError()
    }

    const [repostLikeCount, repostCommentCount, repostFirstComment, repostLikeBy, viewerRepostLiked] = await Promise.all([
      this.likeRepository.batchLikeCountsByRepostIds([repostId]),
      this.commentRepository.batchCommentCountsByRepostIds([repostId]),
      this.commentRepository.batchFirstCommentByRepostIds([repostId]),
      this.likeRepository.batchRecentRepostLikers([repostId], 3),
      viewerId != null
        ? this.likeRepository.batchUserRepostLikes([repostId], viewerId)
        : null
    ])

    return {
      id: repost.id,
      factId: repost.originalFactId,
      author: originalFact.author,
      title: originalFact.title,
      content: originalFact.content,
      hashtags: originalFact.hashtags,
      repostCount: originalFact.repostCount,
      repostedBy: {
        username: repost.username,
        displayName: repost.displayName,
        avatarUrl: repost.avatarUrl,
        avatarColor: repost.avatarColor,
        isMe: viewerId === repost.authorId
      },
      repostLikeCount: repostLikeCount.get(repostId) ?? 0,
      liked: viewerRepostLiked?.has(repostId) ?? undefined,
      likeBy: repostLikeBy.get(repostId) ?? [],
      repostCommentCount: repostCommentCount.get(repostId) ?? 0,
      repostCommentsDetails: repostFirstComment.get(repostId) ?? null,
      createdAt: repost.createdAt.toISOString()
    }
  }
}
