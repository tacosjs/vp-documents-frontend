export const authKeys = {
  me: ['auth', 'me'] as const,
}

export const documentsKeys = {
  all: ['documents'] as const,
  list: ['documents', 'list'] as const,
  detail: (id: string) => ['documents', 'detail', id] as const,
  versions: (id: string) => ['documents', 'versions', id] as const,
}

export const userKeysKeys = {
  all: ['userKeys'] as const,
  history: ['userKeys', 'history'] as const,
  rotate: ['userKeys', 'rotate'] as const,
  securityActivity: ['userKeys', 'securityActivity'] as const,
}

export const decryptionKeys = {
  document: (documentId: string, unlockId: string) =>
    ['decryptedDocument', documentId, unlockId] as const,
}

export const tenantKeys = {
  organizationKeyGenerate: ['tenants', 'organizationKey', 'generate'] as const,
  organizationKeySync: ['tenants', 'organizationKey', 'sync'] as const,
  invitationPreview: (token: string) =>
    ['tenants', 'invitationPreview', token] as const,
  members: (tenantId: string) => ['tenants', 'members', tenantId] as const,
}
