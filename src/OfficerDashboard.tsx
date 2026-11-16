import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronDown,
  Clock,
  FolderPlus,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  RefreshCw,
} from 'lucide-react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { useLanguage } from './LanguageProvider'
import { supabase, isSupabaseConfigured, type ReportRow } from './lib/supabase'
import {
  addCaseUpdate,
  createCase,
  getReportLinks,
  linkReportToCase,
  listAllCases,
  setCasePublished,
  STAGES,
  STAGE_LABEL,
  type CaseSource,
  type CaseStage,
  type PublicCase,
} from './lib/cases'
import './officer/officer.css'

// Demo officer credentials
export const DEMO_OFFICER = {
  email: 'officer@tugon.test',
  password: 'tugon123',
}

export type OfficerPage = 'queue' | 'map' | 'projects' | 'cases' | 'update' | 'audit' | 'review'
export type PriorityLevel = 'High' | 'Medium' | 'Low'
export type UpdateStatus = 'Under review' | 'Sent to office' | 'Action taken' | 'Resolved'

export interface ExtendedReport {
  id: string
  tracking_code: string
  problem: string
  address: string
  landmark: string
  description: string
  timing: string
  phone: string
  risk_questions: string[]
  status: ReportRow['status']
  created_at: string
  priority: PriorityLevel
  match: string
  reportsCount: number
  assignedOffice?: string
  priorityReason?: string
  coordinates?: [number, number]
  photoUrls?: string[]
}

export interface OfficerProject {
  id: string
  title: string
  office: string
  status: string
  budget: string
  contractor: string
  startDate: string
  endDate: string
  location: string
  matchedReportsCount: number
  sourceDocs: string[]
}

export interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: string
  target: string
  detail: string
  tag: 'AI' | 'OFFICER' | 'SYSTEM'
}

const DEMO_PROJECTS: OfficerProject[] = [
  {
    id: 'proj-1',
    title: 'Mabini Street Road Rehabilitation & Drainage Improvement',
    office: 'DPWH Sample District Engineering Office',
    status: 'Ongoing',
    budget: '₱12.4M',
    contractor: 'Sample Builders Inc.',
    startDate: 'Sep 2026',
    endDate: 'Dec 2026',
    location: 'Mabini St., Brgy. Sample',
    matchedReportsCount: 5,
    sourceDocs: ['Project Contract 2026-A12.pdf', 'Program of Works Sep-2026.pdf', 'DPWH Registry ↗'],
  },
  {
    id: 'proj-2',
    title: 'Rizal Avenue Stormwater Drainage Rehabilitation',
    office: 'DPWH Sample District Engineering Office',
    status: 'Bidding / Preparation',
    budget: '₱8.7M',
    contractor: 'Southern Infra Corp.',
    startDate: 'Oct 2026',
    endDate: 'Jan 2027',
    location: 'Rizal Ave., Brgy. Sample',
    matchedReportsCount: 3,
    sourceDocs: ['Drainage Assessment Report.pdf', 'Notice to Proceed.pdf'],
  },
  {
    id: 'proj-3',
    title: 'Poblacion Commercial District Sidewalk Modernization',
    office: 'Municipal Engineering Office',
    status: 'Ongoing · Work Stoppage Notice Issued',
    budget: '₱5.2M',
    contractor: 'Batangas Urban Builders',
    startDate: 'Jul 2026',
    endDate: 'Nov 2026',
    location: 'Poblacion Main Street',
    matchedReportsCount: 4,
    sourceDocs: ['City Council Resolution No. 44.pdf', 'Site Inspection Log.pdf'],
  },
  {
    id: 'proj-4',
    title: 'Provincial Bridge & Approach Shoulder Stabilization',
    office: 'Provincial Engineering Office',
    status: 'Scheduled',
    budget: '₱14.8M',
    contractor: 'Luzon Highway Construct',
    startDate: 'Nov 2026',
    endDate: 'Mar 2027',
    location: 'Sample Bridge Rd.',
    matchedReportsCount: 2,
    sourceDocs: ['Bridge Integrity Report 2026.pdf'],
  },
]

const INITIAL_AUDIT_LOG: AuditEntry[] = [
  {
    id: 'aud-1',
    timestamp: 'Nov 15, 2026 · 10:22 AM',
    user: 'AI Classifier',
    action: 'Analyzed report',
    target: 'TUG-2026-0124',
    detail: 'Suggested priority High based on proximity to school gate and road hazard description.',
    tag: 'AI',
  },
  {
    id: 'aud-2',
    timestamp: 'Nov 15, 2026 · 10:35 AM',
    user: 'Officer A (officer@tugon.test)',
    action: 'Confirmed priority & assigned office',
    target: 'TUG-2026-0124',
    detail: 'Confirmed High priority and routed to DPWH Sample District Engineering Office.',
    tag: 'OFFICER',
  },
  {
    id: 'aud-3',
    timestamp: 'Nov 15, 2026 · 11:04 AM',
    user: 'Officer A (officer@tugon.test)',
    action: 'Grouped reports',
    target: 'Mabini St. Cluster',
    detail: 'Grouped 5 citizen reports together sharing coordinates along Mabini Street segment.',
    tag: 'OFFICER',
  },
  {
    id: 'aud-4',
    timestamp: 'Nov 15, 2026 · 1:15 PM',
    user: 'Officer A (officer@tugon.test)',
    action: 'Posted public progress update',
    target: 'CASE-0001',
    detail: 'Status moved to Work Scheduled. Before photos attached with privacy check confirmation.',
    tag: 'OFFICER',
  },
  {
    id: 'aud-5',
    timestamp: 'Nov 15, 2026 · 3:40 PM',
    user: 'System Notification',
    action: 'Dispatched citizen notifications',
    target: 'TUG-2026-0124',
    detail: 'Automated SMS sent to citizen reporter acknowledging case review by district engineer.',
    tag: 'SYSTEM',
  },
]

