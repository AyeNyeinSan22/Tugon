import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Construction,
  Droplets,
  Footprints,
  MapPin,
  Route,
  ShieldAlert,
  X,
} from 'lucide-react'
import { useLanguage } from './LanguageProvider'

const HERO_IMAGE_SRC = '/hero-road.jpg'

const problemTypes = [
  {
    name: 'Damaged road',
    detail: 'Potholes, cracks',
    Icon: Route,
    iconBg: 'bg-[#eff6ff] text-[#1e3a8a]',
    orbBg: 'bg-[#dbeafe]/65',
    hoverStyle: 'hover:border-[#1e3a8a] hover:bg-gradient-to-br hover:from-[#eff6ff] hover:to-white',
    selectedStyle: 'border-[#1e3a8a] bg-gradient-to-br from-[#eff6ff] to-white ring-2 ring-[#1e3a8a]/15',
    badgeBg: 'bg-[#1e3a8a]',
  },
  {
    name: 'Blocked drainage',
    detail: 'Flooding, clogged canal',
    Icon: Droplets,
    iconBg: 'bg-[#e0f2fe] text-[#0369a1]',
    orbBg: 'bg-[#bae6fd]/60',
    hoverStyle: 'hover:border-[#0284c7] hover:bg-gradient-to-br hover:from-[#f0f9ff] hover:to-white',
    selectedStyle: 'border-[#0284c7] bg-gradient-to-br from-[#f0f9ff] to-white ring-2 ring-[#0284c7]/15',
    badgeBg: 'bg-[#0369a1]',
  },
  {
    name: 'Unfinished project',
    detail: 'Work stopped',
    Icon: Construction,
    iconBg: 'bg-[#fff7ed] text-[#ea580c]',
    orbBg: 'bg-[#fed7aa]/60',
    hoverStyle: 'hover:border-[#ea580c] hover:bg-gradient-to-br hover:from-[#fff7ed] hover:to-white',
    selectedStyle: 'border-[#ea580c] bg-gradient-to-br from-[#fff7ed] to-white ring-2 ring-[#ea580c]/15',
    badgeBg: 'bg-[#ea580c]',
  },
  {
    name: 'Unsafe construction',
    detail: 'Open pits, no barriers',
    Icon: ShieldAlert,
    iconBg: 'bg-[#fef2f2] text-[#be123c]',
    orbBg: 'bg-[#fecdd3]/60',
    hoverStyle: 'hover:border-[#be123c] hover:bg-gradient-to-br hover:from-[#fff1f2] hover:to-white',
    selectedStyle: 'border-[#be123c] bg-gradient-to-br from-[#fff1f2] to-white ring-2 ring-[#be123c]/15',
    badgeBg: 'bg-[#be123c]',
  },
  {
    name: 'Broken walkway or bridge',
    detail: 'Hard or unsafe to cross',
    Icon: Footprints,
    iconBg: 'bg-[#f1f5f9] text-[#334155]',
    orbBg: 'bg-[#cbd5e1]/55',
    hoverStyle: 'hover:border-[#475569] hover:bg-gradient-to-br hover:from-[#f8fafc] hover:to-white',
    selectedStyle: 'border-[#334155] bg-gradient-to-br from-[#f8fafc] to-white ring-2 ring-[#334155]/15',
    badgeBg: 'bg-[#334155]',
  },
  {
    name: 'Something else',
    detail: 'Tell us in your own words',
    Icon: CircleHelp,
    iconBg: 'bg-[#f1f5f9] text-[#475569]',
    orbBg: 'bg-[#e2e8f0]/65',
    hoverStyle: 'hover:border-[#64748b] hover:bg-gradient-to-br hover:from-[#f8fafc] hover:to-white',
    selectedStyle: 'border-[#475569] bg-gradient-to-br from-[#f8fafc] to-white ring-2 ring-[#475569]/15',
    badgeBg: 'bg-[#475569]',
  },
]

const timingOptions = ['Today', 'This week', 'A few weeks ago', 'Months ago', 'Not sure']
const questionOptions = ['Yes', 'No', 'Not sure']

