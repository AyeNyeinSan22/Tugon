import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, FolderPlus, ImagePlus, Loader2 } from 'lucide-react'
import { useLanguage } from './LanguageProvider'
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
import { StageBadge } from './CasesPublic'

export interface OfficerReportRef {
  id: string
  trackingCode: string
  label: string
}

const CATEGORIES = ['Damaged road', 'Blocked drainage', 'Unfinished project', 'Unsafe construction', 'Broken walkway or bridge', 'Something else']
const field = 'mt-1.5 w-full rounded-lg border border-[#d5dee5] bg-white px-3.5 py-2.5 text-sm text-[#0f2342] outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/15'
const label = 'block text-xs font-semibold text-[#0f2342]'

function UpdateForm({ item, onSaved }: { item: PublicCase; onSaved: () => Promise<void> }) {
  const { t } = useLanguage()
  const [stage, setStage] = useState<CaseStage>(item.stage)
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const id = `case-${item.id}`

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    setError('')
    if (photo && !checked) {
      setError('Confirm the photo check before uploading.')
      return
    }
    setSaving(true)
    try {
      await addCaseUpdate(item.id, { stage, note, photo, photoCaption: caption })
      setNote('')
      setPhoto(null)
      setCaption('')
      setChecked(false)
      await onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The update could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
      <p className="text-xs font-bold text-[#0f2342]">{t('Post an update')}</p>
      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        <div>
          <label htmlFor={`${id}-stage`} className={label}>
            {t('Stage')}
          </label>
          <select id={`${id}-stage`} value={stage} onChange={(e) => setStage(e.target.value as CaseStage)} className={field}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {t(STAGE_LABEL[s])}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-note`} className={label}>
            {t('What happened? (shown to the public once published)')}
          </label>
          <textarea id={`${id}-note`} value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} className={field} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-photo`} className={label}>
            <ImagePlus className="mr-1 inline size-3.5" aria-hidden="true" />
            {t('Progress photo (optional)')}
          </label>
          <input
            id={`${id}-photo`}
            key={photo ? 'has' : 'none'}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className={`${field} file:mr-3 file:rounded file:border-0 file:bg-[#eff6ff] file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-[#1e3a8a]`}
          />
        </div>
        <div>
          <label htmlFor={`${id}-caption`} className={label}>
            {t('Describe the photo')}
          </label>
          <input id={`${id}-caption`} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} disabled={!photo} placeholder={t('e.g. Crew patching the road')} className={`${field} disabled:opacity-50`} />
        </div>
      </div>
      {photo && (
        <label className="flex items-start gap-2 text-xs leading-5 text-[#475569]">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 size-4" />
          <span>{t('I took this photo for this case, and it shows no faces, plate numbers, documents or private addresses. It is not a photo sent by a citizen.')}</span>
        </label>
      )}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700" role="alert">
          {t(error)}
        </p>
      )}
      <button type="submit" disabled={saving} className="rounded-lg bg-[#1e3a8a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#172554] disabled:opacity-60">
        {saving ? t('Saving…') : t('Post update')}
      </button>
    </form>
  )
}

/**
 * Officer tools for Public progress: create a case from reports, attach
 * reports to it, post stage updates with photos, and publish or unpublish it.
 * Nothing is public until Publish is pressed.
 */
