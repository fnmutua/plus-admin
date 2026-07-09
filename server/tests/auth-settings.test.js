'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const {
  AUTH_JWT_EXPIRES_MODULE,
  AUTH_GUEST_EXPIRES_MODULE,
  ENV_JWT_EXPIRES_SECONDS,
  DEFAULT_GUEST_EXPIRES_SECONDS,
  getJwtExpiresInSeconds,
  getGuestExpiresInSeconds
} = require('../app/utils/authSettings')

describe('authSettings', () => {
  it('exports expected module keys', () => {
    assert.equal(AUTH_JWT_EXPIRES_MODULE, 'auth_jwt_expires_seconds')
    assert.equal(AUTH_GUEST_EXPIRES_MODULE, 'auth_guest_expires_seconds')
  })

  it('getJwtExpiresInSeconds falls back to env default when no DB setting exists', async () => {
    const seconds = await getJwtExpiresInSeconds()
    assert.equal(seconds, ENV_JWT_EXPIRES_SECONDS)
    assert.ok(seconds > 0)
  })

  it('getGuestExpiresInSeconds falls back to default when no DB setting exists', async () => {
    const seconds = await getGuestExpiresInSeconds()
    assert.equal(seconds, DEFAULT_GUEST_EXPIRES_SECONDS)
    assert.equal(seconds, 7200)
  })
})
