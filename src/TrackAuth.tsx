import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useLanguage } from './LanguageProvider'
import { supabase, isSupabaseConfigured } from './lib/supabase'

/**
 * Gates a section behind citizen email+password auth.
 * When Supabase is not configured, children render open (demo mode).
 */
export default function TrackAuth({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  const [authReady, setAuthReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSignedIn(Boolean(data.session))
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session))
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  if (!authReady) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#475569]">
        <Loader2 className="size-4 animate-spin text-[#1e3a8a]" aria-hidden="true" />
        {t('Loading…')}
      </div>
    )
  }

  // Demo mode: no Supabase → open access
  if (!isSupabaseConfigured || !supabase) return <>{children}</>

  if (signedIn) return <>{children}</>

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setSubmitting(true)
    setError('')
    setInfo('')

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(
          signInError.message.includes('Invalid login')
            ? 'Invalid email or password. Try again, or create an account first.'
            : signInError.message,
        )
      }
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setError(signUpError.message)
      } else if (data.session) {
        // Email confirmation disabled → signed in immediately
      } else {
        setInfo('Account created. Check your email to confirm, then sign in.')
        setMode('signin')
      }
    }
    setSubmitting(false)
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-[#d8e0ea] bg-white p-6 shadow-[0_6px_24px_rgba(15,35,66,0.06)] sm:p-8">
        <span className="grid size-10 place-items-center rounded-full bg-[#eff6ff] text-[#1e3a8a]" aria-hidden="true">
          <ShieldCheck className="size-5" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#0f2342]">
          {t('Sign in to track your report')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#475569]">
          {t('Tracking shows live progress. Create a free account or sign in if you already have one.')}
        </p>

        <div className="mt-5 flex rounded-md border border-[#d8e0ea] p-0.5" role="tablist" aria-label={t('Sign in or sign up')}>
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m)
                setError('')
                setInfo('')
              }}
              className={`flex-1 rounded px-3 py-2 text-xs font-bold transition ${
                mode === m ? 'bg-[#1e3a8a] text-white' : 'text-[#475569] hover:text-[#1e3a8a]'
              }`}
            >
              {m === 'signin' ? t('Sign in') : t('Create account')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="citizen-email" className="block text-xs font-semibold text-[#0f2342]">
              {t('Email')}
            </label>
            <input
              id="citizen-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#d8e0ea] px-3.5 py-2.5 text-sm text-[#0f2342] outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/15"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="citizen-password" className="block text-xs font-semibold text-[#0f2342]">
              {t('Password')}
            </label>
            <input
              id="citizen-password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#d8e0ea] px-3.5 py-2.5 text-sm text-[#0f2342] outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/15"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700" role="status">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#facc15] px-5 py-2.5 text-sm font-bold text-[#0f2342] transition hover:bg-[#eab308] disabled:opacity-60"
          >
            {submitting ? t('Please wait…') : mode === 'signin' ? t('Sign in') : t('Create account')}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-5 text-[#64748b]">
          {t('Reporting a problem does not require an account — only tracking does.')}
        </p>
      </div>
      <div className="mt-4 text-center">
        <Link to="/" className="text-sm font-semibold text-[#1e3a8a] hover:underline">
          {t('Back to home')}
        </Link>
      </div>
    </div>
  )
}
