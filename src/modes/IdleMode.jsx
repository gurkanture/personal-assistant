import { useEffect, useState } from 'react'
import { api } from '../api.js'

const QUICK_ACTIONS = [
  { id: 'note', icon: '📝', label: 'NOT AL' },
  { id: 'music', icon: '🎵', label: 'MÜZİK' },
  { id: 'tasks', icon: '✓', label: 'GÖREVLER' },
  { id: 'history', icon: '⌛', label: 'GEÇMİŞ' },
]

export default function IdleMode({ onQuickAction }) {
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .getTasks('pending', 3)
      .then(data => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : data?.tasks || []
        setUpcoming(list)
        setError(null)
        setLoading(false)
      })
      .catch(e => {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="idle-mode">
      <div className="quick-grid">
        {QUICK_ACTIONS.map(a => (
          <button
            key={a.id}
            className="quick-card"
            onClick={() => onQuickAction(a.id)}
          >
            <span className="quick-icon">{a.icon}</span>
            <span className="quick-label mono">{a.label}</span>
          </button>
        ))}
      </div>

      <section className="upcoming">
        <div className="section-label mono">
          YAKLAŞAN GÖREVLER
          <span className="section-line" />
        </div>
        {loading && <div className="hint mono">YÜKLENİYOR...</div>}
        {error && <div className="hint mono error">BAĞLANTI YOK</div>}
        {!loading && !error && upcoming.length === 0 && (
          <div className="hint mono">BEKLEYEN GÖREV YOK</div>
        )}
        <ul className="upcoming-list">
          {upcoming.map(t => (
            <li key={t.id} className="upcoming-row">
              <span className="upcoming-prio mono">
                #{t.priority ?? '–'}
              </span>
              <span className="upcoming-title">{t.title}</span>
              {t.targetAgent && (
                <span className="upcoming-agent mono">{t.targetAgent}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
