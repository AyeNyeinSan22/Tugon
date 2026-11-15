import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Construction,
  Droplets,
  Filter,
  Loader2,
  LogOut,
  MapPin,
  RefreshCw,
  Route as RouteIcon,
  ShieldAlert,
  Sparkles,
  Lock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLanguage } from './LanguageProvider'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import type { ReportRow } from './lib/supabase'
import OfficerCases from './OfficerCases'

type StatusFilter = 'all' | ReportRow['status']

type QueueItem = ReportRow & {
  CategoryIcon: LucideIcon
}

const DEMO_QUEUE: QueueItem[] = [
  {
    id: 'demo-1',
    tracking_code: 'TUG-2026-0124',
    problem: 'Damaged road',
    address: 'Mabini Street',
    landmark: 'Near the elementary school gate',
    description: 'Deep pothole across one lane. Cars swerve into oncoming traffic to avoid it.',
    timing: 'Morning',
    phone: '0917 000 0001',
    risk_questions: ['Yes', 'Yes', 'No'],
    status: 'new',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    CategoryIcon: RouteIcon,
  },
  {
    id: 'demo-2',
    tracking_code: 'TUG-2026-0118',
    problem: 'Blocked drainage',
    address: 'Rizal Avenue corner Bonifacio Street',
    landmark: 'Brgy. Sample covered court',
    description: 'Storm drain clogged with silt and plastic. Water rises above the curb when it rains.',
    timing: 'Afternoon',
    phone: '0917 000 0002',
    risk_questions: ['No', 'No', 'Yes'],
    status: 'in_progress',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    CategoryIcon: Droplets,
  },
  {
    id: 'demo-3',
    tracking_code: 'TUG-2026-0109',
    problem: 'Unfinished project',
    address: 'Public Market Gate 2 frontage',
    landmark: 'Fronting Public Market Gate 2',
    description: 'Sidewalk drainage excavation left open for weeks with no barrier or signage.',
    timing: 'Any time',
    phone: '0917 000 0003',
    risk_questions: ['Yes', 'Yes', 'Yes'],
    status: 'new',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    CategoryIcon: Construction,
  },
  {
    id: 'demo-4',
    tracking_code: 'TUG-2026-0097',
    problem: 'Unsafe construction',
    address: 'P. Burgos Street widening site',
    landmark: 'Near the chapel',
    description: 'Open trench beside the sidewalk with no reflective barrier at night.',
    timing: 'Evening',
    phone: '0917 000 0004',
    risk_questions: ['Yes', 'No', 'Yes'],
    status: 'resolved',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    CategoryIcon: ShieldAlert,
  },
]

const categoryIconFor = (problem: string): LucideIcon => {
  const normalized = problem.toLowerCase()
  if (normalized.includes('drain') || normalized.includes('flood')) return Droplets
  if (normalized.includes('construction') || normalized.includes('unfinished') || normalized.includes('project')) return Construction
  if (normalized.includes('unsafe') || normalized.includes('pit')) return ShieldAlert
  return RouteIcon
}

const statusMeta: Record<ReportRow['status'], { label: string; pill: string }> = {
  new: { label: 'New', pill: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]' },
  in_progress: { label: 'In progress', pill: 'border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]' },
  resolved: { label: 'Resolved', pill: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]' },
}

