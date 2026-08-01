#!/usr/bin/env node
/**
 * Verify dist/ HTML shells only reference asset files that exist on disk.
 * Run after `npm run build` and before rsync deploy.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, process.env.VITE_OUT_DIR || 'dist')

const ASSET_RE = /\/assets\/[A-Za-z0-9._-]+\.(?:js|mjs|css|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|ico|map)/g

function collectAssetRefs(htmlPath) {
  if (!fs.existsSync(htmlPath)) return []
  const html = fs.readFileSync(htmlPath, 'utf8')
  return [...new Set(html.match(ASSET_RE) || [])]
}

function collectJsImports() {
  const assetsDir = path.join(distDir, 'assets')
  if (!fs.existsSync(assetsDir)) return []

  const refs = new Set()
  for (const file of fs.readdirSync(assetsDir)) {
    if (!/\.(?:js|mjs)$/i.test(file)) continue
    const content = fs.readFileSync(path.join(assetsDir, file), 'utf8')
    const matches = content.match(/\/assets\/[A-Za-z0-9._-]+\.(?:js|mjs|css)/g) || []
    for (const m of matches) refs.add(m)
  }
  return [...refs]
}

if (!fs.existsSync(distDir)) {
  console.error(`dist not found: ${distDir}`)
  process.exit(1)
}

const shells = ['index.html', 'landing.html']
  .map((name) => path.join(distDir, name))
  .filter((p) => fs.existsSync(p))

const refs = new Set([
  ...shells.flatMap(collectAssetRefs),
  ...collectJsImports(),
])

const missing = []
for (const ref of refs) {
  const rel = ref.replace(/^\//, '')
  const filePath = path.join(distDir, rel)
  if (!fs.existsSync(filePath)) missing.push(ref)
}

console.log(`Dist: ${distDir}`)
console.log(`Asset references checked: ${refs.size}`)

if (missing.length) {
  console.error('\nMissing asset files (build is incomplete — do not deploy):')
  for (const m of missing.sort()) console.error(`  ${m}`)
  process.exit(1)
}

console.log('OK — all referenced assets exist.')
