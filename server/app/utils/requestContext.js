const { AsyncLocalStorage } = require('async_hooks')

const requestContextStore = new AsyncLocalStorage()

function runWithRequestContext(context, callback) {
  return requestContextStore.run(context, callback)
}

function getRequestContext() {
  return requestContextStore.getStore() || null
}

module.exports = {
  runWithRequestContext,
  getRequestContext
}
