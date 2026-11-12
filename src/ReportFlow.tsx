import { useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleHelp, Construction, Droplets, Footprints, MapPin, Route, ShieldAlert, X } from 'lucide-react'
import { useLanguage } from './LanguageProvider'

const problemTypes = [
  { name: 'Damaged road', detail: 'Potholes, cracks', Icon: Route },
  { name: 'Blocked drainage', detail: 'Flooding, clogged canal', Icon: Droplets },
  { name: 'Unfinished project', detail: 'Work stopped', Icon: Construction },
  { name: 'Unsafe construction', detail: 'Open pits, no barriers', Icon: ShieldAlert },
  { name: 'Broken walkway or bridge', detail: 'Hard or unsafe to cross', Icon: Footprints },
  { name: 'Something else', detail: 'Tell us in your own words', Icon: CircleHelp },
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

const initialReport: Report = { problem: '', address: '', landmark: '', pin: false, description: '', timing: 'A few weeks ago', phone: '', photos: [] }

function ChoicePills({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <fieldset><legend className="mb-2 text-sm font-semibold text-[#153550]">{label}</legend><div className="flex flex-wrap gap-2">{questionOptions.map((option) => <button key={option} type="button" onClick={() => onChange(option)} aria-pressed={value === option} className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${value === option ? 'border-[#176b70] bg-[#176b70] text-white' : 'border-[#d5dee5] bg-white text-[#263746] hover:border-[#176b70]'}`}>{option}</button>)}</div></fieldset>
}

export default function ReportFlow({ onClose }: { onClose: () => void }) {
  const { language, setLanguage, t } = useLanguage()
  const [step, setStep] = useState(1)
  const [report, setReport] = useState<Report>(initialReport)
  const [questions, setQuestions] = useState(['', '', ''])
  const [summaryReviewed, setSummaryReviewed] = useState(false)
  const [finished, setFinished] = useState(false)
  const [geoMessage, setGeoMessage] = useState('')
  const setField = <K extends keyof Report>(key: K, value: Report[K]) => setReport((current) => ({ ...current, [key]: value }))
  const handlePhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const additions = Array.from(event.currentTarget.files ?? []).slice(0, 3 - report.photos.length)
    setField('photos', [...report.photos, ...additions])
    event.currentTarget.value = ''
  }
  const locateMe = () => {
    if (!navigator.geolocation) { setGeoMessage('Location is not available in this browser. Enter a street or landmark below.'); return }
    setGeoMessage('Requesting your location…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setField('pin', true); setField('address', `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`); setGeoMessage('Location added. You can refine it with a street address below.') },
      () => setGeoMessage('Location permission was unavailable. Enter a street or landmark below.'),
      { timeout: 8000 },
    )
  }
  const finish = (event?: FormEvent) => { event?.preventDefault(); setFinished(true) }
  const canContinue = step === 1 ? Boolean(report.problem) : step === 2 ? Boolean(report.address.trim()) : Boolean(report.description.trim() && report.timing)

  return <div className="fixed inset-0 z-40 overflow-y-auto bg-[#f5f7f8]" role="presentation">
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[#d5dee5] bg-white">
        <div className="flex h-1.5 bg-[#176b70]"><span className="w-[88%] bg-[#176b70]"/></div>
        <div className="bg-[#fff5dc] py-1.5 text-center text-[11px] font-medium text-[#75510b]">{t('DEMONSTRATION · Reports are not sent to government. Sample data is fictional.')}</div>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3 sm:px-8">
          <a href="#home" onClick={onClose} className="flex items-center gap-2"><img src="/tugon-mark.svg" alt="" className="size-7"/><span className="text-lg font-bold text-[#153550]">tugon</span></a>
          <div className="hidden items-center gap-6 text-xs text-[#516575] sm:flex"><span className="border-b-2 border-[#176b70] pb-1 font-semibold text-[#153550]">{t('Report a problem')}</span><span>{t('Track my report')}</span><span>{t('Public progress')}</span><span>{t('How it works')}</span></div>
          <div className="flex items-center gap-1 text-[11px]">{(['EN', 'FIL'] as const).map((lang) => <button key={lang} type="button" onClick={() => setLanguage(lang)} aria-pressed={language === lang} className={`rounded px-2 py-1 ${language === lang ? 'bg-[#176b70] font-semibold text-white' : 'border border-[#d5dee5]'}`}>{lang}</button>)}<button onClick={onClose} className="ml-1 text-[#153550]">{t('Help')}</button><button onClick={onClose} aria-label={t('Close report')} className="ml-2 grid size-8 place-items-center rounded-md border border-[#d5dee5] text-[#516575] sm:hidden"><X size={16}/></button></div>
        </div>
      </header>

      <main className="route-main flex flex-1 items-start justify-center px-4 py-7 sm:px-6 sm:py-9">
        <section key={step} className="report-step-panel my-auto w-full max-w-[620px] rounded-lg border border-[#d5dee5] bg-white p-5 shadow-[0_2px_10px_rgba(22,50,79,.03)] sm:p-7" aria-labelledby="report-step-title">
          {finished ? <div className="py-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[#e5f2e9] text-[#236444]"><Check size={25}/></span><h1 className="mt-4 text-2xl font-bold text-[#153550]">{t('Thanks for helping your community.')}</h1><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#516575]">{t('Your report is ready in this demonstration. It has not been saved or sent to government.')}</p><button onClick={onClose} className="mt-6 rounded-md bg-[#176b70] px-5 py-2.5 text-sm font-semibold text-white">{t('Done')}</button></div> : <>
            {step < 4 ? <>
              <p className="text-[11px] font-medium text-[#516575]">{t(`Step ${step} of 3 · ${['Problem', 'Location', 'Details'][step - 1]}`)}</p>
              <div className="mt-1 flex gap-1" aria-label={`Step ${step} of 3`}>{[1,2,3].map((n) => <span key={n} className={`h-[3px] flex-1 rounded-full ${n <= step ? 'bg-[#176b70]' : 'bg-[#d5dee5]'}`}/>)}</div>
              {step === 1 && <>
                <h1 id="report-step-title" className="mt-3 text-[22px] font-bold text-[#153550]">{t('What kind of problem is it?')}</h1><p className="mt-2 text-sm text-[#516575]">{t('Choose the closest match. You can add details on the next steps.')}</p>
                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">{problemTypes.map(({ name, detail, Icon }) => <button key={name} type="button" onClick={() => setField('problem', name)} aria-pressed={report.problem === name} className={`min-h-[76px] rounded-lg border p-3 text-left transition ${report.problem === name ? 'border-[#176b70] bg-[#e8f3f1] ring-1 ring-[#176b70]' : 'border-[#d5dee5] bg-white hover:border-[#176b70]'}`}><span className={`mb-1.5 grid size-7 place-items-center rounded-md ${report.problem === name ? 'bg-white text-[#176b70]' : 'bg-[#eef2f5] text-[#516575]'}`}><Icon size={17} strokeWidth={1.8} aria-hidden="true"/></span><span className="block text-sm font-semibold text-[#153550]">{t(name)}</span><span className="mt-0.5 block text-xs text-[#516575]">{t(detail)}</span></button>)}</div>
                <p className="mt-4 rounded-md bg-[#fbe9e8] px-3 py-2 text-xs text-[#a12b2a]">{t('In danger right now? Call 911 or your local DRRMO first. Then report here.')}</p>
              </>}
              {step === 2 && <>
                <h1 id="report-step-title" className="mt-3 text-[22px] font-bold text-[#153550]">{t('Where is it?')}</h1><p className="mt-2 text-sm text-[#516575]">{t('Drop a pin on the map or use your phone location. A landmark helps too.')}</p>
                <button type="button" onClick={() => setField('pin', !report.pin)} className={`mt-4 grid h-36 w-full place-items-center rounded-lg border border-dashed text-center transition ${report.pin ? 'border-[#176b70] bg-[#e8f3f1]' : 'border-[#d5dee5] bg-[#eef2f5] hover:border-[#176b70]'}`}><span><MapPin className={`mx-auto ${report.pin ? 'text-[#176b70]' : 'text-[#93a1ac]'}`} size={24} fill={report.pin ? 'currentColor' : 'none'}/><span className="mt-1 block text-xs text-[#516575]">{t(report.pin ? 'Pin placed · tap to move it' : 'Map · tap to drop a pin')}</span></span></button>
                <button type="button" onClick={locateMe} className="mt-3 rounded-md bg-[#176b70] px-4 py-2 text-xs font-semibold text-white hover:bg-[#10565a]">{t('Use my current location')}</button>{geoMessage && <p className="mt-2 text-xs text-[#516575]" role="status">{geoMessage}</p>}
                <label className="mt-4 block text-xs font-semibold text-[#153550]">{t('Street, barangay, or area')}<input value={report.address} onChange={(e) => setField('address', e.target.value)} required className="form-control mt-1" placeholder={t('e.g. Mabini Street, Brgy. Sample')}/></label>
                <label className="mt-3 block text-xs font-semibold text-[#153550]">{t('Nearby landmark (optional)')}<input value={report.landmark} onChange={(e) => setField('landmark', e.target.value)} className="form-control mt-1" placeholder={t('e.g. In front of the elementary school')}/></label>
                <p className="mt-3 rounded-md bg-[#e8f3f1] px-3 py-2 text-xs leading-5 text-[#153550]">{t('You do not need to know the project name. We will look up the related public project for you.')}</p>
              </>}
              {step === 3 && <>
                <h1 id="report-step-title" className="mt-3 text-[22px] font-bold text-[#153550]">{t('Tell us more')}</h1>
                <label className="mt-4 block text-xs font-semibold text-[#153550]">{t('Add photos (optional)')}</label>
                <div className="mt-2 grid grid-cols-3 gap-2">{report.photos.map((photo, index) => <div key={`${photo.name}-${index}`} className="relative grid h-16 place-items-center overflow-hidden rounded-md border border-[#d5dee5] bg-[#eef2f5] px-2 text-center text-[10px] text-[#516575]"><span className="line-clamp-2">{photo.name}</span><button type="button" onClick={() => setField('photos', report.photos.filter((_, i) => i !== index))} className="absolute right-1 top-1 rounded-full bg-white p-1 text-[#516575]" aria-label={`Remove ${photo.name}`}><X size={11}/></button></div>)}{report.photos.length < 3 && <label className="grid h-16 cursor-pointer place-items-center rounded-md border border-dashed border-[#d5dee5] bg-[#eef2f5] text-center text-xs text-[#516575] hover:border-[#176b70]">{t(report.photos.length ? '+ Add another' : 'Choose photos')}<input type="file" accept="image/*" multiple onChange={handlePhotos} className="sr-only"/></label>}</div>
                <p className="mt-2 text-[11px] text-[#516575]">{t('Stand back so the whole problem is visible. Avoid including identifiable faces or license plates.')}</p>
                <label className="mt-4 block text-xs font-semibold text-[#153550]">{t('What did you notice?')}<textarea value={report.description} onChange={(e) => setField('description', e.target.value)} required rows={4} className="form-control mt-1 resize-y text-sm font-normal" placeholder={t('For example: A deep pothole near the school gate. Motorcycles swerve to avoid it.')}/></label>
                <label className="mt-3 block text-xs font-semibold text-[#153550]">{t('When did you first notice it?')}<select value={report.timing} onChange={(e) => setField('timing', e.target.value)} className="sr-only">{timingOptions.map((x) => <option key={x}>{x}</option>)}</select><span className="mt-2 flex flex-wrap gap-1.5">{timingOptions.map((x) => <button type="button" key={x} onClick={() => setField('timing', x)} aria-pressed={report.timing === x} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${report.timing === x ? 'border-[#176b70] bg-[#176b70] text-white' : 'border-[#d5dee5] bg-white text-[#263746]'}`}>{t(x)}</button>)}</span></label>
                <label className="mt-4 block text-xs font-semibold text-[#153550]">{t('Mobile number for SMS updates (optional)')}<input value={report.phone} onChange={(e) => setField('phone', e.target.value)} type="tel" className="form-control mt-1" placeholder="09XX XXX XXXX"/></label><p className="mt-2 text-[11px] text-[#516575]">{t('Only used to send updates about this report. Never shown publicly.')}</p>
              </>}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#eef2f5] pt-4">
                <button type="button" onClick={() => step === 1 ? onClose() : setStep(step - 1)} className="rounded-md border border-[#176b70] px-4 py-2 text-xs font-semibold text-[#176b70] hover:bg-[#e8f3f1]"><ArrowLeft className="mr-1 inline" size={13}/>{t(step === 1 ? 'Cancel' : 'Back')}</button>
                <button type="button" disabled={!canContinue} onClick={() => setStep(step === 3 ? 4 : step + 1)} className="rounded-md bg-[#176b70] px-4 py-2 text-xs font-semibold text-white hover:bg-[#10565a] disabled:cursor-not-allowed disabled:opacity-45">{t(step === 3 ? 'Send my report' : `Next: ${step === 1 ? 'Location' : 'Details'}`)} <ArrowRight className="ml-1 inline" size={13}/></button>
              </div>
            </> : <>
              <h1 id="report-step-title" className="text-[22px] font-bold text-[#153550]">{t('AI summary · review your report')}</h1><p className="mt-2 text-sm text-[#516575]">{t('Here is what we understood. Check the details below and edit anything that is incorrect.')}</p>
              <p className="mt-4 rounded-md bg-[#153550] px-3 py-2 text-xs font-medium text-white">{t('AI-generated draft · Government staff make every decision.')}</p>
              <div className="mt-3 rounded-lg border border-[#176b70] bg-[#e8f3f1] p-4"><h2 className="font-semibold text-[#153550]">{report.description.split(/[.!?]/)[0] || 'Your reported concern'}{report.address ? ` · ${report.address}` : ''}</h2><dl className="mt-3 grid grid-cols-[72px_1fr] gap-x-2 gap-y-1 text-xs"><dt className="text-[#516575]">{t('Type')}</dt><dd>{report.problem || 'Not provided'}</dd><dt className="text-[#516575]">{t('Where')}</dt><dd>{report.address || 'Not provided'}{report.landmark ? ` · ${report.landmark}` : ''}</dd><dt className="text-[#516575]">{t('Noticed')}</dt><dd>{report.timing}</dd><dt className="text-[#516575]">{t('Photos')}</dt><dd>{report.photos.length} attached</dd></dl><div className="mt-3 flex gap-2"><button type="button" onClick={() => setSummaryReviewed(true)} className="rounded-md bg-[#176b70] px-3 py-1.5 text-xs font-semibold text-white">{summaryReviewed ? 'Reviewed ✓' : 'This looks right'}</button><button type="button" onClick={() => setStep(1)} className="rounded-md border border-[#176b70] px-3 py-1.5 text-xs font-semibold text-[#176b70]">{t('Edit')}</button></div></div>
              <h2 className="mt-4 font-semibold text-[#153550]">{t('A few quick questions (optional)')}</h2><p className="mt-1 text-xs text-[#516575]">{t('Your answers help the reviewing officer decide how urgent this is.')}</p>
              <div className="mt-4 space-y-4"><ChoicePills label={t('Is anyone at risk of getting hurt?')} value={questions[0]} onChange={(v) => setQuestions((q) => [v, q[1], q[2]])}/><ChoicePills label={t('Is it near a school, hospital, or main road?')} value={questions[1]} onChange={(v) => setQuestions((q) => [q[0], v, q[2]])}/><ChoicePills label={t('Is it getting worse?')} value={questions[2]} onChange={(v) => setQuestions((q) => [q[0], q[1], v])}/></div>
              <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => finish()} className="rounded-md border border-[#176b70] px-4 py-2 text-xs font-semibold text-[#176b70]">{t('Skip for now')}</button><button type="button" onClick={() => finish()} className="rounded-md bg-[#176b70] px-4 py-2 text-xs font-semibold text-white">{t('Send answers')} <ArrowRight className="ml-1 inline" size={13}/></button></div>
            </>}
          </>}
        </section>
      </main>
      <footer className="border-t border-[#d5dee5] bg-white"><div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-2 px-5 py-3 text-[10px] text-[#516575] sm:flex-row sm:px-8"><span>tugon · {t('Your voice. Visible action.')}</span><span className="font-medium text-red-600">{t('Emergency? Call 911 or your local DRRMO.')}</span><span>{t('Privacy')} · {t('Help & coverage')} · {t('Staff workspace')}</span></div></footer>
    </div>
  </div>
}
