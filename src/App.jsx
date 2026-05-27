import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

const WORKER = 'https://hena-api.gurkan-ture.workers.dev'
const AGENT  = 'agent_6401kqkzd0rpehnaspqfd8jwbj7w'

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

// ── Orb ──────────────────────────────────────────────────
function Orb({ state }) {
  return (
    <div className={`orb-wrap orb-${state}`}>
      <div className="ring r1"/><div className="ring r2"/><div className="ring r3"/>
      <div className="orb-core">
        {state === 'speaking' && (
          <div className="wave-bars">
            {[0,.07,.14,.21,.28].map((d,i)=><div key={i} className="wb" style={{animationDelay:`${d}s`}}/>)}
          </div>
        )}
        {state === 'listening' && <div className="pulse-ring"/>}
        <div className="orb-dot"/>
      </div>
    </div>
  )
}

// ── Music bars ────────────────────────────────────────────
function MusicBars() {
  return (
    <div className="music-bars">
      {[...Array(8)].map((_,i)=>(
        <div key={i} className="mbar" style={{animationDelay:`${i*0.09}s`, animationDuration:`${0.6+i*0.07}s`}}/>
      ))}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [callState, setCallState] = useState('idle')
  const [mode,      setMode]      = useState('idle')
  const [msgs,      setMsgs]      = useState([])
  const [track,     setTrack]     = useState('')
  const [tasks,     setTasks]     = useState([])
  const [settings,  setSettings]  = useState({speed:100,stability:70,similarity:80,voice:''})
  const [showSet,   setShowSet]   = useState(false)
  const [showText,  setShowText]  = useState(false)
  const [textVal,   setTextVal]   = useState('')
  const transcriptRef = useRef(null)
  const memory = useMemory()

  // Load widget script once
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

  // Auto scroll transcript
  useEffect(()=>{ transcriptRef.current?.scrollTo(0,transcriptRef.current.scrollHeight) },[msgs])

  // ElevenLabs events
  useEffect(()=>{
    const h = e => {
      if (e.detail?.config) {
        const tts = {speed:settings.speed/100,stability:settings.stability/100,similarity_boost:settings.similarity/100}
        if (settings.voice) tts.voice_id = settings.voice
        e.detail.config.overrides = {tts}
        if (memory) e.detail.config.overrides.agent = {prompt:{prompt:memory}}
      }
      setCallState('listening'); setMode('conv')
    }
    window.addEventListener('elevenlabs-convai:call', h)
    return ()=>window.removeEventListener('elevenlabs-convai:call', h)
  },[settings,memory])

  useEffect(()=>{
    const onConn = ()=>{ setCallState('listening'); setMode('conv') }
    const onDisc = ()=>{ setCallState('idle'); setMode('idle') }
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
      if (t.includes('disconnect')    ||t.includes('call-end'))       {setCallState('idle');setMode('idle')}
      if (ev.data.message) {
        const role = t.includes('agent')?'agent':'user'
        setMsgs(p=>[...p.slice(-40),{role,text:ev.data.message,ts:Date.now()}])
        if (mode!=='music') setMode('conv')
        const m = ev.data.message.match(/müzik_iste:(.+)/i)
        if (m) { setTrack(m[1].trim()); setMode('music') }
      }
    }
    window.addEventListener('message',h)
    return ()=>window.removeEventListener('message',h)
  },[mode])

  const markDone = id => {
    fetch(`${WORKER}/tasks/${id}/status`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({status:'done'})
    }).then(()=>loadTasks())
  }

  const sendText = () => {
    if (!textVal.trim()) return
    setMsgs(p=>[...p,{role:'user',text:textVal,ts:Date.now()}])
    setMode('conv'); setShowText(false); setTextVal('')
  }

  const stLabel = {idle:'HAZIR',listening:'DİNLİYOR',speaking:'KONUŞUYOR'}

  // ── Karatahta content ──
  const renderKB = () => {
    if (mode === 'tasks') return (
      <div className="kb-tasks">
        <div className="kb-tasks-top">
          <span className="kb-label">📋 GÖREVLER</span>
          <button className="kb-x" onClick={()=>setMode('idle')}>✕</button>
        </div>
        {tasks.length===0 && <p className="kb-empty">Bekleyen görev yok 🎉</p>}
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
    )

    if (mode === 'music') return (
      <div className="kb-music">
        <MusicBars/>
        <div className="music-track">{track}</div>
        <div className="music-sub">Windows Agent çalıyor</div>
        <button className="music-back" onClick={()=>setMode(callState!=='idle'?'conv':'idle')}>← Geri</button>
      </div>
    )

    // conv + idle → orb + transcript
    return (
      <div className="kb-main">
        <Orb state={callState}/>
        {callState==='idle'&&mode==='idle' && (
          <p className="idle-hint">Konuşmak için mikrofona dokun</p>
        )}
        {msgs.length>0 && (
          <div className="transcript" ref={transcriptRef}>
            {msgs.slice(-8).map((m,i)=>(
              <div key={i} className={`line line-${m.role}`}>
                <span className="line-who">{m.role==='user'?'SEN':'HENA'}</span>
                <span className="line-txt">{m.text}</span>
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
        <main className="karatahta">{renderKB()}</main>

        {/* Text input bar */}
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

          {/* KONUŞ — widget overlay inside */}
          <div className={`fb main-btn ${callState!=='idle'?'main-on':''}`}>
            <span className="mic-ico">🎙</span>
            <span className="main-lbl">{callState==='idle'?'KONUŞ':'KAPAT'}</span>
            <elevenlabs-convai
              id="el-widget"
              agent-id={AGENT}
              style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0,zIndex:10,cursor:'pointer'}}
            />
          </div>

          <button className={`fb sm ${mode==='tasks'?'fb-on':''}`}
            onClick={()=>setMode(m=>m==='tasks'?'idle':'tasks')}>📋</button>

          <button className={`fb sm ${showSet?'fb-on':''}`} onClick={()=>setShowSet(v=>!v)}>⚙</button>
        </footer>
      </div>

      {/* Settings sheet */}
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
