const { createConditionalRateLimit } = require('../middleware/conditionalRateLimit')

const RATE_LIMIT_MODULES = {
  LOGIN: 'rate_limit_login',
  OTP: 'rate_limit_otp',
}

const loginLimiter = createConditionalRateLimit(
  {
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  },
  RATE_LIMIT_MODULES.LOGIN
)

const otpLimiter = createConditionalRateLimit(
  {
    windowMs: 10 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many OTP attempts. Please request a new code.' },
  },
  RATE_LIMIT_MODULES.OTP
)

function registerRateLimiters(app) {
  app.use('/api/auth/signin', loginLimiter)
  app.use('/api/auth/guest', loginLimiter)
  app.use('/api/app/signin', loginLimiter)
  app.use('/api/app/verify', otpLimiter)
}

module.exports = {
  registerRateLimiters,
  RATE_LIMIT_MODULES,
}
