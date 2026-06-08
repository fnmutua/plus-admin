'use strict'

const fs = require('fs')
const path = require('path')

function normalizeCountyName(name) {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

function csvEscape(v) {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

async function main() {
  const counties = await fetch('http://127.0.0.1/api/auth/county').then((r) => r.json())
  const byName = new Map(counties.map((c) => [normalizeCountyName(c.name), c]))
  const COUNTY_NAME_ALIASES = {
    'nairobi city': 'nairobi',
  }

  function resolveCounty(csvName) {
    const norm = normalizeCountyName(csvName)
    const alias = COUNTY_NAME_ALIASES[norm]
    if (alias) return byName.get(alias)
    return byName.get(norm)
  }
  const dir = __dirname
  const files = [
    'kenya_county_annual_growth_rates_wide_2019_2040.csv',
    'kenya_county_household_annual_growth_rates_wide_2019_2040_modelled.csv',
  ]

  for (const file of files) {
    const fp = path.join(dir, file)
    const text = fs.readFileSync(fp, 'utf8').replace(/\r\n/g, '\n').trimEnd()
    const lines = text.split('\n')
    const header = parseCsvLine(lines[0])
    const countyIdx = header.findIndex((h) => normalizeCountyName(h) === 'county')
    if (countyIdx < 0) throw new Error(`No county column in ${file}`)
    if (header[0] === 'county_id') {
      console.log(`${file} already has county_id`)
      continue
    }

    const newHeader = ['county_id', ...header]
    const newLines = [newHeader.map(csvEscape).join(',')]
    const unmatched = []

    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i])
      const countyName = row[countyIdx]
      const match = resolveCounty(countyName)
      if (!match) unmatched.push(countyName)
      const newRow = [match ? match.id : '', ...row]
      newLines.push(newRow.map(csvEscape).join(','))
    }

    if (unmatched.length) {
      console.error(`Unmatched in ${file}:`, unmatched)
      process.exit(1)
    }

    fs.writeFileSync(fp, `${newLines.join('\n')}\n`, 'utf8')
    console.log(`Updated ${file} (${lines.length - 1} rows)`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
