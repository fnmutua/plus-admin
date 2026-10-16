'use strict'

// Progress for work that outlives the request that started it.
//
// Re-indexing answers "indexing 1,661 document(s) in the background" and then
// says nothing for an hour — there was no way to tell a running job from a
// stalled one except by watching the row count. Each batch now registers
// here, reports every document as it finishes, and the page polls it.
//
// Live state is in memory, because only this process knows which file is in
// hand; it is written through to index_jobs every ten documents and at each
// end, so progress survives leaving the page and a restart leaves a record
// rather than a batch that appears to run for ever.

const { randomUUID } = require('crypto')
const store = require('./store')

/** Finished jobs stay visible this long, so a page that polls still sees the result. */
const KEEP_FINISHED_MS = 30 * 60 * 1000

/** The last few filenames, enough to show what it is working through. */
const RECENT = 5

/** How often progress is written through to the database, in documents. */
const PERSIST_EVERY = 10

const jobs = new Map()

function prune() {
  const cutoff = Date.now() - KEEP_FINISHED_MS
  for (const [id, job] of jobs) {
    if (job.finishedAt && job.finishedAt < cutoff) jobs.delete(id)
  }
}

/**
 * Register a batch about to start.
 *
 * @param {{label: string, total: number, source?: string}} options
 * @returns {{advance: Function, finish: Function, id: string}}
 */
function start({ label, total, source = 'reindex' }) {
  prune()

  const job = {
    id: randomUUID(),
    label,
    source,
    total,
    done: 0,
    indexed: 0,
    failed: 0,
    current: null,
    recent: [],
    startedAt: Date.now(),
    finishedAt: null,
    status: 'running',
    lastError: null
  }
  jobs.set(job.id, job)
  store.saveJob(job)

  return {
    id: job.id,

    /** Name the document being worked on, before the slow part. */
    begin(filename) {
      job.current = filename || null
    },

    /** Record one finished document. */
    advance({ filename, ok, message }) {
      job.done += 1
      if (ok) job.indexed += 1
      else {
        job.failed += 1
        job.lastError = message || job.lastError
      }
      job.current = null
      job.recent.unshift({ filename, ok, message: ok ? null : message || null })
      job.recent = job.recent.slice(0, RECENT)

      // Written through every so often rather than per document: one batch
      // would otherwise be thousands of writes, and a page that comes back
      // ten documents late is close enough.
      if (job.done % PERSIST_EVERY === 0) store.saveJob(job)
    },

    finish(status = 'done') {
      job.status = status
      job.current = null
      job.finishedAt = Date.now()
      store.saveJob(job)
    }
  }
}

/** A job as the UI reads it, with the arithmetic already done. */
function shape(job) {
  const elapsedMs = (job.finishedAt || Date.now()) - job.startedAt
  const perDoc = job.done ? elapsedMs / job.done : 0
  const remaining = Math.max(0, job.total - job.done)

  return {
    id: job.id,
    label: job.label,
    source: job.source,
    status: job.status,
    total: job.total,
    done: job.done,
    indexed: job.indexed,
    failed: job.failed,
    current: job.current,
    recent: job.recent,
    percent: job.total ? Math.round((job.done / job.total) * 100) : 0,
    elapsedMs,
    // Only once there is enough history for the estimate to mean anything.
    etaMs: job.status === 'running' && job.done >= 3 ? Math.round(perDoc * remaining) : null,
    startedAt: new Date(job.startedAt).toISOString(),
    finishedAt: job.finishedAt ? new Date(job.finishedAt).toISOString() : null,
    lastError: job.lastError
  }
}

/** Shape a row the database kept, which has no live detail to report. */
function shapeStored(row) {
  const started = new Date(row.startedAt).getTime()
  const finished = row.finishedAt ? new Date(row.finishedAt).getTime() : Date.now()

  return {
    id: row.id,
    label: row.label,
    source: row.source,
    status: row.status,
    total: row.total,
    done: row.done,
    indexed: row.indexed,
    failed: row.failed,
    current: row.current,
    recent: [],
    percent: row.total ? Math.round((row.done / row.total) * 100) : 0,
    elapsedMs: finished - started,
    etaMs: null,
    startedAt: new Date(started).toISOString(),
    finishedAt: row.finishedAt ? new Date(row.finishedAt).toISOString() : null,
    lastError: row.lastError
  }
}

/**
 * Running batches first, then recent history.
 *
 * History comes from the database, so a batch survives leaving the page, and
 * a restart that killed one mid-way shows as interrupted instead of as
 * running for ever. The live copy wins where both have the same job, because
 * only it knows the file in hand.
 */
async function list() {
  prune()

  const live = [...jobs.values()].map(shape)
  const stored = await store.listJobs(20).catch(() => [])
  const seen = new Set(live.map((job) => job.id))
  const history = stored.filter((row) => !seen.has(row.id)).map(shapeStored)

  return [...live, ...history].sort((a, b) => {
    if ((a.status === 'running') !== (b.status === 'running')) return a.status === 'running' ? -1 : 1
    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  })
}

const get = (id) => {
  const job = jobs.get(id)
  return job ? shape(job) : null
}

const active = () => [...jobs.values()].some((job) => job.status === 'running')

module.exports = { start, list, get, active }
