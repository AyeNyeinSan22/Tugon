import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Camera, Check, Construction, Droplets, ImageOff, Route, ShieldAlert, Users, type LucideIcon } from 'lucide-react'
import { useLanguage } from './LanguageProvider'
import { getCaseForReport, getPublishedCase, listPublishedCases, STAGES, STAGE_LABEL, type CaseSource, type CaseStage, type CaseUpdate, type PublicCase } from './lib/cases'

const categoryIcon = (category: string): LucideIcon => {
  const c = category.toLowerCase()
  if (c.includes('drain') || c.includes('flood')) return Droplets
  if (c.includes('unsafe') || c.includes('pit')) return ShieldAlert
  if (c.includes('construction') || c.includes('unfinished')) return Construction
  return Route
}

const stageTone = (stage: CaseStage) =>
  stage === 'completed'
    ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
    : stage === 'work_in_progress' || stage === 'work_scheduled'
      ? 'border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]'
      : 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]'

function useDate() {
  const { language } = useLanguage()
  const locale = language === 'FIL' ? 'fil-PH' : 'en-PH'
  return (iso: string) => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }).format(new Date(iso))
}

export function StageBadge({ stage }: { stage: CaseStage }) {
  const { t } = useLanguage()
  return <span className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-bold ${stageTone(stage)}`}>{t(STAGE_LABEL[stage])}</span>
}

/** The five stages as a stepper, with the current one marked. Text, not colour alone, shows where the case is. */
export function StageStepper({ stage }: { stage: CaseStage }) {
  const { t } = useLanguage()
  const current = STAGES.indexOf(stage)
  return (
    <ol className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-1" aria-label={t('Case stage')}>
      {STAGES.map((s, i) => {
        const done = i < current || stage === 'completed'
        const isCurrent = i === current && stage !== 'completed'
        return (
          <li key={s} className="flex items-center gap-2 sm:flex-1 sm:flex-col sm:items-start" aria-current={i === current ? 'step' : undefined}>
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                done ? 'bg-[#1e3a8a] text-white' : isCurrent ? 'bg-[#ea580c] text-white' : 'bg-[#e2e8f0] text-[#64748b]'
              }`}
            >
              {done ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : i + 1}
            </span>
            <span className={`text-xs leading-tight ${done || isCurrent ? 'font-bold text-[#0f2342]' : 'text-[#64748b]'}`}>
              {t(STAGE_LABEL[s])}
              {i === current && <span className="block text-[11px] font-semibold text-[#c2410c]">{t('Current stage')}</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function SampleNotice({ source }: { source: CaseSource }) {
  const { t } = useLanguage()
  if (source === 'live') return null
  return (
    <p className="rounded-xl bg-[#fff7ed] p-3.5 text-xs leading-5 text-[#9a3412]">
      {t('Example cases. These are fictional and only show how a case looks. Real cases appear here when officers publish them.')}
    </p>
  )
}

/** Public progress: the list of published cases. */
export function PublicCaseList() {
  const { t } = useLanguage()
  const formatDate = useDate()
  const [state, setState] = useState<{ source: CaseSource; cases: PublicCase[] } | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    let cancelled = false
    void listPublishedCases().then((result) => {
      if (!cancelled) setState(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!state) return <p role="status" className="rounded-2xl border border-[#d8e0ea] bg-white p-6 text-sm text-[#475569]">{t('Loading cases…')}</p>

  const visible = state.cases.filter((c) => filter === 'all' || (filter === 'completed' ? c.stage === 'completed' : c.stage !== 'completed'))
  const filters: ['all' | 'active' | 'completed', string][] = [
    ['all', 'All cases'],
    ['active', 'Being addressed'],
    ['completed', 'Completed'],
  ]

  return (
    <div className="rounded-2xl border border-[#d8e0ea] bg-white p-5 shadow-[0_12px_32px_rgba(15,35,66,0.08)] sm:p-7">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('Filter cases')}>
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === value ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white' : 'border-[#d8e0ea] bg-white text-[#475569] hover:border-[#1e3a8a] hover:text-[#1e3a8a]'
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-[#d8e0ea] bg-[#f8fafc] px-5 py-10 text-center text-sm text-[#475569]">
          {state.cases.length === 0 ? t('No public progress has been published yet.') : t('No cases match this filter.')}
        </p>
      ) : (
        <ul className="mt-5 space-y-3.5">
          {visible.map((c) => {
            const Icon = categoryIcon(c.category)
            const photos = c.updates.filter((u) => u.photoUrl).length
            return (
              <li key={c.id}>
                <Link
                  to={`/progress/${c.caseCode}`}
                  className="group block rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_16px_rgba(15,35,66,0.03)] transition hover:-translate-y-0.5 hover:border-[#1e3a8a] hover:shadow-[0_10px_24px_rgba(15,35,66,0.07)]"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-4">
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#eff6ff] text-[#1e3a8a]">
                        <Icon size={22} strokeWidth={2.1} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-[#64748b]">
                          {c.caseCode} · <span className="font-sans font-semibold text-[#475569]">{t(c.category)}</span>
                        </p>
                        <h2 className="mt-1 text-base font-extrabold text-[#0f2342]">{c.title}</h2>
                        <p className="mt-0.5 text-xs text-[#475569]">
                          {c.area} · {t('Updated')} {formatDate(c.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <StageBadge stage={c.stage} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#475569]">{c.summary}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569]">
                    <span className="flex flex-wrap gap-x-4 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <Users size={13} aria-hidden="true" />
                        {c.reportCount} {t(c.reportCount === 1 ? 'report' : 'reports')}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Camera size={13} aria-hidden="true" />
                        {photos} {t(photos === 1 ? 'photo' : 'photos')}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#1e3a8a] group-hover:underline">
                      {t('View case')} <ArrowRight size={13} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-5 space-y-2">
        <SampleNotice source={state.source} />
        <p className="text-xs leading-5 text-[#64748b]">
          {t('The number of reports is how many reports were grouped into a case. It is not a count of verified witnesses.')}
        </p>
      </div>
    </div>
  )
}

function UpdatePhoto({ update }: { update: CaseUpdate }) {
  const { t } = useLanguage()
  if (update.photoUrl) {
    return (
      <figure className="mt-3">
        <img src={update.photoUrl} alt={update.photoCaption} loading="lazy" className="max-h-80 w-full rounded-xl border border-[#e2e8f0] object-cover" />
        <figcaption className="mt-1.5 text-xs text-[#475569]">{update.photoCaption}</figcaption>
      </figure>
    )
  }
  // Only show a placeholder where a photo was described but no picture is stored (the fictional examples).
  if (!update.photoCaption) return null
  return (
    <figure className="mt-3">
      <div className="grid h-40 place-items-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] text-[#64748b]">
        <span className="flex flex-col items-center gap-1.5 text-xs font-semibold">
          <ImageOff size={22} aria-hidden="true" />
          {t('Photo placeholder')}
        </span>
      </div>
      <figcaption className="mt-1.5 text-xs text-[#475569]">
        {update.photoCaption} <span className="text-[#94a3b8]">· {t('no real photo; example only')}</span>
      </figcaption>
    </figure>
  )
}

/** One published case: stage, summary, and the officer's updates with photos. */
export function CaseDetail() {
  const { t } = useLanguage()
  const formatDate = useDate()
  const { caseCode = '' } = useParams()
  const [state, setState] = useState<{ status: 'loading' } | { status: 'missing' } | { status: 'ready'; item: PublicCase }>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    void getPublishedCase(caseCode).then((item) => {
      if (!cancelled) setState(item ? { status: 'ready', item } : { status: 'missing' })
    })
    return () => {
      cancelled = true
    }
  }, [caseCode])

  const back = (
    <Link to="/progress" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1e3a8a] hover:underline">
      <ArrowLeft size={15} aria-hidden="true" />
      {t('All public progress')}
    </Link>
  )

  if (state.status === 'loading') return <p role="status" className="text-sm text-[#475569]">{t('Loading cases…')}</p>
  if (state.status === 'missing') {
    return (
      <div className="mx-auto max-w-2xl">
        {back}
        <div className="mt-4 rounded-2xl border border-[#d8e0ea] bg-white p-6">
          <h1 className="text-xl font-extrabold text-[#0f2342]">{t('Public progress is not available for this case.')}</h1>
          <p className="mt-2 text-sm leading-6 text-[#475569]">{t('It may not be published yet, or it was taken down. You can still follow your own report from Track my report.')}</p>
        </div>
      </div>
    )
  }

  const c = state.item
  const Icon = categoryIcon(c.category)
  const newestFirst = [...c.updates].reverse()
  return (
    <div className="mx-auto max-w-3xl">
      {back}
      <article className="mt-4 rounded-2xl border border-[#d8e0ea] bg-white p-6 shadow-[0_8px_24px_rgba(15,35,66,0.06)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#eff6ff] text-[#1e3a8a]">
              <Icon size={22} strokeWidth={2.1} aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-xs text-[#64748b]">
                {c.caseCode} · <span className="font-sans font-semibold text-[#475569]">{t(c.category)}</span>
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0f2342]">{c.title}</h1>
              <p className="mt-1 text-sm text-[#475569]">{c.area}</p>
            </div>
          </div>
          <StageBadge stage={c.stage} />
        </div>

        <p className="mt-4 text-sm leading-6 text-[#334155]">{c.summary}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#475569]">
          <Users size={13} aria-hidden="true" />
          {t('Opened because of')} {c.reportCount} {t(c.reportCount === 1 ? 'report' : 'reports')} · {t('Updated')} {formatDate(c.updatedAt)}
        </p>

        <section className="mt-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4" aria-labelledby="stage-heading">
          <h2 id="stage-heading" className="mb-3 text-sm font-extrabold text-[#0f2342]">
            {t('Where this case is now')}
          </h2>
          <StageStepper stage={c.stage} />
        </section>

        <section className="mt-6" aria-labelledby="updates-heading">
          <h2 id="updates-heading" className="text-sm font-extrabold text-[#0f2342]">
            {t('Updates from the office')}
          </h2>
          {newestFirst.length === 0 ? (
            <p className="mt-2 text-sm text-[#475569]">{t('No updates have been posted yet.')}</p>
          ) : (
            <ol className="mt-3 space-y-4">
              {newestFirst.map((u) => (
                <li key={u.id} className="border-l-[3px] border-[#1e3a8a] pl-4">
                  <p className="text-xs text-[#64748b]">
                    {formatDate(u.createdAt)} · <span className="font-semibold text-[#0f2342]">{t(STAGE_LABEL[u.stage])}</span>
                  </p>
                  {u.note && <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#334155]">{u.note}</p>}
                  <UpdatePhoto update={u} />
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="mt-6 space-y-2">
          {c.isExample && (
            <p className="rounded-xl bg-[#fff7ed] p-3.5 text-xs leading-5 text-[#9a3412]">
              {t('Example case. It is fictional and only shows how a case looks.')}
            </p>
          )}
          <p className="text-xs leading-5 text-[#64748b]">
            {t('Photos and updates are posted by the reviewing office. They show what the office reports, not an independent inspection. Reporters’ own photos are never shown here.')}
          </p>
        </div>
      </article>
    </div>
  )
}

/**
 * Shortcut shown on a tracked report. When the report belongs to a published
 * case, it links straight to that case in Public progress, also while work is
 * still under way. Otherwise it says public progress is not available yet.
 */
export function ReportCaseLink({ trackingCode }: { trackingCode: string }) {
  const { t } = useLanguage()
  const [linked, setLinked] = useState<Awaited<ReturnType<typeof getCaseForReport>> | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    setLinked(undefined)
    void getCaseForReport(trackingCode).then((result) => {
      if (!cancelled) setLinked(result)
    })
    return () => {
      cancelled = true
    }
  }, [trackingCode])

  if (linked === undefined) return null
  if (linked === null) {
    return <p className="relative mt-4 rounded-lg bg-[#f8fafc] px-3.5 py-2.5 text-xs text-[#475569]">{t('Public progress is not available for this report yet.')}</p>
  }
  return (
    <div className="relative mt-4 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-4">
      <p className="text-xs font-semibold text-[#1e3a8a]">{t('This report is part of a public case')}</p>
      <p className="mt-1 text-sm font-extrabold text-[#0f2342]">{linked.title}</p>
      <p className="mt-0.5 text-xs text-[#475569]">
        {linked.caseCode} · {t(STAGE_LABEL[linked.stage])}
      </p>
      <Link
        to={`/progress/${linked.caseCode}`}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#1e3a8a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#172554]"
      >
        {t('View public progress')} <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  )
}
