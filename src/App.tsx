import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, Route as RouterRoute, Routes, useNavigate } from 'react-router-dom'
import { ArrowRight, Construction, Droplets, Menu, Route, ShieldAlert, X } from 'lucide-react'
import ReportFlow from './ReportFlow'
import RoadSafetyMap from './RoadSafetyMap'
import FaqSection from './FaqSection'
import { useLanguage } from './LanguageProvider'

const categories = [
  { title: 'Damaged road', detail: 'Potholes, cracks, sinking surface', Icon: Route },
  { title: 'Blocked drainage', detail: 'Clogged canals, flooding spots', Icon: Droplets },
  { title: 'Unfinished project', detail: 'Work stopped or abandoned', Icon: Construction },
  { title: 'Unsafe construction', detail: 'Open pits, no barriers or signs', Icon: ShieldAlert },
]

const steps = [
  ['Tell us what you see', 'Pick a problem type, drop a pin on the map, and add a photo if you can.'],
  ['We organize it', 'AI summarizes your report and groups similar concerns nearby.'],
  ['An officer reviews it', 'A person decides the priority and routes it to the right office.'],
  ['You see what happens', 'Follow updates and confirm if the reported issue has been resolved.'],
]

const resolved = [
  { title: 'Drainage cleared · Mabini St.' },
  { title: 'Road patched · Sample Brgy.' },
  { title: 'Barrier installed · Sample Ave.' },
]

