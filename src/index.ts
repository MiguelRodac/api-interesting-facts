import express from 'express'
import interestingFacts from './routes/interestingFacts.route'
import { validateToken } from './middleware/authToken.middleware';

// Create Express App
const app = express()

// Middleware para validar el token
app.use(validateToken);
// Middlewares básicos
app.use(express.json());

// Constants
const PORT = process.env.PORT || 3001;

// Routes Root
app.get('/ping', (_, res) => {
  console.log(
    'Someone is requesting the ping ' +
      new Date().toLocaleDateString() +
      ' ' +
      new Date().toLocaleTimeString().replace(/:\d{2}\.\d{3}Z$/, '')
  )
  res.status(200).send(
    '<h1 style="background-color: #000; color: blue; font-size: 50px; text-align: center; display: flex; justify-content: center; align-items: center; font-family: Arial, Helvetica, sans-serif; margin: auto; padding: 0rem; width: 100%; height: 100%;">PONG</h1>'
  )
})

// Routes Interesting Facts
app.use('/api/interesting-facts', interestingFacts)

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString().replace(/:\d{2}\.\d{3}Z$/, '')}`)
})
