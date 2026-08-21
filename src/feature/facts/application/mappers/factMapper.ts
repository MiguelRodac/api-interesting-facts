import { type FactView } from '../../domain/models/FactView'
import { type FactResponse } from '../dto/FactResponse'

export function mapFactViewToResponse (fact: FactView): FactResponse {
  return {
    id: fact.id,
    author: fact.author,
    title: fact.title,
    content: fact.content,
    likes: fact.likes,
    liked: fact.liked,
    likeBy: fact.likeBy,
    comments: fact.comments,
    commentsDetails: fact.commentsDetails,
    repostCount: fact.repostCount,
    repostedByMe: fact.repostedByMe,
    repostBy: fact.repostBy,
    hashtags: fact.hashtags,
    createdAt: fact.createdAt.toISOString(),
    updatedAt: fact.updatedAt.toISOString()
  }
}
