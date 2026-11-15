import { useMemo, useState } from 'react'
import { Building2, CheckCircle2, CircleDashed, Droplets, ExternalLink, Hammer, Route, Waypoints, type LucideIcon } from 'lucide-react'
import { useLanguage } from './LanguageProvider'
// The cleaned CSV is the single source for this section. To change the records,
// edit data/dpwh/raw_dpwh_alangilan.csv and run: node scripts/clean-dpwh.mjs
import cleanedCsv from './data/dpwh_projects_clean.csv?raw'

type ProjectStatus = 'finished' | 'in_progress' | 'not_started'

interface PublicProject {
  contractId: string
  shortTitle: string
  description: string
  category: string
  barangay: string
  city: string
  office: string
  costPhp: number | null
  accomplishmentPct: number
  startDate: string
  targetCompletionDate: string
  actualCompletionDate: string
  status: ProjectStatus
  portalStatus: string
  sourceUrl: string
  retrievedOn: string
}

/** Small CSV reader: quoted fields, doubled quotes and commas inside quotes. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((v) => v !== '')) rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) {
    row.push(field)
    if (row.some((v) => v !== '')) rows.push(row)
  }
  const [header = [], ...body] = rows
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

const STATUSES: ProjectStatus[] = ['finished', 'in_progress', 'not_started']

const projects: PublicProject[] = parseCsv(cleanedCsv)
  .filter((r) => STATUSES.includes(r.status as ProjectStatus))
  .map((r) => ({
    contractId: r.contract_id,
    shortTitle: r.short_title,
    description: r.description,
    category: r.category,
    barangay: r.barangay,
    city: r.city,
    office: r.implementing_office,
    costPhp: r.contract_cost_php === '' ? null : Number(r.contract_cost_php),
    accomplishmentPct: Number(r.accomplishment_pct || 0),
    startDate: r.start_date,
    targetCompletionDate: r.target_completion_date,
    actualCompletionDate: r.actual_completion_date,
    status: r.status as ProjectStatus,
    portalStatus: r.portal_status,
    sourceUrl: r.source_url,
    retrievedOn: r.retrieved_on,
  }))

const STATUS_LABEL: Record<ProjectStatus, string> = {
  finished: 'Finished',
  in_progress: 'In progress',
  not_started: 'Not started',
}

const STATUS_STYLE: Record<ProjectStatus, { badge: string; bar: string; Icon: LucideIcon }> = {
  finished: { badge: 'bg-[#e6f4ea] text-[#1e6b3a] border-[#b7dfc3]', bar: 'bg-[#1e6b3a]', Icon: CheckCircle2 },
  in_progress: { badge: 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]', bar: 'bg-[#ea580c]', Icon: Hammer },
  not_started: { badge: 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]', bar: 'bg-[#94a3b8]', Icon: CircleDashed },
}

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Roads: Route,
  Bridges: Waypoints,
  'Flood Control and Drainage': Droplets,
  'Buildings and Facilities': Building2,
}

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 })

function formatDate(iso: string, locale: string): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00Z`)
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(d)
}

/**
 * Public infrastructure contracts in and near Barangay Alangilan, Batangas City,
 * as recorded on the DPWH Transparency Portal. These are real published records
 * (a snapshot), unlike the fictional sample reports on the same page.
 */
