import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

const WORKER = 'https://hena-api.gurkan-ture.workers.dev'
const AGENT  = 'agent_6401kqkzd0rpehnaspqfd8jwbj7w'

// ── Widget script ─────────────────────────────────────────
function useWidget() {
  useEffect(() => {
    if (document.querySelector('script[data-hw]')) return
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/@elevenlabs/convai-widget-embed@latest/dist/index.js'
    s.async = true; s.setAttribute('data-hw', '1')
    document.body.appendChild(s)
  }, [])
}

// ── Memory ────────────────────────────────────────────────
function useMemory() {
  const [prompt, setPrompt] = useState('')
  useEffect(() => {
    fetch(`${WORKER}/memory`).then(r => r.json()).then(all => {
      if (!Array.isArray(all)) return
      const f = all.filter(m => ['user_profile','agenda','topic','preference'].includes(m.category))
      if (!f.length) return
      const g = cat => f.filter(m => m.category === cat)
      let p = '\n\n=== HAFIZA ==='
      if (g('user_profile').length) p += '\nKullanıcı: ' + g('user_profile').map(m=>`${m.key}=${m.summary}`).join(', ')
      if (g('preference').length)   p += '\nTercihler: ' + g('preference').map(m=>`${m.key}=${m.summary}`).join(', ')
      if (g('agenda').length)       { p += '\nGündem:'; g('agenda').forEach(m => p += `\n- ${m.summary}`) }
      if (g('topic').length)        { p += '\nKonular:'; g('topic').forEach(m => p += `\n- ${m.key}: ${m.summary}`) }
      p += '\n=== HAFIZA SONU ==='; setPrompt(p)
    }).catch(() => {})
  }, [])
  return prompt
}

// ── Dönen halkalar (idle) ─────────────────────────────────
function OrbRings({ state }) {
  return (
    <div className={`orb-stage stage-${state}`}>
      <div className="ring r1" /><div className="ring r2" /><div className="ring r3" />
      <div className="orb-core">
        {(state === 'speaking') && (
          <div className="wave-bars">
            {[0,.07,.14,.21,.28].map((d,i) => <div key={i} className="wb" style={{animationDelay:`${d}s`}} />)}
          </div>
        )}
        {(state === 'listening') && <div className="listen-pulse" />}
        {(state === 'idle') && <div className="idle-dot" />}
      </div>
    </div>
  )
}

// ── Karatahta içerikleri ──────────────────────────────────
function KaratahtalIdle() {
  return (
    <div className="kb-idle">
      <OrbRings state="idle" />
      <p className="kb-hint">Konuşmak için mikrofona dokun</p>
    </div>
  )
}

