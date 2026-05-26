import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

const WORKER = 'https://hena-api.gurkan-ture.workers.dev'
const AGENT  = 'agent_6401kqkzd0rpehnaspqfd8jwbj7w'

// ── Widget script loader ──────────────────────────────────
function useWidget() {
  useEffect(() => {
    if (document.querySelector('script[data-hw]')) return
    const s = document.createElement('script')
    s.src   = 'https://cdn.jsdelivr.net/npm/@elevenlabs/convai-widget-embed@latest/dist/index.js'
    s.async = true
    s.setAttribute('data-hw', '1')
    document.body.appendChild(s)
  }, [])
}

// ── Memory loader ─────────────────────────────────────────
function useMemory() {
  const [prompt, setPrompt] = useState('')
  useEffect(() => {
    fetch(`${WORKER}/memory`).then(r => r.json()).then(all => {
      if (!Array.isArray(all)) return
      const f = all.filter(m => ['user_profile','agenda','topic','preference'].includes(m.category))
      if (!f.length) return
      const g = (cat) => f.filter(m => m.category === cat)
      let p = '\n\n=== HAFIZA ==='
      if (g('user_profile').length) p += '\nKullanıcı: ' + g('user_profile').map(m=>`${m.key}=${m.summary}`).join(', ')
      if (g('preference').length)   p += '\nTercihler: ' + g('preference').map(m=>`${m.key}=${m.summary}`).join(', ')
      if (g('agenda').length)       { p += '\nGündem:'; g('agenda').forEach(m => p += `\n- ${m.summary}`) }
      if (g('topic').length)        { p += '\nKonular:'; g('topic').forEach(m => p += `\n- ${m.key}: ${m.summary}`) }
      p += '\n=== HAFIZA SONU ==='
      setPrompt(p)
    }).catch(() => {})
  }, [])
  return prompt
}

// ── Tasks loader ──────────────────────────────────────────
function useTasks() {
  const [tasks, setTasks] = useState([])
  const load = useCallback(() => {
    fetch(`${WORKER}/tasks?status=pending&limit=5`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setTasks(d)
    }).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])
  return { tasks, reload: load }
}

