'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { supabase } from '@/lib/supabase'
import AdminPanel from './components/AdminPanel'

interface Rule {
  id: string
  rule_number: string
  title: string
  content: string
  sort_key: string
  section: string
  mod_only: boolean
}

function isSection(num: string) {
  return !num.includes('.')
}

function punBadge(text: string) {
  const t = text.toLowerCase()
  if (t.includes('перманентный')) return 'pun-badge pun-ban'
  if (t.startsWith('бан'))        return 'pun-badge pun-ban'
  if (t.startsWith('мут'))        return 'pun-badge pun-mut'
  if (t.startsWith('кик'))        return 'pun-badge pun-kick'
  if (t.startsWith('снятие'))     return 'pun-badge pun-rem'
  return null
}

function MD({ text }: { text: string }) {
  return <span className="md"><ReactMarkdown>{text}</ReactMarkdown></span>
}

function RulesList({ rules, isPunishments }: { rules: Rule[]; isPunishments: boolean }) {
  if (rules.length === 0) return <div className="empty">Нет данных.</div>

  const sections = rules.filter(r => isSection(r.rule_number))
  const subs: Record<string, Rule[]> = {}
  rules.filter(r => !isSection(r.rule_number)).forEach(r => {
    const parent = r.rule_number.split('.')[0]
    if (!subs[parent]) subs[parent] = []
    subs[parent].push(r)
  })

  return (
    <div className="rule-list fadein">
      {sections.map(sec => (
        <div key={sec.id}>
          <div className="rule-section-header">
            <span className="sec-num">{sec.rule_number}.</span>
            <span className="sec-title">{sec.title}</span>
          </div>
          {(subs[sec.rule_number] || []).map(sub => {
            const badgeCls = isPunishments ? punBadge(sub.title) : null
            return (
              <div key={sub.id} className="rule-sub">
                <span className="sub-num">{sub.rule_number}</span>
                <div className="sub-body">
                  {badgeCls ? (
                    <span className={badgeCls}><MD text={sub.title} /></span>
                  ) : (
                    <span className="sub-text">
                      <MD text={sub.title} />
                      {sub.mod_only && <span className="mod-badge">★ модерация</span>}
                    </span>
                  )}
                  {sub.content && (
                    <div className="sub-text" style={{ marginTop: 4 }}>
                      <MD text={sub.content} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'rules' | 'punishments'>('rules')
  const [adminOpen, setAdminOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [comboKeys, setComboKeys] = useState<string[]>([])

  const fetchRules = useCallback(async () => {
    const { data } = await supabase.from('rules').select('*').order('sort_key', { ascending: true })
    setRules(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRules() }, [fetchRules])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        const k = e.key.toUpperCase()
        setComboKeys(prev => {
          const next = [...prev, k].slice(-2)
          if (next[0] === 'X' && next[1] === 'A') { setLoginOpen(true); return [] }
          return next
        })
      } else {
        setComboKeys([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const shown = rules.filter(r => r.section === tab)
  const ruleCount = rules.filter(r => r.section === 'rules' && !isSection(r.rule_number)).length
  const punCount  = rules.filter(r => r.section === 'punishments' && !isSection(r.rule_number)).length

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="wrap">
        <header className="hdr">
          <div className="hdr-eyebrow">Pixel Party</div>
          <h1 className="hdr-title">Правила сервера</h1>
          <div className="hdr-sub">
            <span>Редакция от {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span style={{ color: 'var(--border2)' }}>|</span>
            <span>{ruleCount} пунктов · {punCount} наказаний</span>
          </div>
          <div className="hdr-note">
            ★ — пункты, отмеченные значком «модерация», относятся только к составу модерации, но полезны для общего понимания.
          </div>
        </header>

        <nav className="tabs">
          <button className={`tab-btn${tab === 'rules' ? ' active' : ''}`} onClick={() => setTab('rules')}>
            Правила
          </button>
          <button className={`tab-btn${tab === 'punishments' ? ' active' : ''}`} onClick={() => setTab('punishments')}>
            Наказания
          </button>
        </nav>

        {loading ? (
          <div className="empty">Загрузка...</div>
        ) : (
          <RulesList rules={shown} isPunishments={tab === 'punishments'} />
        )}

        <footer className="ftr">
          <span>PIXEL PARTY © {new Date().getFullYear()}</span>
          <span>jrgmirakov.github.io/pixel-party-rules</span>
        </footer>
      </div>

      {loginOpen && !adminOpen && (
        <LoginModal
          onSuccess={() => { setLoginOpen(false); setAdminOpen(true) }}
          onClose={() => setLoginOpen(false)}
        />
      )}
      {adminOpen && (
        <AdminPanel rules={rules} onClose={() => setAdminOpen(false)} onRefresh={fetchRules} />
      )}
    </div>
  )
}

function LoginModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'pixelparty2025'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pw === PASS) onSuccess()
    else { setErr('Неверный пароль.'); setPw('') }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 340 }}>
        <div className="modal-hdr">
          <span className="modal-ttl">Вход</span>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-bd">
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label className="lbl">Пароль</label>
              <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr('') }}
                placeholder="••••••••" className="inp" autoFocus />
              {err && <span style={{ fontSize: 12, color: 'var(--accent)' }}>{err}</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
              <button type="submit" className="btn btn-red">Войти</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
