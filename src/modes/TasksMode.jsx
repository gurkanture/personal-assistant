import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

export default function TasksMode({ onExit }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(() => {
    let cancelled = false
    api
      .getTasks('pending', 20)
      .then(d => {
        if (cancelled) return
        setTasks(Array.isArray(d) ? d : d?.tasks || [])
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

  useEffect(() => load(), [load])

  const complete = async (id) => {
    setBusyId(id)
    try {
      await api.markTaskDone(id)
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="tasks-mode">
      <div className="section-label mono">
        BEKLEYEN GÖREVLER
        <button className="section-close mono" onClick={onExit}>KAPAT</button>
      </div>

      {loading && <div className="hint mono">YÜKLENİYOR...</div>}
      {error && <div className="hint mono error">BAĞLANTI HATASI</div>}
      {!loading && !error && tasks.length === 0 && (
        <div className="hint mono">BEKLEYEN GÖREV YOK</div>
      )}

      <ul className="tasks-list">
        {tasks.map(t => (
          <li
            key={t.id}
            className={`task-row ${busyId === t.id ? 'busy' : ''}`}
          >
            <button
              className="task-check"
              disabled={busyId === t.id}
              onClick={() => complete(t.id)}
              title="Tamamla"
            >
              ✓
            </button>
            <div className="task-body">
              <div className="task-title">{t.title}</div>
              <div className="task-meta mono">
                <span>#{t.priority ?? '–'}</span>
                {t.targetAgent && <span>· {t.targetAgent}</span>}
                {t.taskType && <span>· {t.taskType}</span>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
