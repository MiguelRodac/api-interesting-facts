type UrlString = `${'http' | 'https'}://${string}`

export interface InterestingFact {
  id: string
  title: string
  description: string
  studyLocation: string
  source: UrlString
}

export type InterestingFactAdd = Omit<InterestingFact, 'id'>

export type { UrlString }
