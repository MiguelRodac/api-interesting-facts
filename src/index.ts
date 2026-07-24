import app from './app'
import config from './shared/config'

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`)
})
