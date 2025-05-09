const haveAnyData = (data: any): boolean => {
  if (data === '' || data === null || data === undefined) {
    return true
  }

  return false
}

const isString = (string: any): boolean => {
  return typeof string === 'string' || string instanceof String
}

const isNumber = (number: any): boolean => {
  return typeof number === 'number' || number instanceof Number
}

const isBoolean = (boolean: any): boolean => {
  return typeof boolean === 'boolean' || boolean instanceof Boolean
}

const isArray = (array: any): boolean => {
  return Array.isArray(array)
}

const isObject = (object: any): boolean => {
  return typeof object === 'object' && object !== null
}

const isDate = (date: any): boolean => {
  //   return date instanceof Date
  return Boolean(Date.parse(date))
}

// const isEmail = (email: string): boolean => {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
// }

const isUrl = (url: string): boolean => {
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url)
}

// const isPhone = (phone: string): boolean => {
//   return /^[0-9]{10}$/.test(phone)
// }

// const isIp = (ip: string): boolean => {
//   return /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(ip)
// }

export { haveAnyData, isString, isNumber, isBoolean, isArray, isObject, isDate, isUrl }
