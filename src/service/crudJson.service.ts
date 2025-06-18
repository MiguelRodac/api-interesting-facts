import { promises as fs } from 'fs'

// Funtion to read data from a json file
export const readData = async (filePath: string): Promise<any> => {
  console.log('Reading data from file:', filePath)
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return data
  } catch (error) {
    console.error('Error reading JSON file:', error)
    return null
  }
}

// Funtion to write data to a json file
export const writeData = async (filePath: string, data: any): Promise<any> => {
  console.log('Writing data to file:', filePath)
  try {
    const result = await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return result
  } catch (error) {
    console.error('Error writing JSON file:', error)
    return null
  }
}

// Funtion to update data in a json file
export const updateFact = async (filePath: string, id: number, updatedFields: any): Promise<any> => {
  console.log('Updating data in file:', filePath)
  const data = await readData(filePath)

  try {
    if (data !== null) {
      const index = data.interesting_facts_in_life.findIndex((fact: any) => fact.id === id)
      if (index !== -1) {
        data.interesting_facts_in_life[index] = { ...data.interesting_facts_in_life[index], ...updatedFields }
        await writeData(filePath, data)
        console.log(`Fact ${id} updated successfully.`)
        return {
          message: 'Fact updated successfully',
          data: data.interesting_facts_in_life[index]
        }
      } else {
        console.error('Fact not found')
        return {
          message: 'Fact not found',
          error: `Fact with id ${id} not exist`
        }
      }
    }

    return {
      message: 'Data not found or empty',
      error: 'Error reading data'
    }
  } catch (error) {
    console.error('Error updating fact:', error)
    return {
      message: 'Error updating fact',
      error: `Update fact error: ${error as string}`
    }
  }
}

// Funtion to delete data from a json file
export const deleteFact = async (filePath: string, id: number): Promise<any> => {
  console.log('Deleting data from file:', filePath)
  const data = await readData(filePath)

  try {
    if (data !== null) {
      const newFacts = data.interesting_facts_in_life.filter((fact: any) => fact.id !== id)
      if (newFacts.length < data.interesting_facts_in_life.length) {
        data.interesting_facts_in_life = newFacts
        await writeData(filePath, data)
        console.log(`Fact ${id} deleted.`)
        return {
          message: 'Fact deleted successfully',
          data: `Fact ${id} deleted.`
        }
      } else {
        return {
          message: 'Fact not found',
          error: `Fact with id ${id} not exist`
        }
      }
    }

    return {
      message: 'Data not found or empty',
      error: 'Error reading data'
    }
  } catch (error) {
    console.error('Error deleting fact:', error)
    return {
      message: 'Error deleting fact',
      error: `Delete fact error: ${error as string}`
    }
  }
}

export default { readData, writeData, updateFact, deleteFact }
