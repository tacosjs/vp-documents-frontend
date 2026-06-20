/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/crypto', () => ({
  generateTenantSymmetricKey: vi.fn(() => new Uint8Array(32).fill(9)),
  unwrapTenantSymmetricKeyFromPgp: vi.fn(),
  wrapTenantSymmetricKeyForPublicKey: vi.fn(() =>
    Promise.resolve('armored-wrap'),
  ),
}))

vi.mock('@/services/tenants', () => ({
  listMembers: vi.fn(),
}))

vi.mock('./tenantKey.query', () => ({
  fetchTenantKeyWrapping: vi.fn(),
  postTenantKeyWrapping: vi.fn(),
}))

describe('distributeWorkspaceKeyToMembers', () => {
  it('skips members without a public key and posts one wrapping per member with a key', async () => {
    const { postTenantKeyWrapping } = await import('./tenantKey.query')
    const { distributeWorkspaceKeyToMembers } = await import('./tenantKey.hook')

    const tsk = new Uint8Array(32).fill(2)
    await distributeWorkspaceKeyToMembers('tid', tsk, [
      {
        userId: 'u0',
        accessValidated: true,
        email: 'no@key.co',
        hasOrganizationKeyWrap: false,
        publicKey: '',
        role: 'editor',
      },
      {
        userId: 'u1',
        accessValidated: true,
        email: 'yes@key.co',
        hasOrganizationKeyWrap: false,
        role: 'editor',
        publicKey:
          '-----BEGIN PGP PUBLIC KEY BLOCK-----\nx\n-----END PGP PUBLIC KEY BLOCK-----',
      },
    ])

    expect(postTenantKeyWrapping).toHaveBeenCalledTimes(1)
    expect(postTenantKeyWrapping).toHaveBeenCalledWith('tid', {
      userId: 'u1',
      wrappedTenantKey: 'armored-wrap',
    })
  })
})

describe('tryBootstrapWorkspaceKeyForTenant', () => {
  beforeEach(async () => {
    const { listMembers } = await import('@/services/tenants')
    const { postTenantKeyWrapping } = await import('./tenantKey.query')
    vi.mocked(listMembers).mockReset()
    vi.mocked(postTenantKeyWrapping).mockReset()
  })

  it('does not POST wrappings when no member has a public key', async () => {
    const { listMembers } = await import('@/services/tenants')
    const { postTenantKeyWrapping } = await import('./tenantKey.query')
    const { tryBootstrapWorkspaceKeyForTenant } =
      await import('./tenantKey.hook')

    vi.mocked(listMembers).mockResolvedValue([
      {
        userId: 'u1',
        accessValidated: true,
        email: 'a@b.co',
        hasOrganizationKeyWrap: false,
        publicKey: '',
        role: 'admin',
      },
    ])

    await tryBootstrapWorkspaceKeyForTenant('tid')

    expect(postTenantKeyWrapping).not.toHaveBeenCalled()
  })

  it('posts one wrapping per member with a non-empty public key', async () => {
    const { listMembers } = await import('@/services/tenants')
    const { postTenantKeyWrapping } = await import('./tenantKey.query')
    const { tryBootstrapWorkspaceKeyForTenant } =
      await import('./tenantKey.hook')

    vi.mocked(listMembers).mockResolvedValue([
      {
        userId: 'u1',
        accessValidated: true,
        email: 'a@b.co',
        hasOrganizationKeyWrap: false,
        role: 'admin',
        publicKey:
          '-----BEGIN PGP PUBLIC KEY BLOCK-----\nx\n-----END PGP PUBLIC KEY BLOCK-----',
      },
    ])

    await tryBootstrapWorkspaceKeyForTenant('tid')

    expect(postTenantKeyWrapping).toHaveBeenCalledTimes(1)
    expect(postTenantKeyWrapping).toHaveBeenCalledWith('tid', {
      userId: 'u1',
      wrappedTenantKey: 'armored-wrap',
    })
  })
})