export default function OfficerCases({ reports }: { reports: OfficerReportRef[] }) {
  const { t } = useLanguage()
  const [cases, setCases] = useState<PublicCase[]>([])
  const [source, setSource] = useState<CaseSource>('sample')
  const [links, setLinks] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ title: '', area: '', category: CATEGORIES[0], summary: '' })
  const [creating, setCreating] = useState(false)

  const reportKey = reports.map((r) => r.id).join(',')
  const reload = useCallback(async () => {
    const result = await listAllCases()
    setCases(result.cases)
    setSource(result.source)
    setLinks(await getReportLinks(reports))
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportKey])

  useEffect(() => {
    void reload()
  }, [reload])

  const run = async (action: () => Promise<void>, done: string) => {
    setMessage('')
    try {
      await action()
      await reload()
      setMessage(done)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'The change could not be saved.')
    }
  }

  const create = async (event: FormEvent) => {
    event.preventDefault()
    if (creating) return
    setCreating(true)
    await run(async () => {
      await createCase(form)
      setForm({ title: '', area: '', category: CATEGORIES[0], summary: '' })
    }, 'Case created as a draft. It is not public until you publish it.')
    setCreating(false)
  }

  return (
    <section className="mt-8 rounded-2xl border border-[#d5dee5] bg-white p-5 sm:p-6" aria-labelledby="officer-cases-title">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#516575]">{t('PUBLIC PROGRESS')}</p>
      <h2 id="officer-cases-title" className="mt-1 text-xl font-bold tracking-tight text-[#0f2342]">
        {t('Cases')}
      </h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#516575]">
        {t('Open a case when reports show a problem the office will act on. Attach the reports, post updates with photos, then publish it so citizens can follow the work.')}
      </p>

      {source === 'sample' && (
        <p className="mt-3 rounded-lg border border-[#fed7aa] bg-[#fff7ed] px-4 py-2.5 text-xs text-[#c2410c]">
          {t('Sample mode: the cases tables are not connected. Changes here work for this visit only and are lost when the page reloads.')}
        </p>
      )}
      {message && (
        <p className="mt-3 rounded-lg border border-[#d5dee5] bg-[#f7f9fb] px-4 py-2.5 text-xs text-[#516575]" role="status">
          {t(message)}
        </p>
      )}

      <form onSubmit={create} className="mt-5 grid gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 sm:grid-cols-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f2342] sm:col-span-2">
          <FolderPlus className="size-4" aria-hidden="true" />
          {t('New case')}
        </p>
        <div>
          <label htmlFor="new-case-title" className={label}>
            {t('Case title')}
          </label>
          <input id="new-case-title" required minLength={4} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('e.g. Damaged road in Barangay Alangilan')} className={field} />
        </div>
        <div>
          <label htmlFor="new-case-area" className={label}>
            {t('Area (broad location only)')}
          </label>
          <input id="new-case-area" maxLength={120} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder={t('e.g. Brgy. Alangilan, Batangas City')} className={field} />
        </div>
        <div>
          <label htmlFor="new-case-category" className={label}>
            {t('Problem type')}
          </label>
          <select id="new-case-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={field}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="new-case-summary" className={label}>
            {t('Public summary (no names or phone numbers)')}
          </label>
          <input id="new-case-summary" maxLength={400} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={field} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={creating} className="rounded-lg bg-[#0f2342] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1e3a8a] disabled:opacity-60">
            {t('Create draft case')}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="mt-5 inline-flex items-center gap-2 text-sm text-[#516575]" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {t('Loading cases…')}
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {cases.map((c) => {
            const attached = reports.filter((r) => links[r.id] === c.id)
            const available = reports.filter((r) => links[r.id] !== c.id)
            return (
              <li key={c.id} className="rounded-xl border border-[#d5dee5] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-[#8998a5]">
                      {c.caseCode} · <span className="font-sans font-semibold">{t(c.category)}</span>
                    </p>
                    <h3 className="mt-0.5 text-base font-semibold text-[#0f2342]">{c.title}</h3>
                    <p className="mt-0.5 text-xs text-[#516575]">
                      {c.area || t('No area given')} · {c.reportCount} {t(c.reportCount === 1 ? 'report' : 'reports')} · {c.updates.length} {t(c.updates.length === 1 ? 'update' : 'updates')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StageBadge stage={c.stage} />
                    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${c.isPublished ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]' : 'border-[#cbd5e1] bg-[#f1f5f9] text-[#475569]'}`}>
                      {c.isPublished ? <Eye className="size-3.5" aria-hidden="true" /> : <EyeOff className="size-3.5" aria-hidden="true" />}
                      {t(c.isPublished ? 'Published' : 'Draft — not public')}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void run(() => setCasePublished(c.id, !c.isPublished), c.isPublished ? 'Case unpublished. It no longer appears in Public progress.' : 'Case published. It now appears in Public progress.')}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${c.isPublished ? 'border border-[#d5dee5] bg-white text-[#516575] hover:border-[#be123c] hover:text-[#be123c]' : 'bg-[#15803d] text-white hover:bg-[#166534]'}`}
                  >
                    {t(c.isPublished ? 'Unpublish' : 'Publish')}
                  </button>
                  <button type="button" onClick={() => setOpenId(openId === c.id ? null : c.id)} aria-expanded={openId === c.id} className="rounded-lg border border-[#d5dee5] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#516575] transition hover:border-[#1e3a8a] hover:text-[#1e3a8a]">
                    {t(openId === c.id ? 'Close' : 'Manage case')}
                  </button>
                  {c.isPublished && (
                    <Link to={`/progress/${c.caseCode}`} className="text-xs font-semibold text-[#1e3a8a] hover:underline">
                      {t('View public page')}
                    </Link>
                  )}
                </div>

                {openId === c.id && (
                  <div>
                    <div className="mt-4 rounded-xl border border-[#e2e8f0] p-4">
                      <p className="text-xs font-bold text-[#0f2342]">{t('Reports in this case')}</p>
                      {attached.length === 0 ? (
                        <p className="mt-1.5 text-xs text-[#516575]">{t('No reports attached yet.')}</p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {attached.map((r) => (
                            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#516575]">
                              <span>
                                <span className="font-mono font-semibold text-[#0f2342]">{r.trackingCode}</span> · {r.label}
                              </span>
                              <button type="button" onClick={() => void run(() => linkReportToCase(r, null), 'Report removed from the case.')} className="font-semibold text-[#be123c] hover:underline">
                                {t('Remove')}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {available.length > 0 && (
                        <div className="mt-3">
                          <label htmlFor={`attach-${c.id}`} className={label}>
                            {t('Attach a report')}
                          </label>
                          <select
                            id={`attach-${c.id}`}
                            value=""
                            onChange={(e) => {
                              const picked = reports.find((r) => r.id === e.target.value)
                              if (picked) void run(() => linkReportToCase(picked, c.id), 'Report attached. Its reporter will see a link to this case once it is published.')
                            }}
                            className={field}
                          >
                            <option value="">{t('Choose a report…')}</option>
                            {available.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.trackingCode} — {r.label}
                                {links[r.id] ? ` (${t('moves it from another case')})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <UpdateForm item={c} onSaved={async () => { await reload(); setMessage('Update posted.') }} />
                  </div>
                )}
              </li>
            )
          })}
          {cases.length === 0 && <li className="rounded-xl border border-dashed border-[#d5dee5] bg-[#f7f9fb] px-5 py-8 text-center text-sm text-[#516575]">{t('No cases yet. Create the first one above.')}</li>}
        </ul>
      )}
    </section>
  )
}
