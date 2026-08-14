import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry } from './registry'

// Side-effect: populates the registry with all schemas and paths
import './routes'

export function generateSpec(): ReturnType<OpenApiGeneratorV3['generateDocument']> {
  const generator = new OpenApiGeneratorV3(registry.definitions)
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Social Facts API',
      description: 'API for social facts with Firebase Auth, PostgreSQL + Prisma',
      version: '0.0.1',
      contact: { name: 'API Support' }
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local development' }
    ]
  })
}
