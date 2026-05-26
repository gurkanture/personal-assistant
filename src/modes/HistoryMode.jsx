import { useEffect, useState } from 'react'
import { api } from '../api.js'

export default function HistoryMode({ onExit }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .getTasks('done', 20)
      .then(d => {
        if (cancelled) return
        setItems(Array.isArray(d) ? d : d?.tasks || [])
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setItems([])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="history-mode">
      <div className="section-label mono">
        SON KONUŞMALAR
        <button className="section-close mono" onClick={onExit}>KAPAT</button>
      </div>

      {loading && <div className="hint mono">YÜKLENİYOR...</div>}
      {!loading && items.length === 0 && (
        <div className="hint mono">GEÇMİŞ KAYIT YOK</div>
      )}

      <ul className="history-list">
        {items.map(t => (
          <li key={t.id} className="history-row">
            <span className="history-icon">●</span>
            <div className="history-body">
              <div className="history-title">{t.title}</div>
              <div className="history-meta mono">
                {t.completedAt || t.createdAt || ''}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
