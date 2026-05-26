import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const WORKER_URL = 'https://hena-api.gurkan-ture.workers.dev'

// ── Particle sistemi ──────────────────────────────────────
function Particles() {
  return (
    <div className="particles" aria-hidden>
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top:  `${55 + Math.random() * 45}%`,
            animationDuration: `${4 + Math.random() * 6}s`,
            animationDelay:    `${Math.random() * 8}s`,
            width:  `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
          }}
        />
      ))}
    </div>
  )
}

// ── Ayarlar drawer'ı ──────────────────────────────────────
function SettingsDrawer({ open, settings, onChange }) {
  const sliders = [
    { key: 'speed',      label: 'HIZ',       min: 70,  max: 120, display: v => (v/100).toFixed(1)+'×' },
    { key: 'stability',  label: 'STABİLİTE', min: 30,  max: 100, display: v => (v/100).toFixed(2) },
    { key: 'similarity', label: 'BENZERLİK', min: 50,  max: 100, display: v => (v/100).toFixed(2) },
  ]
  const voices = [
    { value: '',                      label: '— Varsayılan —' },
    { value: 'AmW3oHMmMm7pJX7z8Kj3', label: 'Amelia' },
    { value: 'jsCqWAovK2LkecY7zXl4', label: 'Freya' },
    { value: 'XB0fDUnXU5powFXDhCwa', label: 'Charlotte' },
    { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah' },
  ]

  return (
    <div className={`drawer ${open ? 'open' : ''}`}>
      <div className="drawer-inner">
        <div className="drawer-title">Ses Ayarları</div>
        <div className="drawer-grid">
          {sliders.map(s => (
            <div className="ctrl-row" key={s.key}>
              <span className="ctrl-label">{s.label}</span>
              <input
                type="range" min={s.min} max={s.max} step="5"
                value={settings[s.key]}
                onChange={e => onChange(s.key, +e.target.value)}
              />
              <span className="ctrl-value">{s.display(settings[s.key])}</span>
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
    </div>
  )
}

// ── Ana uygulama ──────────────────────────────────────────
export default function App() {
  const [callState, setCallState]   = useState('idle') // idle | listening | speaking
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settings, setSettings]     = useState({ speed: 100, stability: 70, similarity: 80, voice: '' })
  const widgetRef = useRef(null)

  // Override event — call başlarken ayarları inject et
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.config) {
        const tts = {
          speed:            settings.speed / 100,
          stability:        settings.stability / 100,
          similarity_boost: settings.similarity / 100,
        }
        if (settings.voice) tts.voice_id = settings.voice
        e.detail.config.overrides = { tts }
      }
      setCallState('listening')
    }
    window.addEventListener('elevenlabs-convai:call', handler)
    return () => window.removeEventListener('elevenlabs-convai:call', handler)
  }, [settings])

  // Widget events
  useEffect(() => {
    const onConnect    = () => setCallState('listening')
    const onDisconnect = () => setCallState('idle')
    window.addEventListener('elevenlabs-convai:connect',    onConnect)
    window.addEventListener('elevenlabs-convai:disconnect', onDisconnect)
    return () => {
      window.removeEventListener('elevenlabs-convai:connect',    onConnect)
      window.removeEventListener('elevenlabs-convai:disconnect', onDisconnect)
    }
  }, [])

  // Message fallback (speaking/listening)
  useEffect(() => {
    const handler = (ev) => {
      if (!ev.data || typeof ev.data !== 'object') return
      const t = String(ev.data.type || '')
      if (t.includes('agent-speaking') || t.includes('agent_speaking')) setCallState('speaking')
      if (t.includes('user-speaking')  || t.includes('user_speaking'))  setCallState('listening')
      if (t.includes('disconnect')     || t.includes('call-end'))       setCallState('idle')
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // ElevenLabs widget script inject
  useEffect(() => {
    if (document.querySelector('script[data-hena-widget]')) return
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/@elevenlabs/convai-widget-embed@latest/dist/index.js'
    s.async = true
    s.setAttribute('data-hena-widget', '1')
    document.body.appendChild(s)
  }, [])

  const handleSettingChange = useCallback((key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }))
  }, [])

  // State config
  const stateMap = {
    idle:      { label: 'KONUŞMAK İÇİN DOKUN', status: 'HAZIR',     pillActive: false },
    listening: { label: 'DİNLİYOR',             status: 'DİNLİYOR',  pillActive: true  },
    speaking:  { label: 'KONUŞUYOR',            status: 'KONUŞUYOR', pillActive: true  },
  }
  const state = stateMap[callState] || stateMap.idle

  return (
    <>
      {/* Arka plan */}
      <div className="bg-canvas" />
      <div className="bg-grid" />
      <Particles />

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
          <div className={`status-pill ${state.pillActive ? 'active' : ''}`}>
            <span className="dot" />
            <span>{state.status}</span>
          </div>
        </header>

        {/* Main */}
        <main>
          {/* Orb + widget */}
          <div className="orb-wrap">
            <div className="orb-ring r1" />
            <div className="orb-ring r2" />
            <div className="orb-ring r3" />
            <div className="widget-center" ref={widgetRef}>
              <elevenlabs-convai agent-id="agent_6401kqkzd0rpehnaspqfd8jwbj7w" />
            </div>
          </div>

          <div className={`state-label ${state.pillActive ? 'active' : ''}`}>
            {state.label}
          </div>

          <SettingsDrawer
            open={drawerOpen}
            settings={settings}
            onChange={handleSettingChange}
          />
        </main>

        {/* Footer */}
        <footer>
          <span className="footer-info">HENA v6.0 · REACT</span>
          <button
            className={`btn-settings ${drawerOpen ? 'active' : ''}`}
            onClick={() => setDrawerOpen(o => !o)}
          >
            ⚙ AYARLAR
          </button>
        </footer>
      </div>
    </>
  )
}