// ── Idle panel ────────────────────────────────────────────
function IdlePanel({ tasks, onMode }) {
  const btns = [
    { icon: '📝', label: 'Notlar',   mode: 'tasks'   },
    { icon: '🎵', label: 'Müzik',    mode: 'music'   },
    { icon: '📋', label: 'Görevler', mode: 'tasks'   },
    { icon: '💬', label: 'Geçmiş',   mode: 'history' },
  ]
  return (
    <div className="idle-panel">
      <div className="quick-grid">
        {btns.map(b => (
          <button key={b.label} className="quick-btn" onClick={() => onMode(b.mode)}>
            <span className="quick-icon">{b.icon}</span>
            <span className="quick-label">{b.label}</span>
          </button>
        ))}
      </div>
      {tasks.length > 0 && (
        <div className="task-preview">
          <div className="section-title">📌 Bekleyen</div>
          {tasks.slice(0,3).map(t => (
            <div key={t.id} className="task-row">
              <span className="task-dot">◻</span>
              <span className="task-title">{t.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Conversation panel ────────────────────────────────────
function ConvPanel({ msgs, callState }) {
  const ref = useRef(null)
  useEffect(() => { ref.current?.scrollTo(0, ref.current.scrollHeight) }, [msgs])
  return (
    <div className="conv-panel">
      <div className="orb-mini">
        <div className={`orb-core-mini ${callState}`}>
          <div className="wave-bars">
            {[0,.08,.16,.24,.32].map((d,i) => (
              <div key={i} className="wave-bar" style={{animationDelay:`${d}s`}} />
            ))}
          </div>
        </div>
      </div>
      <div className="transcript" ref={ref}>
        {msgs.length === 0 && <div className="transcript-empty">Dinliyorum...</div>}
        {msgs.map((m,i) => (
          <div key={i} className={`msg msg-${m.role}`}>
            <span className="msg-label">{m.role === 'user' ? 'Sen' : 'HENA'}</span>
            <span className="msg-text">{m.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tasks panel ───────────────────────────────────────────
function TasksPanel({ tasks, reload }) {
  const done = (id) => {
    fetch(`${WORKER}/tasks/${id}/status`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({status:'done'})
    }).then(() => reload())
  }
  return (
    <div className="tasks-panel">
      <div className="section-title">📋 Görevler</div>
      {tasks.length === 0 && <div className="empty-msg">Bekleyen görev yok</div>}
      {tasks.map(t => (
        <div key={t.id} className="task-item">
          <button className="task-check" onClick={() => done(t.id)}>◻</button>
          <div className="task-info">
            <div className="task-name">{t.title}</div>
            {t.description && <div className="task-desc">{t.description}</div>}
          </div>
          <div className="task-pri">P{t.priority}</div>
        </div>
      ))}
    </div>
  )
}

// ── Music panel ───────────────────────────────────────────
function MusicPanel({ track }) {
  return (
    <div className="music-panel">
      <div className="music-icon">🎵</div>
      <div className="music-track">{track || 'Müzik bekleniyor...'}</div>
      <div className="music-sub">Windows Agent çalıyor</div>
    </div>
  )
}

// ── History panel ─────────────────────────────────────────
function HistoryPanel({ msgs }) {
  return (
    <div className="history-panel">
      <div className="section-title">💬 Konuşma Geçmişi</div>
      {msgs.length === 0 && <div className="empty-msg">Henüz konuşma yok</div>}
      {msgs.map((m,i) => (
        <div key={i} className={`msg msg-${m.role}`}>
          <span className="msg-label">{m.role === 'user' ? 'Sen' : 'HENA'}</span>
          <span className="msg-text">{m.text}</span>
        </div>
      ))}
    </div>
  )
}

// ── Text input ────────────────────────────────────────────
function TextInput({ onClose }) {
  const [val, setVal] = useState('')
  const send = () => {
    if (!val.trim()) return
    fetch(`${WORKER}/message`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({text: val})
    })
    setVal('')
    onClose()
  }
  return (
    <div className="text-input-wrap">
      <input
        className="text-input"
        placeholder="HENA'ya yaz..."
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && send()}
        autoFocus
      />
      <button className="text-send" onClick={send}>↑</button>
      <button className="text-close" onClick={onClose}>✕</button>
    </div>
  )
}

// ── Settings drawer ───────────────────────────────────────
function SettingsDrawer({ open, settings, onChange }) {
  const sliders = [
    { key:'speed',      label:'HIZ',       min:70,  max:120, fmt: v=>(v/100).toFixed(1)+'×' },
    { key:'stability',  label:'STABİLİTE', min:30,  max:100, fmt: v=>(v/100).toFixed(2) },
    { key:'similarity', label:'BENZERLİK', min:50,  max:100, fmt: v=>(v/100).toFixed(2) },
  ]
  const voices = [
    {value:'',                      label:'— Varsayılan —'},
    {value:'AmW3oHMmMm7pJX7z8Kj3', label:'Amelia'},
    {value:'jsCqWAovK2LkecY7zXl4', label:'Freya'},
    {value:'XB0fDUnXU5powFXDhCwa', label:'Charlotte'},
    {value:'EXAVITQu4vr4xnSDxMaL', label:'Sarah'},
  ]
  if (!open) return null
  return (
    <div className="settings-overlay" onClick={e => e.target === e.currentTarget && onChange('__close')}>
      <div className="settings-panel">
        <div className="drawer-title">Ses Ayarları</div>
        {sliders.map(s => (
          <div className="ctrl-row" key={s.key}>
            <span className="ctrl-label">{s.label}</span>
            <input type="range" min={s.min} max={s.max} step="5"
              value={settings[s.key]}
              onChange={e => onChange(s.key, +e.target.value)} />
            <span className="ctrl-value">{s.fmt(settings[s.key])}</span>
          </div>
        ))}
        <div className="ctrl-row">
          <span className="ctrl-label">SES</span>
          <select value={settings.voice} onChange={e => onChange('voice', e.target.value)}>
            {voices.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [callState,  setCallState]  = useState('idle')
  const [panelMode,  setPanelMode]  = useState('idle')
  const [msgs,       setMsgs]       = useState([])
  const [musicTrack, setMusicTrack] = useState('')
  const [showText,   setShowText]   = useState(false)
  const [settings,   setSettings]   = useState({speed:100, stability:70, similarity:80, voice:''})
  const [showSettings, setShowSettings] = useState(false)

  const memoryPrompt = useMemory()
  const { tasks, reload } = useTasks()
  useWidget()

  // ElevenLabs override injection
  useEffect(() => {
    const h = (e) => {
      if (e.detail?.config) {
        const tts = {
          speed:            settings.speed / 100,
          stability:        settings.stability / 100,
          similarity_boost: settings.similarity / 100,
        }
        if (settings.voice) tts.voice_id = settings.voice
        e.detail.config.overrides = { tts }
        if (memoryPrompt) e.detail.config.overrides.agent = { prompt: { prompt: memoryPrompt } }
      }
      setCallState('listening')
      setPanelMode('conv')
    }
    window.addEventListener('elevenlabs-convai:call', h)
    return () => window.removeEventListener('elevenlabs-convai:call', h)
  }, [settings, memoryPrompt])

  useEffect(() => {
    const onConn = () => { setCallState('listening'); setPanelMode('conv') }
    const onDisc = () => { setCallState('idle'); setPanelMode('idle') }
    window.addEventListener('elevenlabs-convai:connect',    onConn)
    window.addEventListener('elevenlabs-convai:disconnect', onDisc)
    return () => {
      window.removeEventListener('elevenlabs-convai:connect',    onConn)
      window.removeEventListener('elevenlabs-convai:disconnect', onDisc)
    }
  }, [])

  useEffect(() => {
    const h = (ev) => {
      if (!ev.data || typeof ev.data !== 'object') return
      const t = String(ev.data.type || '')
      if (t.includes('agent-speaking') || t.includes('agent_speaking')) setCallState('speaking')
      if (t.includes('user-speaking')  || t.includes('user_speaking'))  setCallState('listening')
      if (t.includes('disconnect')     || t.includes('call-end'))       { setCallState('idle'); setPanelMode('idle') }

      // Transcript
      if (ev.data.message) {
        const role = t.includes('agent') ? 'agent' : 'user'
        const text = ev.data.message
        setMsgs(prev => [...prev.slice(-20), {role, text, time: Date.now()}])

        // Müzik komutu yakala
        const match = text.match(/müzik_iste:(.+)/i)
        if (match) {
          setMusicTrack(match[1].trim())
          setPanelMode('music')
        }
      }
    }
    window.addEventListener('message', h)
    return () => window.removeEventListener('message', h)
  }, [])

  const handleSettings = useCallback((key, val) => {
    if (key === '__close') { setShowSettings(false); return }
    setSettings(prev => ({ ...prev, [key]: val }))
  }, [])

  const statusMap = {
    idle:      { label: 'HAZIR',     active: false },
    listening: { label: 'DİNLİYOR', active: true  },
    speaking:  { label: 'KONUŞUYOR',active: true  },
  }
  const st = statusMap[callState] || statusMap.idle

  // Panel içeriği
  const renderPanel = () => {
    switch(panelMode) {
      case 'conv':    return <ConvPanel msgs={msgs} callState={callState} />
      case 'tasks':   return <TasksPanel tasks={tasks} reload={reload} />
      case 'music':   return <MusicPanel track={musicTrack} />
      case 'history': return <HistoryPanel msgs={msgs} />
      default:        return <IdlePanel tasks={tasks} onMode={setPanelMode} />
    }
  }

  return (
    <>
      {/* Arka plan */}
      <div className="bg-canvas" />
      <div className="bg-grid" />

      <div className="shell">
        {/* Header */}
        <header>
          <div className="logo-group">
            <div className="logo-mark"><div className="logo-inner" /></div>
            <div className="logo-text">
              <span className="logo-name">HENA</span>
              <span className="logo-sub">KİŞİSEL ASISTAN</span>
            </div>
          </div>
          <div className={`status-pill ${st.active ? 'active' : ''}`}>
            <span className="dot" />
            <span>{st.label}</span>
            {memoryPrompt && <span className="mem-dot" title="Bellek aktif"> ●</span>}
          </div>
        </header>

        {/* Akıllı Alan */}
        <main>
          {/* Panel mod seçici */}
          {panelMode !== 'idle' && panelMode !== 'conv' && (
            <button className="back-btn" onClick={() => setPanelMode('idle')}>← Geri</button>
          )}
          <div className="smart-area">
            {renderPanel()}
          </div>
          {showText && <TextInput onClose={() => setShowText(false)} />}
        </main>

        {/* Footer */}
        <footer>
          {/* ElevenLabs widget gizli ama DOM'da */}
          <elevenlabs-convai
            id="el-widget"
            agent-id={AGENT}
            style={{position:'fixed', bottom:'-9999px', right:'-9999px', opacity:0, pointerEvents:'none'}}
          />

          <button
            className={`foot-btn primary ${callState !== 'idle' ? 'active' : ''}`}
            onClick={() => {
              const w = document.getElementById('el-widget')
              const btn = w?.shadowRoot?.querySelector('button')
              if (btn) btn.click()
            }}
          >
            🎙 {callState === 'idle' ? 'KONUŞ' : 'KAPAT'}
          </button>

          <button
            className={`foot-btn ${showText ? 'active' : ''}`}
            onClick={() => setShowText(v => !v)}
          >
            ⌨ YAZ
          </button>

          <button
            className="foot-btn"
            onClick={() => setPanelMode(m => m === 'tasks' ? 'idle' : 'tasks')}
          >
            📋 GÖREVLER
          </button>

          <button
            className={`foot-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(v => !v)}
          >
            ⚙
          </button>
        </footer>
      </div>

      <SettingsDrawer open={showSettings} settings={settings} onChange={handleSettings} />
    </>
  )
}