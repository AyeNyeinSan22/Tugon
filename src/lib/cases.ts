import { isSupabaseConfigured, supabase } from './supabase'

/**
 * Public progress cases.
 *
 * A CASE is an issue an officer decided to act on because of citizen reports.
 * Many reports can point to one case. Officers create a case, move it through
 * stages, add updates with photos, and press Publish to show it publicly.
 *
 * Two modes:
 *  - LIVE: Supabase is configured and supabase/cases.sql has been run.
 *  - SAMPLE: otherwise. Fictional example cases are kept in memory so the whole
 *    flow can be shown. Changes made in sample mode are lost on reload.
 */

export const STAGES = ['reported', 'under_review', 'work_scheduled', 'work_in_progress', 'completed'] as const
export type CaseStage = (typeof STAGES)[number]

export const STAGE_LABEL: Record<CaseStage, string> = {
  reported: 'Reported',
  under_review: 'Under review',
  work_scheduled: 'Work scheduled',
  work_in_progress: 'Work in progress',
  completed: 'Completed',
}

export interface CaseUpdate {
  id: string
  stage: CaseStage
  note: string
  /** Address of the officer's photo, or null when the update has no photo. */
  photoUrl: string | null
  photoCaption: string
  createdAt: string
}

export interface PublicCase {
  id: string
  caseCode: string
  title: string
  area: string
  category: string
  summary: string
  stage: CaseStage
  isPublished: boolean
  reportCount: number
  createdAt: string
  updatedAt: string
  updates: CaseUpdate[]
  /** True for the built-in fictional examples. */
  isExample: boolean
}

export type CaseSource = 'live' | 'sample'

/* ------------------------------------------------------------------ */
/* Sample mode: fictional example cases                                 */
/* ------------------------------------------------------------------ */

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

const sampleCases: PublicCase[] = [
  {
    id: 'example-1',
    caseCode: 'CASE-0001',
    title: 'Deep potholes along the main road',
    area: 'Brgy. Alangilan, Batangas City',
    category: 'Damaged road',
    summary: 'Several residents reported deep potholes near the school gate. The office decided to patch and resurface this section.',
    stage: 'work_in_progress',
    isPublished: true,
    reportCount: 7,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(1),
    isExample: true,
    updates: [
      { id: 'e1-u1', stage: 'under_review', note: 'An officer visited the site and confirmed three potholes across one lane.', photoUrl: null, photoCaption: 'Before work: potholes near the school gate', createdAt: daysAgo(10) },
      { id: 'e1-u2', stage: 'work_scheduled', note: 'Patching scheduled. One lane will be closed during the work.', photoUrl: null, photoCaption: '', createdAt: daysAgo(6) },
      { id: 'e1-u3', stage: 'work_in_progress', note: 'Crew started cutting and cleaning the damaged sections.', photoUrl: null, photoCaption: 'Work in progress: damaged sections cut out', createdAt: daysAgo(1) },
    ],
  },
  {
    id: 'example-2',
    caseCode: 'CASE-0002',
    title: 'Clogged storm drain causing street flooding',
    area: 'Brgy. Sample, Batangas City',
    category: 'Blocked drainage',
    summary: 'Reports said water rises above the curb when it rains. The drain was cleared of silt and plastic.',
    stage: 'completed',
    isPublished: true,
    reportCount: 4,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(5),
    isExample: true,
    updates: [
      { id: 'e2-u1', stage: 'under_review', note: 'Drain inspected. Blocked with silt and plastic waste.', photoUrl: null, photoCaption: 'Before work: blocked drain inlet', createdAt: daysAgo(18) },
      { id: 'e2-u2', stage: 'work_in_progress', note: 'Declogging crew on site.', photoUrl: null, photoCaption: '', createdAt: daysAgo(8) },
      { id: 'e2-u3', stage: 'completed', note: 'Drain cleared and tested with water. Reporters may confirm whether flooding has stopped.', photoUrl: null, photoCaption: 'After work: drain inlet cleared', createdAt: daysAgo(5) },
    ],
  },
  {
    id: 'example-3',
    caseCode: 'CASE-0003',
    title: 'Open excavation with no safety barrier',
    area: 'Public Market Gate 2, Batangas City',
    category: 'Unsafe construction',
    summary: 'Residents reported an excavation left open beside the sidewalk. The office is checking who is responsible for the site.',
    stage: 'under_review',
    isPublished: true,
    reportCount: 3,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
    isExample: true,
    updates: [{ id: 'e3-u1', stage: 'under_review', note: 'Reports received and grouped. Site visit being arranged.', photoUrl: null, photoCaption: '', createdAt: daysAgo(2) }],
  },
]

