/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'

import { membersMissingOrganizationKeyWrap } from './useAutoDistributeOrganizationKeyWraps'

describe('membersMissingOrganizationKeyWrap', () => {
  it('is false when no member has both a public key and a missing wrap', () => {
    expect(
      membersMissingOrganizationKeyWrap([
        { hasOrganizationKeyWrap: false, publicKey: '' },
        { hasOrganizationKeyWrap: true, publicKey: '-----BEGIN' },
      ]),
    ).toBe(false)
  })

  it('is true when a member has a non-empty public key and no wrap yet', () => {
    expect(
      membersMissingOrganizationKeyWrap([
        {
          accessValidated: true,
          hasOrganizationKeyWrap: false,
          publicKey: '-----BEGIN PGP',
        },
      ]),
    ).toBe(true)
  })

  it('ignores whitespace-only public keys', () => {
    expect(
      membersMissingOrganizationKeyWrap([
        {
          accessValidated: true,
          hasOrganizationKeyWrap: false,
          publicKey: '   \n',
        },
      ]),
    ).toBe(false)
  })

  it('ignores members who are not access-validated yet', () => {
    expect(
      membersMissingOrganizationKeyWrap([
        {
          accessValidated: false,
          hasOrganizationKeyWrap: false,
          publicKey: '-----BEGIN',
        },
      ]),
    ).toBe(false)
  })
})
