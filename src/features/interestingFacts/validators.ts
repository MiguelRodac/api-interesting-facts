import { type InterestingFactAdd, type UrlString } from './types'
import { ValidationError } from '../../shared/errors/ValidationError'

const haveAnyData = (data: any): boolean => {
  return data === '' || data === null || data === undefined
}

const isString = (value: any): boolean => {
  return typeof value === 'string' || value instanceof String
}

const isUrl = (url: string): boolean => {
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url)
}

const validateTitle = (title: any): string => {
  if (!isString(title) || haveAnyData(title)) {
    throw new ValidationError('Title is required and must be a string', { title: 'Title is required and must be a string' })
  }
  return title
}

const validateDescription = (description: any): string => {
  if (!isString(description) || haveAnyData(description)) {
    throw new ValidationError('Description is required and must be a string', { description: 'Description is required and must be a string' })
  }
  return description
}

const validateSource = (source: any): UrlString => {
  if (!isString(source) || !isUrl(source)) {
    throw new ValidationError('Source is required, must be a string and a valid URL', { source: 'Source is required, must be a string and a valid URL' })
  }
  return source as UrlString
}

const validateStudyLocation = (studyLocation: any): string => {
  if (!isString(studyLocation) || haveAnyData(studyLocation)) {
    throw new ValidationError('Study location is required and must be a string', { studyLocation: 'Study location is required and must be a string' })
  }
  return studyLocation
}

export const validateInterestingFactAdd = (fact: any): InterestingFactAdd => {
  return {
    title: validateTitle(fact.title),
    description: validateDescription(fact.description),
    studyLocation: validateStudyLocation(fact.studyLocation),
    source: validateSource(fact.source)
  }
}
