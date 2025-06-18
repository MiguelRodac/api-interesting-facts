import { IinterestingFact, IinterestingFactAdd } from '../interface/facts.interface'
import { UrlString } from '../interface/globals.interface'
import * as validators from './globlasValidators'

const validateInterestingFactAdd = (fact: IinterestingFactAdd): IinterestingFactAdd => {
  const newFact: IinterestingFactAdd = {
    title: validateTitle(fact.title),
    description: validateDescription(fact.description),
    studyLocation: validateStudyLocation(fact.studyLocation),
    source: validateSource(fact.source)
  }
  return newFact
}

const validateInterestingFact = (fact: IinterestingFact): IinterestingFact => {
  const newFact: IinterestingFact = {
    id: validateId(fact.id),
    title: validateTitle(fact.title),
    description: validateDescription(fact.description),
    studyLocation: validateStudyLocation(fact.studyLocation),
    source: validateSource(fact.source)
  }
  return newFact
}

const validateId = (id: any): number => {
  if (!validators.isNumber(id) || validators.haveAnyData(id)) {
    throw new Error('Id is required and must be a number')
  }
  return id
}

const validateTitle = (title: any): string => {
  if (!validators.isString(title) || validators.haveAnyData(title)) {
    throw new Error('Title is required and must be a string')
  }
  return title
}

const validateDescription = (description: any): string => {
  if (!validators.isString(description) || validators.haveAnyData(description)) {
    throw new Error('Description is required and must be a string')
  }
  return description
}

const validateSource = (source: any): UrlString => {
  if (!validators.isString(source) || !validators.isUrl(source)) {
    throw new Error('Source is required, must be a string and a valid URL')
  }
  return source
}

const validateStudyLocation = (studyLocation: any): string => {
  if (!validators.isString(studyLocation) || validators.haveAnyData(studyLocation)) {
    throw new Error('Study location is required and must be a string')
  }
  return studyLocation
}

export { validateInterestingFactAdd, validateInterestingFact }
