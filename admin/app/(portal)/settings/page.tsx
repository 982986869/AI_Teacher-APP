'use client'

/**
 * Settings — feature flags, platform configuration and maintenance controls.
 *
 * Each card saves itself. There is deliberately no single "save everything"
 * button: these settings are independent, several are dangerous (maintenance
 * mode takes the app down), and one button implying they commit together would
 * make an accidental change to one of them invisible among the rest.
 */

import { Info } from 'lucide-react'
import { useApi } from '@/components/useApi'
import { Skel, ErrorState } from '@/components/ui'
import { FeatureFlags } from '@/components/settings/FeatureFlags'
import { SettingCard } from '@/components/settings/SettingCard'
import { useAuth } from '@/lib/auth'
import type { Setting } from '@/lib/types'

const CATEGORY_ORDER = ['general', 'academics', 'system']
const CATEGORY: Record<string, { label: string; sub: string }> = {
  general: { label: 'General', sub: 'Basic platform configuration and contact information.' },
  academics: { label: 'Academics', sub: 'Academic year and supported classes configuration.' },
  system: { label: 'System', sub: 'App version, maintenance and platform configuration.' },
}

export default function SettingsPage() {
  const { can } = useAuth()
  const { data, loading, error, reload } = useApi<{ settings: Setting[]; version: any }>('/settings')
  const editable = can('settings.edit')

  const byCategory: Record<string, Setting[]> = {}
  for (const s of data?.settings || []) (byCategory[s.category] ||= []).push(s)
  const categories = Object.keys(byCategory)
    .sort((a, b) => (CATEGORY_ORDER.indexOf(a) + 99) - (CATEGORY_ORDER.indexOf(b) + 99))

  return (
    <div className="col gap-20">
      <div className="an-head">
        <div style={{ minWidth: 0 }}>
          <h1 className="set-title">Settings</h1>
          <div className="sub">Feature flags, platform configuration and maintenance controls.</div>
        </div>
      </div>

      {can('flags.view') && <FeatureFlags />}

      {error && <ErrorState message={error} onRetry={reload} />}

      {loading && !data ? (
        <div className="set-section">
          <div className="set-grid">{[0, 1, 2, 3].map((i) => <Skel key={i} h={178} r={15} />)}</div>
        </div>
      ) : (
        categories.map((cat) => {
          const meta = CATEGORY[cat] || { label: cat, sub: '' }
          return (
            <section key={cat} className="set-section">
              <div className="set-section-head">
                <div>
                  <h2 className="set-section-title">{meta.label}</h2>
                  {meta.sub && <div className="set-section-sub">{meta.sub}</div>}
                </div>
              </div>
              <div className="set-grid">
                {byCategory[cat].map((s) => (
                  <SettingCard key={s.key} setting={s} editable={editable} onConflict={reload} />
                ))}
              </div>
            </section>
          )
        })
      )}

      {!loading && !error && (
        <div className="set-version">
          <span className="set-version-ic"><Info size={18} strokeWidth={2.2} /></span>
          <div className="set-version-title">Version information</div>
          <div className="set-version-grid">
            <Info2 label="API version" value={data?.version?.apiVersion} />
            <Info2 label="Environment" value={data?.version?.environment} />
            <Info2 label="Node" value={data?.version?.node} />
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes set-rise { from { opacity: 0; transform: translateY(10px); } }

        .set-title { font-size: 30px; font-weight: 900; letter-spacing: -.03em; line-height: 1.1; }

        .set-section {
          padding: 22px 24px; border-radius: 18px;
          border: 1px solid var(--line); background: var(--card);
        }
        .set-section-head {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 18px;
        }
        .set-section-title { font-size: 21px; font-weight: 850; letter-spacing: -.02em; line-height: 1.2; }
        .set-section-sub { font-size: 13px; color: var(--muted); margin-top: 3px; }
        .set-count {
          display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 11px;
          background: rgba(79,109,245,.1); color: var(--accent-ink); font-size: 12.5px; font-weight: 700;
        }

        /* Flags read four across; settings are wider because they hold fields. */
        .set-flags { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        @media (max-width: 1360px) { .set-flags { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 1040px) { .set-flags { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 680px)  { .set-flags { grid-template-columns: 1fr; } }

        .set-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; align-items: start; }
        @media (max-width: 1040px) { .set-grid { grid-template-columns: 1fr; } }

        /* ── flag card ─────────────────────────────────────────────────── */
        .set-flag {
          display: flex; flex-direction: column; justify-content: space-between; gap: 14px;
          padding: 15px; border-radius: 15px; border: 1px solid var(--line); background: var(--surface-2);
          animation: set-rise .34s cubic-bezier(.22,1,.36,1) both;
          transition: border-color .22s, box-shadow .22s, transform .22s cubic-bezier(.22,1,.36,1);
        }
        .set-flag:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); border-color: var(--accent); }
        .set-flag.on { background: var(--card); }
        .set-flag-ic { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; flex: 0 0 auto; }
        .set-flag-name { font-size: 14.5px; font-weight: 750; line-height: 1.3; }
        .set-flag-desc { font-size: 12px; color: var(--muted); line-height: 1.45; margin-top: 3px; }
        .set-flag-foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .set-scope {
          padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700;
          background: rgba(25,160,184,.12); color: #0d7f94; text-transform: capitalize;
        }
        .set-env {
          border: 1px solid var(--line); background: var(--card); border-radius: 8px;
          padding: 2px 6px; font-size: 11px; font-weight: 650; color: var(--muted); cursor: pointer;
        }
        .set-env:disabled { opacity: .55; cursor: not-allowed; }
        .set-flag-when { margin-left: auto; font-size: 10.5px; font-weight: 700; color: var(--faint); white-space: nowrap; }

        /* ── setting card ──────────────────────────────────────────────── */
        .set-card {
          display: flex; flex-direction: column; gap: 14px;
          padding: 18px; border-radius: 15px; border: 1px solid var(--line); background: var(--card);
          animation: set-rise .34s cubic-bezier(.22,1,.36,1) both;
          transition: border-color .22s, box-shadow .22s;
        }
        .set-card:hover { box-shadow: var(--shadow-sm); }
        /* An unsaved change is marked on the card itself, so it cannot be lost
           by scrolling past it. */
        .set-card.dirty { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,109,245,.1); }
        .set-card-ic { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; flex: 0 0 auto; }
        .set-card-title { font-size: 15px; font-weight: 750; }
        .set-card-sub { font-size: 12.5px; color: var(--muted); margin-top: 2px; line-height: 1.45; }
        .set-card-body { flex: 1; }
        .set-card-foot {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          padding-top: 12px; border-top: 1px solid var(--hair);
        }
        .set-when {
          display: inline-flex; align-items: center; gap: 6px; margin-right: auto;
          font-size: 11.5px; font-weight: 650; color: var(--faint);
        }

        .set-chip {
          padding: 7px 15px; border-radius: 10px; cursor: pointer; font-size: 12.5px; font-weight: 700;
          border: 1px solid var(--line); background: var(--surface-2); color: var(--accent-ink);
          transition: background .18s, color .18s, border-color .18s, transform .18s cubic-bezier(.22,1,.36,1);
        }
        .set-chip:hover:not(:disabled) { transform: translateY(-1px); border-color: var(--accent); }
        .set-chip.on { background: var(--accent); border-color: var(--accent); color: #fff; }
        .set-chip:disabled { opacity: .55; cursor: not-allowed; }

        /* ── version strip ─────────────────────────────────────────────── */
        .set-version {
          display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; align-items: center;
          padding: 18px 22px; border-radius: 18px; border: 1px solid var(--line); background: var(--card);
        }
        .set-version-ic {
          grid-row: span 2; width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center;
          background: rgba(42,120,214,.12); color: #2a78d6;
        }
        .set-version-title { font-size: 14px; font-weight: 750; }
        .set-version-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        @media (max-width: 760px) { .set-version-grid { grid-template-columns: 1fr; } }

        @media (prefers-reduced-motion: reduce) {
          .set-flag, .set-card { animation: none !important; }
          .set-flag:hover, .set-chip:hover:not(:disabled) { transform: none; }
        }
      `}</style>
    </div>
  )
}

function Info2({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '10px 14px' }}>
      <div className="faint" style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 14, marginTop: 2 }}>{value || '—'}</div>
    </div>
  )
}
