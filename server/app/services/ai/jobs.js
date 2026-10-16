'use strict'

// Progress for work that outlives the request that started it.
//
// Re-indexing answers "indexing 1,661 document(s) in the background" and then
// says nothing for an hour — there was no way to tell a running job from a
// stalled one except by watching the row count. Each batch now registers
// here, reports every document as it finishes, and the page polls it.
//
// In memory on purpose: PM2 runs one process per app, the state is worth
// nothing once that process restarts, and a job table would have to be
// cleaned up by something.

const { randomUUID } = require('crypto')

/** Finished jobs stay visible this long, so a page that polls still sees the result. */
const KEEP_FINISHED_MS = 30 * 60 * 1000

/** The last few filenames, enough to show what it is working through. */
const RECENT = 5

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
    },

    finish(status = 'done') {
      job.status = status
      job.current = null
      job.finishedAt = Date.now()
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

/** Running jobs first, then the most recently finished. */
function list() {
  prune()
  return [...jobs.values()]
    .sort((a, b) => {
      if ((a.status === 'running') !== (b.status === 'running')) return a.status === 'running' ? -1 : 1
      return b.startedAt - a.startedAt
    })
    .map(shape)
}

const get = (id) => {
  const job = jobs.get(id)
  return job ? shape(job) : null
}

const active = () => [...jobs.values()].some((job) => job.status === 'running')

module.exports = { start, list, get, active }
