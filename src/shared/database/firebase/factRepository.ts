import './admin'
import { getFirestore, type DocumentData } from 'firebase-admin/firestore'
import { type FactRepository } from '../../../features/interestingFacts/repository'
import { type InterestingFact, type InterestingFactAdd, type UrlString } from '../../../features/interestingFacts/types'

const COLLECTION = 'interestingFacts'

const toInterestingFact = (id: string, data: DocumentData): InterestingFact => {
  const result: InterestingFact = {
    id,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    studyLocation: String(data.studyLocation ?? ''),
    source: String(data.source ?? '') as UrlString
  }
  return result
}

export class FirestoreFactRepository implements FactRepository {
  private readonly collection = getFirestore().collection(COLLECTION)

  async findAll (): Promise<InterestingFact[]> {
    const snapshot = await this.collection.get()
    return snapshot.docs.map((doc) => toInterestingFact(doc.id, doc.data()))
  }

  async findById (id: string): Promise<InterestingFact | null> {
    const doc = await this.collection.doc(id).get()
    if (!doc.exists) return null
    return toInterestingFact(doc.id, doc.data() as DocumentData)
  }

  async create (fact: InterestingFactAdd): Promise<InterestingFact> {
    const docRef = await this.collection.add(fact)
    const result: InterestingFact = { id: docRef.id, ...fact }
    return result
  }

  async update (id: string, fact: InterestingFactAdd): Promise<InterestingFact> {
    await this.collection.doc(id).update(fact as Record<string, unknown>)
    const result: InterestingFact = { id, ...fact }
    return result
  }

  async delete (id: string): Promise<void> {
    await this.collection.doc(id).delete()
  }
}