const DEMO_REPORTS: ExtendedReport[] = [
  {
    id: 'demo-1',
    tracking_code: 'TUG-2026-0124',
    problem: 'Damaged road',
    address: 'Mabini St., Brgy. Sample',
    landmark: 'Near the elementary school gate',
    description: 'Deep pothole across one lane. Cars and motorcycles swerve into oncoming traffic to avoid it.',
    timing: 'Morning',
    phone: '0917 000 0001',
    risk_questions: ['Yes', 'Yes', 'No'],
    status: 'in_progress',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    priority: 'High',
    match: 'Likely · 72%',
    reportsCount: 5,
    assignedOffice: 'DPWH Sample District Engineering Office',
    coordinates: [13.7538, 121.0601],
    photoUrls: [
      '/sample-photos/pothole-1.jpg',
      '/sample-photos/pothole-2.jpg',
    ],
  },
  {
    id: 'demo-2',
    tracking_code: 'TUG-2026-0118',
    problem: 'Blocked drainage',
    address: 'Rizal Ave., Brgy. Sample',
    landmark: 'Brgy. Sample covered court',
    description: 'Open drainage cover, no barrier. Water rises above the curb when it rains.',
    timing: 'Afternoon',
    phone: '0917 000 0002',
    risk_questions: ['No', 'No', 'Yes'],
    status: 'new',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    priority: 'High',
    match: 'Likely · 81%',
    reportsCount: 3,
    coordinates: [13.7506, 121.0539],
    photoUrls: [
      '/sample-photos/drain-1.jpg',
    ],
  },
  {
    id: 'demo-3',
    tracking_code: 'TUG-2026-0109',
    problem: 'Damaged road',
    address: 'Sample Bridge Rd.',
    landmark: 'Bridge approach slope',
    description: 'Cracked road shoulder at bridge approach. Soft soil underneath causing edge erosion.',
    timing: 'Any time',
    phone: '0917 000 0003',
    risk_questions: ['Yes', 'Yes', 'No'],
    status: 'new',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    priority: 'Medium',
    match: 'Possible · 54%',
    reportsCount: 2,
    coordinates: [13.7621, 121.0645],
    photoUrls: [
      '/sample-photos/pothole-2.jpg',
    ],
  },
  {
    id: 'demo-4',
    tracking_code: 'TUG-2026-0097',
    problem: 'Unfinished project',
    address: 'Poblacion Main Street',
    landmark: 'Fronting Public Market Gate 2',
    description: 'Unfinished sidewalk, work stopped. Sidewalk drainage excavation left open for weeks with no barrier or signage.',
    timing: 'Morning',
    phone: '0917 000 0004',
    risk_questions: ['Yes', 'Yes', 'Yes'],
    status: 'in_progress',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
    priority: 'Medium',
    match: 'Likely · 77%',
    reportsCount: 4,
    assignedOffice: 'Municipal Engineering Office',
    coordinates: [13.7591, 121.0527],
  },
  {
    id: 'demo-5',
    tracking_code: 'TUG-2026-0085',
    problem: 'Damaged road',
    address: 'Sample Ave. near Kilometer 12',
    landmark: 'Beside petrol station',
    description: 'Faded road markings along multi-lane segment. Hard to see lane dividers during heavy rain.',
    timing: 'Evening',
    phone: '0917 000 0005',
    risk_questions: ['No', 'No', 'No'],
    status: 'new',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    priority: 'Low',
    match: 'No match',
    reportsCount: 1,
    coordinates: [13.7482, 121.0491],
  },
  {
    id: 'demo-6',
    tracking_code: 'TUG-2026-0072',
    problem: 'Damaged road',
    address: 'Brgy. Sample 2 Inner Access',
    landmark: 'Near basketball court',
    description: 'Minor surface crack across concrete slab. No vehicle damage reported.',
    timing: 'Afternoon',
    phone: '0917 000 0006',
    risk_questions: ['No', 'No', 'No'],
    status: 'resolved',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    priority: 'Low',
    match: 'Possible · 48%',
    reportsCount: 1,
    coordinates: [13.7654, 121.0568],
  },
]

function formatAge(iso: string): { label: string; isOverdue: boolean } {
  const diffMs = Date.now() - new Date(iso).getTime()
  const days = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))
  if (days >= 21) {
    const weeks = Math.round(days / 7)
    return { label: `${weeks} wks · Overdue`, isOverdue: true }
  }
  if (days >= 7) {
    const weeks = Math.round(days / 7)
    return { label: `${weeks} wk${weeks === 1 ? '' : 's'}`, isOverdue: false }
  }
  if (days === 0) {
    const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)))
    return { label: `${hours} hr${hours === 1 ? '' : 's'}`, isOverdue: false }
  }
  return { label: `${days} day${days === 1 ? '' : 's'}`, isOverdue: false }
}

function inferPriority(report: ReportRow): PriorityLevel {
  const prob = (report.problem || '').toLowerCase()
  const desc = (report.description || '').toLowerCase()
  const dangerAnswers = (report.risk_questions || []).filter((a) => a === 'Yes').length
  if (dangerAnswers >= 2 || prob.includes('unsafe') || desc.includes('hole') || desc.includes('deep')) {
    return 'High'
  }
  if (dangerAnswers === 1 || prob.includes('drain') || prob.includes('unfinished')) {
    return 'Medium'
  }
  return 'Low'
}

/* ==========================================================================
   OFFICER LOGIN COMPONENT
   ========================================================================== */
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
      setError(
        signInError.message.includes('Invalid login')
          ? 'Invalid email or password. Try again.'
          : signInError.message,
      )
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    onSignedIn()
  }

  return (
    <div className="app-shell flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#ccd7df] bg-white p-7 shadow-[0_8px_30px_rgb(22_50_79/0.08)] sm:p-9">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-[#16868a] text-white">
            <Lock className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#526277]">TUGON</p>
            <h1 className="text-xl font-bold text-[#16324f]">{t('Staff workspace')}</h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#526277]">
          {t('Sign in with your officer account to review community reports and manage cases.')}
        </p>

        {/* Demo credentials for judges */}
        <div className="mt-5 rounded-lg border-2 border-dashed border-[#facc15] bg-[#fffbeb] p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#92400e]">
            {t('Demo credentials')}
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-[#16324f]">{DEMO_OFFICER.email}</p>
          <p className="font-mono text-sm font-bold text-[#16324f]">{DEMO_OFFICER.password}</p>
          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_OFFICER.email)
              setPassword(DEMO_OFFICER.password)
              setError('')
            }}
            className="mt-2.5 rounded-lg bg-[#facc15] px-3.5 py-1.5 text-xs font-bold text-[#0f2342] transition hover:bg-[#eab308]"
          >
            {t('Use demo account')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="officer-email" className="block text-xs font-semibold text-[#16324f]">
              {t('Email')}
            </label>
            <input
              id="officer-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#ccd7df] px-3.5 py-2.5 text-sm text-[#233548] outline-none focus:border-[#006b70] focus:ring-2 focus:ring-[#006b70]/15"
              placeholder="officer@gov.ph"
            />
          </div>
          <div>
            <label htmlFor="officer-password" className="block text-xs font-semibold text-[#16324f]">
              {t('Password')}
            </label>
            <input
              id="officer-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#ccd7df] px-3.5 py-2.5 text-sm text-[#233548] outline-none focus:border-[#006b70] focus:ring-2 focus:ring-[#006b70]/15"
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
            className="w-full rounded-lg bg-[#006b70] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00575b] disabled:opacity-60"
          >
            {submitting ? t('Signing in…') : t('Sign in')}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-5 text-[#8998a5]">
          {t('Accounts are created by the project team in Supabase.')}
        </p>
      </div>

      <Link to="/" className="mt-5 text-sm font-semibold text-[#006b70] hover:underline">
        ← {t('Back to home')}
      </Link>
    </div>
  )
}

/* ==========================================================================
   OFFICER HEADER & SIDEBAR NAVIGATION
   ========================================================================== */
