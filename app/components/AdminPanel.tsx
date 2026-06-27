'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Rule {
  id: string
  rule_number: string
  title: string
  content: string
  sort_key: string
  section: string
  mod_only: boolean
}

interface Props {
  rules: Rule[]
  onClose: () => void
  onRefresh: () => Promise<void>
}

function makeSortKey(num: string, section: string): string {
  const prefix = section === 'punishments' ? 'P' : ''
  return prefix + num.split('.').map(p => p.padStart(3, '0')).join('.')
}

function isSection(num: string) { return !num.includes('.') }

export default function AdminPanel({ rules, onClose, onRefresh }: Props) {
  const [tab, setTab]       = useState<'rules' | 'punishments'>('rules')
  const [view, setView]     = useState<'list' | 'edit'>('list')
  const [editing, setEditing] = useState<Rule | null>(null)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({
    rule_number: '', title: '', content: '', section: 'rules', mod_only: false,
  })

  const shown = rules.filter(r => r.section === tab)

  const openAdd = () => {
    setForm({ rule_number: '', title: '', content: '', section: tab, mod_only: false })
    setEditing(null)
    setView('edit')
  }

  const openEdit = (r: Rule) => {
    setForm({ rule_number: r.rule_number, title: r.title, content: r.content, section: r.section, mod_only: r.mod_only })
    setEditing(r)
    setView('edit')
  }

  const handleSave = async () => {
    if (!form.rule_number.trim() || !form.title.trim()) return
    setSaving(true)
    try {
      const payload = {
        rule_number: form.rule_number.trim(),
        title: form.title.trim(),
        content: form.content.trim(),
        section: form.section,
        mod_only: form.mod_only,
        sort_key: makeSortKey(form.rule_number.trim(), form.section),
        updated_at: new Date().toISOString(),
      }
      if (editing) {
        await supabase.from('rules').update(payload).eq('id', editing.id)
      } else {
        await supabase.from('rules').insert([payload])
      }
      await onRefresh()
      setView('list')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот пункт?')) return
    setDeleting(id)
    try {
      await supabase.from('rules').delete().eq('id', id)
      await onRefresh()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="overlay">
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-hdr">
          <span className="modal-ttl">Панель управления</span>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-bd">
          {view === 'list' ? (
            <>
              <div className="adm-tabs">
                <button className={`adm-tab${tab === 'rules' ? ' active' : ''}`} onClick={() => setTab('rules')}>Правила</button>
                <button className={`adm-tab${tab === 'punishments' ? ' active' : ''}`} onClick={() => setTab('punishments')}>Наказания</button>
              </div>
              <div style={{ marginBottom: 14 }}>
                <button className="btn btn-red" onClick={openAdd}>+ Добавить пункт</button>
              </div>
              {shown.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: 13, padding: '16px 0' }}>Пунктов нет.</div>
              ) : (
                shown.map(r => (
                  <div key={r.id} className="adm-row">
                    <span className={`adm-row-num${isSection(r.rule_number) ? ' is-sec' : ''}`}>{r.rule_number}</span>
                    <div className="adm-row-body">
                      <div className={`adm-row-title${isSection(r.rule_number) ? ' is-sec' : ''}`}>
                        {r.title}
                        {r.mod_only && <span className="mod-badge" style={{ marginLeft: 6 }}>★ мод</span>}
                      </div>
                    </div>
                    <div className="adm-row-acts">
                      <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEdit(r)}>Ред.</button>
                      <button className="btn btn-del"   style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleDelete(r.id)} disabled={deleting === r.id}>
                        {deleting === r.id ? '...' : 'Удал.'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setView('list')}>← Назад</button>
                <span style={{ color: 'var(--text3)', fontSize: 13 }}>{editing ? 'Редактировать' : 'Новый пункт'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div className="field">
                  <label className="lbl">Номер</label>
                  <input type="text" value={form.rule_number}
                    onChange={e => setForm(f => ({ ...f, rule_number: e.target.value }))}
                    placeholder="1.3" className="inp mono" autoFocus />
                </div>
                <div className="field">
                  <label className="lbl">Раздел</label>
                  <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} className="inp">
                    <option value="rules">Правила</option>
                    <option value="punishments">Наказания</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="lbl">Текст пункта</label>
                <input type="text" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Текст правила или наказания..." className="inp" />
              </div>
              <div className="field">
                <label className="lbl">Доп. пояснение (необязательно, Markdown)</label>
                <textarea value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Дополнительный текст..." className="inp" rows={3} style={{ resize: 'vertical' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                <input type="checkbox" checked={form.mod_only}
                  onChange={e => setForm(f => ({ ...f, mod_only: e.target.checked }))}
                  style={{ accentColor: 'var(--mod)', width: 15, height: 15 }} />
                Только для модерации (★)
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setView('list')}>Отмена</button>
                <button className="btn btn-red" onClick={handleSave}
                  disabled={saving || !form.rule_number.trim() || !form.title.trim()}>
                  {saving ? 'Сохранение...' : editing ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
