'use strict'

// Encryption for settings that hold a credential.
//
// Provider API keys may be set from the AI Settings page, which means they
// land in `module_settings` alongside ordinary settings. A key sitting in a
// database column in clear text is readable by anyone with a backup, a psql
// session or a SQL-injection bug somewhere else in the application, so every
// stored credential is encrypted with AES-256-GCM first.
//
// The encryption key comes from the environment and is never stored. Rotating
// or losing it does not corrupt anything: a value that cannot be decrypted is
// ignored with a warning and the environment variable is used instead.

const crypto = require('crypto')

const PREFIX = 'enc.v1'
// A fixed salt is acceptable here: the input is a single long-lived secret, not
// a user password, and the salt only separates this key from other uses of the
// same environment variable.
const SALT = 'plus-admin.ai.credentials.v1'

let cached = null

/** 32-byte key derived from the environment, or null when none is configured. */
function key() {
  if (cached !== null) return cached

  const source = process.env.SETTINGS_ENCRYPTION_KEY || process.env.JWT_SECRET || ''
  cached = source ? crypto.scryptSync(source, SALT, 32) : false
  return cached
}

/** Whether this deployment can store credentials at all. */
const available = () => Boolean(key())

/** True for a value produced by encrypt(), so plain text is never decrypted blindly. */
const isEncrypted = (value) => typeof value === 'string' && value.startsWith(`${PREFIX}:`)

function encrypt(plain) {
  const secret = key()
  if (!secret) throw new Error('No encryption key: set SETTINGS_ENCRYPTION_KEY')

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', secret, iv)
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])

  return [PREFIX, iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':')
}

/** Decrypt a stored value. Throws if the key has changed or the text was altered. */
function decrypt(payload) {
  const secret = key()
  if (!secret) throw new Error('No encryption key: set SETTINGS_ENCRYPTION_KEY')

  const [, iv, tag, data] = String(payload).split(':')
  if (!iv || !tag || !data) throw new Error('Stored value is not in the expected format')

  const decipher = crypto.createDecipheriv('aes-256-gcm', secret, Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8')
}

/**
 * A hint that identifies a key without revealing it: first four and last four
 * characters, which is enough to tell two keys apart in the UI.
 */
function mask(value) {
  const text = String(value || '')
  if (!text) return null
  if (text.length <= 12) return `${text.slice(0, 2)}…${text.slice(-2)}`
  return `${text.slice(0, 4)}…${text.slice(-4)}`
}

module.exports = { available, isEncrypted, encrypt, decrypt, mask }