function OfficerHeader({
  officerEmail,
  onNavigate,
  onSignOut,
}: {
  officerEmail: string | null
  onNavigate: (page: OfficerPage) => void
  onSignOut: () => void
}) {
  const [userDropdown, setUserDropdown] = useState(false)

  return (
    <header className="topbar">
      <button
        className="brand"
        type="button"
        aria-label="Go to report queue"
        onClick={() => onNavigate('queue')}
      >
        <span className="brand-mark" />
        <span className="brand-name">tugon</span>
        <span className="workspace-label">Staff workspace</span>
      </button>

      <div className="office-meta relative">
        <span className="text-white/85 text-xs sm:text-sm">DPWH · Sample District Office (pilot)</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserDropdown(!userDropdown)}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-white hover:bg-white/10"
          >
            <span>{officerEmail ? officerEmail.split('@')[0] : 'Officer A'}</span>
            <ChevronDown className="size-3.5" />
          </button>

          {userDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-[#ccd7df] bg-white p-2 text-xs shadow-lg z-50 text-[#233548]">
              {officerEmail && (
                <div className="px-3 py-2 border-b border-[#edf2f5] mb-1">
                  <p className="font-semibold truncate">{officerEmail}</p>
                  <p className="text-[#526277] text-[11px]">Staff Officer</p>
                </div>
              )}
              <Link
                to="/"
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-[#233548] hover:bg-[#edf2f5]"
              >
                <ArrowLeft className="size-3.5 text-[#526277]" />
                Public Home
              </Link>
              {isSupabaseConfigured && (
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdown(false)
                    onSignOut()
                  }}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function OfficerSidebar({
  page,
  onNavigate,
}: {
  page: OfficerPage
  onNavigate: (page: OfficerPage) => void
}) {
  const navItems: { id: OfficerPage; label: string }[] = [
    { id: 'queue', label: 'Queue' },
    { id: 'map', label: 'Map view' },
    { id: 'projects', label: 'Projects' },
    { id: 'cases', label: 'Grouped reports' },
    { id: 'update', label: 'Updates and evidence' },
    { id: 'audit', label: 'Audit log' },
  ]

  return (
    <aside className="sidebar" aria-label="Staff navigation">
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={page === item.id ? 'nav-item active' : 'nav-item'}
          onClick={() => onNavigate(item.id)}
        >
          {item.label}
        </button>
      ))}
      <div className="mt-auto pt-6 border-t border-[#ccd7df]">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#526277] hover:text-[#006b70] hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Exit to Public site
        </Link>
      </div>
    </aside>
  )
}

/* ==========================================================================
   PAGE 1: QUEUE PAGE
   ========================================================================== */
function QueueView({
  reports,
  loading,
  notice,
  onRefresh,
  onSelectReport,
  onSwitchToMap,
}: {
  reports: ExtendedReport[]
  loading: boolean
  notice: string | null
  onRefresh: () => void
  onSelectReport: (report: ExtendedReport) => void
  onSwitchToMap: () => void
}) {
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const counts = useMemo(() => {
    return {
      new: reports.filter((r) => r.status === 'new').length,
      underReview: reports.filter((r) => r.status === 'in_progress').length,
      resolved: reports.filter((r) => r.status === 'resolved').length,
      overdue: reports.filter((r) => formatAge(r.created_at).isOverdue).length,
    }
  }, [reports])

  const visibleReports = useMemo(() => {
    return reports.filter((r) => {
      const matchPriority = priorityFilter === 'All' || r.priority === priorityFilter
      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'New' && r.status === 'new') ||
        (statusFilter === 'Under review' && r.status === 'in_progress') ||
        (statusFilter === 'Resolved' && r.status === 'resolved')
      const text = `${r.tracking_code} ${r.problem} ${r.address} ${r.landmark} ${r.description} ${r.match}`.toLowerCase()
      const matchQuery = !query || text.includes(query.toLowerCase())
      return matchPriority && matchStatus && matchQuery
    })
  }, [reports, priorityFilter, statusFilter, query])

  return (
    <>
      <div className="page-heading queue-heading">
        <div className="flex items-center gap-3">
          <h1>Report queue</h1>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 text-[#526277] hover:text-[#006b70] rounded-full hover:bg-white transition"
            title="Refresh queue"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="summary-chips">
          <span className="chip teal">{counts.new} new</span>
          <span className="chip amber">{counts.underReview} under review</span>
          <span className="chip red">{counts.overdue} overdue</span>
        </div>
      </div>

      {notice && (
        <div className="mt-3 rounded-lg border border-[#ccd7df] bg-[#e7f3f3] px-4 py-2.5 text-xs text-[#16324f]">
          {notice}
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="mt-3 rounded-lg border border-[#fed7aa] bg-[#fff7ed] px-4 py-2.5 text-xs text-[#c2410c]">
          Supabase is not configured. Viewing sample queue data.
        </div>
      )}

      <div className="filters">
        <input
          aria-label="Search reports"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reports, streets, tracking codes…"
        />
        <select
          aria-label="Priority filter"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select
          aria-label="Status filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="New">New</option>
          <option value="Under review">Under review</option>
          <option value="Resolved">Resolved</option>
        </select>
        <div className="segmented compact">
          <button className="selected" type="button">
            List
          </button>
          <button type="button" onClick={onSwitchToMap}>
            Map
          </button>
        </div>
      </div>

      <div className="priority-note">
        <strong>SET PRIORITY</strong> · Review a case → check the evidence → choose High, Medium, or
        Low → confirm priority &amp; assignment.
        <br />
        AI suggestions are not final. Consider danger, severity, duration, and evidence—not
        complaint volume alone.
      </div>

      <div className="report-table" role="table">
        <div className="report-row report-head" role="row">
          <span>Priority (AI suggested)</span>
          <span>Summary &amp; Code</span>
          <span>Location</span>
          <span>Project match</span>
          <span>Reports</span>
          <span>Age</span>
          <span>Status</span>
        </div>

        {visibleReports.map((report) => {
          const tone =
            report.priority === 'High' ? 'red' : report.priority === 'Medium' ? 'amber' : 'green'
          const ageInfo = formatAge(report.created_at)

          return (
            <button
              className="report-row report-data"
              type="button"
              role="row"
              key={report.id}
              onClick={() => onSelectReport(report)}
            >
              <span className="priority-cell">
                <span className={`chip ${tone}`}>{report.priority}</span>
                <small>Review priority →</small>
              </span>
              <div>
                <strong>{report.problem}</strong>
                <p className="text-xs text-[#526277] truncate">{report.description}</p>
                <span className="text-[11px] font-mono text-[#8998a5]">{report.tracking_code}</span>
              </div>
              <span>
                <div className="flex items-center gap-1">
                  <MapPin className="size-3 text-[#526277] shrink-0" />
                  <span className="truncate">{report.address}</span>
                </div>
                {report.landmark && (
                  <small className="text-[#526277] block truncate">{report.landmark}</small>
                )}
              </span>
              <span>{report.match}</span>
              <span>{report.reportsCount}</span>
              <span className={ageInfo.isOverdue ? 'overdue' : ''}>{ageInfo.label}</span>
              <span>
                <span
                  className={`chip ${
                    report.status === 'resolved'
                      ? 'green'
                      : report.status === 'in_progress'
                      ? 'amber'
                      : 'teal'
                  }`}
                >
                  {report.status === 'in_progress'
                    ? 'Under review'
                    : report.status === 'resolved'
                    ? 'Resolved'
                    : 'New'}
                </span>
              </span>
            </button>
          )
        })}

        {visibleReports.length === 0 && (
          <div className="empty-state">No reports match these filters.</div>
        )}
      </div>
    </>
  )
}

/* ==========================================================================
   PAGE 2: MAP VIEW
   ========================================================================== */
const BATANGAS_CENTER: LatLngExpression = [13.7563, 121.0583]

function OfficerMapView({
  reports,
  onSelectReport,
}: {
  reports: ExtendedReport[]
  onSelectReport: (report: ExtendedReport) => void
}) {
  const [selectedPin, setSelectedPin] = useState<ExtendedReport | null>(null)
  const [filterPriority, setFilterPriority] = useState<string>('All')

  const filtered = useMemo(() => {
    return reports.filter((r) => filterPriority === 'All' || r.priority === filterPriority)
  }, [reports, filterPriority])

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Map view</h1>
          <p className="mt-1 text-sm text-[#526277]">
            Geographic view of incoming community reports and hazard severity clustering.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Danger</option>
            <option value="Medium">Medium Concern</option>
            <option value="Low">Low / Minor</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-[520px] overflow-hidden rounded-xl border border-[#ccd7df] bg-white relative">
          <MapContainer
            center={BATANGAS_CENTER}
            zoom={14}
            scrollWheelZoom
            className="h-full w-full z-0"
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {filtered.map((item, idx) => {
              const pos: LatLngExpression = item.coordinates || [
                13.7563 + (idx % 3 === 0 ? 0.005 : -0.004) * ((idx + 1) * 0.4),
                121.0583 + (idx % 2 === 0 ? -0.006 : 0.005) * ((idx + 1) * 0.4),
              ]
              const color =
                item.priority === 'High' ? '#a32626' : item.priority === 'Medium' ? '#d97706' : '#16a34a'

              return (
                <CircleMarker
                  key={item.id}
                  center={pos}
                  radius={10}
                  eventHandlers={{
                    click: () => setSelectedPin(item),
                  }}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 2,
                    fillColor: color,
                    fillOpacity: 0.9,
                  }}
                >
                  <Popup>
                    <strong>{item.tracking_code}</strong>
                    <br />
                    {item.problem} - {item.address}
                    <br />
                    <span className="text-xs text-[#526277]">{item.match}</span>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        </div>

        {/* Selected or Inspector panel */}
        <div className="space-y-3">
          <div className="card">
            <h3 className="text-base text-[#16324f]">Map Pin Inspector</h3>
            {selectedPin ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#006b70]">{selectedPin.tracking_code}</span>
                  <span
                    className={`chip ${
                      selectedPin.priority === 'High'
                        ? 'red'
                        : selectedPin.priority === 'Medium'
                        ? 'amber'
                        : 'green'
                    }`}
                  >
                    {selectedPin.priority}
                  </span>
                </div>
                <p className="font-semibold text-sm text-[#16324f]">{selectedPin.problem}</p>
                <p className="text-[#526277]">{selectedPin.address}</p>
                <p className="text-[#526277] italic">“{selectedPin.description}”</p>
                <div className="pt-2 border-t border-[#ccd7df]">
                  <p>
                    <strong>Project Match:</strong> {selectedPin.match}
                  </p>
                  <p>
                    <strong>Reports:</strong> {selectedPin.reportsCount} citizen submissions
                  </p>
                </div>
                <button
                  type="button"
                  className="button w-full mt-3"
                  onClick={() => onSelectReport(selectedPin)}
                >
                  Review Details &amp; Assign →
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#526277]">
                Click on any colored hazard marker on the map to inspect report details or open the full review workflow.
              </p>
            )}
          </div>

          <div className="card">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#526277]">Map Legend</h4>
            <div className="space-y-2 text-xs text-[#233548]">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-[#a32626]" />
                <span>High Priority (Safety risk, active hazard)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-[#d97706]" />
                <span>Medium Priority (Drainage/delay, needs info)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-[#16a34a]" />
                <span>Low Priority (Minor road defect / resolved)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ==========================================================================
   PAGE 3: PROJECTS PAGE
   ========================================================================== */
function ProjectsView({
  projects,
}: {
  projects: OfficerProject[]
}) {
  const [search, setSearch] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('All')

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        !search || `${p.title} ${p.contractor} ${p.location}`.toLowerCase().includes(search.toLowerCase())
      const matchOffice = selectedOffice === 'All' || p.office.includes(selectedOffice)
      return matchSearch && matchOffice
    })
  }, [projects, search, selectedOffice])

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Government Projects &amp; Contracts</h1>
          <p className="mt-1 text-sm text-[#526277]">
            Active and planned infrastructure projects used for automated report matching and verification.
          </p>
        </div>
        <div className="summary-chips">
          <span className="chip teal">{projects.length} Registered Projects</span>
        </div>
      </div>

      <div className="filters">
        <input
          placeholder="Search by project name, contractor, or street…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={selectedOffice} onChange={(e) => setSelectedOffice(e.target.value)}>
          <option value="All">All Offices</option>
          <option value="DPWH">DPWH District</option>
          <option value="Municipal">Municipal Engineering</option>
          <option value="Provincial">Provincial Engineering</option>
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {filtered.map((proj) => (
          <div key={proj.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="chip teal">{proj.office}</span>
                  <span className="chip amber">{proj.status}</span>
                </div>
                <h2 className="mt-2 text-lg text-[#16324f]">{proj.title}</h2>
                <p className="text-xs text-[#526277] flex items-center gap-1 mt-0.5">
                  <MapPin className="size-3" /> {proj.location}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase font-bold text-[#8998a5]">Allocated Budget</span>
                <p className="text-xl font-bold text-[#006b70]">{proj.budget}</p>
                <span className="chip teal mt-1">{proj.matchedReportsCount} Matched Reports</span>
              </div>
            </div>

            <div className="grid gap-2 border-t border-[#ccd7df] pt-3 text-xs sm:grid-cols-3 text-[#233548]">
              <div>
                <strong className="text-[#526277]">Contractor:</strong> {proj.contractor}
              </div>
              <div>
                <strong className="text-[#526277]">Duration:</strong> {proj.startDate} - {proj.endDate}
              </div>
              <div>
                <strong className="text-[#526277]">Source Records:</strong>{' '}
                {proj.sourceDocs.join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ==========================================================================
   PAGE 4: AUDIT LOG PAGE
   ========================================================================== */
function AuditLogView({
  logs,
}: {
  logs: AuditEntry[]
}) {
  const [filterTag, setFilterTag] = useState<string>('All')

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => filterTag === 'All' || l.tag === filterTag)
  }, [logs, filterTag])

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Audit &amp; Accountability Log</h1>
          <p className="mt-1 text-sm text-[#526277]">
            Complete tamper-evident log of officer determinations, AI suggestion audits, and case updates.
          </p>
        </div>
        <div className="summary-chips">
          <span className="chip teal">{logs.length} Total events</span>
        </div>
      </div>

      <div className="filters">
        <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
          <option value="All">All Event Types</option>
          <option value="AI">AI Determinations</option>
          <option value="OFFICER">Officer Decisions</option>
          <option value="SYSTEM">System Automations</option>
        </select>
      </div>

      <div className="card mt-6">
        <div className="divide-y divide-[#ccd7df]">
          {filteredLogs.map((log) => (
            <div key={log.id} className="py-3.5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`chip ${
                      log.tag === 'AI' ? 'teal' : log.tag === 'OFFICER' ? 'amber' : 'neutral'
                    }`}
                  >
                    {log.tag}
                  </span>
                  <strong className="text-sm text-[#16324f]">{log.action}</strong>
                  <span className="text-xs font-mono text-[#006b70]">[{log.target}]</span>
                </div>
                <p className="text-xs text-[#233548]">{log.detail}</p>
                <p className="text-[11px] text-[#8998a5]">By {log.user}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-[#526277] flex items-center gap-1">
                  <Clock className="size-3" />
                  {log.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/* ==========================================================================
   PAGE 5: REVIEW PAGE
   ========================================================================== */
function ReviewView({
  report,
  onBack,
  onUpdateStatus,
  onAssignPriority,
  notify,
}: {
  report: ExtendedReport
  onBack: () => void
  onUpdateStatus: (id: string, status: ReportRow['status']) => Promise<void>
  onAssignPriority: (id: string, priority: PriorityLevel, office: string, reason: string) => void
  notify: (msg: string) => void
}) {
  const [priority, setPriority] = useState<PriorityLevel>(report.priority)
  const [reason, setReason] = useState(report.priorityReason || '')
  const [office, setOffice] = useState(
    report.assignedOffice || 'DPWH Sample District Engineering Office',
  )
  const [activePhoto, setActivePhoto] = useState<string | null>(null)

  const handleConfirm = () => {
    onAssignPriority(report.id, priority, office, reason)
    if (report.status === 'new') {
      void onUpdateStatus(report.id, 'in_progress')
    }
    notify(`${priority} priority confirmed & assigned to ${office}.`)
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-[#006b70] hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" /> Back to Queue
        </button>
        <span className="text-[#ccd7df]">/</span>
        <span className="breadcrumbs">{report.tracking_code}</span>
      </div>

      <div className="case-title-row">
        <div className="case-title">
          <h1>{report.problem}</h1>
          <span
            className={`chip ${
              report.status === 'resolved'
                ? 'green'
                : report.status === 'in_progress'
                ? 'amber'
                : 'teal'
            }`}
          >
            {report.status === 'in_progress'
              ? 'Under review'
              : report.status === 'resolved'
              ? 'Resolved'
              : 'New'}
          </span>
        </div>
        <div className="button-row">
          <button
            className="button secondary"
            type="button"
            onClick={() => notify(`Information request sent to reporter (${report.phone || 'N/A'}).`)}
          >
            Request more info
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              void onUpdateStatus(report.id, 'in_progress')
              notify(`Case marked as Under review & assigned to ${office}.`)
            }}
          >
            Assign office
          </button>
        </div>
      </div>

      <div className="review-grid">
        {/* Column 1: Citizen Report & AI Summary */}
        <div className="column">
          <div className="card ai-summary">
            <h2>AI summary</h2>
            <p className="eyebrow normal-case">AI-generated · verify before deciding</p>
            <p>{report.description}</p>
            <strong className="amber-text">
              Timing: {report.timing || 'Not specified'} · Risk checks:{' '}
              {(report.risk_questions || []).join(', ') || 'None answered'}
            </strong>
          </div>

          <div className="card">
            <p className="eyebrow">Citizen report details</p>
            <p className="font-medium text-[#16324f]">“{report.description}”</p>
            <div className="text-xs text-[#526277] space-y-1 mt-2">
              <p>
                <strong>Location:</strong> {report.address}
              </p>
              <p>
                <strong>Landmark:</strong> {report.landmark || 'None'}
              </p>
              <p>
                <strong>Reporter phone:</strong> {report.phone || 'Hidden / Anonymous'}
              </p>
            </div>
            <div className="photo-grid two mt-3">
              {report.photoUrls && report.photoUrls.length > 0 ? (
                report.photoUrls.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActivePhoto(url)}
                    className="group relative overflow-hidden rounded-lg border border-[#ccd7df] bg-slate-100 hover:border-[#006b70] transition focus:outline-none"
                  >
                    <img
                      src={url}
                      alt={`Citizen photo ${i + 1}`}
                      className="h-28 w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                      Photo {i + 1} 🔍
                    </span>
                  </button>
                ))
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePhoto('/sample-photos/pothole-1.jpg')}
                    className="group relative overflow-hidden rounded-lg border border-[#ccd7df] bg-slate-100 hover:border-[#006b70] transition focus:outline-none"
                  >
                    <img
                      src="/sample-photos/pothole-1.jpg"
                      alt="Citizen photo 1"
                      className="h-28 w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                      Photo 1 🔍
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhoto('/sample-photos/pothole-2.jpg')}
                    className="group relative overflow-hidden rounded-lg border border-[#ccd7df] bg-slate-100 hover:border-[#006b70] transition focus:outline-none"
                  >
                    <img
                      src="/sample-photos/pothole-2.jpg"
                      alt="Citizen photo 2"
                      className="h-28 w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                      Photo 2 🔍
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Photo Lightbox Modal */}
            {activePhoto && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
                onClick={() => setActivePhoto(null)}
              >
                <div
                  className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setActivePhoto(null)}
                    className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black"
                  >
                    ✕
                  </button>
                  <img
                    src={activePhoto}
                    alt="Citizen evidence expanded"
                    className="max-h-[80vh] w-full rounded-xl object-contain"
                  />
                  <div className="p-3 text-xs text-[#526277] flex items-center justify-between">
                    <span>Citizen Evidence Photo · {report.tracking_code}</span>
                    <span>Click anywhere outside to close</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-heading">
              <h3>Grouped reports ({report.reportsCount})</h3>
              <span className="text-xs text-[#526277]">Auto-clustered by AI</span>
            </div>
            <div className="line-list text-xs">
              <div>
                <span>Report 1 · Nov 10 · with photos</span>
                <button type="button" onClick={() => notify('Report 1 opened.')}>
                  View
                </button>
              </div>
              <div>
                <span>Report 2 · Nov 6 · with photos</span>
                <button type="button" onClick={() => notify('Report 2 opened.')}>
                  View
                </button>
              </div>
              <div>
                <span>Report 3 · Oct 28</span>
                <button type="button" onClick={() => notify('Report 3 opened.')}>
                  View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Project match */}
        <div className="column">
          <div className="card">
            <div className="card-heading">
              <h3>Project match</h3>
              <span className="chip teal">{report.match}</span>
            </div>
            <h3 className="text-base text-[#16324f] mt-1">{report.address} Rehabilitation (sample)</h3>
            <dl className="details mt-2">
              <dt>Office</dt>
              <dd>{office}</dd>
              <dt>Status</dt>
              <dd>Ongoing · Sep 2026</dd>
              <dt>Budget</dt>
              <dd>₱12.4M (sample)</dd>
              <dt>Contractor</dt>
              <dd>Sample Builders Inc.</dd>
              <dt>End date</dt>
              <dd>Dec 2026</dd>
            </dl>
            <p className="eyebrow mt-3">Why this match</p>
            <p className="text-xs text-[#526277]">✓&nbsp; Same street location</p>
            <p className="text-xs text-[#526277]">✓&nbsp; Within 80 m of active project segment</p>
            <p className="text-xs text-[#526277]">✓&nbsp; Project is currently active</p>
          </div>

          <div className="card">
            <h3>Source documents</h3>
            <p className="text-xs text-[#526277]">Project list, DPWH (sample) · as of Sep 2026 ↗</p>
            <p className="text-xs text-[#526277]">Contract record (sample) ↗</p>
            <p className="text-xs text-[#526277]">Program of works (sample) ↗</p>
          </div>

          <div className="stacked-buttons">
            <button className="button" type="button" onClick={() => notify('Project match confirmed.')}>
              Confirm match
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => notify('Project selector opened.')}
            >
              Choose a different project
            </button>
          </div>
        </div>

        {/* Column 3: AI Suggestion & Priority Decision */}
        <div className="column">
          <div className="card">
            <div className="card-heading">
              <h3>AI suggestion</h3>
              <span
                className={`chip ${
                  report.priority === 'High'
                    ? 'red'
                    : report.priority === 'Medium'
                    ? 'amber'
                    : 'green'
                }`}
              >
                {report.priority}
              </span>
            </div>
            <p className="eyebrow mt-2">Basis for suggestion</p>
            <dl className="details suggestion text-xs">
              <dt>Danger reported</dt>
              <dd>{report.landmark || 'Active roadway hazard'}</dd>
              <dt>Severity</dt>
              <dd>{report.problem}</dd>
              <dt>Duration</dt>
              <dd>{formatAge(report.created_at).label}</dd>
              <dt>Supporting reports</dt>
              <dd>{report.reportsCount} related citizen submissions</dd>
            </dl>
            <p className="muted-note mt-2">Not based on complaint volume alone.</p>
          </div>

          <div className="card decision-card">
            <h2>Set final priority</h2>
            <p className="subtle">
              Review the evidence, then choose a level. AI does not set the final priority.
            </p>

            <label className="field-label">1. Choose priority</label>
            <div className="priority-options">
              {(
                [
                  ['High', 'Serious safety risk or major disruption'],
                  ['Medium', 'Needs attention; no immediate danger'],
                  ['Low', 'Minor defect with limited impact'],
                ] as [PriorityLevel, string][]
              ).map(([val, help]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPriority(val)}
                  className={`priority-option ${val.toLowerCase()} ${
                    priority === val ? 'chosen' : ''
                  }`}
                >
                  <strong>
                    {priority === val ? '●' : '○'} {val}
                    {priority === val ? ' · Selected' : ''}
                  </strong>
                  <span>{help}</span>
                </button>
              ))}
            </div>

            <label className="field-label" htmlFor="decision-reason">
              2. Reason if changing AI suggestion
            </label>
            <textarea
              id="decision-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add justification note…"
            />

            <label className="field-label" htmlFor="decision-office">
              3. Assign responsible office
            </label>
            <select
              id="decision-office"
              value={office}
              onChange={(e) => setOffice(e.target.value)}
            >
              <option>DPWH Sample District Engineering Office</option>
              <option>Municipal Engineering Office</option>
              <option>Provincial Engineering Office</option>
            </select>

            <button className="button" type="button" onClick={handleConfirm}>
              Confirm priority &amp; assignment
            </button>
          </div>

          <div className="card">
            <h3>Change Report Status</h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {(['new', 'in_progress', 'resolved'] as ReportRow['status'][]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => void onUpdateStatus(report.id, st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                    report.status === st
                      ? 'border-[#006b70] bg-[#e7f3f3] text-[#006b70]'
                      : 'border-[#ccd7df] bg-white text-[#526277] hover:border-[#006b70]'
                  }`}
                >
                  {st === 'new' ? 'New' : st === 'in_progress' ? 'In Progress' : 'Resolved'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="caution-note mt-5">
        AI suggests. The officer decides. Tugon never labels a project as corrupt or failed on its own.
      </div>
    </>
  )
}

/* ==========================================================================
   PAGE 6: POST UPDATE & EVIDENCE PAGE
   ========================================================================== */
function UpdateEvidenceView({
  reports,
  notify,
}: {
  reports: ExtendedReport[]
  notify: (msg: string) => void
}) {
  const [selectedReportId, setSelectedReportId] = useState(reports[0]?.id || '')
  const selectedReport = reports.find((r) => r.id === selectedReportId) || reports[0]

  const [status, setStatus] = useState<UpdateStatus>('Action taken')
  const [message, setMessage] = useState(
    'Crews inspected the site and deployed initial barriers. Full repair scheduled for this week.',
  )
  const [isPublic, setIsPublic] = useState(true)
  const [uploads, setUploads] = useState<string[]>([])
  const [reviewDate, setReviewDate] = useState('Nov 19, 2026')

  const statuses: UpdateStatus[] = ['Under review', 'Sent to office', 'Action taken', 'Resolved']
  const addUpload = (name: string) =>
    setUploads((current) => (current.includes(name) ? current : [...current, name]))

  const handlePublish = async () => {
    notify(`Public update for ${selectedReport?.tracking_code || 'case'} published successfully!`)
  }

  return (
    <>
      <p className="breadcrumbs mb-1">
        Queue&nbsp;&nbsp;/&nbsp;&nbsp;{selectedReport?.tracking_code || 'CASE'}&nbsp;&nbsp;/&nbsp;&nbsp;Post update
      </p>
      <h1>Post a public update</h1>

      <div className="mt-4 flex items-center gap-3">
        <label className="text-xs font-semibold text-[#16324f]" htmlFor="report-picker">
          Target Report / Case:
        </label>
        <select
          id="report-picker"
          value={selectedReportId}
          onChange={(e) => setSelectedReportId(e.target.value)}
          className="max-w-md"
        >
          {reports.map((r) => (
            <option key={r.id} value={r.id}>
              {r.tracking_code} - {r.problem} ({r.address})
            </option>
          ))}
        </select>
      </div>

      <div className="update-grid mt-4">
        <div className="composer column">
          <div className="card">
            <h3>New status</h3>
            <div className="status-options">
              {statuses.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={status === item ? 'selected' : ''}
                  onClick={() => setStatus(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <label className="section-label" htmlFor="citizen-message">
              Message for citizens (plain language)
            </label>
            <textarea
              id="citizen-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain clearly what steps have been taken…"
            />
            <p className="subtle">Avoid technical terms. Say what was done and what comes next.</p>
          </div>

          <div className="card">
            <h3>Evidence of action</h3>
            <div className="photo-grid three">
              {['Before photo', 'After photo|Required for Resolved', 'Document (optional)'].map(
                (item) => {
                  const [title, detail] = item.split('|')
                  const uploaded = uploads.includes(title)
                  return (
                    <button
                      className={`upload-tile ${uploaded ? 'uploaded' : ''}`}
                      type="button"
                      key={title}
                      onClick={() => addUpload(title)}
                    >
                      {uploaded ? `${title} added` : title}
                      {!uploaded && detail && <small>{detail}</small>}
                    </button>
                  )
                },
              )}
            </div>

            <label className="field-label mt-2" htmlFor="review-date">
              Next review date
            </label>
            <input
              id="review-date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
            />
          </div>

          <div className="publish-row">
            <button
              className="toggle-label"
              type="button"
              onClick={() => setIsPublic((v) => !v)}
              aria-pressed={isPublic}
            >
              {isPublic ? (
                <img src="/assets/toggle-on.svg" width="40" height="22" alt="" />
              ) : (
                <span className="toggle">
                  <span />
                </span>
              )}
              Show on public progress page
            </button>
            <div className="button-row">
              <button
                className="button secondary"
                type="button"
                onClick={() => notify('Draft update saved locally.')}
              >
                Save draft
              </button>
              <button className="button" type="button" onClick={handlePublish}>
                Publish update
              </button>
            </div>
          </div>
        </div>

        {/* Live citizen preview */}
        <div className="preview column">
          <div className="card">
            <p className="eyebrow">What citizens see</p>
            <div className="preview-meta">
              <span className="chip teal">{status}</span>
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <p className="preview-message">{message || 'Your public update will appear here.'}</p>
            <div className="photo-grid two">
              <div className="upload-tile">Before</div>
              <div className="upload-tile">After</div>
            </div>
            {!isPublic && <p className="private-notice">Hidden from the public progress page</p>}
          </div>

          <div className="card dashed">
            <h3>After you mark it Resolved</h3>
            <p className="subtle">
              Grouped reporters will receive SMS: Was it really fixed? If citizens report it persists,
              the case reopens automatically.
            </p>
            <strong>Confirmed fixed so far: 0 of {selectedReport?.reportsCount || 1}</strong>
          </div>

          <div className="card">
            <h3>Audit log</h3>
            <div className="audit-lines text-xs">
              <p>Nov 10 · AI suggested High</p>
              <p>Nov 10 · Officer confirmed High</p>
              <p>Nov 10 · Assigned to DPWH District Office</p>
              <p>Nov 12 · Public update drafted</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ==========================================================================
   PAGE 7: GROUPED REPORTS & PUBLIC CASES MANAGEMENT
   ========================================================================== */
const CATEGORIES = [
  'Damaged road',
  'Blocked drainage',
  'Unfinished project',
  'Unsafe construction',
  'Broken walkway or bridge',
  'Something else',
]

function CasesManagementView({
  reports,
  notify,
}: {
  reports: ExtendedReport[]
  notify: (msg: string) => void
}) {
  const [cases, setCases] = useState<PublicCase[]>([])
  const [source, setSource] = useState<CaseSource>('sample')
  const [links, setLinks] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    area: '',
    category: CATEGORIES[0],
    summary: '',
  })
  const [creating, setCreating] = useState(false)

  const reload = useCallback(async () => {
    const result = await listAllCases()
    setCases(result.cases)
    setSource(result.source)
    const reportRefs = reports.map((r) => ({
      id: r.id,
      trackingCode: r.tracking_code,
    }))
    setLinks(await getReportLinks(reportRefs))
    setLoading(false)
  }, [reports])

  useEffect(() => {
    void reload()
  }, [reload])

  const handleCreateCase = async (e: FormEvent) => {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    try {
      await createCase(form)
      setForm({ title: '', area: '', category: CATEGORIES[0], summary: '' })
      await reload()
      notify('Case created as a draft. Publish it when ready for public viewing.')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create case.')
    } finally {
      setCreating(false)
    }
  }

  const handleTogglePublish = async (caseId: string, current: boolean) => {
    try {
      await setCasePublished(caseId, !current)
      await reload()
      notify(current ? 'Case unpublished.' : 'Case published to the Public Progress page!')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Publish error.')
    }
  }

  const handleLinkReport = async (caseId: string, report: ExtendedReport) => {
    try {
      await linkReportToCase({ id: report.id, trackingCode: report.tracking_code }, caseId)
      await reload()
      notify('Citizen report linked to case.')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Link error.')
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Grouped reports &amp; Public Cases</h1>
          <p className="mt-1 text-sm text-[#526277]">
            Group citizen reports into verified Public Cases, record progress updates, and publish
            to the citizen progress portal.
          </p>
        </div>
      </div>

      {source === 'sample' && (
        <div className="mt-3 rounded-lg border border-[#fed7aa] bg-[#fff7ed] px-4 py-2.5 text-xs text-[#c2410c]">
          Sample mode: Connect Supabase cases tables to persist changes permanently.
        </div>
      )}

      {/* Create draft case form */}
      <form onSubmit={handleCreateCase} className="card mt-5">
        <h3 className="flex items-center gap-2">
          <FolderPlus className="size-4 text-[#006b70]" />
          Create New Public Case
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="case-title">
              Case title
            </label>
            <input
              id="case-title"
              required
              minLength={4}
              maxLength={120}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Road rehabilitation in Brgy. Sample"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="case-area">
              Area (broad location)
            </label>
            <input
              id="case-area"
              maxLength={120}
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              placeholder="e.g. Mabini Street, Sample City"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="case-cat">
              Category
            </label>
            <select
              id="case-cat"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="case-summary">
              Public summary
            </label>
            <input
              id="case-summary"
              maxLength={400}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Brief overview visible to community…"
            />
          </div>
        </div>
        <div>
          <button className="button" type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create draft case'}
          </button>
        </div>
      </form>

      {/* Cases list */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-[#526277] flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading cases…
          </p>
        ) : cases.length === 0 ? (
          <div className="empty-state card">No cases found. Create one above!</div>
        ) : (
          cases.map((c) => {
            const attached = reports.filter((r) => links[r.id] === c.id)
            const isOpen = openId === c.id

            return (
              <div key={c.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#006b70]">
                        {c.caseCode}
                      </span>
                      <span className={`chip ${c.isPublished ? 'green' : 'amber'}`}>
                        {c.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span className="chip teal">{STAGE_LABEL[c.stage] || c.stage}</span>
                    </div>
                    <h3 className="mt-1 text-base">{c.title}</h3>
                    <p className="text-xs text-[#526277]">{c.area} · {c.category}</p>
                    {c.summary && <p className="mt-1 text-sm text-[#233548]">{c.summary}</p>}
                  </div>

                  <div className="button-row">
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => handleTogglePublish(c.id, c.isPublished)}
                    >
                      {c.isPublished ? 'Unpublish' : 'Publish to Portal'}
                    </button>
                    <button
                      className="button"
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : c.id)}
                    >
                      {isOpen ? 'Close' : 'Manage & Post Updates'}
                    </button>
                  </div>
                </div>

                {/* Expanded Case Management Area */}
                {isOpen && (
                  <div className="mt-4 border-t border-[#ccd7df] pt-4 space-y-4">
                    {/* Linked Citizen Reports */}
                    <div>
                      <h4 className="text-xs font-bold text-[#16324f] uppercase tracking-wider">
                        Linked Citizen Reports ({attached.length})
                      </h4>
                      {attached.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs">
                          {attached.map((att) => (
                            <li
                              key={att.id}
                              className="flex items-center justify-between bg-[#f8fafc] p-2 rounded border border-[#edf2f5]"
                            >
                              <span>
                                <strong>{att.tracking_code}</strong> · {att.problem} - {att.address}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-[#526277] mt-1">No reports linked yet.</p>
                      )}

                      {/* Attach report dropdown */}
                      <div className="mt-2 flex items-center gap-2">
                        <select
                          className="text-xs max-w-sm"
                          onChange={(e) => {
                            const found = reports.find((r) => r.id === e.target.value)
                            if (found) {
                              void handleLinkReport(c.id, found)
                              e.target.value = ''
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Link an unattached citizen report…
                          </option>
                          {reports
                            .filter((r) => !links[r.id])
                            .map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.tracking_code} - {r.problem}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Post an update form */}
                    <CaseUpdateSubForm
                      caseItem={c}
                      onSaved={async () => {
                        await reload()
                        notify('Update posted successfully!')
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}

function CaseUpdateSubForm({
  caseItem,
  onSaved,
}: {
  caseItem: PublicCase
  onSaved: () => Promise<void>
}) {
  const { t } = useLanguage()
  const [stage, setStage] = useState<CaseStage>(caseItem.stage)
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    setError('')
    if (photo && !checked) {
      setError('Please confirm the photo check before uploading.')
      return
    }
    setSaving(true)
    try {
      await addCaseUpdate(caseItem.id, { stage, note, photo, photoCaption: caption })
      setNote('')
      setPhoto(null)
      setCaption('')
      setChecked(false)
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save update.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[#ccd7df] bg-[#f8fbfb] p-4 space-y-3">
      <p className="text-xs font-bold text-[#16324f]">Post a progress update to this case</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Stage</label>
          <select value={stage} onChange={(e) => setStage(e.target.value as CaseStage)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {t(STAGE_LABEL[s])}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Note for public</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Crew poured cement; waiting for cure"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Progress Photo (optional)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label className="field-label">Photo description</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Fresh asphalt on south lane"
            disabled={!photo}
          />
        </div>
      </div>

      {photo && (
        <label className="flex items-start gap-2 text-xs text-[#526277]">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5"
          />
          <span>I verify this photo contains no faces, vehicle plates, or sensitive personal data.</span>
        </label>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button className="button" type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Submit Update'}
      </button>
    </form>
  )
}

/* ==========================================================================
   ROOT OFFICER DASHBOARD (WITH APP-SHELL, STATE, & ROUTING)
   ========================================================================== */
export default function OfficerDashboard() {
  const [page, setPage] = useState<OfficerPage>('queue')
  const [reports, setReports] = useState<ExtendedReport[]>(DEMO_REPORTS)
  const [projects] = useState<OfficerProject[]>(DEMO_PROJECTS)
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(INITIAL_AUDIT_LOG)
  const [selectedReport, setSelectedReport] = useState<ExtendedReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [officerEmail, setOfficerEmail] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)

  // Auth session listener
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

  const notify = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 3000)
  }

  // Load live reports from Supabase if configured
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
      setNotice('Could not reach the live reports table. Showing demo queue data.')
    } else if (data && data.length > 0) {
      const mapped: ExtendedReport[] = (data as ReportRow[]).map((row, idx) => ({
        ...row,
        priority: inferPriority(row),
        match: idx % 2 === 0 ? 'Likely · 78%' : 'Possible · 52%',
        reportsCount: 1,
        coordinates: [13.7563 + (idx * 0.003), 121.0583 + (idx * 0.003)],
      }))
      setReports(mapped)
    } else {
      setNotice('No live reports found in database yet. Showing sample queue.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  const updateReportStatus = async (id: string, status: ReportRow['status']) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    if (selectedReport && selectedReport.id === id) {
      setSelectedReport((prev) => (prev ? { ...prev, status } : null))
    }

    // Add audit entry
    const entry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      user: officerEmail || 'Officer A',
      action: `Status updated to ${status}`,
      target: selectedReport?.tracking_code || id,
      detail: `Report status changed to ${status}`,
      tag: 'OFFICER',
    }
    setAuditLogs((prev) => [entry, ...prev])

    if (!isSupabaseConfigured || !supabase) {
      notify('Report status updated locally in sample queue.')
      return
    }

    const { error } = await supabase.from('reports').update({ status }).eq('id', id)
    if (error) {
      notify('Could not save to Supabase. View updated locally.')
    } else {
      notify('Report status persisted.')
    }
  }

  const assignPriority = (
    id: string,
    priority: PriorityLevel,
    office: string,
    reason: string,
  ) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, priority, assignedOffice: office, priorityReason: reason }
          : r,
      ),
    )
    if (selectedReport && selectedReport.id === id) {
      setSelectedReport((prev) =>
        prev
          ? { ...prev, priority, assignedOffice: office, priorityReason: reason }
          : null,
      )
    }

    // Add audit entry
    const entry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      user: officerEmail || 'Officer A',
      action: `Assigned priority ${priority}`,
      target: selectedReport?.tracking_code || id,
      detail: `Assigned office: ${office}${reason ? `. Reason: ${reason}` : ''}`,
      tag: 'OFFICER',
    }
    setAuditLogs((prev) => [entry, ...prev])
  }

  const navigate = (next: OfficerPage) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!authReady) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#f3f6f8]">
        <Loader2 className="size-8 animate-spin text-[#006b70]" />
      </main>
    )
  }

  if (!signedIn) {
    return <OfficerLogin onSignedIn={() => undefined} />
  }

  return (
    <div className="app-shell">
      <OfficerHeader
        officerEmail={officerEmail}
        onNavigate={navigate}
        onSignOut={() => void supabase?.auth.signOut()}
      />

      <div className="app-body">
        <OfficerSidebar page={page} onNavigate={navigate} />

        <main className="main-content">
          {page === 'queue' && (
            <QueueView
              reports={reports}
              loading={loading}
              notice={notice}
              onRefresh={() => void loadReports()}
              onSelectReport={(report) => {
                setSelectedReport(report)
                navigate('review')
              }}
              onSwitchToMap={() => navigate('map')}
            />
          )}

          {page === 'map' && (
            <OfficerMapView
              reports={reports}
              onSelectReport={(report) => {
                setSelectedReport(report)
                navigate('review')
              }}
            />
          )}

          {page === 'projects' && (
            <ProjectsView
              projects={projects}
            />
          )}

          {page === 'review' && selectedReport && (
            <ReviewView
              report={selectedReport}
              onBack={() => navigate('queue')}
              onUpdateStatus={updateReportStatus}
              onAssignPriority={assignPriority}
              notify={notify}
            />
          )}

          {page === 'review' && !selectedReport && (
            <div className="empty-state card">
              <p>No report selected. Select a report from the queue first.</p>
              <button className="button mt-3" type="button" onClick={() => navigate('queue')}>
                Go to Queue
              </button>
            </div>
          )}

          {page === 'update' && (
            <UpdateEvidenceView reports={reports} notify={notify} />
          )}

          {page === 'cases' && (
            <CasesManagementView reports={reports} notify={notify} />
          )}

          {page === 'audit' && (
            <AuditLogView
              logs={auditLogs}
            />
          )}
        </main>
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
