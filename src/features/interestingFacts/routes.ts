import { Router } from 'express'
import { InterestingFactsService } from './service'
import { FirestoreFactRepository } from '../../shared/database/firebase/factRepository'
import { validateInterestingFactAdd } from './validators'
import { requireAuth } from '../../shared/middleware/auth'

const router = Router()
const repository = new FirestoreFactRepository()
const service = new InterestingFactsService(repository)

router.get('/', async (_req, res, next) => {
  try {
    const facts = await service.getAll()
    const sample = facts.sort(() => Math.random() - 0.5).slice(0, 3)
    res.status(200).json(sample)
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

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const validated = validateInterestingFactAdd(req.body)
    const created = await service.create(validated)
    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const validated = validateInterestingFactAdd(req.body)
    const updated = await service.update(req.params.id as string, validated)
    res.status(200).json(updated)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await service.delete(req.params.id as string)
    res.status(200).json({ message: 'Interesting fact deleted' })
  } catch (err) {
    next(err)
  }
})

export default router
