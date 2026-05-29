import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

const WORKER = 'https://hena-api.gurkan-ture.workers.dev'
const AGENT  = 'agent_6401kqkzd0rpehnaspqfd8jwbj7w'

// ── Memory ────────────────────────────────────────────────
function useMemory() {
  const [prompt, setPrompt] = useState('')
  useEffect(() => {
    fetch(`${WORKER}/memory?limit=50`).then(r => r.json()).then(all => {
      if (!Array.isArray(all)) return
      const cats = ['user_profile','agenda','topic','preference','gundem','genel','görev','hatırlatma']
      const f = all.filter(m => cats.includes(m.category))
      if (!f.length) return
      const g = cat => f.filter(m => m.category === cat)
      let p = '\n\n=== HAFIZA ==='
      if (g('user_profile').length) p += '\nKullanıcı: ' + g('user_profile').map(m=>`${m.key}=${m.summary}`).join(', ')
      if (g('preference').length)   p += '\nTercihler: ' + g('preference').map(m=>`${m.key}=${m.summary}`).join(', ')
      // Son gündem — en kritik, en üste
      const gundemler = [...g('gundem'), ...g('genel')].slice(0, 5)
      if (gundemler.length) { p += '\nSon gündem (önemli, bunları bil):'; gundemler.forEach(m => p += `\n- ${m.summary}`) }
      if (g('hatırlatma').length) { p += '\nHatırlatmalar:'; g('hatırlatma').slice(0,3).forEach(m => p += `\n- ${m.summary}`) }
      if (g('görev').length)      { p += '\nGörevler:'; g('görev').slice(0,3).forEach(m => p += `\n- ${m.summary}`) }
      if (g('agenda').length)     { p += '\nAktif gündem:'; g('agenda').forEach(m => p += `\n- ${m.summary}`) }
      if (g('topic').length)      { p += '\nKonular:'; g('topic').forEach(m => p += `\n- ${m.key}: ${m.summary}`) }
      p += '\n=== HAFIZA SONU ==='; setPrompt(p)
    }).catch(() => {})
  }, [])
  return prompt
}

// ── Web Audio Visualizer ──────────────────────────────────
function useAudioVisualizer(active) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef   = useRef(null)
  const ctxRef      = useRef(null)

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current)
      if (sourceRef.current) { try { sourceRef.current.disconnect() } catch(e){} }
      if (ctxRef.current)    { try { ctxRef.current.close() }         catch(e){} }
      analyserRef.current = null; sourceRef.current = null; ctxRef.current = null
      // Clear canvas
      const c = canvasRef.current; if (!c) return
      const ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height)
      return
    }

    navigator.mediaDevices.getUserMedia({audio:true}).then(stream => {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)
      ctxRef.current = audioCtx; analyserRef.current = analyser; sourceRef.current = source

      const data = new Uint8Array(analyser.frequencyBinCount)
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')

      const draw = () => {
        rafRef.current = requestAnimationFrame(draw)
        analyser.getByteFrequencyData(data)
        const W = canvas.width, H = canvas.height
        ctx.clearRect(0,0,W,H)
        const barW = W / data.length * 2.5
        let x = 0
        for (let i = 0; i < data.length; i++) {
          const h = (data[i] / 255) * H * 0.85
          const hue = 200 + i * 0.5
          ctx.fillStyle = `hsla(${hue},80%,65%,0.85)`
          // Mirrored bars from center
          ctx.fillRect(W/2 + x, H - h, barW - 1, h)
          ctx.fillRect(W/2 - x - barW, H - h, barW - 1, h)
          x += barW
          if (x > W/2) break
        }
      }
      draw()
    }).catch(() => {
      // Mic unavailable — show fake animation
      const canvas = canvasRef.current; if (!canvas) return
      const ctx = canvas.getContext('2d')
      const W = canvas.width, H = canvas.height
      let t = 0
      const draw = () => {
        if (!active) return
        rafRef.current = requestAnimationFrame(draw)
        ctx.clearRect(0,0,W,H)
        const bars = 24
        for (let i = 0; i < bars; i++) {
          const h = (Math.sin(t * 3 + i * 0.4) * 0.5 + 0.5) * H * 0.7
          const hue = 200 + i * 3
          ctx.fillStyle = `hsla(${hue},75%,62%,0.8)`
          const bw = W / bars - 3
          ctx.fillRect(i * (bw + 3), H - h, bw, h)
          t += 0.008
        }
      }
      draw()
    })

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (sourceRef.current) { try { sourceRef.current.disconnect() } catch(e){} }
      if (ctxRef.current)    { try { ctxRef.current.close() }         catch(e){} }
    }
  }, [active])

  return canvasRef
}

