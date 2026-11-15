// Cleans the raw DPWH records into a tidy CSV.
//
//   node scripts/clean-dpwh.mjs
//
// Input : data/dpwh/raw_dpwh_alangilan.csv   (values exactly as shown on the DPWH portal)
// Output: data/dpwh/clean_dpwh_alangilan.csv (one tidy row per contract)
//
// These records are kept for reference only. The Public progress page no longer
// shows them: it now shows cases that officers publish (src/lib/cases.ts).
//
// Cleaning rules
//  - contract            -> contract_id + description (split at the first " - ")
//  - text                -> trimmed, repeated spaces collapsed
//  - category            -> "Buildings" normalised to "Buildings and Facilities"
//  - contract_cost       -> plain number in pesos; "N/A" becomes empty
//  - accomplishment      -> number (percent); kept even when 0
//  - dates               -> ISO yyyy-mm-dd; "TBA" becomes empty
//  - barangay            -> taken from the description (known nearby barangays only)
//  - status              -> finished | in_progress | not_started, from the portal's own
//                           status. The portal's wording is kept in portal_status.
//  - short_title         -> a short readable name (hand-written, see SHORT_TITLES)
import { readFileSync, writeFileSync } from 'node:fs'

const RAW = 'data/dpwh/raw_dpwh_alangilan.csv'
const OUT = 'data/dpwh/clean_dpwh_alangilan.csv'
const RETRIEVED_ON = '2026-11-15'

// The portal's status -> the three labels shown on the page.
const STATUS_MAP = {
  Completed: 'finished',
  'On-Going': 'in_progress',
  'Not Yet Started': 'not_started',
  // Still being bid out: no work has started.
  'For Procurement': 'not_started',
}

const BARANGAYS = ['Alangilan', 'Balagtas', 'Kumintang Ilaya', 'Kumintang Ibaba', 'Bolbok']

const SHORT_TITLES = {
  '23DE0041': 'Drainage construction, Barangay Alangilan',
  '19DE0028': 'Road concreting and rehabilitation, Barangay Alangilan',
  '19DE0150': 'Covered court, Alangilan Elementary School',
  '25DE0190': 'School building, Alangilan Senior High School',
  '24D00075': 'Balagtas Flyover',
  '23D00145': 'Multi-purpose building, Camp General Miguel Malvar',
  '24D00035': 'Multi-purpose building, Camp General Miguel Malvar (Phase II)',
  '24DE0251': 'Perimeter fence, DPWH Balagtas Annex Compound',
  '24DE0223': 'Bolbok Annex Building (Phase 2)',
  '25DE0192': 'Multi-purpose building, DPWH Annex Compound, Bolbok (Phase 3)',
}

/** Minimal CSV parser: handles quoted fields, doubled quotes and commas inside quotes. */
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((v) => v !== '')) rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((v) => v !== '')) rows.push(row) }
  const [header, ...body] = rows
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

const tidy = (s) => s.replace(/\s+/g, ' ').trim()
const csvCell = (v) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toIsoDate(value) {
  const v = tidy(value)
  if (!v || /^(tba|n\/a|—|-)$/i.test(v)) return ''
  const d = new Date(`${v} UTC`)
  if (Number.isNaN(d.getTime())) throw new Error(`Unreadable date: "${value}"`)
  return d.toISOString().slice(0, 10)
}

function toNumber(value) {
  const v = tidy(value)
  if (!v || /^(n\/a|tba|—|-)$/i.test(v)) return ''
  const n = Number(v.replace(/[₱,%\s]/g, ''))
  if (!Number.isFinite(n)) throw new Error(`Unreadable number: "${value}"`)
  return n
}

function clean(raw) {
  const contract = tidy(raw.contract)
  const split = contract.indexOf(' - ')
  if (split < 0) throw new Error(`No contract id in: "${contract}"`)
  const id = contract.slice(0, split)
  const description = contract.slice(split + 3)
  const portalStatus = tidy(raw.status)
  const status = STATUS_MAP[portalStatus]
  if (!status) throw new Error(`Status "${portalStatus}" of ${id} has no mapping. Add it to STATUS_MAP on purpose.`)
  const upper = description.toUpperCase()
  const barangay = BARANGAYS.find((b) => upper.includes(b.toUpperCase())) ?? ''
  if (!SHORT_TITLES[id]) throw new Error(`No short title for ${id}`)
  const category = tidy(raw.category) === 'Buildings' ? 'Buildings and Facilities' : tidy(raw.category)
  return {
    contract_id: id,
    short_title: SHORT_TITLES[id],
    description,
    category,
    barangay,
    city: 'Batangas City',
    implementing_office: tidy(raw.implementing_office),
    contract_cost_php: toNumber(raw.contract_cost),
    accomplishment_pct: toNumber(raw.accomplishment),
    start_date: toIsoDate(raw.actual_start_date),
    target_completion_date: toIsoDate(raw.contract_expiry_date),
    actual_completion_date: toIsoDate(raw.actual_completion_date),
    status,
    portal_status: portalStatus,
    source_url: tidy(raw.source_url),
    retrieved_on: RETRIEVED_ON,
  }
}

const rows = parseCsv(readFileSync(RAW, 'utf8')).map(clean)
const ids = new Set(rows.map((r) => r.contract_id))
if (ids.size !== rows.length) throw new Error('Duplicate contract ids in the raw file.')

const header = Object.keys(rows[0])
const order = { finished: 0, in_progress: 1, not_started: 2 }
rows.sort((a, b) => order[a.status] - order[b.status] || a.contract_id.localeCompare(b.contract_id))
writeFileSync(OUT, [header.join(','), ...rows.map((r) => header.map((h) => csvCell(r[h])).join(','))].join('\n') + '\n')

const count = (s) => rows.filter((r) => r.status === s).length
console.log(`Wrote ${rows.length} records to ${OUT}: ${count('finished')} finished, ${count('in_progress')} in progress, ${count('not_started')} not started.`)