function KaratahtalConv({ msgs, state }) {
  const ref = useRef(null)
  useEffect(() => { ref.current?.scrollTo(0, ref.current.scrollHeight) }, [msgs])
  return (
    <div className="kb-conv">
      <OrbRings state={state} />
      <div className="transcript" ref={ref}>
        {msgs.slice(-6).map((m, i) => (
          <div key={i} className={`line line-${m.role}`}>
            <span className="line-who">{m.role === 'user' ? 'Sen' : 'HENA'}</span>
            <span className="line-text">{m.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KaratahtalMusic({ track }) {
  return (
    <div className="kb-music">
      <div className="music-visual">
        {[...Array(12)].map((_,i) => (
          <div key={i} className="music-bar" style={{animationDelay:`${i*0.08}s`, height:`${20+Math.random()*60}%`}} />
        ))}
      </div>
      <div className="music-info">
        <div className="music-label">ŞU AN ÇALIYOR</div>
        <div className="music-track">{track}</div>
      </div>
    </div>
  )
}

function KaratahtalTasks({ tasks, onClose, onDone }) {
  return (
    <div className="kb-tasks">
      <div className="kb-tasks-header">
        <span>📋 Bekleyen Görevler</span>
        <button className="kb-close" onClick={onClose}>✕</button>
      </div>
      {tasks.length === 0 && <div className="kb-empty">Bekleyen görev yok 🎉</div>}
      {tasks.map(t => (
        <div key={t.id} className="task-row">
          <button className="task-done-btn" onClick={() => onDone(t.id)}>◻</button>
          <div className="task-body">
            <div className="task-name">{t.title}</div>
            {t.description && <div className="task-desc">{t.description}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function KaratahtalText({ onClose, onSend }) {
  const [val, setVal] = useState('')
  const send = () => { if (!val.trim()) return; onSend(val); setVal(''); onClose() }
  return (
    <div className="kb-text">
      <OrbRings state="idle" />
      <div className="text-area">
        <input className="text-in" placeholder="HENA'ya yaz..." value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          autoFocus />
        <button className="text-btn" onClick={send}>↑</button>
      </div>
    </div>
  )
}

// ── Settings sheet ────────────────────────────────────────
function SettingsSheet({ open, settings, onChange, onClose }) {
  if (!open) return null
  const sliders = [
    { key:'speed',      label:'HIZ',       min:70,  max:120, fmt: v=>(v/100).toFixed(1)+'×' },
    { key:'stability',  label:'STABİLİTE', min:30,  max:100, fmt: v=>(v/100).toFixed(2) },
    { key:'similarity', label:'BENZERLİK', min:50,  max:100, fmt: v=>(v/100).toFixed(2) },
  ]
  const voices = [
    {value:'',label:'— Varsayılan —'},{value:'AmW3oHMmMm7pJX7z8Kj3',label:'Amelia'},
    {value:'jsCqWAovK2LkecY7zXl4',label:'Freya'},{value:'XB0fDUnXU5powFXDhCwa',label:'Charlotte'},
    {value:'EXAVITQu4vr4xnSDxMaL',label:'Sarah'},
  ]
  return (
    <div className="sheet-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">Ses Ayarları</div>
        {sliders.map(s => (
          <div className="s-row" key={s.key}>
            <span className="s-label">{s.label}</span>
            <input type="range" min={s.min} max={s.max} step="5"
              value={settings[s.key]} onChange={e => onChange(s.key, +e.target.value)} />
            <span className="s-val">{s.fmt(settings[s.key])}</span>
          </div>
        ))}
        <div className="s-row">
          <span className="s-label">SES</span>
          <select value={settings.voice} onChange={e => onChange('voice', e.target.value)}>
            {voices.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────
export default function App() {
  const [callState, setCallState] = useState('idle')
  const [mode,      setMode]      = useState('idle') // idle|conv|music|tasks|text
  const [msgs,      setMsgs]      = useState([])
  const [track,     setTrack]     = useState('')
  const [tasks,     setTasks]     = useState([])
  const [settings,  setSettings]  = useState({speed:100, stability:70, similarity:80, voice:''})
  const [showSettings, setShowSettings] = useState(false)

  const memory = useMemory()
  useWidget()

  // Tasks
  const loadTasks = useCallback(() => {
    fetch(`${WORKER}/tasks?status=pending&limit=10`).then(r=>r.json()).then(d => {
      if (Array.isArray(d)) setTasks(d)
    }).catch(()=>{})
  }, [])
  useEffect(() => { loadTasks() }, [loadTasks])

  const markDone = (id) => {
    fetch(`${WORKER}/tasks/${id}/status`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({status:'done'})
    }).then(() => loadTasks())
  }

  // ElevenLabs events
  useEffect(() => {
    const h = (e) => {
      if (e.detail?.config) {
        const tts = { speed: settings.speed/100, stability: settings.stability/100, similarity_boost: settings.similarity/100 }
        if (settings.voice) tts.voice_id = settings.voice
        e.detail.config.overrides = { tts }
        if (memory) e.detail.config.overrides.agent = { prompt: { prompt: memory } }
      }
      setCallState('listening'); setMode('conv')
    }
    window.addEventListener('elevenlabs-convai:call', h)
    return () => window.removeEventListener('elevenlabs-convai:call', h)
  }, [settings, memory])

  useEffect(() => {
    const onConn = () => { setCallState('listening'); setMode('conv') }
    const onDisc = () => { setCallState('idle'); setMode('idle') }
    window.addEventListener('elevenlabs-convai:connect', onConn)
    window.addEventListener('elevenlabs-convai:disconnect', onDisc)
    return () => {
      window.removeEventListener('elevenlabs-convai:connect', onConn)
      window.removeEventListener('elevenlabs-convai:disconnect', onDisc)
    }
  }, [])

  useEffect(() => {
    const h = (ev) => {
      if (!ev.data || typeof ev.data !== 'object') return
      const t = String(ev.data.type || '')
      if (t.includes('agent-speaking') || t.includes('agent_speaking')) setCallState('speaking')
      if (t.includes('user-speaking')  || t.includes('user_speaking'))  setCallState('listening')
      if (t.includes('disconnect')     || t.includes('call-end'))       { setCallState('idle'); setMode('idle') }
      if (ev.data.message) {
        const role = t.includes('agent') ? 'agent' : 'user'
        setMsgs(prev => [...prev.slice(-30), {role, text: ev.data.message}])
        const m = ev.data.message.match(/müzik_iste:(.+)/i)
        if (m) { setTrack(m[1].trim()); setMode('music') }
      }
    }
    window.addEventListener('message', h)
    return () => window.removeEventListener('message', h)
  }, [])

  const triggerWidget = () => {
    const w = document.getElementById('el-widget')
    const btn = w?.shadowRoot?.querySelector('button')
    if (btn) btn.click()
  }

  const handleSettings = useCallback((key, val) => {
    setSettings(prev => ({...prev, [key]: val}))
  }, [])

  const statusLabels = { idle:'HAZIR', listening:'DİNLİYOR', speaking:'KONUŞUYOR' }

  // Karatahta içeriği
  const renderKB = () => {
    switch(mode) {
      case 'conv':  return <KaratahtalConv msgs={msgs} state={callState} />
      case 'music': return <KaratahtalMusic track={track} />
      case 'tasks': return <KaratahtalTasks tasks={tasks} onClose={() => setMode('idle')} onDone={markDone} />
      case 'text':  return <KaratahtalText onClose={() => setMode('idle')} onSend={(text) => {
        setMsgs(prev => [...prev, {role:'user', text}])
        setMode('conv')
      }} />
      default:      return <KaratahtalIdle />
    }
  }

  return (
    <>
      <div className="bg" /><div className="grid" />

      <div className="shell">
        {/* Header */}
        <header>
          <div className="logo">
            <div className="logo-gem"><div className="gem-dot" /></div>
            <div>
              <div className="logo-name">HENA</div>
              <div className="logo-sub">KİŞİSEL ASISTAN</div>
            </div>
          </div>
          <div className={`pill ${callState !== 'idle' ? 'pill-on' : ''}`}>
            <span className="pill-dot" />
            {statusLabels[callState]}
          </div>
        </header>

        {/* Karatahta */}
        <main className="karatahta">
          {renderKB()}
        </main>

        {/* Footer */}
        <footer>
          <button className={`fb fb-text ${mode==='text'?'fb-on':''}`}
            onClick={() => setMode(m => m==='text' ? 'idle' : 'text')}>
            ✏
          </button>

          <button
            className={`fb fb-main ${callState !== 'idle' ? 'fb-active' : ''}`}
            onClick={triggerWidget}
          >
            <span className="fb-mic">🎙</span>
            <span className="fb-label">{callState === 'idle' ? 'KONUŞ' : 'KAPAT'}</span>
          </button>

          <button className={`fb fb-tasks ${mode==='tasks'?'fb-on':''}`}
            onClick={() => setMode(m => m==='tasks' ? 'idle' : 'tasks')}>
            📋
          </button>

          <button className={`fb fb-set ${showSettings?'fb-on':''}`}
            onClick={() => setShowSettings(v => !v)}>
            ⚙
          </button>
        </footer>
      </div>

      {/* Gizli widget */}
      <elevenlabs-convai id="el-widget" agent-id={AGENT}
        style={{position:'fixed',bottom:'-9999px',right:'-9999px',opacity:0,pointerEvents:'none'}} />

      <SettingsSheet open={showSettings} settings={settings}
        onChange={handleSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
