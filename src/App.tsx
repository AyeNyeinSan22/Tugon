import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, Route as RouterRoute, Routes, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Construction,
  Droplets,
  Menu,
  Route,
  Search,
  ShieldAlert,
  X,
  type LucideIcon,
} from 'lucide-react'
import ReportFlow from './ReportFlow'
import OfficerDashboard from './OfficerDashboard'
import TrackAuth from './TrackAuth'
import RoadSafetyMap from './RoadSafetyMap'
import FaqSection from './FaqSection'
import { useLanguage } from './LanguageProvider'
import { supabase, isSupabaseConfigured } from './lib/supabase'

const HERO_IMAGE_SRC = '/hero-road.jpg'

const categories = [
  {
    title: 'Damaged road',
    detail: 'Potholes, cracks, sinking surface',
    Icon: Route,
    iconBg: 'bg-[#eff6ff] text-[#1e3a8a]',
    orbBg: 'bg-[#dbeafe]/65',
    cardHover: 'hover:border-[#1e3a8a] hover:bg-gradient-to-br hover:from-[#eff6ff] hover:to-white',
    ctaColor: 'text-[#1e3a8a]',
  },
  {
    title: 'Blocked drainage',
    detail: 'Clogged canals, flooding spots',
    Icon: Droplets,
    iconBg: 'bg-[#e0f2fe] text-[#0369a1]',
    orbBg: 'bg-[#bae6fd]/60',
    cardHover: 'hover:border-[#0284c7] hover:bg-gradient-to-br hover:from-[#f0f9ff] hover:to-white',
    ctaColor: 'text-[#0369a1]',
  },
  {
    title: 'Unfinished project',
    detail: 'Work stopped or abandoned',
    Icon: Construction,
    iconBg: 'bg-[#fff7ed] text-[#ea580c]',
    orbBg: 'bg-[#fed7aa]/60',
    cardHover: 'hover:border-[#ea580c] hover:bg-gradient-to-br hover:from-[#fff7ed] hover:to-white',
    ctaColor: 'text-[#ea580c]',
  },
  {
    title: 'Unsafe construction',
    detail: 'Open pits, no barriers or signs',
    Icon: ShieldAlert,
    iconBg: 'bg-[#fef2f2] text-[#be123c]',
    orbBg: 'bg-[#fecdd3]/60',
    cardHover: 'hover:border-[#be123c] hover:bg-gradient-to-br hover:from-[#fff1f2] hover:to-white',
    ctaColor: 'text-[#be123c]',
  },
]

const steps = [
  ['Tell us what you see', 'Pick a problem type, drop a pin on the map, and add a photo if you can.'],
  ['We organize it', 'AI summarizes your report and groups similar concerns nearby.'],
  ['An officer reviews it', 'A person decides the priority and routes it to the right office.'],
  ['You see what happens', 'Follow updates and confirm if the reported issue has been resolved.'],
]

const resolved = [
  { id: 'TUG-2026-0118', title: 'Drainage cleared · Mabini St.', meta: '12 days · confirmed by reporters' },
  { id: 'TUG-2026-0112', title: 'Road patched · Sample Brgy.', meta: '9 days · confirmed by reporters' },
  { id: 'TUG-2026-0104', title: 'Barrier installed · Sample Ave.', meta: '5 days · confirmed by reporters' },
]

function CivicTopStrip() {
  return (
    <div className="flex h-1.5" aria-hidden="true">
      <span className="flex-1 bg-[#1e3a8a]" />
      <span className="w-1/4 bg-[#ea580c]" />
      <span className="w-1/6 bg-[#facc15]" />
    </div>
  )
}

