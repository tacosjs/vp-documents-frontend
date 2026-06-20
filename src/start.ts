import { createStart } from '@tanstack/react-start'

/** CSR route matches; avoids SSR/Paraglide hydration mismatches for UI. */
export const startInstance = createStart(() => ({
  defaultSsr: false,
}))
