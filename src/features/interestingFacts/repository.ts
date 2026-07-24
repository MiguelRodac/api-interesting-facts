import { type InterestingFact, type InterestingFactAdd } from './types'

export interface FactRepository {
  findAll: () => Promise<InterestingFact[]>
  findById: (id: string) => Promise<InterestingFact | null>
  create: (fact: InterestingFactAdd) => Promise<InterestingFact>
  update: (id: string, fact: InterestingFactAdd) => Promise<InterestingFact>
  delete: (id: string) => Promise<void>
}