function RoutePageLayout({ children, current }: { children: ReactNode; current: string }) {
  const { language, setLanguage, t } = useLanguage()
  const navItems = [
    ['/report', 'Report a problem'],
    ['/track', 'Track my report'],
    ['/progress', 'Public progress'],
    ['/how-it-works', 'How it works'],
  ]
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#1e293b]">
      <CivicTopStrip />
      <div className="bg-[#fff7ed] px-4 py-1.5 text-center text-[11px] font-medium text-[#9a3412]">
        {t('DEMONSTRATION · Reports are not sent to government. Sample data is fictional.')}
      </div>
      <header className="border-b border-[#d8e0ea] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/tugon-mark.svg" alt="" className="size-9 object-contain" />
            <div className="flex flex-col">
              <span className="text-xl font-extrabold uppercase leading-none tracking-tight text-[#0f2342]">TUGON</span>
              <span className="mt-0.5 hidden text-[9px] font-semibold uppercase tracking-[0.16em] text-[#475569] sm:block">
                PUBLIC TRANSPARENCY
              </span>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm" aria-label={t('Main navigation')}>
            {navItems.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className={
                  current === to
                    ? 'border-b-2 border-[#1e3a8a] pb-1 font-semibold text-[#0f2342]'
                    : 'text-[#475569] hover:text-[#1e3a8a]'
                }
              >
                {t(label)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-[#d8e0ea] p-0.5" aria-label={t('Language')}>
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                aria-pressed={language === 'EN'}
                className={`rounded px-2 py-1 text-xs font-semibold ${language === 'EN' ? 'bg-[#1e3a8a] text-white' : 'text-[#475569]'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('FIL')}
                aria-pressed={language === 'FIL'}
                className={`rounded px-2 py-1 text-xs font-semibold ${language === 'FIL' ? 'bg-[#1e3a8a] text-white' : 'text-[#475569]'}`}
              >
                FIL
              </button>
            </div>
            <Link
              to="/officer"
              className="rounded-lg bg-[#0f2342] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#1e3a8a]"
            >
              {t('Officer login')}
            </Link>
            <Link to="/how-it-works" className="hidden text-sm font-medium text-[#0f2342] lg:block">
              {t('Help')}
            </Link>
          </div>
        </div>
      </header>
      <main className="route-main mx-auto min-h-[calc(100vh-170px)] max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-[#d8e0ea] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-2 px-5 py-4 text-xs text-[#475569] sm:flex-row sm:px-8">
          <span>
            <strong className="font-extrabold uppercase tracking-tight text-[#0f2342]">TUGON</strong> ·{' '}
            {t('Your voice. Visible action.')}
          </span>
          <span className="font-medium text-red-600">Emergency? Call 911 or your local DRRMO.</span>
          <span>
            Privacy · Help &amp; coverage · <Link to="/officer">Staff workspace</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}

type DemoReportRecord = {
  ref: string
  title: string
  location: string
  category: string
  CategoryIcon: LucideIcon
  status: 'Under review' | 'Resolved' | 'Sent to office'
  currentStep: 1 | 2 | 3
  timeline: [string, string, string]
}

const DEMO_REPORTS: Record<string, DemoReportRecord> = {
  'TUG-2026-0124': {
    ref: 'TUG-2026-0124',
    title: 'Deep pothole on Mabini Street',
    location: 'Near the elementary school gate',
    category: 'Damaged road',
    CategoryIcon: Route,
    status: 'Under review',
    currentStep: 2,
    timeline: ['Nov 10', 'Nov 11', 'Next update pending'],
  },
  'TUG-2026-0118': {
    ref: 'TUG-2026-0118',
    title: 'Clogged storm drain along Rizal Ave.',
    location: 'Corner Bonifacio St., Brgy. Sample',
    category: 'Blocked drainage',
    CategoryIcon: Droplets,
    status: 'Resolved',
    currentStep: 3,
    timeline: ['Nov 02', 'Nov 03', 'Completed Nov 08'],
  },
  'TUG-2026-0109': {
    ref: 'TUG-2026-0109',
    title: 'Stalled sidewalk drainage excavation',
    location: 'Fronting Public Market Gate 2',
    category: 'Unfinished project',
    CategoryIcon: Construction,
    status: 'Sent to office',
    currentStep: 2,
    timeline: ['Oct 28', 'Oct 29', 'Forwarded to Engineering'],
  },
}

const trackStatusThemes: Record<
  DemoReportRecord['status'],
  {
    cardBorder: string
    orbBg: string
    pillBg: string
    activeNodeBg: string
  }
> = {
  'Under review': {
    cardBorder: 'border-[#fdba74] ring-2 ring-[#ea580c]/10',
    orbBg: 'bg-[#fff7ed]',
    pillBg: 'border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]',
    activeNodeBg: 'bg-[#ea580c] text-white',
  },
  'Sent to office': {
    cardBorder: 'border-[#fdba74] ring-2 ring-[#ea580c]/10',
    orbBg: 'bg-[#fff7ed]',
    pillBg: 'border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]',
    activeNodeBg: 'bg-[#ea580c] text-white',
  },
  Resolved: {
    cardBorder: 'border-[#86efac] ring-2 ring-[#16a34a]/10',
    orbBg: 'bg-[#f0fdf4]',
    pillBg: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]',
    activeNodeBg: 'bg-[#16a34a] text-white',
  },
}

function TrackPage() {
  const { t } = useLanguage()
  const [reportId, setReportId] = useState('')
  const [activeRef, setActiveRef] = useState<string | null>(null)
  const [liveRecord, setLiveRecord] = useState<DemoReportRecord | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [looking, setLooking] = useState(false)

  const statusToTrack = (status: string): Pick<DemoReportRecord, 'status' | 'currentStep' | 'timeline'> => {
    if (status === 'resolved') {
      return { status: 'Resolved', currentStep: 3, timeline: ['Received', 'Reviewed', 'Resolved'] }
    }
    if (status === 'in_progress') {
      return { status: 'Sent to office', currentStep: 2, timeline: ['Received', 'With the office', 'Next update pending'] }
    }
    return { status: 'Under review', currentStep: 2, timeline: ['Received', 'Under review', 'Next update pending'] }
  }

  const handleLookup = async (refCode: string) => {
    const normalized = refCode.trim().toUpperCase()
    if (!normalized) return
    setReportId(normalized)
    setLiveRecord(null)
    setActiveRef(null)
    setNotFound(false)

    if (isSupabaseConfigured && supabase) {
      setLooking(true)
      const { data, error } = await supabase
        .from('reports')
        .select('tracking_code, problem, address, landmark, status, created_at')
        .eq('tracking_code', normalized)
        .maybeSingle()
      setLooking(false)

      if (!error && data) {
        const track = statusToTrack(data.status)
        setLiveRecord({
          ref: data.tracking_code,
          title: data.problem || 'Reported issue',
          location: data.landmark || data.address || 'Location provided',
          category: data.problem || 'Report',
          CategoryIcon: Route,
          ...track,
          timeline: [
            new Date(data.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
            track.timeline[1],
            track.timeline[2],
          ],
        })
        return
      }
      // Fall through to demo lookup if the table isn't ready yet
    }

    if (DEMO_REPORTS[normalized]) {
      setActiveRef(normalized)
      setNotFound(false)
    } else {
      setNotFound(true)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleLookup(reportId)
  }

  const record = liveRecord ?? (activeRef ? DEMO_REPORTS[activeRef] : null)
  const theme = record ? trackStatusThemes[record.status] : null

  return (
    <RoutePageLayout current="/track">
      <TrackAuth>
      <div className="mx-auto max-w-2xl">
        {/* Lookup Card with Dual-Tone Royal Blue & Civic Orange Top Bar */}
        <section
          aria-labelledby="track-heading"
          className="overflow-hidden rounded-2xl border border-[#d8e0ea] bg-white shadow-[0_6px_24px_rgba(15,35,66,0.05)]"
        >
          <div className="flex h-1.5" aria-hidden="true">
            <span className="flex-1 bg-[#1e3a8a]" />
            <span className="w-28 bg-[#ea580c]" />
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-xs font-bold tracking-wider text-[#1e3a8a]">{t('CITIZEN REPORTS')}</p>
            <h1 id="track-heading" className="mt-1.5 text-3xl font-extrabold tracking-tight text-[#0f2342]">
              {t('Track my report')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#475569]">
              {t('Enter the reference number you received after reporting an issue.')}
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4"
            >
              <label htmlFor="report-ref-input" className="block text-xs font-semibold text-[#0f2342]">
                {t('Report reference')}
              </label>
              <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
                <input
                  id="report-ref-input"
                  value={reportId}
                  onChange={(e) => {
                    setReportId(e.target.value)
                    setNotFound(false)
                  }}
                  required
                  className="form-control flex-1"
                  placeholder={t('e.g. TG-A1B2C3')}
                />
                <button
                  type="submit"
                  disabled={looking}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172554] disabled:opacity-60"
                >
                  <Search size={15} aria-hidden="true" />
                  <span>{looking ? t('Finding…') : t('Find report')}</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Not Found Notice */}
        {notFound && (
          <div
            role="status"
            className="mt-5 rounded-2xl border border-[#fecdd3] bg-white p-5 text-sm text-[#475569] shadow-xs"
          >
            <p className="font-semibold text-[#0f2342]">
              {t('No report found for')} <span className="font-mono text-[#be123c]">{reportId}</span>
            </p>
            <p className="mt-1 text-xs">
              {t('Check your reference code and try again (e.g. TG-A1B2C3).')}
            </p>
          </div>
        )}

        {/* Minimal Colored-Outline Report Result Card */}
        {record && theme && (
          <article
            aria-live="polite"
            className={`relative mt-5 overflow-hidden rounded-2xl border-2 bg-white p-6 shadow-[0_8px_24px_rgba(15,35,66,0.06)] transition-all ${theme.cardBorder}`}
          >
            {/* Subtle Top-Right Quarter-Circle Orb (matching category cards) */}
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute -right-8 -top-8 size-32 rounded-full ${theme.orbBg}`}
            />

            {/* Header Row: Reference ID + Status Pill */}
            <div className="relative flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold tracking-wide text-[#475569]">{record.ref}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.pillBg}`}>
                {t(record.status)}
              </span>
            </div>

            {/* Category Icon + Issue Title */}
            <div className="relative mt-4 flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eff6ff] text-[#1e3a8a]">
                <record.CategoryIcon size={21} strokeWidth={2.1} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold leading-snug text-[#0f2342]">{t(record.title)}</h2>
                <p className="mt-0.5 text-xs text-[#475569]">
                  {t(record.location)} · <span className="font-medium text-[#1e3a8a]">{t(record.category)}</span>
                </p>
              </div>
            </div>

            {/* Minimal Connected 3-Stage Milestone Stepper */}
            <ol className="relative mt-5 flex flex-col gap-3 border-t border-[#f1f5f9] pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
              {[
                { stepNum: 1, title: 'Report received', meta: record.timeline[0] },
                { stepNum: 2, title: 'Under review', meta: record.timeline[1] },
                { stepNum: 3, title: 'Office action', meta: record.timeline[2] },
              ].map(({ stepNum, title, meta }, idx) => {
                const isDone = record.currentStep > stepNum || (record.status === 'Resolved' && stepNum === 3)
                const isCurrent = record.currentStep === stepNum && record.status !== 'Resolved'
                return (
                  <li key={stepNum} className={`flex items-center ${idx < 2 ? 'sm:flex-1' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                          isDone
                            ? 'bg-[#1e3a8a] text-white'
                            : isCurrent
                              ? theme.activeNodeBg
                              : 'bg-[#e2e8f0] text-[#64748b]'
                        }`}
                      >
                        {isDone ? <Check size={12} strokeWidth={3} /> : stepNum}
                      </span>
                      <div className="text-xs leading-tight">
                        <span className={`font-semibold ${isCurrent || isDone ? 'text-[#0f2342]' : 'text-[#64748b]'}`}>
                          {t(title)}
                        </span>
                        <span className="block text-[11px] text-[#64748b]">{t(meta)}</span>
                      </div>
                    </div>
                    {idx < 2 && (
                      <span
                        aria-hidden="true"
                        className={`mx-2.5 hidden h-[1.5px] flex-1 sm:block ${
                          isDone ? 'bg-[#1e3a8a]' : 'bg-[#e2e8f0]'
                        }`}
                      />
                    )}
                  </li>
                )
              })}
            </ol>

            {/* Sample Disclaimer Notice — only for demo records */}
            {!liveRecord && (
              <div className="relative mt-4 flex items-center gap-2 rounded-lg bg-[#fff7ed] px-3.5 py-2.5 text-[11px] font-medium text-[#9a3412]">
                <AlertTriangle size={14} className="shrink-0 text-[#ea580c]" />
                <span>{t('This is sample progress for the demonstration. No real report records are connected.')}</span>
              </div>
            )}
          </article>
        )}
      </div>
      </TrackAuth>
    </RoutePageLayout>
  )
}

const publicCases = [
  {
    id: 'TUG-2026-0124',
    title: 'Deep pothole on Mabini Street',
    area: 'Brgy. Sample',
    category: 'Damaged road',
    status: 'Under review',
    updated: 'Updated Nov 11',
    Icon: Route,
    iconBg: 'bg-[#eff6ff] text-[#1e3a8a]',
    orbBg: 'bg-[#dbeafe]/65',
    cardHover: 'hover:border-[#1e3a8a] hover:bg-gradient-to-br hover:from-[#eff6ff]/70 hover:to-white',
    linkColor: 'text-[#1e3a8a]',
  },
  {
    id: 'TUG-2026-0118',
    title: 'Drainage cleared on Mabini St.',
    area: 'Brgy. Sample',
    category: 'Blocked drainage',
    status: 'Resolved',
    updated: 'Resolved Nov 10',
    Icon: Droplets,
    iconBg: 'bg-[#e0f2fe] text-[#0369a1]',
    orbBg: 'bg-[#bae6fd]/60',
    cardHover: 'hover:border-[#0284c7] hover:bg-gradient-to-br hover:from-[#f0f9ff]/70 hover:to-white',
    linkColor: 'text-[#0369a1]',
  },
  {
    id: 'TUG-2026-0109',
    title: 'Safety barriers requested',
    area: 'Sample Avenue',
    category: 'Unsafe construction',
    status: 'Sent to office',
    updated: 'Updated Nov 9',
    Icon: ShieldAlert,
    iconBg: 'bg-[#fef2f2] text-[#be123c]',
    orbBg: 'bg-[#fecdd3]/60',
    cardHover: 'hover:border-[#be123c] hover:bg-gradient-to-br hover:from-[#fff1f2]/70 hover:to-white',
    linkColor: 'text-[#be123c]',
  },
]

function ProgressPage() {
  const { language, setLanguage, t } = useLanguage()
  const [filter, setFilter] = useState('All reports')
  const visibleCases = publicCases.filter((item) => filter === 'All reports' || item.status === filter)
  const filters = ['All reports', 'Under review', 'Sent to office', 'Resolved']
  const navItems = [
    ['/report', 'Report a problem'],
    ['/track', 'Track my report'],
    ['/progress', 'Public progress'],
    ['/how-it-works', 'How it works'],
  ]

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] text-[#1e293b]">
      <CivicTopStrip />
      <div className="bg-[#fff7ed] px-4 py-1.5 text-center text-[11px] font-medium text-[#9a3412]">
        {t('DEMONSTRATION · Reports are not sent to government. Sample data is fictional.')}
      </div>

      {/* Consistent Header */}
      <header className="border-b border-[#d8e0ea] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/tugon-mark.svg" alt="" className="size-9 object-contain" />
            <div className="flex flex-col">
              <span className="text-xl font-extrabold uppercase leading-none tracking-tight text-[#0f2342]">TUGON</span>
              <span className="mt-0.5 hidden text-[9px] font-semibold uppercase tracking-[0.16em] text-[#475569] sm:block">
                PUBLIC TRANSPARENCY
              </span>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm" aria-label={t('Main navigation')}>
            {navItems.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className={
                  to === '/progress'
                    ? 'border-b-2 border-[#1e3a8a] pb-1 font-semibold text-[#0f2342]'
                    : 'text-[#475569] hover:text-[#1e3a8a]'
                }
              >
                {t(label)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-[#d8e0ea] p-0.5" aria-label={t('Language')}>
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                aria-pressed={language === 'EN'}
                className={`rounded px-2 py-1 text-xs font-semibold ${language === 'EN' ? 'bg-[#1e3a8a] text-white' : 'text-[#475569]'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('FIL')}
                aria-pressed={language === 'FIL'}
                className={`rounded px-2 py-1 text-xs font-semibold ${language === 'FIL' ? 'bg-[#1e3a8a] text-white' : 'text-[#475569]'}`}
              >
                FIL
              </button>
            </div>
            <Link
              to="/officer"
              className="rounded-lg bg-[#0f2342] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#1e3a8a]"
            >
              {t('Officer login')}
            </Link>
            <Link to="/how-it-works" className="hidden text-sm font-medium text-[#0f2342] lg:block">
              {t('Help')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Photo Header Band */}
      <section className="relative isolate overflow-hidden bg-[#1e3a8a] pb-24 pt-10 text-white sm:pb-28 sm:pt-12">
        <img
          src={HERO_IMAGE_SRC}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 size-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-[#be123c]/88 via-[#3730a3]/84 to-[#1e3a8a]/92"
        />

        <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-block rounded-md bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white ring-1 ring-white/25 backdrop-blur-xs">
                {t('PUBLIC PROJECT FOLLOW-UP')}
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {t('Public progress')}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-100">
                {t('See how sample community reports move through review and action.')}
              </p>
            </div>

            <div className="rounded-xl border border-white/25 bg-white/12 px-4 py-3 text-sm text-white backdrop-blur-sm">
              <strong className="text-2xl font-extrabold text-[#facc15]">12</strong>
              <span className="ml-2 text-xs font-medium text-slate-100">{t('sample reports')}</span>
            </div>
          </div>

          {/* Filter Pills inside Hero Band */}
          <div className="mt-6 flex flex-wrap gap-2" aria-label={t('Filter reports')}>
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  filter === item
                    ? 'border-[#facc15] bg-[#facc15] text-[#0f2342] shadow-xs'
                    : 'border-white/30 bg-white/10 text-white backdrop-blur-xs hover:bg-white/20'
                }`}
              >
                {t(item)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Overlapping Floating White Panel with Category-Styled Report Cards */}
      <main className="route-main mx-auto -mt-16 w-full max-w-[1080px] flex-1 px-5 pb-12 sm:-mt-20 sm:px-8">
        <div className="rounded-2xl border border-[#d8e0ea] bg-white p-5 shadow-[0_12px_32px_rgba(15,35,66,0.08)] sm:p-7">
          <div className="space-y-3.5">
            {visibleCases.map(({ id, title, area, category, status, updated, Icon, iconBg, orbBg, cardHover, linkColor }) => (
              <article
                key={id}
                className={`group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_16px_rgba(15,35,66,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,35,66,0.07)] sm:flex-row sm:items-center ${cardHover}`}
              >
                {/* Decorative Top-Right Quarter-Circle Orb (matching category cards) */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -right-7 -top-7 size-28 rounded-full transition-transform duration-300 group-hover:scale-110 ${orbBg}`}
                />

                <div className="relative flex items-start gap-4">
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${iconBg}`}
                  >
                    <Icon size={22} strokeWidth={2.1} aria-hidden="true" />
                  </span>

                  <div>
                    <p className="font-mono text-xs text-[#64748b]">
                      {id} · <span className="font-sans font-semibold text-[#475569]">{t(category)}</span>
                    </p>
                    <h2 className="mt-1 text-base font-extrabold text-[#0f2342]">{t(title)}</h2>
                    <p className="mt-0.5 text-xs text-[#475569]">
                      {t(area)} · {t(updated)}
                    </p>
                  </div>
                </div>

                <div className="relative flex items-center justify-between gap-3.5 sm:justify-end">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      status === 'Resolved'
                        ? 'bg-[#e6f4ea] text-[#1e6b3a]'
                        : 'border border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]'
                    }`}
                  >
                    {t(status)}
                  </span>
                  <Link
                    to="/track"
                    className={`inline-flex items-center gap-1 text-sm font-bold hover:underline ${linkColor}`}
                  >
                    {t('Details →')}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-5 rounded-xl bg-[#fff7ed] p-3.5 text-xs leading-5 text-[#9a3412]">
            {t('Demonstration only. Sample data is fictional and does not represent live government service records.')}
          </p>
        </div>
      </main>

      {/* Consistent Footer */}
      <footer className="border-t border-[#d8e0ea] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-2 px-5 py-4 text-xs text-[#475569] sm:flex-row sm:px-8">
          <span>
            <strong className="font-extrabold uppercase tracking-tight text-[#0f2342]">TUGON</strong> ·{' '}
            {t('Your voice. Visible action.')}
          </span>
          <span className="font-medium text-red-600">{t('Emergency? Call 911 or your local DRRMO.')}</span>
          <span>
            Privacy · Help &amp; coverage · <Link to="/officer">Staff workspace</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}