type Report = {
  problem: string
  address: string
  landmark: string
  pin: boolean
  description: string
  timing: string
  phone: string
  photos: File[]
}

const initialReport: Report = {
  problem: '',
  address: '',
  landmark: '',
  pin: false,
  description: '',
  timing: 'A few weeks ago',
  phone: '',
  photos: [],
}

function ChoicePills({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-[#0f2342]">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {questionOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              value === option
                ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white'
                : 'border-[#d8e0ea] bg-white text-[#1e293b] hover:border-[#1e3a8a]'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export default function ReportFlow({ onClose }: { onClose: () => void }) {
  const { language, setLanguage, t } = useLanguage()
  const location = useLocation()
  const preselectedProblem = (location.state as { preselectedProblem?: string } | null)?.preselectedProblem ?? ''
  const [step, setStep] = useState(1)
  const [report, setReport] = useState<Report>({ ...initialReport, problem: preselectedProblem })
  const [questions, setQuestions] = useState(['', '', ''])
  const [summaryReviewed, setSummaryReviewed] = useState(false)
  const [finished, setFinished] = useState(false)
  const [geoMessage, setGeoMessage] = useState('')

  const setField = <K extends keyof Report>(key: K, value: Report[K]) =>
    setReport((current) => ({ ...current, [key]: value }))

  const handlePhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const additions = Array.from(event.currentTarget.files ?? []).slice(0, 3 - report.photos.length)
    setField('photos', [...report.photos, ...additions])
    event.currentTarget.value = ''
  }

  const locateMe = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Location is not available in this browser. Enter a street or landmark below.')
      return
    }
    setGeoMessage('Requesting your location…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setField('pin', true)
        setField('address', `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`)
        setGeoMessage('Location added. You can refine it with a street address below.')
      },
      () => setGeoMessage('Location permission was unavailable. Enter a street or landmark below.'),
      { timeout: 8000 }
    )
  }

  const finish = (event?: FormEvent) => {
    event?.preventDefault()
    setFinished(true)
  }

  const canContinue =
    step === 1
      ? Boolean(report.problem)
      : step === 2
        ? Boolean(report.address.trim())
        : Boolean(report.description.trim() && report.timing)

  const stepperItems = [
    { num: 1, label: step === 1 ? 'Step 1' : 'Problem' },
    { num: 2, label: 'Location' },
    { num: 3, label: 'Details' },
  ]

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#1e3a8a]" role="presentation">
      <div className="flex min-h-full flex-col">
        {/* Top Civic Strip & Header */}
        <header className="relative z-20 border-b border-[#d8e0ea] bg-white">
          <div className="flex h-1.5" aria-hidden="true">
            <span className="flex-1 bg-[#1e3a8a]" />
            <span className="w-1/4 bg-[#ea580c]" />
            <span className="w-1/6 bg-[#facc15]" />
          </div>
          <div className="bg-[#fff7ed] py-1.5 text-center text-[11px] font-medium text-[#9a3412]">
            {t('DEMONSTRATION · Reports are not sent to government. Sample data is fictional.')}
          </div>
          <div className="mx-auto flex max-w-[1408px] items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-16">
            <Link to="/" onClick={onClose} className="flex shrink-0 items-center gap-3">
              <img src="/tugon-mark.svg" alt="" className="size-9 object-contain" />
              <div className="flex flex-col">
                <span className="text-[22px] font-extrabold uppercase leading-none tracking-tight text-[#0f2342]">
                  TUGON
                </span>
                <span className="mt-0.5 hidden text-[9px] font-semibold tracking-[0.16em] text-[#475569] sm:block">
                  PUBLIC TRANSPARENCY
                </span>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 text-xs sm:flex sm:text-sm" aria-label={t('Main navigation')}>
              <span className="border-b-2 border-[#1e3a8a] pb-1 font-semibold text-[#0f2342]">
                {t('Report a problem')}
              </span>
              <Link to="/track" onClick={onClose} className="text-[#475569] hover:text-[#1e3a8a]">
                {t('Track my report')}
              </Link>
              <Link to="/progress" onClick={onClose} className="text-[#475569] hover:text-[#1e3a8a]">
                {t('Public progress')}
              </Link>
              <Link to="/how-it-works" onClick={onClose} className="text-[#475569] hover:text-[#1e3a8a]">
                {t('How it works')}
              </Link>
            </nav>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex rounded-md border border-[#d8e0ea] p-0.5" aria-label={t('Language')}>
                {(['EN', 'FIL'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    aria-pressed={language === lang}
                    className={`rounded px-2 py-1 font-semibold ${
                      language === lang ? 'bg-[#1e3a8a] text-white' : 'text-[#475569] hover:bg-slate-50'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <Link to="/how-it-works" onClick={onClose} className="ml-1 hidden font-medium text-[#0f2342] sm:inline">
                {t('Help')}
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('Close report')}
                className="ml-1 grid size-8 place-items-center rounded-md border border-[#d8e0ea] text-[#475569] sm:hidden"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Hero Image Background + Gradient Overlay */}
        <main className="route-main relative isolate flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
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

          <section
            key={step}
            className="report-step-panel w-full max-w-[780px] rounded-2xl border border-white/60 bg-white p-6 shadow-2xl sm:p-8"
            aria-labelledby="report-step-title"
          >
            {finished ? (
              <div className="py-8 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#e6f4ea] text-[#1e6b3a]">
                  <Check size={25} />
                </span>
                <h1 className="mt-4 text-2xl font-bold text-[#0f2342]">{t('Thanks for helping your community.')}</h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#475569]">
                  {t('Your report is ready in this demonstration. It has not been saved or sent to government.')}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 rounded-lg bg-[#1e3a8a] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#172554]"
                >
                  {t('Done')}
                </button>
              </div>
            ) : (
              <>
                {step < 4 ? (
                  <>
                    {/* Connected Horizontal Pill Stepper */}
                    <div className="flex items-center justify-between gap-2" aria-label={`Step ${step} of 3`}>
                      {stepperItems.map(({ num, label }, idx) => {
                        const isActive = step === num
                        const isCompleted = step > num
                        return (
                          <div key={num} className={`flex items-center ${idx < 2 ? 'flex-1' : ''}`}>
                            <div
                              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                                isActive
                                  ? 'bg-[#1e3a8a] text-white shadow-xs'
                                  : isCompleted
                                    ? 'bg-[#eff6ff] text-[#1e3a8a]'
                                    : 'text-[#64748b]'
                              }`}
                            >
                              <span
                                className={`grid size-5 place-items-center rounded-full text-[11px] font-bold ${
                                  isActive
                                    ? 'bg-white text-[#1e3a8a]'
                                    : isCompleted
                                      ? 'bg-[#1e3a8a] text-white'
                                      : 'bg-[#e2e8f0] text-[#475569]'
                                }`}
                              >
                                {isCompleted ? <Check size={11} strokeWidth={3} /> : num}
                              </span>
                              <span>{t(label)}</span>
                            </div>
                            {idx < 2 && (
                              <div
                                className={`mx-3 h-[1.5px] flex-1 transition-colors ${
                                  step > num ? 'bg-[#1e3a8a]' : 'bg-[#e2e8f0]'
                                }`}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {step === 1 && (
                      <>
                        <h1 id="report-step-title" className="mt-6 text-2xl font-extrabold tracking-tight text-[#0f2342] sm:text-[28px]">
                          {t('What kind of problem is it?')}
                        </h1>
                        <p className="mt-1.5 text-sm text-[#475569]">
                          {t('Choose the closest match. You can add details on the next steps.')}
                        </p>

                        {/* Homepage Card Styling in Compact 3x2 ReportFlow Layout */}
                        <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                          {problemTypes.map(({ name, detail, Icon, iconBg, orbBg, hoverStyle, selectedStyle, badgeBg }) => {
                            const isSelected = report.problem === name
                            return (
                              <button
                                key={name}
                                type="button"
                                onClick={() => setField('problem', name)}
                                aria-pressed={isSelected}
                                className={`group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left shadow-[0_4px_16px_rgba(15,35,66,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,35,66,0.08)] ${
                                  isSelected
                                    ? selectedStyle
                                    : `border-[#e2e8f0] bg-white ${hoverStyle}`
                                }`}
                              >
                                {/* Top-Right Quarter-Circle Orb (matching homepage) */}
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none absolute -right-6 -top-6 size-24 rounded-full transition-transform duration-300 group-hover:scale-110 ${orbBg}`}
                                />

                                <div className="relative flex items-start justify-between">
                                  <span
                                    className={`grid size-10 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${iconBg}`}
                                  >
                                    <Icon size={20} strokeWidth={2.1} aria-hidden="true" />
                                  </span>

                                  {isSelected && (
                                    <span
                                      className={`grid size-5 place-items-center rounded-full text-white shadow-xs ${badgeBg}`}
                                    >
                                      <Check size={12} strokeWidth={3} />
                                    </span>
                                  )}
                                </div>

                                <div className="relative mt-4">
                                  <span className="block text-[15px] font-extrabold leading-snug text-[#0f2342]">
                                    {t(name)}
                                  </span>
                                  <span className="mt-0.5 block text-xs leading-relaxed text-[#475569]">
                                    {t(detail)}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>

                        <div className="mt-5 flex items-center gap-2.5 rounded-lg bg-[#fbe9eb] px-4 py-3 text-xs font-medium text-[#7f1d1d]">
                          <AlertTriangle size={16} className="shrink-0 text-[#991b1b]" />
                          <span>{t('In danger right now? Call 911 or your local DRRMO first. Then report here.')}</span>
                        </div>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <h1 id="report-step-title" className="mt-6 text-2xl font-extrabold tracking-tight text-[#0f2342]">
                          {t('Where is it?')}
                        </h1>
                        <p className="mt-1.5 text-sm text-[#475569]">
                          {t('Drop a pin on the map or use your phone location. A landmark helps too.')}
                        </p>
                        <button
                          type="button"
                          onClick={() => setField('pin', !report.pin)}
                          className={`mt-5 grid h-36 w-full place-items-center rounded-xl border border-dashed text-center transition ${
                            report.pin
                              ? 'border-[#1e3a8a] bg-[#eff6ff]'
                              : 'border-[#d8e0ea] bg-[#f8fafc] hover:border-[#1e3a8a]'
                          }`}
                        >
                          <span>
                            <MapPin
                              className={`mx-auto ${report.pin ? 'text-[#1e3a8a]' : 'text-[#94a3b8]'}`}
                              size={24}
                              fill={report.pin ? 'currentColor' : 'none'}
                            />
                            <span className="mt-1.5 block text-xs font-medium text-[#475569]">
                              {t(report.pin ? 'Pin placed · tap to move it' : 'Map · tap to drop a pin')}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={locateMe}
                          className="mt-3 rounded-lg bg-[#1e3a8a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#172554]"
                        >
                          {t('Use my current location')}
                        </button>
                        {geoMessage && (
                          <p className="mt-2 text-xs text-[#475569]" role="status">
                            {geoMessage}
                          </p>
                        )}
                        <label className="mt-5 block text-xs font-semibold text-[#0f2342]">
                          {t('Street, barangay, or area')}
                          <input
                            value={report.address}
                            onChange={(e) => setField('address', e.target.value)}
                            required
                            className="form-control mt-1.5"
                            placeholder={t('e.g. Mabini Street, Brgy. Sample')}
                          />
                        </label>
                        <label className="mt-4 block text-xs font-semibold text-[#0f2342]">
                          {t('Nearby landmark (optional)')}
                          <input
                            value={report.landmark}
                            onChange={(e) => setField('landmark', e.target.value)}
                            className="form-control mt-1.5"
                            placeholder={t('e.g. In front of the elementary school')}
                          />
                        </label>
                        <p className="mt-4 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-xs leading-5 text-[#1e3a8a]">
                          {t('You do not need to know the project name. We will look up the related public project for you.')}
                        </p>
                      </>
                    )}

                    {step === 3 && (
                      <>
                        <h1 id="report-step-title" className="mt-6 text-2xl font-extrabold tracking-tight text-[#0f2342]">
                          {t('Tell us more')}
                        </h1>
                        <label className="mt-5 block text-xs font-semibold text-[#0f2342]">{t('Add photos (optional)')}</label>
                        <div className="mt-2 grid grid-cols-3 gap-2.5">
                          {report.photos.map((photo, index) => (
                            <div
                              key={`${photo.name}-${index}`}
                              className="relative grid h-20 place-items-center overflow-hidden rounded-xl border border-[#d8e0ea] bg-[#f8fafc] px-2 text-center text-[11px] text-[#475569]"
                            >
                              <span className="line-clamp-2">{photo.name}</span>
                              <button
                                type="button"
                                onClick={() => setField('photos', report.photos.filter((_, i) => i !== index))}
                                className="absolute right-1 top-1 rounded-full bg-white p-1 text-[#475569] shadow-xs"
                                aria-label={`Remove ${photo.name}`}
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ))}
                          {report.photos.length < 3 && (
                            <label className="grid h-20 cursor-pointer place-items-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] text-center text-xs text-[#475569] hover:border-[#1e3a8a] hover:bg-[#eff6ff]">
                              {t(report.photos.length ? '+ Add another' : 'Choose photos')}
                              <input type="file" accept="image/*" multiple onChange={handlePhotos} className="sr-only" />
                            </label>
                          )}
                        </div>
                        <p className="mt-2 text-[11px] text-[#64748b]">
                          {t('Stand back so the whole problem is visible. Avoid including identifiable faces or license plates.')}
                        </p>
                        <label className="mt-5 block text-xs font-semibold text-[#0f2342]">
                          {t('What did you notice?')}
                          <textarea
                            value={report.description}
                            onChange={(e) => setField('description', e.target.value)}
                            required
                            rows={4}
                            className="form-control mt-1.5 resize-y text-sm font-normal"
                            placeholder={t('For example: A deep pothole near the school gate. Motorcycles swerve to avoid it.')}
                          />
                        </label>
                        <label className="mt-4 block text-xs font-semibold text-[#0f2342]">
                          {t('When did you first notice it?')}
                          <select value={report.timing} onChange={(e) => setField('timing', e.target.value)} className="sr-only">
                            {timingOptions.map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </select>
                          <span className="mt-2 flex flex-wrap gap-1.5">
                            {timingOptions.map((x) => (
                              <button
                                type="button"
                                key={x}
                                onClick={() => setField('timing', x)}
                                aria-pressed={report.timing === x}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                  report.timing === x
                                    ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white'
                                    : 'border-[#d8e0ea] bg-white text-[#1e293b] hover:border-[#1e3a8a]'
                                }`}
                              >
                                {t(x)}
                              </button>
                            ))}
                          </span>
                        </label>
                        <label className="mt-5 block text-xs font-semibold text-[#0f2342]">
                          {t('Mobile number for SMS updates (optional)')}
                          <input
                            value={report.phone}
                            onChange={(e) => setField('phone', e.target.value)}
                            type="tel"
                            className="form-control mt-1.5"
                            placeholder="09XX XXX XXXX"
                          />
                        </label>
                        <p className="mt-1.5 text-[11px] text-[#64748b]">
                          {t('Only used to send updates about this report. Never shown publicly.')}
                        </p>
                      </>
                    )}

                    {/* Bottom Action Controls */}
                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#e2e8f0] pt-5">
                      <button
                        type="button"
                        onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#cbd5e1] bg-white px-4 py-2.5 text-xs font-semibold text-[#334155] transition hover:bg-[#f8fafc]"
                      >
                        <ArrowLeft size={14} />
                        {t(step === 1 ? 'Cancel' : 'Back')}
                      </button>
                      <button
                        type="button"
                        disabled={!canContinue}
                        onClick={() => setStep(step === 3 ? 4 : step + 1)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a8a] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#172554] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {t(step === 3 ? 'Send my report' : `Next: ${step === 1 ? 'Location' : 'Details'}`)}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h1 id="report-step-title" className="text-2xl font-extrabold tracking-tight text-[#0f2342]">
                      {t('AI summary · review your report')}
                    </h1>
                    <p className="mt-1.5 text-sm text-[#475569]">
                      {t('Here is what we understood. Check the details below and edit anything that is incorrect.')}
                    </p>
                    <p className="mt-4 rounded-lg bg-[#0f2342] px-4 py-2.5 text-xs font-medium text-white">
                      {t('AI-generated draft · Government staff make every decision.')}
                    </p>
                    <div className="mt-4 rounded-xl border border-[#1e3a8a]/25 bg-[#eff6ff] p-5">
                      <h2 className="font-bold text-[#0f2342]">
                        {report.description.split(/[.!?]/)[0] || 'Your reported concern'}
                        {report.address ? ` · ${report.address}` : ''}
                      </h2>
                      <dl className="mt-4 grid grid-cols-[80px_1fr] gap-x-3 gap-y-1.5 text-xs">
                        <dt className="text-[#64748b]">{t('Type')}</dt>
                        <dd className="font-medium text-[#0f2342]">{report.problem || 'Not provided'}</dd>
                        <dt className="text-[#64748b]">{t('Where')}</dt>
                        <dd className="font-medium text-[#0f2342]">
                          {report.address || 'Not provided'}
                          {report.landmark ? ` · ${report.landmark}` : ''}
                        </dd>
                        <dt className="text-[#64748b]">{t('Noticed')}</dt>
                        <dd className="font-medium text-[#0f2342]">{report.timing}</dd>
                        <dt className="text-[#64748b]">{t('Photos')}</dt>
                        <dd className="font-medium text-[#0f2342]">{report.photos.length} attached</dd>
                      </dl>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSummaryReviewed(true)}
                          className="rounded-lg bg-[#1e3a8a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#172554]"
                        >
                          {summaryReviewed ? 'Reviewed ✓' : 'This looks right'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="rounded-lg border border-[#1e3a8a] bg-white px-4 py-2 text-xs font-semibold text-[#1e3a8a] hover:bg-[#f8fafc]"
                        >
                          {t('Edit')}
                        </button>
                      </div>
                    </div>
                    <h2 className="mt-6 text-base font-bold text-[#0f2342]">{t('A few quick questions (optional)')}</h2>
                    <p className="mt-1 text-xs text-[#475569]">
                      {t('Your answers help the reviewing officer decide how urgent this is.')}
                    </p>
                    <div className="mt-4 space-y-4">
                      <ChoicePills
                        label={t('Is anyone at risk of getting hurt?')}
                        value={questions[0]}
                        onChange={(v) => setQuestions((q) => [v, q[1], q[2]])}
                      />
                      <ChoicePills
                        label={t('Is it near a school, hospital, or main road?')}
                        value={questions[1]}
                        onChange={(v) => setQuestions((q) => [q[0], v, q[2]])}
                      />
                      <ChoicePills
                        label={t('Is it getting worse?')}
                        value={questions[2]}
                        onChange={(v) => setQuestions((q) => [q[0], q[1], v])}
                      />
                    </div>
                    <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-[#e2e8f0] pt-5">
                      <button
                        type="button"
                        onClick={() => finish()}
                        className="rounded-lg border border-[#cbd5e1] px-5 py-2.5 text-xs font-semibold text-[#334155] hover:bg-[#f8fafc]"
                      >
                        {t('Skip for now')}
                      </button>
                      <button
                        type="button"
                        onClick={() => finish()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#facc15] px-6 py-2.5 text-xs font-bold text-[#0f2342] hover:bg-[#eab308]"
                      >
                        {t('Send answers')}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </main>

        <footer className="relative z-20 border-t border-[#d8e0ea] bg-white">
          <div className="mx-auto flex max-w-[1408px] flex-col justify-between gap-2 px-5 py-4 text-xs text-[#475569] sm:flex-row sm:px-8 lg:px-16">
            <span>TUGON · {t('Your voice. Visible action.')}</span>
            <span className="font-medium text-red-600">{t('Emergency? Call 911 or your local DRRMO.')}</span>
            <span>
              {t('Privacy')} · {t('Help & coverage')} · {t('Staff workspace')}
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}