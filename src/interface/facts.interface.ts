import { UrlString } from './globals.interface'

export interface IinterestingFact {
  id: number
  title: string
  description: string
  studyLocation: string
  source: UrlString
}

// Type to add a new interesting fact to omit the id
export type IinterestingFactAdd = Omit<IinterestingFact, 'id'>
