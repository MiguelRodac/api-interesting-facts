import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry } from './registry'

// Side-effect: populates the registry with all schemas and paths
import './routes'

/**
 * Global X-App-Version header enforced by the versionCheck middleware on every route.
 * Injected into every operation so Scalar shows it per-endpoint.
 */
function injectVersionHeader (spec: ReturnType<OpenApiGeneratorV3['generateDocument']>): void {
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']

  for (const pathItem of Object.values(spec.paths)) {
    for (const method of methods) {
      const op: Record<string, unknown> | undefined = (pathItem as Record<string, unknown>)[method] as Record<string, unknown> | undefined
      if (op == null) continue

      const versionParam = {
        name: 'X-App-Version',
        in: 'header',
        required: true,
        description: 'Client app version (semver). Requests without it are rejected with 400; outdated versions get 426.',
        example: '1.2.0',
        schema: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' }
      }

      const existing = Array.isArray(op.parameters) ? op.parameters : []
      op.parameters = [versionParam, ...existing]
    }
  }
}

export function generateSpec (): ReturnType<OpenApiGeneratorV3['generateDocument']> {
  const generator = new OpenApiGeneratorV3(registry.definitions)
  const spec = generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Social Facts API',
      description: [
        'API for social facts with Firebase Auth, PostgreSQL + Prisma.',
        '',
        '## Versioning',
        '',
        'Clients must send their app version in the `X-App-Version` header (semver, e.g. `1.2.0`) on every request.',
        '',
        '| Status | error_code | Meaning |',
        '|---|---|---|',
        '| 400 | APP_VERSION_MISSING | Header missing while strict mode is enabled |',
        '| 426 | APP_VERSION_OUTDATED | Client version no longer supported — update required |',
        '',
        'Error bodies intentionally omit the minimum supported version.'
      ].join('\n'),
      version: '0.0.1',
      contact: { name: 'API Support' }
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local development' }
    ]
  })

  injectVersionHeader(spec)
  return spec
}
