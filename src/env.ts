import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'VITE_',

  emptyStringAsUndefined: true,

  runtimeEnv: import.meta.env,

  client: {
    VITE_API_BASE_URL: z.string().url(),
    VITE_MOCK_AUTH: z.preprocess(
      (val) => val === 'true' || val === true,
      z.boolean(),
    ),
    VITE_MOCK_DOCUMENTS: z.preprocess(
      (val) => val === 'true' || val === true,
      z.boolean(),
    ),
    VITE_MOCK_USER_KEYS: z.preprocess(
      (val) => val === 'true' || val === true,
      z.boolean(),
    ),
  },

  server: {
    SERVER_URL: z.string().url().optional(),
  },
})
