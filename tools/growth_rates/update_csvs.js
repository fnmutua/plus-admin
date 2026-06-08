'use strict'

const fs = require('fs')
const path = require('path')

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

function updateCsvFile(filePath, countiesById) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n').trimEnd()
  const lines = text.split('\n')
  const header = parseCsvLine(lines[0])

  if (!header.includes('county_id')) {
    throw new Error(`${filePath}: missing county_id column`)
  }

  const restCols = header.filter((h) => !['county_id', 'county', 'code'].includes(h))
  const newHeader = ['county_id', 'code', 'county', ...restCols]
  const newLines = [newHeader.map(csvEscape).join(',')]

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i])
    const valuesByCol = Object.fromEntries(header.map((h, idx) => [h, row[idx] ?? '']))
    const countyId = Number(valuesByCol.county_id)
    const county = countiesById.get(countyId)

    if (!county) {
      throw new Error(`${path.basename(filePath)} row ${i + 1}: unknown county_id ${countyId}`)
    }

    const newRow = [
      county.id,
      county.code,
      county.name,
      ...restCols.map((col) => valuesByCol[col] ?? ''),
    ]
    newLines.push(newRow.map(csvEscape).join(','))
  }

  fs.writeFileSync(filePath, `${newLines.join('\n')}\n`, 'utf8')
  console.log(`Updated ${path.basename(filePath)} (${lines.length - 1} rows)`)
}

async function main() {
  const counties = await fetch('http://127.0.0.1/api/auth/county').then((r) => r.json())
  const countiesById = new Map(counties.map((c) => [Number(c.id), c]))

  const files = [
    'kenya_county_annual_growth_rates_wide_2019_2040.csv',
    'kenya_county_household_annual_growth_rates_wide_2019_2040_modelled.csv',
  ]

  for (const file of files) {
    updateCsvFile(path.join(__dirname, file), countiesById)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