export default function PublicProjects() {
  const { t, language } = useLanguage()
  const [filter, setFilter] = useState<'all' | ProjectStatus>('all')
  const locale = language === 'FIL' ? 'fil-PH' : 'en-PH'

  const counts = useMemo(
    () => Object.fromEntries(STATUSES.map((s) => [s, projects.filter((p) => p.status === s).length])) as Record<ProjectStatus, number>,
    [],
  )
  const visible = projects.filter((p) => filter === 'all' || p.status === filter)
  const retrievedOn = projects[0]?.retrievedOn ?? ''

  return (
    <section
      aria-labelledby="public-projects-title"
      className="mt-6 rounded-2xl border border-[#d8e0ea] bg-white p-5 shadow-[0_12px_32px_rgba(15,35,66,0.08)] sm:p-7"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-block rounded-md bg-[#eff6ff] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1e3a8a]">
            {t('DPWH PROJECT RECORDS')}
          </span>
          <h2 id="public-projects-title" className="mt-2 text-xl font-extrabold tracking-tight text-[#0f2342] sm:text-2xl">
            {t('Public projects near BatStateU Alangilan')}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#475569]">
            {t('Ten infrastructure contracts in and near Barangay Alangilan, Batangas City, with their recorded status.')}
          </p>
        </div>
        <dl className="flex gap-2 text-center text-xs">
          {STATUSES.map((s) => (
            <div key={s} className={`rounded-xl border px-3 py-2 ${STATUS_STYLE[s].badge}`}>
              <dd className="text-xl font-extrabold leading-none">{counts[s]}</dd>
              <dt className="mt-1 font-semibold">{t(STATUS_LABEL[s])}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t('Filter projects by status')}>
        {(['all', ...STATUSES] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            aria-pressed={filter === item}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === item ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white' : 'border-[#d8e0ea] bg-white text-[#475569] hover:border-[#1e3a8a] hover:text-[#1e3a8a]'
            }`}
          >
            {item === 'all' ? `${t('All projects')} (${projects.length})` : `${t(STATUS_LABEL[item])} (${counts[item]})`}
          </button>
        ))}
      </div>

      <ul className="mt-5 space-y-3.5">
        {visible.map((p) => {
          const style = STATUS_STYLE[p.status]
          const CategoryIcon = CATEGORY_ICON[p.category] ?? Building2
          const pct = Math.max(0, Math.min(100, p.accomplishmentPct))
          return (
            <li key={p.contractId} className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_16px_rgba(15,35,66,0.03)]">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#eff6ff] text-[#1e3a8a]">
                    <CategoryIcon size={22} strokeWidth={2.1} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-[#64748b]">
                      {p.contractId} · <span className="font-sans font-semibold text-[#475569]">{t(p.category)}</span>
                    </p>
                    <h3 className="mt-1 text-base font-extrabold text-[#0f2342]">{p.shortTitle}</h3>
                    <p className="mt-0.5 text-xs text-[#475569]">
                      {p.barangay ? `Brgy. ${p.barangay}, ` : ''}
                      {p.city} · {p.office}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-xs font-bold ${style.badge}`}>
                  <style.Icon size={14} aria-hidden="true" />
                  {t(STATUS_LABEL[p.status])}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-[#475569]">
                  <span>{t('Recorded accomplishment')}</span>
                  <span className="font-bold text-[#0f2342]">{p.accomplishmentPct}%</span>
                </div>
                <div
                  className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#e2e8f0]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  aria-label={`${t('Recorded accomplishment')}: ${p.accomplishmentPct}%`}
                >
                  {/* Width comes from the record; Tailwind cannot generate arbitrary runtime widths. */}
                  <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-xs text-[#475569] sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="font-semibold text-[#64748b]">{t('Contract cost')}</dt>
                  <dd className="text-[#0f2342]">{p.costPhp === null ? t('Not yet published') : peso.format(p.costPhp)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#64748b]">{t('Started')}</dt>
                  <dd className="text-[#0f2342]">{formatDate(p.startDate, locale) || t('Not yet started')}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#64748b]">{p.status === 'finished' ? t('Completed') : t('Target completion')}</dt>
                  <dd className="text-[#0f2342]">
                    {formatDate(p.status === 'finished' ? p.actualCompletionDate : p.targetCompletionDate, locale) || t('To be announced')}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#64748b]">{t('DPWH portal status')}</dt>
                  <dd className="text-[#0f2342]">{p.portalStatus}</dd>
                </div>
              </dl>

              <details className="mt-3 text-xs text-[#475569]">
                <summary className="cursor-pointer font-semibold text-[#1e3a8a]">{t('Official contract description')}</summary>
                <p className="mt-1.5 leading-5">{p.description}</p>
              </details>

              <a
                href={p.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1e3a8a] hover:underline"
              >
                {t('View this record on the DPWH portal')}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </li>
          )
        })}
      </ul>

      <div className="mt-5 rounded-xl bg-[#eff6ff] p-3.5 text-xs leading-5 text-[#1e3a8a]">
        <p>
          <strong>{t('About this data.')}</strong>{' '}
          {t('These are real records copied from the DPWH Transparency Portal (transparency.dpwh.gov.ph). They are a snapshot, not a live feed, and may have changed since.')}{' '}
          {retrievedOn ? `${t('Retrieved on')} ${formatDate(retrievedOn, locale)}.` : ''}
        </p>
        <p className="mt-1.5">
          {t('Status is the portal’s recorded contract status, not an inspection of the site. “Not started” includes contracts the portal lists as For Procurement. Tugon is not connected to DPWH and is not an official DPWH service.')}
        </p>
      </div>
    </section>
  )
}