const filters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.max(0, Math.round(diffMs / 60000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

// Demo credentials shown to judges — create this exact user in Supabase
// Authentication -> Users -> Add user (Auto Confirm ON)
export const DEMO_OFFICER = {
  email: 'officer@tugon.test',
  password: 'tugon123',
}

function OfficerLogin({ onSignedIn }: { onSignedIn: () => void }) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setSubmitting(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message.includes('Invalid login')
        ? 'Invalid email or password. Try again.'
        : signInError.message)
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    onSignedIn()
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="rounded-2xl border border-[#d5dee5] bg-white p-6 shadow-[0_6px_24px_rgba(15,35,66,0.06)] sm:p-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-[#1e3a8a] text-white" aria-hidden="true">
            <Lock className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#516575]">TUGON</p>
            <h1 className="text-lg font-bold text-[#0f2342]">{t('Staff workspace')}</h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#516575]">
          {t('Sign in with your officer account to review community reports.')}
        </p>

        {/* Demo credentials for judges */}
        <div className="mt-4 rounded-lg border-2 border-dashed border-[#facc15] bg-[#fffbeb] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#92400e]">
            {t('Demo credentials')}
          </p>
          <p className="mt-1.5 font-mono text-sm font-bold text-[#0f2342]">
            {DEMO_OFFICER.email}
          </p>
          <p className="font-mono text-sm font-bold text-[#0f2342]">
            {DEMO_OFFICER.password}
          </p>
          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_OFFICER.email)
              setPassword(DEMO_OFFICER.password)
              setError('')
            }}
            className="mt-2.5 rounded-lg bg-[#facc15] px-4 py-1.5 text-xs font-bold text-[#0f2342] transition hover:bg-[#eab308]"
          >
            {t('Use demo account')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="officer-email" className="block text-xs font-semibold text-[#0f2342]">
              {t('Email')}
            </label>
            <input
              id="officer-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#d5dee5] px-3.5 py-2.5 text-sm text-[#0f2342] outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/15"
              placeholder="officer@gov.ph"
            />
          </div>
          <div>
            <label htmlFor="officer-password" className="block text-xs font-semibold text-[#0f2342]">
              {t('Password')}
            </label>
            <input
              id="officer-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#d5dee5] px-3.5 py-2.5 text-sm text-[#0f2342] outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/15"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#1e3a8a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172554] disabled:opacity-60"
          >
            {submitting ? t('Signing in…') : t('Sign in')}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-5 text-[#8998a5]">
          {t('Accounts are created by the project team in Supabase.')}
        </p>
      </div>
      <Link to="/" className="mt-4 text-center text-sm font-semibold text-[#1e3a8a] hover:underline">
        {t('Back to home')}
      </Link>
    </main>
  )
}

