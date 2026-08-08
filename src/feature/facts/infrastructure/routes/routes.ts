import { Router, type Request, type Response, type NextFunction } from 'express'
import { PrismaFactRepository } from '../repositories/PrismaFactRepository'
import { CreateFact } from '../../application/use-cases/CreateFact'
import { GetFactById } from '../../application/use-cases/GetFactById'
import { UpdateFact } from '../../application/use-cases/UpdateFact'
import { DeleteFact } from '../../application/use-cases/DeleteFact'
import { GetFacts } from '../../application/use-cases/GetFacts'
import { GetFactsByAuthor } from '../../application/use-cases/GetFactsByAuthor'
import { GetPopularFacts } from '../../application/use-cases/GetPopularFacts'
import { requireAuth } from '../../../../shared/infrastructure/middleware/auth'
import { requireProfile } from '../../../../shared/infrastructure/middleware/requireProfile'

const router = Router()
const factRepository = new PrismaFactRepository()
const createFact = new CreateFact(factRepository)
const getFactById = new GetFactById(factRepository)
const updateFact = new UpdateFact(factRepository)
const deleteFact = new DeleteFact(factRepository)
const getFacts = new GetFacts(factRepository)
const getFactsByAuthor = new GetFactsByAuthor(factRepository)
const getPopularFacts = new GetPopularFacts(factRepository)

// POST /facts — Create a fact (authenticated + profile required)
router.post('/', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body
    const authorId = req.user?.uid as string

    const fact = await createFact.execute({ title, content }, authorId)
    res.status(201).json(fact)
  } catch (err) {
    next(err)
  }
})

// GET /facts — Get all facts (public)
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const facts = await getFacts.execute()
    res.status(200).json(facts)
  } catch (err) {
    next(err)
  }
})

// GET /facts/author/:authorId — Get facts by author (public)
router.get('/author/:authorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorId = req.params.authorId as string
    const facts = await getFactsByAuthor.execute(authorId)
    res.status(200).json(facts)
  } catch (err) {
    next(err)
  }
})

// GET /facts/popular — Get all facts sorted by likes count (public)
router.get('/popular', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const facts = await getPopularFacts.execute()
    res.status(200).json(facts)
  } catch (err) {
    next(err)
  }
})

// GET /facts/:id — Get fact by ID (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const fact = await getFactById.execute(id)
    res.status(200).json(fact)
  } catch (err) {
    next(err)
  }
})

// PUT /facts/:id — Update a fact (authenticated + profile required, author only)
router.put('/:id', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const { title, content } = req.body
    const authorId = req.user?.uid as string

    const fact = await updateFact.execute(id, { title, content }, authorId)
    res.status(200).json(fact)
  } catch (err) {
    next(err)
  }
})

// DELETE /facts/:id — Delete a fact (authenticated + profile required, author only)
router.delete('/:id', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const authorId = req.user?.uid as string

    await deleteFact.execute(id, authorId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