function RoutePageLayout({ children, current }: { children: ReactNode; current: string }) {
  const { language, setLanguage, t } = useLanguage()
  const navItems = [['/report', 'Report a problem'], ['/track', 'Track my report'], ['/progress', 'Public progress'], ['/how-it-works', 'How it works']]
  return <div className="min-h-screen bg-[#f5f7f8] text-[#263746]">
    <div className="flex h-1.5"><span className="flex-1 bg-[#176b70]"/><span className="w-[12.5%] bg-[#176b70]"/></div>
    <div className="bg-[#fff5dc] px-4 py-1.5 text-center text-[11px] font-medium text-[#75510b]">{t('DEMONSTRATION · Reports are not sent to government. Sample data is fictional.')}</div>
    <header className="border-b border-[#d5dee5] bg-white"><div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8">
      <Link to="/" className="flex items-center gap-2"><img src="/tugon-mark.svg" alt="" className="size-8"/><span className="text-xl font-bold text-[#153550]">tugon</span></Link>
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm" aria-label={t('Main navigation')}>{navItems.map(([to, label]) => <Link key={to} to={to} className={current === to ? 'border-b-2 border-[#176b70] pb-1 font-semibold text-[#153550]' : 'text-[#516575] hover:text-[#176b70]'}>{t(label)}</Link>)}</nav>
      <div className="flex items-center gap-2"><div className="flex rounded-md border border-[#d5dee5] p-0.5" aria-label={t('Language')}><button type="button" onClick={() => setLanguage('EN')} aria-pressed={language === 'EN'} className={`rounded px-2 py-1 text-xs font-semibold ${language === 'EN' ? 'bg-[#176b70] text-white' : 'text-[#516575]'}`}>EN</button><button type="button" onClick={() => setLanguage('FIL')} aria-pressed={language === 'FIL'} className={`rounded px-2 py-1 text-xs font-semibold ${language === 'FIL' ? 'bg-[#176b70] text-white' : 'text-[#516575]'}`}>FIL</button></div><Link to="/how-it-works" className="hidden text-sm font-medium text-[#153550] lg:block">{t('Help')}</Link></div>
    </div></header>
    <main className="route-main mx-auto min-h-[calc(100vh-170px)] max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">{children}</main>
    <footer className="border-t border-[#d5dee5] bg-white"><div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-2 px-5 py-4 text-xs text-[#516575] sm:flex-row sm:px-8"><span>tugon · Your voice. Visible action.</span><span className="font-medium text-red-600">Emergency? Call 911 or your local DRRMO.</span><span>Privacy · Help &amp; coverage · Staff workspace</span></div></footer>
  </div>
}

function TrackPage() {
  const { t } = useLanguage()
  const [reportId, setReportId] = useState('')
  const [searched, setSearched] = useState(false)
  return <RoutePageLayout current="/track"><div className="mx-auto max-w-2xl">
    <p className="text-xs font-bold tracking-wider text-[#176b70]">{t('CITIZEN REPORTS')}</p><h1 className="mt-2 text-3xl font-bold text-[#153550]">{t('Track my report')}</h1><p className="mt-2 text-sm leading-6 text-[#516575]">{t('Enter the reference number you received after reporting an issue.')}</p>
    <form onSubmit={(e) => {e.preventDefault(); setSearched(true)}} className="mt-6 flex flex-col gap-3 rounded-xl border border-[#d5dee5] bg-white p-5 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-semibold text-[#153550]">{t('Report reference')}<input value={reportId} onChange={(e) => {setReportId(e.target.value); setSearched(false)}} required className="form-control mt-1.5" placeholder={t('e.g. TUG-2026-0124')}/></label><button className="rounded-md bg-[#176b70] px-5 py-3 text-sm font-semibold text-white hover:bg-[#10565a]">{t('Find report')}</button></form>
    <p className="mt-3 text-xs text-[#516575]">{t('Demo reference: TUG-2026-0124')}</p>
    {searched && <section className="mt-6 rounded-xl border border-[#d5dee5] bg-white p-5" aria-live="polite"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-[#516575]">{reportId.trim().toUpperCase()}</p><h2 className="mt-1 text-xl font-bold text-[#153550]">{t('Deep pothole on Mabini Street')}</h2></div><span className="rounded-full bg-[#fff4d6] px-3 py-1.5 text-xs font-semibold text-[#79520c]">{t('Under review')}</span></div><p className="mt-2 text-sm text-[#516575]">{t('Near the elementary school gate · Damaged road')}</p><ol className="mt-6 grid gap-4 border-l-2 border-[#d5dee5] pl-4 sm:grid-cols-3 sm:border-l-0 sm:border-t-2 sm:pl-0 sm:pt-4">{[['Report received','Nov 10'],['Under review','Nov 11'],['Office action','Next update pending']].map(([title, date], i) => <li key={title} className="relative"><span className={`absolute -left-[22px] top-0 size-3 rounded-full sm:-top-[22px] sm:left-0 ${i < 2 ? 'bg-[#176b70]' : 'bg-[#d5dee5]'}`}/><h3 className="text-sm font-semibold text-[#153550]">{t(title)}</h3><p className="mt-1 text-xs text-[#516575]">{t(date)}</p></li>)}</ol><p className="mt-5 rounded-md bg-[#fff5dc] p-3 text-xs leading-5 text-[#75510b]">{t('This is sample progress for the demonstration. No real report records are connected.')}</p></section>}
  </div></RoutePageLayout>
}

const publicCases = [
  { id: 'TUG-2026-0124', title: 'Deep pothole on Mabini Street', area: 'Brgy. Sample', category: 'Damaged road', status: 'Under review', updated: 'Updated Nov 11' },
  { id: 'TUG-2026-0118', title: 'Drainage cleared on Mabini St.', area: 'Brgy. Sample', category: 'Blocked drainage', status: 'Resolved', updated: 'Resolved Nov 10' },
  { id: 'TUG-2026-0109', title: 'Safety barriers requested', area: 'Sample Avenue', category: 'Unsafe construction', status: 'Sent to office', updated: 'Updated Nov 9' },
]

function ProgressPage() {
  const { t } = useLanguage()
  const [filter, setFilter] = useState('All reports')
  const visibleCases = publicCases.filter((item) => filter === 'All reports' || item.status === filter)
  const filters = ['All reports', 'Under review', 'Sent to office', 'Resolved']
  return <RoutePageLayout current="/progress"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-wider text-[#176b70]">{t('PUBLIC PROJECT FOLLOW-UP')}</p><h1 className="mt-2 text-3xl font-bold text-[#153550]">{t('Public progress')}</h1><p className="mt-2 text-sm text-[#516575]">{t('See how sample community reports move through review and action.')}</p></div><div className="rounded-lg bg-white px-4 py-3 text-sm text-[#516575]"><strong className="text-xl text-[#153550]">12</strong><span className="ml-2">{t('sample reports')}</span></div></div>
    <div className="mt-6 flex flex-wrap gap-2" aria-label={t('Filter reports')}>{filters.map((item) => <button key={item} onClick={() => setFilter(item)} aria-pressed={filter === item} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === item ? 'border-[#176b70] bg-[#176b70] text-white' : 'border-[#d5dee5] bg-white text-[#516575]'}`}>{t(item)}</button>)}</div>
    <div className="mt-4 space-y-3">{visibleCases.map((item) => <article key={item.id} className="flex flex-col justify-between gap-4 rounded-xl border border-[#d5dee5] bg-white p-5 sm:flex-row sm:items-center"><div><p className="text-xs text-[#516575]">{item.id} · {t(item.category)}</p><h2 className="mt-1 font-semibold text-[#153550]">{t(item.title)}</h2><p className="mt-1 text-sm text-[#516575]">{t(item.area)} · {t(item.updated)}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${item.status === 'Resolved' ? 'bg-[#e5f2e9] text-[#236444]' : 'bg-[#fff4d6] text-[#79520c]'}`}>{t(item.status)}</span><Link to="/track" className="text-sm font-semibold text-[#176b70] hover:underline">{t('Details →')}</Link></div></article>)}</div>
    <p className="mt-5 rounded-md bg-[#fff5dc] p-3 text-xs leading-5 text-[#75510b]">{t('Demonstration only. Sample data is fictional and does not represent live government service records.')}</p>
  </RoutePageLayout>
}

function HowItWorksPage() {
  const { t } = useLanguage()
  const details = [
    ['Choose a problem type', 'Select the closest match, from damaged roads and blocked drainage to unsafe construction.'],
    ['Add the location', 'Drop a map pin or enter a street and nearby landmark so the issue can be found.'],
    ['Describe what you noticed', 'Add a short description, when you noticed it, and photos if you have them.'],
    ['Review and follow up', 'Check the generated summary, answer optional urgency questions, then follow public updates.'],
  ]
  return <RoutePageLayout current="/how-it-works"><div className="mx-auto max-w-3xl"><p className="text-xs font-bold tracking-wider text-[#176b70]">{t('A SIMPLE REPORTING PROCESS')}</p><h1 className="mt-2 text-3xl font-bold text-[#153550]">{t('How it works')}</h1><p className="mt-2 text-sm leading-6 text-[#516575]">{t('Tugon helps residents raise concerns and see what happens next.')}</p><ol className="mt-7 space-y-4">{details.map(([title, description], index) => <li key={title} className="flex gap-4 rounded-xl border border-[#d5dee5] bg-white p-5"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#176b70] font-bold text-white">{index + 1}</span><div><h2 className="font-semibold text-[#153550]">{t(title)}</h2><p className="mt-1 text-sm leading-6 text-[#516575]">{t(description)}</p></div></li>)}</ol><div className="mt-6 rounded-lg bg-[#e8f3f1] p-4 text-sm leading-6 text-[#153550]"><strong>{t('People make the decisions.')}</strong> {t('Automated summaries can help organize a report. Government staff review reports, decide urgency, and determine what action to take.')}</div><div className="mt-6 flex flex-wrap gap-3"><Link to="/report" className="rounded-md bg-[#176b70] px-5 py-3 text-sm font-semibold text-white">{t('Report a problem')} <ArrowRight className="ml-1 inline" size={15}/></Link><Link to="/progress" className="rounded-md border border-[#176b70] px-5 py-3 text-sm font-semibold text-[#176b70]">{t('View public progress')}</Link></div><FaqSection/></div></RoutePageLayout>
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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f7f8] text-[#263746]">
      <div className="flex h-1.5" aria-hidden="true"><span className="flex-1 bg-[#176b70]"/><span className="w-1/8 bg-[#176b70]"/></div>
      <div className="bg-[#fff5dc] px-4 py-2 text-center text-xs font-medium text-[#75510b] sm:text-[13px]">
        {t('DEMONSTRATION · Reports are not sent to government. Sample data is fictional.')}
      </div>
      <header className="relative z-10 border-b border-[#d5dee5] bg-white">
        <div className="mx-auto flex max-w-[1408px] items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:px-16">
          <a href="#home" className="flex shrink-0 items-center gap-2.5" aria-label="Tugon home">
            <img src="/tugon-mark.svg" alt="" className="size-9"/>
            <span className="text-[26px] font-bold leading-none text-[#153550]">tugon</span>
          </a>
          <nav className={`${menuOpen ? 'absolute left-0 right-0 top-full flex border-b border-[#d5dee5] bg-white px-5 py-4 shadow-lg' : 'hidden'} flex-col gap-4 md:static md:flex md:flex-row md:items-center md:gap-7 md:border-0 md:bg-transparent md:p-0 md:shadow-none`} aria-label="Main navigation">
            <Link to="/report" onClick={() => setMenuOpen(false)} className="nav-active text-left">{t('Report a problem')}</Link>
            <Link to="/track" onClick={() => setMenuOpen(false)} className="nav-link text-left">{t('Track my report')}</Link>
            <Link to="/progress" onClick={() => setMenuOpen(false)} className="nav-link">{t('Public progress')}</Link>
            <Link to="/how-it-works" onClick={() => setMenuOpen(false)} className="nav-link">{t('How it works')}</Link>
          </nav>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="flex rounded-md border border-[#d5dee5] p-0.5" aria-label="Language">
              {(['EN', 'FIL'] as const).map((lang) => <button key={lang} onClick={() => setLanguage(lang)} className={`rounded px-2.5 py-1 text-xs font-semibold ${language === lang ? 'bg-[#176b70] text-white' : 'text-[#516575] hover:bg-slate-50'}`} aria-pressed={language === lang}>{lang}</button>)}
            </div>
            <a href="#footer" className="hidden text-sm font-medium text-[#153550] sm:inline">{t('Help')}</a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-9 place-items-center rounded-md border border-[#d5dee5] text-[#153550] md:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X size={19}/> : <Menu size={19}/>}</button>
          </div>
        </div>
      </header>

      <main id="home" ref={mainRef} className="mx-auto flex max-w-[1408px] flex-col gap-10 px-5 pb-14 pt-10 sm:px-8 sm:pt-14 lg:gap-12 lg:px-16">
        <section className="flex flex-col items-start gap-8" aria-labelledby="hero-title">
          <div className="flex w-full max-w-4xl flex-col items-start gap-5">
            <p className="text-[13px] font-semibold tracking-wide text-[#176b70]">{t('NO ACCOUNT NEEDED · TAKES ABOUT 3 MINUTES')}</p>
            <h1 id="hero-title" className="max-w-[900px] text-[38px] font-bold leading-[1.13] tracking-[-0.035em] text-[#153550] sm:text-[46px]">{t('See a problem with a public project? Tell us.')}</h1>
            <p className="max-w-[820px] text-base leading-7 text-[#516575] sm:text-lg">{t('Tugon is a community reporting platform for problems with public projects. Share what you noticed and where it happened, then follow visible updates as the report is reviewed.')}</p>
            <div className="mt-1 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link to="/report" className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-lg bg-[#176b70] px-7 text-base font-semibold text-white shadow-sm transition hover:bg-[#10565a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b70] sm:px-8 sm:text-lg">{t('Report a problem')} <ArrowRight size={19}/></Link>
              <Link to="/track" className="inline-flex min-h-[58px] items-center justify-center rounded-lg border border-[#176b70] bg-white px-7 text-base font-semibold text-[#176b70] transition hover:bg-[#e8f3f1] sm:px-8 sm:text-lg">{t('Track my report')}</Link>
            </div>
          </div>
        </section>

        <section className="w-full max-w-5xl rounded-lg border border-[#d5dee5] bg-white p-5 shadow-[0_2px_8px_rgba(22,50,79,0.04)] sm:p-7 lg:p-8" aria-labelledby="safety-title">
          <p className="text-xs font-bold tracking-[0.08em] text-[#176b70]">{t('ROAD SAFETY OVERVIEW')}</p>
          <h2 id="safety-title" className="mt-2 text-2xl font-bold text-[#153550]">{t('Know the road before you go')}</h2>
          <RoadSafetyMap/>
          <p className="mt-3 text-xs text-[#516575]">{t('Illustrative conditions only · not a live travel advisory')}</p>
        </section>

        <section aria-labelledby="categories-title">
          <h2 id="categories-title" className="mb-4 text-xl font-bold tracking-tight text-[#153550] sm:text-2xl">{t('What can you report?')}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map(({title,detail,Icon}) => <li key={title} className="category-tile flex items-center gap-3 rounded-lg border border-[#d5dee5] bg-white p-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e8f3f1] text-[#176b70]"><Icon size={20} strokeWidth={1.8}/></span>
              <span><strong className="block text-sm font-semibold text-[#263746]">{t(title)}</strong><span className="mt-0.5 block text-xs leading-5 text-[#516575]">{t(detail)}</span></span>
            </li>)}
          </ul>
        </section>

        <section id="how-it-works" className="rounded-xl border border-[#d5dee5] bg-white p-6 sm:p-8" aria-labelledby="steps-title">
          <h2 id="steps-title" className="mb-6 text-[22px] font-bold text-[#153550]">{t('How it works')}</h2>
          <ol className="space-y-5 sm:space-y-4">
            {steps.map(([title,detail],index) => <li key={title} className="flex gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-[18px] bg-[#176b70] text-base font-bold text-white">{index + 1}</span>
              <div><h3 className="font-semibold text-[#263746]">{t(title)}</h3><p className="mt-1 text-[15px] leading-[22px] text-[#516575]">{t(detail)}</p></div>
            </li>)}
          </ol>
        </section>

        <section id="progress" aria-labelledby="progress-title">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="progress-title" className="text-2xl font-bold tracking-tight text-[#153550] sm:text-[28px]">{t('Recently resolved')}</h2>
            <Link to="/progress" className="text-sm font-semibold text-[#176b70] hover:underline">{t('See all public progress →')}</Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {resolved.map((item) => <article key={item.title} className="category-tile rounded-lg border border-[#d5dee5] bg-white p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-[#263746]">{t(item.title)}</h3><span className="shrink-0 rounded-full bg-[#e5f2e9] px-2.5 py-1 text-xs font-semibold text-[#236444]">{t('Resolved')}</span></div>
              <p className="mt-2 text-xs text-[#516575]">{t('12 days · confirmed by reporters')}</p>
            </article>)}
          </div>
        </section>

        <FaqSection />
      </main>

      <footer id="footer" className="border-t border-[#d5dee5] bg-white">
        <div className="mx-auto flex max-w-[1408px] flex-col gap-3 px-5 py-5 text-xs text-[#516575] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-16">
          <p><strong className="text-[#153550]">tugon</strong> · {t('Your voice. Visible progress.')}</p>
          <p>{t('Emergency? Call 911 or your local emergency hotline.')}</p>
          <p><a href="#footer" className="hover:text-[#176b70]">{t('Privacy')}</a> · <a href="#footer" className="hover:text-[#176b70]">{t('Help & coverage')}</a> · <a href="#footer" className="hover:text-[#176b70]">{t('About')}</a></p>
        </div>
      </footer>

      <a href="#footer" className="sr-only focus:not-sr-only focus:fixed focus:bottom-4 focus:left-4 focus:z-50 focus:rounded bg-white focus:p-3">{t('Skip to help')}</a>
      <div className="sr-only" aria-live="polite">{language === 'FIL' ? 'Filipino ang napili.' : ''}</div>
    </div>
  )
}

function ReportRoute() {
  const navigate = useNavigate()
  return <ReportFlow onClose={() => navigate('/')} />
}

function NotFound() {
  return <main className="mx-auto max-w-3xl px-5 py-20 text-center"><h1 className="text-3xl font-bold text-[#153550]">Page not found</h1><Link to="/" className="mt-4 inline-block font-semibold text-[#176b70]">Return to Tugon home</Link></main>
}

function App() {
  return <Routes>
    <RouterRoute path="/" element={<HomePage/>}/>
    <RouterRoute path="/report" element={<ReportRoute/>}/>
    <RouterRoute path="/track" element={<TrackPage/>}/>
    <RouterRoute path="/progress" element={<ProgressPage/>}/>
    <RouterRoute path="/how-it-works" element={<HowItWorksPage/>}/>
    <RouterRoute path="*" element={<NotFound/>}/>
  </Routes>
}

export default App