function HowItWorksPage() {
  const { t } = useLanguage()
  const details = [
    {
      step: 1,
      title: 'Choose a problem type',
      description: 'Select the closest match, from damaged roads and blocked drainage to unsafe construction.',
      Icon: Route,
      iconBg: 'bg-[#eff6ff] text-[#1e3a8a]',
      orbBg: 'bg-[#dbeafe]/65',
      nodeBg: 'bg-[#1e3a8a] text-white',
    },
    {
      step: 2,
      title: 'Add the location',
      description: 'Drop a map pin or enter a street and nearby landmark so the issue can be found.',
      Icon: Droplets,
      iconBg: 'bg-[#e0f2fe] text-[#0369a1]',
      orbBg: 'bg-[#bae6fd]/60',
      nodeBg: 'bg-[#0369a1] text-white',
    },
    {
      step: 3,
      title: 'Describe what you noticed',
      description: 'Add a short description, when you noticed it, and photos if you have them.',
      Icon: Construction,
      iconBg: 'bg-[#fff7ed] text-[#ea580c]',
      orbBg: 'bg-[#fed7aa]/60',
      nodeBg: 'bg-[#ea580c] text-white',
    },
    {
      step: 4,
      title: 'Review and follow up',
      description: 'Check the generated summary, answer optional urgency questions, then follow public updates.',
      Icon: CheckCircle2,
      iconBg: 'bg-[#fef9c3] text-[#854d0e]',
      orbBg: 'bg-[#fef08a]/55',
      nodeBg: 'bg-[#facc15] text-[#0f2342]',
    },
  ]

  return (
    <RoutePageLayout current="/how-it-works">
      <div className="mx-auto max-w-3xl">
        {/* Top Intro Card with Dual-Tone Royal Blue & Civic Orange Accent Bar */}
        <section
          aria-labelledby="how-heading"
          className="overflow-hidden rounded-2xl border border-[#d8e0ea] bg-white shadow-[0_6px_24px_rgba(15,35,66,0.05)]"
        >
          <div className="flex h-1.5" aria-hidden="true">
            <span className="flex-1 bg-[#1e3a8a]" />
            <span className="w-28 bg-[#ea580c]" />
          </div>

          <div className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <p className="text-xs font-bold tracking-wider text-[#1e3a8a]">{t('A SIMPLE REPORTING PROCESS')}</p>
              <h1 id="how-heading" className="mt-1.5 text-3xl font-extrabold tracking-tight text-[#0f2342]">
                {t('How it works')}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#475569]">
                {t('Tugon helps residents raise concerns and see what happens next.')}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2.5">
              <Link
                to="/report"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#172554]"
              >
                {t('Report a problem')} <ArrowRight size={14} />
              </Link>
              <Link
                to="/progress"
                className="inline-flex items-center rounded-lg border border-[#cbd5e1] bg-white px-4 py-2.5 text-xs font-semibold text-[#0f2342] transition hover:border-[#1e3a8a] hover:bg-[#eff6ff]"
              >
                {t('View public progress')}
              </Link>
            </div>
          </div>
        </section>

        {/* Sequential Vertical Stepper */}
        <ol className="mt-7 space-y-4">
          {details.map(({ step, title, description, Icon, iconBg, orbBg, nodeBg }, index) => {
            const isLast = index === details.length - 1
            return (
              <li key={title} className="relative flex items-stretch gap-4 sm:gap-5">
                {/* Left Step Rail + Numbered Node */}
                <div className="flex flex-col items-center">
                  <span
                    className={`z-10 grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold shadow-xs ring-4 ring-[#f6f8fb] ${nodeBg}`}
                  >
                    {step}
                  </span>
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="my-1 w-0.5 flex-1 bg-gradient-to-b from-[#cbd5e1] to-[#e2e8f0]"
                    />
                  )}
                </div>

                {/* Right Step Card */}
                <div className="group relative flex-1 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_18px_rgba(15,35,66,0.04)] transition-all duration-200 hover:border-[#cbd5e1] hover:shadow-[0_10px_24px_rgba(15,35,66,0.07)] sm:p-6">
                  {/* Subtle Top-Right Quarter-Circle Orb */}
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute -right-7 -top-7 size-28 rounded-full transition-transform duration-300 group-hover:scale-110 ${orbBg}`}
                  />

                  <div className="relative flex items-start gap-4">
                    <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${iconBg}`}>
                      <Icon size={21} strokeWidth={2.1} aria-hidden="true" />
                    </span>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                        {t(`Step ${step} of 4`)}
                      </span>
                      <h2 className="mt-0.5 text-base font-extrabold text-[#0f2342]">{t(title)}</h2>
                      <p className="mt-1 text-sm leading-6 text-[#475569]">{t(description)}</p>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

        {/* Human Oversight Callout Banner */}
        <div className="mt-7 flex items-start gap-3.5 rounded-2xl border border-[#bfdbfe] bg-white p-5 shadow-xs">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eff6ff] text-[#1e3a8a]">
            <ShieldAlert size={20} aria-hidden="true" />
          </span>
          <div className="text-sm leading-6 text-[#334155]">
            <strong className="font-bold text-[#0f2342]">{t('People make the decisions.')}</strong>{' '}
            {t(
              'Automated summaries can help organize a report. Government staff review reports, decide urgency, and determine what action to take.'
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-6">
          <FaqSection />
        </div>
      </div>
    </RoutePageLayout>
  )
}

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const sections = Array.from(mainRef.current?.querySelectorAll<HTMLElement>(':scope > section') ?? [])
    sections.forEach((section, index) => {
      section.classList.add('reveal-on-scroll')
      section.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 75}ms`)
    })
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      sections.forEach((section) => section.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#1e293b]">
      <CivicTopStrip />
      <div className="bg-[#fff7ed] px-4 py-2 text-center text-xs font-medium text-[#9a3412] sm:text-[13px]">
        {t('DEMONSTRATION · Reports are not sent to government. Sample data is fictional.')}
      </div>

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-[#d8e0ea] bg-white">
        <div className="mx-auto flex max-w-[1408px] items-center justify-between gap-6 px-5 py-3.5 sm:px-8 lg:px-16">
          <a href="#home" className="flex shrink-0 items-center gap-3" aria-label="Tugon home">
            <img src="/tugon-mark.svg" alt="" className="size-10 object-contain" />
            <div className="flex flex-col">
              <span className="text-[24px] font-extrabold leading-none tracking-tight text-[#0f2342]">TUGON</span>
              <span className="mt-0.5 hidden text-[10px] font-semibold tracking-[0.16em] text-[#475569] sm:block">
                PUBLIC TRANSPARENCY
              </span>
            </div>
          </a>

          <nav
            className={`${menuOpen ? 'absolute left-0 right-0 top-full flex border-b border-[#d8e0ea] bg-white px-5 py-4 shadow-lg' : 'hidden'} flex-col gap-4 md:static md:flex md:flex-row md:items-center md:gap-7 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
            aria-label="Main navigation"
          >
            <Link to="/report" onClick={() => setMenuOpen(false)} className="nav-active text-left">
              {t('Report a problem')}
            </Link>
            <Link to="/track" onClick={() => setMenuOpen(false)} className="nav-link text-left">
              {t('Track my report')}
            </Link>
            <Link to="/progress" onClick={() => setMenuOpen(false)} className="nav-link">
              {t('Public progress')}
            </Link>
            <Link to="/how-it-works" onClick={() => setMenuOpen(false)} className="nav-link">
              {t('How it works')}
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="flex rounded-md border border-[#d8e0ea] p-0.5" aria-label="Language">
              {(['EN', 'FIL'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`rounded px-2.5 py-1 text-xs font-semibold ${language === lang ? 'bg-[#1e3a8a] text-white' : 'text-[#475569] hover:bg-slate-50'}`}
                  aria-pressed={language === lang}
                >
                  {lang}
                </button>
              ))}
            </div>
            <a href="#footer" className="hidden text-sm font-medium text-[#0f2342] sm:inline">
              {t('Help')}
            </a>
            <Link
              to="/officer"
              className="rounded-lg bg-[#0f2342] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#1e3a8a]"
            >
              {t('Officer login')}
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="grid size-9 place-items-center rounded-md border border-[#d8e0ea] text-[#0f2342] md:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>

      <section
        id="home"
        aria-labelledby="hero-title"
        className="relative isolate overflow-hidden bg-[#1e3a8a] text-white"
      >
        <img
          src={HERO_IMAGE_SRC}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 size-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-[#be123c]/88 via-[#3730a3]/82 to-[#1e3a8a]/92"
        />

        <div className="mx-auto flex max-w-[1408px] flex-col items-center px-5 py-16 text-center sm:px-8 sm:py-20 lg:px-16 lg:py-24">
          <span className="inline-flex items-center rounded-md bg-[#1d4ed8] px-4 py-1.5 text-xs font-bold tracking-[0.12em] text-white shadow-sm ring-1 ring-white/25">
            {t('COMMUNITY INFRASTRUCTURE REPORTING')}
          </span>

          <h1
            id="hero-title"
            className="mt-5 max-w-4xl text-[36px] font-extrabold leading-[1.12] tracking-[-0.03em] text-white drop-shadow-sm sm:text-[48px] lg:text-[54px]"
          >
            {t('See a problem with a public project? Tell us.')}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100 sm:text-lg">
            {t(
              'Tugon is a community reporting platform for problems with public projects. Share what you noticed and where it happened, then follow visible updates as the report is reviewed.'
            )}
          </p>

          <div className="mt-8 flex w-full flex-col justify-center gap-3.5 sm:w-auto sm:flex-row">
            <Link
              to="/report"
              className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-lg bg-[#facc15] px-8 text-base font-bold text-[#0f2342] shadow-md transition hover:bg-[#eab308] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#facc15]"
            >
              {t('Report a problem')} <ArrowRight size={19} />
            </Link>
            <Link
              to="/track"
              className="inline-flex min-h-[54px] items-center justify-center rounded-lg border border-white/40 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              {t('Track my report')}
            </Link>
          </div>
        </div>
      </section>

      <main
        ref={mainRef}
        className="mx-auto flex max-w-[1408px] flex-col gap-10 px-5 pb-16 pt-10 sm:px-8 sm:pt-12 lg:gap-12 lg:px-16"
      >
        {/* Option A: Map stretches cleanly to match the exact height of the right column */}
        <section className="grid items-stretch gap-6 lg:grid-cols-12" aria-labelledby="safety-title">
          {/* Left: Road Safety Map Card */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-[#d8e0ea] bg-white shadow-[0_6px_24px_rgba(15,35,66,0.04)] lg:col-span-8">
            <div className="flex h-1.5 shrink-0" aria-hidden="true">
              <span className="flex-1 bg-[#1e3a8a]" />
              <span className="w-28 bg-[#ea580c]" />
            </div>
            <div className="flex flex-1 flex-col p-5 sm:p-7">
              <p className="text-xs font-bold tracking-[0.08em] text-[#1e3a8a]">{t('ROAD SAFETY OVERVIEW')}</p>
              <h2 id="safety-title" className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#0f2342]">
                {t('Know the road before you go')}
              </h2>
              <div className="flex flex-1 flex-col [&_.leaflet-container]:!h-[510px]">
                <RoadSafetyMap />
              </div>
            </div>
            <div className="shrink-0 border-t border-[#f1f5f9] bg-[#f8fafc] px-5 py-3 text-xs text-[#475569] sm:px-7">
              {t('Illustrative conditions only · not a live travel advisory')}
            </div>
          </div>

          {/* Right Column: Upgraded How It Works & Recently Resolved Cards */}
          <div className="flex flex-col justify-between gap-6 lg:col-span-4">
            {/* How It Works Card */}
            <div
              id="how-it-works"
              className="overflow-hidden rounded-2xl border border-[#d8e0ea] bg-white shadow-[0_6px_24px_rgba(15,35,66,0.04)]"
            >
              <div className="flex h-1" aria-hidden="true">
                <span className="flex-1 bg-[#1e3a8a]" />
                <span className="w-16 bg-[#ea580c]" />
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#1e3a8a]">
                      {t('PROCESS')}
                    </span>
                    <h2 className="text-lg font-extrabold text-[#0f2342]">{t('How it works')}</h2>
                  </div>
                  <Link
                    to="/how-it-works"
                    className="inline-flex items-center gap-1 rounded-lg bg-[#eff6ff] px-2.5 py-1.5 text-xs font-bold text-[#1e3a8a] transition hover:bg-[#dbeafe]"
                  >
                    {t('Details')} <ArrowRight size={13} />
                  </Link>
                </div>

                <ol className="mt-5 space-y-3.5">
                  {steps.map(([title, detail], index) => {
                    const isLast = index === steps.length - 1
                    const nodeStyles = [
                      'bg-[#1e3a8a] text-white',
                      'bg-[#0369a1] text-white',
                      'bg-[#ea580c] text-white',
                      'bg-[#facc15] text-[#0f2342]',
                    ]
                    return (
                      <li key={title} className="relative flex items-stretch gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`z-10 grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold shadow-xs ${nodeStyles[index]}`}
                          >
                            {index + 1}
                          </span>
                          {!isLast && <span aria-hidden="true" className="my-1 w-0.5 flex-1 bg-[#e2e8f0]" />}
                        </div>
                        <div className={isLast ? '' : 'pb-1'}>
                          <h3 className="text-sm font-bold text-[#0f2342]">{t(title)}</h3>
                          <p className="mt-0.5 text-xs leading-5 text-[#475569]">{t(detail)}</p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>

            {/* Recently Resolved Card */}
            <div
              id="progress"
              className="flex-1 overflow-hidden rounded-2xl border border-[#d8e0ea] bg-white shadow-[0_6px_24px_rgba(15,35,66,0.04)]"
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#ea580c]">
                      {t('VERIFIED UPDATES')}
                    </span>
                    <h2 className="text-lg font-extrabold text-[#0f2342]">{t('Recently resolved')}</h2>
                  </div>
                  <Link
                    to="/progress"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1e3a8a] hover:underline"
                  >
                    {t('See all')} <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="mt-4 space-y-2.5">
                  {resolved.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 transition hover:border-[#cbd5e1] hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[11px] font-semibold text-[#64748b]">{item.id}</span>
                          <h3 className="mt-0.5 text-sm font-bold text-[#0f2342]">{t(item.title)}</h3>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-0.5 text-[11px] font-semibold text-[#15803d]">
                          <CheckCircle2 size={12} /> {t('Resolved')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#475569]">{t(item.meta)}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="categories-title" className="pt-2">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 id="categories-title" className="text-2xl font-extrabold tracking-tight text-[#0f2342] sm:text-[30px]">
                {t('What can you report?')}
              </h2>
              <p className="mt-1 text-sm text-[#475569]">
                {t('Pick an issue category to start a 3-minute report.')}
              </p>
            </div>
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 self-start text-sm font-bold text-[#1e3a8a] hover:text-[#172554] sm:self-auto"
            >
              {t('Report another issue')} <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(({ title, detail, Icon, iconBg, orbBg, cardHover, ctaColor }) => (
              <Link
                key={title}
                to="/report"
                state={{ preselectedProblem: title }}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_6px_24px_rgba(15,35,66,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(15,35,66,0.09)] ${cardHover}`}
              >
                {/* Decorative top-right quarter-circle orb */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -right-7 -top-7 size-28 rounded-full transition-transform duration-300 group-hover:scale-110 ${orbBg}`}
                />

                <div className="relative">
                  <span className={`grid size-13 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${iconBg}`}>
                    <Icon size={24} strokeWidth={2.1} />
                  </span>

                  <h3 className="mt-6 text-lg font-extrabold leading-snug text-[#0f2342]">
                    {t(title)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#475569]">
                    {t(detail)}
                  </p>
                </div>

                <div className={`relative mt-7 inline-flex items-center gap-1.5 text-sm font-bold ${ctaColor}`}>
                  <span>{t('Start report')}</span>
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <FaqSection />
      </main>

      <footer id="footer" className="border-t border-[#d8e0ea] bg-white">
        <div className="mx-auto flex max-w-[1408px] flex-col gap-3 px-5 py-6 text-xs text-[#475569] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-16">
          <div className="flex items-center gap-2.5">
            <img src="/tugon-mark.svg" alt="" className="size-6 object-contain" />
            <p>
              <strong className="text-[#0f2342]">TUGON</strong> · {t('Your voice. Visible progress.')}
            </p>
          </div>
          <p>{t('Emergency? Call 911 or your local emergency hotline.')}</p>
          <p>
            <a href="#footer" className="hover:text-[#1e3a8a]">{t('Privacy')}</a> ·{' '}
            <a href="#footer" className="hover:text-[#1e3a8a]">{t('Help & coverage')}</a> ·{' '}
            <a href="#footer" className="hover:text-[#1e3a8a]">{t('About')}</a> ·{' '}
            <Link to="/officer" className="font-semibold hover:text-[#1e3a8a]">{t('Staff workspace')}</Link>
          </p>
        </div>
      </footer>

      <a
        href="#footer"
        className="sr-only focus:not-sr-only focus:fixed focus:bottom-4 focus:left-4 focus:z-50 focus:rounded bg-white focus:p-3"
      >
        {t('Skip to help')}
      </a>
      <div className="sr-only" aria-live="polite">
        {language === 'FIL' ? 'Filipino ang napili.' : ''}
      </div>
    </div>
  )
}

function ReportRoute() {
  const navigate = useNavigate()
  return <ReportFlow onClose={() => navigate('/')} />
}

function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20 text-center">
      <h1 className="text-3xl font-bold text-[#0f2342]">Page not found</h1>
      <Link to="/" className="mt-4 inline-block font-semibold text-[#1e3a8a]">
        Return to Tugon home
      </Link>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <RouterRoute path="/" element={<HomePage />} />
      <RouterRoute path="/report" element={<ReportRoute />} />
      <RouterRoute path="/track" element={<TrackPage />} />
      <RouterRoute path="/progress" element={<ProgressPage />} />
      <RouterRoute path="/how-it-works" element={<HowItWorksPage />} />
      <RouterRoute path="/officer" element={<OfficerDashboard />} />
      <RouterRoute path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App