/** Sample mode: which demo report belongs to which example case. */
const sampleReportLinks = new Map<string, string>([
  ['TUG-2026-0124', 'CASE-0001'],
  ['TUG-2026-0118', 'CASE-0002'],
  ['TUG-2026-0109', 'CASE-0003'],
])

const clone = (c: PublicCase): PublicCase => ({ ...c, updates: c.updates.map((u) => ({ ...u })) })

/* ------------------------------------------------------------------ */
/* Live mode helpers                                                    */
/* ------------------------------------------------------------------ */

interface CaseRow {
  id: string
  case_code: string
  title: string
  area: string
  category: string
  summary: string
  stage: CaseStage
  is_published: boolean
  created_at: string
  updated_at: string
  case_updates?: UpdateRow[]
}
interface UpdateRow {
  id: string
  stage: CaseStage
  note: string
  photo_path: string | null
  photo_caption: string
  created_at: string
}

const PHOTO_BUCKET = 'case-photos'
const CASE_COLUMNS = 'id, case_code, title, area, category, summary, stage, is_published, created_at, updated_at, case_updates (id, stage, note, photo_path, photo_caption, created_at)'

function photoUrl(path: string | null): string | null {
  if (!path || !supabase) return null
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
}

async function fromRow(row: CaseRow): Promise<PublicCase> {
  let reportCount = 0
  if (supabase) {
    const { data } = await supabase.rpc('case_report_count', { target: row.id })
    if (typeof data === 'number') reportCount = data
  }
  return {
    id: row.id,
    caseCode: row.case_code,
    title: row.title,
    area: row.area,
    category: row.category,
    summary: row.summary,
    stage: row.stage,
    isPublished: row.is_published,
    reportCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isExample: false,
    updates: (row.case_updates ?? [])
      .map((u) => ({ id: u.id, stage: u.stage, note: u.note, photoUrl: photoUrl(u.photo_path), photoCaption: u.photo_caption, createdAt: u.created_at }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }
}

/** True once we know the cases tables exist; false sends everything to sample mode. */
let liveAvailable: boolean | null = null
async function canUseLive(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (liveAvailable === null) {
    const { error } = await supabase.from('cases').select('id').limit(1)
    liveAvailable = !error
  }
  return liveAvailable
}

export async function getCaseSource(): Promise<CaseSource> {
  return (await canUseLive()) ? 'live' : 'sample'
}

/* ------------------------------------------------------------------ */
/* Reading                                                              */
/* ------------------------------------------------------------------ */

/** Cases shown on Public progress: published only. */
export async function listPublishedCases(): Promise<{ source: CaseSource; cases: PublicCase[] }> {
  if (await canUseLive()) {
    const { data, error } = await supabase!.from('cases').select(CASE_COLUMNS).eq('is_published', true).order('updated_at', { ascending: false }).limit(100)
    if (!error && data) return { source: 'live', cases: await Promise.all((data as CaseRow[]).map(fromRow)) }
  }
  return { source: 'sample', cases: sampleCases.filter((c) => c.isPublished).map(clone) }
}

/** One published case by its public code, or null. Unpublished cases are never returned here. */
export async function getPublishedCase(caseCode: string): Promise<PublicCase | null> {
  const code = caseCode.trim().toUpperCase()
  if (await canUseLive()) {
    const { data, error } = await supabase!.from('cases').select(CASE_COLUMNS).eq('case_code', code).eq('is_published', true).maybeSingle()
    if (!error) return data ? fromRow(data as CaseRow) : null
  }
  const found = sampleCases.find((c) => c.caseCode === code && c.isPublished)
  return found ? clone(found) : null
}

/**
 * The published case a report belongs to, for the "View public progress"
 * shortcut on Track my report. Returns null when the report has no case or
 * its case is not published.
 */
export async function getCaseForReport(trackingCode: string): Promise<Pick<PublicCase, 'caseCode' | 'title' | 'stage'> | null> {
  const code = trackingCode.trim().toUpperCase()
  if (await canUseLive()) {
    const { data, error } = await supabase!.from('reports').select('case_id').eq('tracking_code', code).maybeSingle()
    if (!error && data) {
      if (!data.case_id) return null
      // Row level security hides the case unless it is published.
      const { data: c } = await supabase!.from('cases').select('case_code, title, stage').eq('id', data.case_id).eq('is_published', true).maybeSingle()
      return c ? { caseCode: c.case_code, title: c.title, stage: c.stage as CaseStage } : null
    }
  }
  const linked = sampleReportLinks.get(code)
  const found = linked ? sampleCases.find((c) => c.caseCode === linked && c.isPublished) : undefined
  return found ? { caseCode: found.caseCode, title: found.title, stage: found.stage } : null
}

/* ------------------------------------------------------------------ */
/* Officer actions                                                      */
/* ------------------------------------------------------------------ */

/** All cases, published or not. Officers only (enforced by the database in live mode). */
export async function listAllCases(): Promise<{ source: CaseSource; cases: PublicCase[] }> {
  if (await canUseLive()) {
    const { data, error } = await supabase!.from('cases').select(CASE_COLUMNS).order('updated_at', { ascending: false }).limit(200)
    if (!error && data) return { source: 'live', cases: await Promise.all((data as CaseRow[]).map(fromRow)) }
  }
  return { source: 'sample', cases: sampleCases.map(clone) }
}

const newCode = () => `CASE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
const touch = () => new Date().toISOString()

export interface NewCaseInput {
  title: string
  area: string
  category: string
  summary: string
}

/** Creates a case as a draft (not published). */
export async function createCase(input: NewCaseInput): Promise<void> {
  const title = input.title.trim()
  if (title.length < 4) throw new Error('Give the case a short title.')
  const base = { title, area: input.area.trim(), category: input.category.trim(), summary: input.summary.trim() }
  if (await canUseLive()) {
    const { error } = await supabase!.from('cases').insert({ ...base, case_code: newCode() })
    if (error) throw new Error('The case could not be saved.')
    return
  }
  sampleCases.unshift({ id: `sample-${Date.now()}`, caseCode: newCode(), ...base, stage: 'reported', isPublished: false, reportCount: 0, createdAt: touch(), updatedAt: touch(), updates: [], isExample: false })
}

export async function setCasePublished(caseId: string, published: boolean): Promise<void> {
  if (await canUseLive()) {
    const { error } = await supabase!.from('cases').update({ is_published: published, published_at: published ? touch() : null, updated_at: touch() }).eq('id', caseId)
    if (error) throw new Error('The publish setting could not be saved.')
    return
  }
  const c = sampleCases.find((x) => x.id === caseId)
  if (c) {
    c.isPublished = published
    c.updatedAt = touch()
  }
}

const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Re-draws the photo onto a canvas and saves it as a JPEG no wider than
 * 1600px. This shrinks it for phones and removes hidden camera data such as
 * GPS location. It cannot hide faces or plate numbers: the officer must check
 * the picture before uploading.
 */
async function preparePhoto(file: File): Promise<Blob> {
  if (!PHOTO_TYPES.includes(file.type)) throw new Error('Use a JPEG, PNG or WebP photo.')
  if (file.size > MAX_PHOTO_BYTES) throw new Error('The photo must be 10 MB or smaller.')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('This file could not be read as a photo.')
  }
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
  if (!blob) throw new Error('The photo could not be processed.')
  return blob
}

export interface NewUpdateInput {
  stage: CaseStage
  note: string
  photo: File | null
  photoCaption: string
}

/** Adds a timeline update (optionally with an officer photo) and moves the case to that stage. */
export async function addCaseUpdate(caseId: string, input: NewUpdateInput): Promise<void> {
  const note = input.note.trim()
  if (note.length < 3 && !input.photo) throw new Error('Write a short update or add a photo.')
  if (input.photo && input.photoCaption.trim().length < 3) throw new Error('Describe the photo in a few words, for people who cannot see it.')
  const photo = input.photo ? await preparePhoto(input.photo) : null

  if (await canUseLive()) {
    let photoPath: string | null = null
    if (photo) {
      photoPath = `${caseId}/${crypto.randomUUID()}.jpg`
      const { error: uploadError } = await supabase!.storage.from(PHOTO_BUCKET).upload(photoPath, photo, { contentType: 'image/jpeg', upsert: false })
      if (uploadError) throw new Error('The photo could not be uploaded.')
    }
    const { error } = await supabase!.from('case_updates').insert({ case_id: caseId, stage: input.stage, note, photo_path: photoPath, photo_caption: input.photoCaption.trim() })
    if (error) {
      if (photoPath) await supabase!.storage.from(PHOTO_BUCKET).remove([photoPath])
      throw new Error('The update could not be saved.')
    }
    await supabase!.from('cases').update({ stage: input.stage, updated_at: touch() }).eq('id', caseId)
    return
  }

  const c = sampleCases.find((x) => x.id === caseId)
  if (!c) throw new Error('Case not found.')
  c.updates.push({ id: `u-${Date.now()}`, stage: input.stage, note, photoUrl: photo ? URL.createObjectURL(photo) : null, photoCaption: input.photoCaption.trim(), createdAt: touch() })
  c.stage = input.stage
  c.updatedAt = touch()
}

/** Attaches a report to a case (or detaches it with null). */
export async function linkReportToCase(report: { id: string; trackingCode: string }, caseId: string | null): Promise<void> {
  if (await canUseLive()) {
    const { error } = await supabase!.from('reports').update({ case_id: caseId }).eq('id', report.id)
    if (error) throw new Error('The report could not be linked.')
    return
  }
  const code = report.trackingCode.toUpperCase()
  const previous = sampleReportLinks.get(code)
  if (previous) {
    const old = sampleCases.find((x) => x.caseCode === previous)
    if (old) old.reportCount = Math.max(0, old.reportCount - 1)
  }
  const target = caseId ? sampleCases.find((x) => x.id === caseId) : undefined
  if (target) {
    sampleReportLinks.set(code, target.caseCode)
    target.reportCount += 1
  } else sampleReportLinks.delete(code)
}

/** Which case each report is attached to, keyed by report id (live) or tracking code (sample). */
export async function getReportLinks(reports: { id: string; trackingCode: string }[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  if (await canUseLive()) {
    const { data } = await supabase!.from('reports').select('id, case_id').in('id', reports.map((r) => r.id))
    for (const row of (data ?? []) as { id: string; case_id: string | null }[]) if (row.case_id) out[row.id] = row.case_id
    return out
  }
  for (const r of reports) {
    const code = sampleReportLinks.get(r.trackingCode.toUpperCase())
    const c = code ? sampleCases.find((x) => x.caseCode === code) : undefined
    if (c) out[r.id] = c.id
  }
  return out
}