export default function OfficerDashboard() {
  const { t } = useLanguage()
  const [items, setItems] = useState<QueueItem[]>(DEMO_QUEUE)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [officerEmail, setOfficerEmail] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setOfficerEmail(data.session?.user.email ?? null)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setOfficerEmail(session?.user.email ?? null)
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const signedIn = !isSupabaseConfigured || officerEmail !== null

  const loadReports = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return
    setLoading(true)
    setNotice(null)
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      setNotice('Could not reach the reports table yet. Showing sample queue data.')
    } else if (data && data.length > 0) {
      setItems(
        (data as ReportRow[]).map((row) => ({
          ...row,
          CategoryIcon: categoryIconFor(row.problem),
        })),
      )
    } else {
      setNotice('No live reports found yet. Showing sample queue data.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  const updateStatus = async (id: string, status: ReportRow['status']) => {
    const next = items.map((item) => (item.id === id ? { ...item, status } : item))
    setItems(next)

    if (!isSupabaseConfigured || !supabase) {
      setNotice('Sample queue updated locally. Connect Supabase to persist status changes.')
      return
    }

    const { error } = await supabase.from('reports').update({ status }).eq('id', id)
    if (error) {
      setNotice('Status could not be saved to the server. The local view was still updated.')
    } else {
      setNotice('Status saved.')
    }
  }

  const visible = items.filter((item) => filter === 'all' || item.status === filter)

  if (!authReady) {
    return (
      <main className="mx-auto flex min-h-[50vh] w-full max-w-md items-center justify-center px-5">
        <Loader2 className="size-6 animate-spin text-[#1e3a8a]" aria-hidden="true" />
        <span className="sr-only">{t('Loading…')}</span>
      </main>
    )
  }

  if (!signedIn) {
    // onAuthStateChange above updates officerEmail once sign-in succeeds
    return <OfficerLogin onSignedIn={() => undefined} />
  }

  const counts = {
    all: items.length,
    new: items.filter((i) => i.status === 'new').length,
    in_progress: items.filter((i) => i.status === 'in_progress').length,
    resolved: items.filter((i) => i.status === 'resolved').length,
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1e3a8a] hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('Back to home')}
      </Link>

      <header className="mt-5 border-b border-[#d5dee5] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#516575]">
          {t('OFFICER WORKSPACE')}
        </p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-[#0f2342]">
          {t('Report review queue')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#516575]">
          {t(
            'Incoming community reports, ordered newest first. Update a status to move a report along.',
          )}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {officerEmail && (
            <span className="text-xs font-medium text-[#516575]">
              {t('Signed in as')} <span className="font-semibold text-[#0f2342]">{officerEmail}</span>
            </span>
          )}
          {isSupabaseConfigured && (
            <button
              type="button"
              onClick={() => void supabase?.auth.signOut()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#d5dee5] bg-white px-3.5 py-2 text-xs font-semibold text-[#516575] transition hover:border-[#1e3a8a] hover:text-[#1e3a8a]"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              {t('Sign out')}
            </button>
          )}
        </div>
      </header>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('Filter by status')}>
          <Filter className="size-4 text-[#516575]" aria-hidden="true" />
          {filters.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === option.value
                  ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white'
                  : 'border-[#d5dee5] bg-white text-[#516575] hover:border-[#1e3a8a] hover:text-[#1e3a8a]'
              }`}
            >
              {t(option.label)} · {counts[option.value]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void loadReports()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[#d5dee5] bg-white px-3.5 py-2 text-xs font-semibold text-[#153550] transition hover:border-[#1e3a8a] hover:text-[#1e3a8a] disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          {t('Refresh')}
        </button>
      </div>

      {notice && (
        <p className="mt-3 rounded-lg border border-[#d5dee5] bg-[#f7f9fb] px-4 py-2.5 text-xs text-[#516575]" aria-live="polite">
          {notice}
        </p>
      )}

      {!isSupabaseConfigured && (
        <p className="mt-3 rounded-lg border border-[#fed7aa] bg-[#fff7ed] px-4 py-2.5 text-xs text-[#c2410c]" aria-live="polite">
          {t('Supabase is not configured. You are viewing sample queue data.')}
        </p>
      )}

      <ul className="mt-5 space-y-3">
        {visible.map((item) => {
          const Icon = item.CategoryIcon
          const meta = statusMeta[item.status]
          return (
            <li
              key={item.id}
              className="rounded-xl border border-[#d5dee5] bg-white p-4 shadow-xs sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#eff6ff] text-[#1e3a8a]" aria-hidden="true">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8998a5]">
                      {item.tracking_code} · {t(item.problem)}
                    </p>
                    <h2 className="mt-0.5 truncate text-base font-semibold text-[#0f2342]">
                      {item.address}
                    </h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#516575]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {item.landmark || t('No landmark given')}
                      </span>
                      <span>{t(timeAgo(item.created_at))}</span>
                    </p>
                  </div>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold ${meta.pill}`}>
                  {t(meta.label)}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#516575]">{item.description}</p>

              {/* AI Summary — placeholder until datasets are connected */}
              <div className="mt-3 rounded-lg border border-[#e0e7ff] bg-[#f5f7ff] px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                  aria-expanded={expandedId === item.id}
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1e3a8a]">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    {t('AI Summary')}
                  </span>
                  <span className="text-[11px] font-medium text-[#516575]">
                    {expandedId === item.id ? t('Hide') : t('Show')}
                  </span>
                </button>
                {expandedId === item.id && (
                  <p className="mt-2 text-xs leading-5 text-[#516575]">
                    {t(
                      'Coming soon — this section will summarize the report and match nearby government projects once the datasets are connected.',
                    )}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#eef2f5] pt-3">
                <span className="mr-1 text-xs font-semibold text-[#8998a5]">{t('Set status')}</span>
                {(['new', 'in_progress', 'resolved'] as ReportRow['status'][]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => void updateStatus(item.id, status)}
                    disabled={item.status === status}
                    aria-current={item.status === status ? 'true' : undefined}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      item.status === status
                        ? 'cursor-default border border-[#1e3a8a] bg-[#eff6ff] text-[#1e3a8a]'
                        : 'border border-[#d5dee5] bg-white text-[#516575] hover:border-[#1e3a8a] hover:text-[#1e3a8a]'
                    }`}
                  >
                    {t(statusMeta[status].label)}
                    {item.status === status && (
                      <CheckCircle2 className="ml-1 inline size-3.5" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </li>
          )
        })}
      </ul>

      {visible.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-[#d5dee5] bg-[#f7f9fb] px-5 py-10 text-center text-sm text-[#516575]">
          {t('No reports match this filter.')}
        </p>
      )}

      {/* Public progress cases built from these reports */}
      <OfficerCases reports={items.map((item) => ({ id: item.id, trackingCode: item.tracking_code, label: `${item.problem} · ${item.address}` }))} />

      <p className="mt-6 text-xs leading-5 text-[#8998a5]">
        {t('Demonstration workspace · status changes persist only when Supabase is connected.')}
      </p>
    </main>
  )
}
