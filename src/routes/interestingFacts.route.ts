import express from 'express' // ESModules
import { getInterestingFacts, addInterestingFact, getInterestingFactById, updateInterestingFact, deleteInterestingFact } from '../service/interestingFacts.service'
import { validateInterestingFactAdd } from '../utils/interestingFactsValidators'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    const interestingFacts = await getInterestingFacts()
    res.status(200).send(interestingFacts)
  } catch (err) {
    res.status(500).send({
      message: 'Error getting interesting facts',
      error: (err as Error).message ?? 'Unknown error'
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      res.status(422).send({
        message: 'Interesting fact not found',
        error: 'Id is required and must be a number'
      })
    }

    const fact = await getInterestingFactById(id)

    res.status(200).send(fact)
  } catch (err) {
    res.status(404).send({
      message: 'Interesting fact not found',
      error: (err as Error).message ?? 'Unknown error'
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const newFact = validateInterestingFactAdd(req.body)

    const factCreated = await addInterestingFact(newFact)

    res.status(201).send(factCreated)
  } catch (err) {
    res.status(400).send({
      message: 'Error adding interesting fact',
      error: (err as Error).message ?? 'Unknown error'
    })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      res.status(422).send({
        message: 'Interesting fact not found',
        error: 'Id is required and must be a number'
      })
    }

    const newFact = validateInterestingFactAdd(req.body)
    const updatedFact = await updateInterestingFact(id, newFact)

    res.status(200).send(updatedFact)
  } catch (err) {
    res.status(400).send({
      message: 'Error updating interesting fact',
      error: (err as Error).message ?? 'Unknown error'
    })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      res.status(422).send({
        message: 'Interesting fact not found',
        error: 'Id is required and must be a number'
      })
    }

    const deletedFact = await deleteInterestingFact(id)

    res.status(200).send(deletedFact)
  } catch (err) {
    res.status(400).send({
      message: 'Error deleting interesting fact',
      error: (err as Error).message ?? 'Unknown error'
    })
  }
})

export default router
