import { Router } from 'express'
import { InterestingFactsService } from './service'
import { FirestoreFactRepository } from '../../shared/database/firebase/factRepository'
import { validateInterestingFactAdd } from './validators'

const router = Router()
const repository = new FirestoreFactRepository()
const service = new InterestingFactsService(repository)

router.get('/', async (_req, res, next) => {
  try {
    const facts = await service.getAll()
    res.status(200).json(facts)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const fact = await service.getById(req.params.id)
    res.status(200).json(fact)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const validated = validateInterestingFactAdd(req.body)
    const created = await service.create(validated)
    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const validated = validateInterestingFactAdd(req.body)
    const updated = await service.update(req.params.id, validated)
    res.status(200).json(updated)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await service.delete(req.params.id)
    res.status(200).json({ message: 'Interesting fact deleted' })
  } catch (err) {
    next(err)
  }
})

export default router
