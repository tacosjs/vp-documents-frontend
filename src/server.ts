import type { Register } from '@tanstack/react-router'
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import type { RequestHandler } from '@tanstack/react-start/server'

import { paraglideMiddleware } from './paraglide/server.js'

const startHandler = createStartHandler(defaultStreamHandler)

// Providing `RequestHandler` from `@tanstack/react-start/server` is required so that the output types don't import it from `@tanstack/start-server-core`
export type ServerEntry = { fetch: RequestHandler<Register> }

export function createServerEntry(entry: ServerEntry): ServerEntry {
  return {
    async fetch(...args) {
      return await entry.fetch(...args)
    },
  }
}

export default createServerEntry({
  async fetch(...args) {
    const [request] = args
    // Request-scoped Paraglide locale for server handlers / server functions.
    return paraglideMiddleware(request, () => startHandler(...args))
  },
})
