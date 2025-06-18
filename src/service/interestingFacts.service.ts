import { IinterestingFact, IinterestingFactAdd } from '../interface/facts.interface'
import crudJson from './crudJson.service'

// File path
const filePath = './src/mock/interestingFacts.json'

// Funtion to get all interesting facts
export const getInterestingFacts = async (): Promise<IinterestingFact[]> => {
  try {
    const data = await crudJson.readData(filePath)
    if (data !== null) {
      // Parse the JSON string into an object since readData returns a string
      const parsedData = JSON.parse(data)
      return parsedData.interesting_facts_in_life
    }
    return []
  } catch (error) {
    console.error('Error in getInterestingFacts:', error)
    throw new Error(`Error getting interesting facts: ${error as string}`)
  }
}

// Funtion to get a single interesting fact by id
export const getInterestingFactById = async (id: number): Promise<
{ message: string, data: IinterestingFact } |
{ message: string, error: any }
> => {
  console.log('Getting interesting fact by id:', id)
  try {
    const data = await crudJson.readData(filePath)
    if (data !== null) {
      // Parse the JSON string into an object since readData returns a string
      const parsedData = JSON.parse(data)
      const fact = parsedData.interesting_facts_in_life.find((fact: any) => fact.id === id) as IinterestingFact

      if (fact === undefined) {
        return {
          message: 'Interesting fact not found',
          error: 'Fact not found'
        }
      }

      return {
        message: 'Interesting fact found',
        data: fact
      }
    }
    return {
      message: 'Data not found or empty',
      error: 'Error reading data'
    }
  } catch (error) {
    console.error('Error in getInterestingFactById:', error)
    return {
      message: 'Error getting interesting fact',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Función para verificar si existe un hecho duplicado
const checkDuplicateFact = (currentFacts: IinterestingFact[], newFact: IinterestingFactAdd, excludeId?: number): boolean => {
  return currentFacts.some((fact: IinterestingFact) => {
    // Si hay un ID a excluir y el hecho actual es ese ID, no lo consideramos como duplicado
    if (excludeId !== undefined && fact.id === excludeId) {
      return false
    }
    // Verificar si el título o la descripción coinciden (ignorando mayúsculas/minúsculas)
    return fact.title.toLowerCase() === newFact.title.toLowerCase() ||
           fact.description.toLowerCase() === newFact.description.toLowerCase()
  })
}

// Funtion to add a new interesting fact with async await
export const addInterestingFact = async (body: IinterestingFactAdd): Promise<
{ message: string, data: IinterestingFact } |
{ message: string, error: any }
> => {
  console.log('Adding interesting fact')
  try {
    const { title, description, source, studyLocation } = body

    // Leer los datos actuales
    const data = await crudJson.readData(filePath)
    if (data === null) {
      return {
        message: 'Error reading data',
        error: 'Could not read existing data'
      }
    }

    // Parsear los datos JSON
    const parsedData = JSON.parse(data)
    const currentFacts = parsedData.interesting_facts_in_life !== undefined ? parsedData.interesting_facts_in_life : []

    // Verificar duplicados usando la nueva función
    if (checkDuplicateFact(currentFacts, body)) {
      return {
        message: 'Error creating interesting fact',
        error: 'A fact with the same title or description already exists'
      }
    }

    // Crear el nuevo hecho
    const newFact: IinterestingFact = {
      id: currentFacts.length > 0 ? Math.max(...currentFacts.map((f: IinterestingFact) => f.id)) + 1 : 1,
      title,
      description,
      studyLocation,
      source
    }

    // Actualizar los datos
    const updatedData = {
      interesting_facts_in_life: [...currentFacts, newFact]
    }

    // Escribir los datos actualizados
    await crudJson.writeData(filePath, updatedData)
    return {
      message: 'Interesting fact created',
      data: newFact
    }
  } catch (error) {
    console.error('Error in addInterestingFact:', error)
    return {
      message: 'Error creating interesting fact',
      error: error !== undefined ? error : 'Unknown error'
    }
  }
}

// Funtion to update an interesting fact
// Función para actualizar un hecho interesante
export const updateInterestingFact = async (id: number, body: IinterestingFactAdd): Promise<
{ message: string, data: IinterestingFact } |
{ message: string, error: any }
> => {
  console.log('Updating interesting fact')
  try {
    // Extraer los datos del cuerpo de la solicitud
    const { title, description, source, studyLocation } = body

    // Leer los datos del archivo
    const data = await crudJson.readData(filePath)
    if (data === null) {
      return {
        message: 'Error reading data',
        error: 'Could not read existing data'
      }
    }

    // Parsear los datos JSON
    const parsedData = JSON.parse(data)
    // Obtener los hechos actuales o un array vacío si no existen
    const currentFacts = parsedData.interesting_facts_in_life !== undefined ? parsedData.interesting_facts_in_life : []

    // Encontrar el índice del hecho a actualizar
    const factIndex = currentFacts.findIndex((fact: IinterestingFact) => fact.id === id)

    // Si no se encuentra el hecho, devolver un error
    if (factIndex === -1) {
      return {
        message: 'Interesting fact not found',
        error: 'Fact not found'
      }
    }

    // Verificar duplicados excluyendo el hecho actual
    if (checkDuplicateFact(currentFacts, body, id)) {
      return {
        message: 'Error updating interesting fact',
        error: 'A fact with the same title or description already exists'
      }
    }

    // Crear el hecho actualizado
    const updatedFact: IinterestingFact = {
      ...currentFacts[factIndex],
      title,
      description,
      studyLocation,
      source
    }

    // Actualizar el hecho en el array de hechos
    currentFacts[factIndex] = updatedFact

    // Preparar los datos actualizados para escribir en el archivo
    const updatedData = {
      interesting_facts_in_life: currentFacts
    }

    // Escribir los datos actualizados en el archivo
    await crudJson.writeData(filePath, updatedData)

    // Devolver el hecho actualizado
    return {
      message: 'Interesting fact updated',
      data: updatedFact
    }
  } catch (error) {
    // Manejar cualquier error que ocurra durante el proceso
    console.error('Error in updateInterestingFact:', error)
    return {
      message: 'Error updating interesting fact',
      error: error !== undefined ? error : 'Unknown error'
    }
  }
}

// Function to delete an interesting fact
export const deleteInterestingFact = async (id: number): Promise<
{ message: string, data: IinterestingFact } |
{ message: string, error: any }
> => {
  console.log('Deleting interesting fact')
  try {
    // Read data from the file
    const data = await crudJson.readData(filePath)
    if (data === null) {
      return {
        message: 'Error reading data',
        error: 'Could not read existing data'
      }
    }

    // Parse the data and get the current facts
    const parsedData = JSON.parse(data)
    const currentFacts = parsedData.interesting_facts_in_life !== undefined ? parsedData.interesting_facts_in_life : []

    // Find the index of the fact to delete
    const factIndex = currentFacts.findIndex((fact: IinterestingFact) => fact.id === id)

    // If the fact is not found, return an error
    if (factIndex === -1) {
      return {
        message: 'Interesting fact not found',
        error: 'Fact not exist'
      }
    }

    // Store the deleted fact
    const deletedFact = currentFacts[factIndex]

    // Remove the fact from the array
    currentFacts.splice(factIndex, 1)

    // Prepare the updated data
    const updatedData = {
      interesting_facts_in_life: currentFacts
    }

    // Write the updated data to the file
    await crudJson.writeData(filePath, updatedData)

    // Return success message with the deleted fact
    return {
      message: 'Interesting fact deleted',
      data: deletedFact
    }
  } catch (error) {
    // Handle any errors that occur during the process
    console.error('Error in deleteInterestingFact:', error)
    return {
      message: 'Error deleting interesting fact',
      error: error !== undefined ? error : 'Unknown error'
    }
  }
}

export default { getInterestingFacts, addInterestingFact, updateInterestingFact, deleteInterestingFact }
