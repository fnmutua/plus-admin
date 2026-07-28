/**
 * Invoke an Express controller handler and return the JSON body from res.send().
 * @param {Function} handler
 * @param {object} body - req.body
 * @param {{ query?: object }} opts - optional req.query (for GET-style controllers)
 */
function invokeController(handler, body = {}, opts = {}) {
  return new Promise((resolve, reject) => {
    let settled = false
    const mockReq = { body, query: opts.query || {} }
    const mockRes = {
      statusCode: 200,
      status(code) {
        this.statusCode = code
        return this
      },
      send(payload) {
        if (settled) return
        settled = true
        const code = mockRes.statusCode || 200
        if (code >= 400) {
          reject(new Error((payload && payload.message) || `Request failed (${code})`))
        } else {
          resolve(payload)
        }
      },
    }

    try {
      const result = handler(mockReq, mockRes)
      if (result && typeof result.then === 'function') {
        result.catch((err) => {
          if (!settled) {
            settled = true
            reject(err)
          }
        })
      }
    } catch (err) {
      if (!settled) {
        settled = true
        reject(err)
      }
    }

    setTimeout(() => {
      if (!settled) {
        settled = true
        reject(new Error('Controller timed out'))
      }
    }, 180000)
  })
}

module.exports = { invokeController }