// ── HENA speaking visualizer (animated sine) ─────────────
function HenaBars({ active }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    let t = 0

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw)
      ctx.clearRect(0,0,W,H)
      if (!active) return
      const bars = 20
      for (let i = 0; i < bars; i++) {
        const h = (Math.sin(t * 4 + i * 0.5) * 0.5 + 0.5) * H * 0.8 + H * 0.1
        ctx.fillStyle = `hsla(165,70%,60%,0.8)`
        const bw = W / bars - 4
        ctx.fillRect(i * (W/bars), H - h, bw, h)
      }
      t += 0.012
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])

  return <canvas ref={canvasRef} width={360} height={100} className="viz-canvas"/>
}

// ── Orb idle ──────────────────────────────────────────────
function OrbIdle() {
  return (
    <div className="orb-wrap">
      <div className="ring r1"/><div className="ring r2"/><div className="ring r3"/>
      <div className="orb-core">
        <div className="orb-dot"/>
      </div>
    </div>
  )
}

// ── Chat bubble ───────────────────────────────────────────
function Bubble({ msg }) {
  return (
    <div className={`bubble bubble-${msg.role}`}>
      <div className="bubble-txt">{msg.text}</div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [callState, setCallState] = useState('idle')
  const [connecting, setConnecting] = useState(false)
  const [msgs,      setMsgs]      = useState([])
  const [track,     setTrack]     = useState('')
  const [showMode,  setShowMode]  = useState('idle') // idle|conv|music|tasks|text
  const [tasks,     setTasks]     = useState([])
  const [settings,  setSettings]  = useState({speed:100,stability:70,similarity:80,voice:''})
  const [showSet,   setShowSet]   = useState(false)
  const [showText,  setShowText]  = useState(false)
  const [textVal,   setTextVal]   = useState('')
  const scrollRef   = useRef(null)
  const memory      = useMemory()

  // Audio visualizers
  const userCanvasRef = useAudioVisualizer(callState === 'listening')

  // Load widget script
  useEffect(() => {
    if (customElements.get('elevenlabs-convai')) return
    if (document.querySelector('script[data-hw]')) return
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/@elevenlabs/convai-widget-embed@latest/dist/index.js'
    s.async = true; s.setAttribute('data-hw','1')
    document.body.appendChild(s)
  }, [])

  // Load tasks
  const loadTasks = useCallback(() => {
    fetch(`${WORKER}/tasks?status=pending&limit=8`).then(r=>r.json()).then(d=>{
      if (Array.isArray(d)) setTasks(d)
    }).catch(()=>{})
  },[])
  useEffect(()=>{ loadTasks() },[loadTasks])

  // Auto scroll
  useEffect(()=>{ scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight) },[msgs])

  // ElevenLabs override injection
  useEffect(()=>{
    const h = e => {
      if (e.detail?.config) {
        const tts = {speed:settings.speed/100,stability:settings.stability/100,similarity_boost:settings.similarity/100}
        if (settings.voice) tts.voice_id = settings.voice
        e.detail.config.overrides = {tts}
        if (memory) e.detail.config.overrides.agent = {prompt:{prompt:memory}}
      }
      setCallState('listening'); setShowMode('conv')
    }
    window.addEventListener('elevenlabs-convai:call', h)
    return ()=>window.removeEventListener('elevenlabs-convai:call', h)
  },[settings,memory])

  useEffect(()=>{
    const onConn = ()=>{ setCallState('listening'); setShowMode('conv') }
    const onDisc = ()=>{ setCallState('idle'); setShowMode('idle') }
    window.addEventListener('elevenlabs-convai:connect',    onConn)
    window.addEventListener('elevenlabs-convai:disconnect', onDisc)
    return ()=>{
      window.removeEventListener('elevenlabs-convai:connect',    onConn)
      window.removeEventListener('elevenlabs-convai:disconnect', onDisc)
    }
  },[])

  useEffect(()=>{
    const h = ev => {
      if (!ev.data||typeof ev.data!=='object') return
      const t = String(ev.data.type||'')
      if (t.includes('agent-speaking')||t.includes('agent_speaking')) setCallState('speaking')
      if (t.includes('user-speaking') ||t.includes('user_speaking'))  setCallState('listening')
      if (t.includes('disconnect')    ||t.includes('call-end'))       { setCallState('idle'); setShowMode('idle') }
      if (ev.data.message) {
        const role = t.includes('agent')?'agent':'user'
        setMsgs(p=>[...p.slice(-60),{role,text:ev.data.message,ts:Date.now()}])
        setShowMode('conv')
        const m = ev.data.message.match(/müzik_iste:(.+)/i)
        if (m) { setTrack(m[1].trim()); setShowMode('music') }
      }
    }
    window.addEventListener('message',h)
    return ()=>window.removeEventListener('message',h)
  },[])

  const markDone = id => {
    fetch(`${WORKER}/tasks/${id}/status`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({status:'done'})
    }).then(()=>loadTasks())
  }

  const sendText = () => {
    if (!textVal.trim()) return
    setMsgs(p=>[...p,{role:'user',text:textVal,ts:Date.now()}])
    setShowMode('conv'); setShowText(false); setTextVal('')
  }

  const stLabel = {idle:'HAZIR',listening:'DİNLİYOR',speaking:'KONUŞUYOR'}

  // ── Widget button handler ──────────────────────────────
  const handleMainBtn = useCallback(() => {
    if (connecting) return

    const clickBtn = (tries = 0) => {
      const w = document.getElementById('el-widget')
      const btn = w?.shadowRoot?.querySelector('button')
      if (btn) {
        btn.click()
        setConnecting(false)
      } else if (tries < 30) {
        setTimeout(() => clickBtn(tries + 1), 200)
      } else {
        setConnecting(false)
        console.warn('HENA: widget button not found')
      }
    }

    if (callState === 'idle') {
      setConnecting(true)
      setShowMode('conv')
      clickBtn()
    } else {
      setConnecting(true)
      clickBtn()
      setTimeout(() => {
        setCallState('idle')
        setShowMode('idle')
        setConnecting(false)
      }, 800)
    }
  }, [callState, connecting])

  // ── Karatahta render ──────────────────────────────────
  const renderKaratahta = () => {

    // MUSIC
    if (showMode === 'music') return (
      <div className="kb-center">
        <div className="music-panel">
          <div className="music-bars-wrap">
            {[...Array(12)].map((_,i)=>(
              <div key={i} className="mbar" style={{animationDelay:`${i*0.08}s`,animationDuration:`${0.55+i*0.06}s`}}/>
            ))}
          </div>
          <div className="music-now">ŞU AN ÇALIYOR</div>
          <div className="music-track">{track}</div>
          <button className="back-btn" onClick={()=>setShowMode(callState!=='idle'?'conv':'idle')}>← Geri</button>
        </div>
      </div>
    )

    // TASKS
    if (showMode === 'tasks') return (
      <div className="kb-tasks-wrap">
        <div className="kb-tasks-hdr">
          <span className="kb-lbl">📋 GÖREVLER</span>
          <button className="kb-x" onClick={()=>setShowMode('idle')}>✕</button>
        </div>
        {tasks.length===0 && <p className="kb-empty">Bekleyen görev yok 🎉</p>}
        <div className="tasks-list">
          {tasks.map(t=>(
            <div key={t.id} className="task-item">
              <button className="task-chk" onClick={()=>markDone(t.id)}>◻</button>
              <div>
                <div className="task-n">{t.title}</div>
                {t.description&&<div className="task-d">{t.description}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )

    // CONV — chat bubbles + visualizer
    if (showMode === 'conv') return (
      <div className="kb-conv">
        {/* Chat bubbles — flex:1, fills space */}
        <div className="bubbles" ref={scrollRef}>
          {msgs.slice(-30).map((m,i)=><Bubble key={i} msg={m}/>)}
        </div>

        {/* Visualizer — bottom, compact */}
        <div className="viz-area">
          {callState === 'listening' && (
            <div className="viz-block">
              <canvas ref={userCanvasRef} width={340} height={64} className="viz-canvas"/>
              <div className="viz-label">DİNLİYOR</div>
            </div>
          )}
          {callState === 'speaking' && (
            <div className="viz-block">
              <HenaBars active={true}/>
              <div className="viz-label hena-label">HENA KONUŞUYOR</div>
            </div>
          )}
          {callState === 'idle' && (
            <div className="viz-idle">
              <div className="viz-idle-dot"/> 
              <span className="viz-label">KONUŞMA BITTI</span>
            </div>
          )}
        </div>
      </div>
    )

    // IDLE
    return (
      <div className="kb-center">
        <OrbIdle/>
        <p className="idle-hint">Konuşmak için mikrofona dokun</p>
        {tasks.length > 0 && (
          <div className="idle-tasks">
            {tasks.slice(0,2).map(t=>(
              <div key={t.id} className="idle-task-row">
                <span className="idle-task-dot">◻</span>
                <span className="idle-task-txt">{t.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="bg"/><div className="grid-bg"/>
      <div className="shell">

        {/* Header */}
        <header>
          <div className="logo">
            <div className="gem"><div className="gem-dot"/></div>
            <div>
              <div className="logo-n">HENA</div>
              <div className="logo-s">KİŞİSEL ASISTAN</div>
            </div>
          </div>
          <div className={`pill ${callState!=='idle'?'pill-on':''}`}>
            <span className="pdot"/>
            {stLabel[callState]}
          </div>
        </header>

        {/* Karatahta */}
        <main className="karatahta">
          {renderKaratahta()}
        </main>

        {/* Text input */}
        {showText && (
          <div className="text-bar">
            <input className="text-in" placeholder="HENA'ya yaz..."
              value={textVal} onChange={e=>setTextVal(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&sendText()} autoFocus/>
            <button className="text-send" onClick={sendText}>↑</button>
            <button className="text-cls" onClick={()=>setShowText(false)}>✕</button>
          </div>
        )}

        {/* Footer */}
        <footer>
          <button className={`fb sm ${showText?'fb-on':''}`} onClick={()=>setShowText(v=>!v)}>✏</button>

          <button
            className={`fb main-btn ${callState!=='idle'?'main-on':''} ${connecting?'main-connecting':''}`}
            onClick={handleMainBtn}
            disabled={connecting}
          >
            {connecting
              ? <><span className="spinner"/><span className="main-lbl">BAĞLANIYOR</span></>
              : <><span className="mic-ico">🎙</span><span className="main-lbl">{callState==='idle'?'KONUŞ':'KAPAT'}</span></>
            }
          </button>
          <elevenlabs-convai
            id="el-widget"
            agent-id={AGENT}
            style={{position:'fixed',bottom:'-9999px',right:'-9999px',opacity:0.001,pointerEvents:'none',width:'60px',height:'60px'}}
          />

          <button className={`fb sm ${showMode==='tasks'?'fb-on':''}`}
            onClick={()=>setShowMode(m=>m==='tasks'?'idle':'tasks')}>📋</button>

          <button className={`fb sm ${showSet?'fb-on':''}`} onClick={()=>setShowSet(v=>!v)}>⚙</button>
        </footer>
      </div>

      {/* Settings */}
      {showSet && (
        <div className="sheet-bg" onClick={e=>e.target===e.currentTarget&&setShowSet(false)}>
          <div className="sheet">
            <div className="sheet-handle"/>
            <div className="sheet-title">Ses Ayarları</div>
            {[
              {k:'speed',l:'HIZ',min:70,max:120,f:v=>(v/100).toFixed(1)+'×'},
              {k:'stability',l:'STABİLİTE',min:30,max:100,f:v=>(v/100).toFixed(2)},
              {k:'similarity',l:'BENZERLİK',min:50,max:100,f:v=>(v/100).toFixed(2)},
            ].map(s=>(
              <div key={s.k} className="s-row">
                <span className="s-lbl">{s.l}</span>
                <input type="range" min={s.min} max={s.max} step="5"
                  value={settings[s.k]} onChange={e=>setSettings(p=>({...p,[s.k]:+e.target.value}))}/>
                <span className="s-val">{s.f(settings[s.k])}</span>
              </div>
            ))}
            <div className="s-row">
              <span className="s-lbl">SES</span>
              <select value={settings.voice} onChange={e=>setSettings(p=>({...p,voice:e.target.value}))}>
                <option value="">— Varsayılan —</option>
                <option value="AmW3oHMmMm7pJX7z8Kj3">Amelia</option>
                <option value="jsCqWAovK2LkecY7zXl4">Freya</option>
                <option value="XB0fDUnXU5powFXDhCwa">Charlotte</option>
                <option value="EXAVITQu4vr4xnSDxMaL">Sarah</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  )
}