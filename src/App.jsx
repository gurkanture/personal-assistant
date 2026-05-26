import { useCallback, useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import SettingsDrawer from './components/SettingsDrawer.jsx'
import TextInput from './components/TextInput.jsx'
import AnimatedRings from './components/AnimatedRings.jsx'
import IdleMode from './modes/IdleMode.jsx'
import ConversationMode from './modes/ConversationMode.jsx'
import MusicMode from './modes/MusicMode.jsx'
import TasksMode from './modes/TasksMode.jsx'
import HistoryMode from './modes/HistoryMode.jsx'
import { useElevenLabs, startCall } from './hooks/useElevenLabs.js'
import { detectMusicRequest } from './music.js'
import { api } from './api.js'

const AGENT_ID = 'agent_6401kqkzd0rpehnaspqfd8jwbj7w'

const CONVO_MODES = ['listening', 'speaking']

function buildMemoryPrompt(memories) {
  if (!Array.isArray(memories) || memories.length === 0) return ''
  const groups = { user_profile: [], agenda: [], topic: [], preference: [] }
  for (const m of memories) {
    if (groups[m.category]) groups[m.category].push(m)
  }
  let p = '\n\n=== HAFIZA ==='
  if (groups.user_profile.length)
    p += '\nKullanıcı: ' + groups.user_profile.map(m => `${m.key}=${m.summary}`).join(', ')
  if (groups.preference.length)
    p += '\nTercihler: ' + groups.preference.map(m => `${m.key}=${m.summary}`).join(', ')
  if (groups.agenda.length) {
    p += '\nAktif Gündem:'
    groups.agenda.forEach(m => (p += `\n- ${m.summary}`))
  }
  if (groups.topic.length) {
    p += '\nTakip Edilen:'
    groups.topic.forEach(m => (p += `\n- ${m.key}: ${m.summary}`))
  }
  p += '\n=== HAFIZA SONU ==='
  return p
}

export default function App() {
  const [mode, setMode] = useState('idle')
  const [transcript, setTranscript] = useState([])
  const [musicTrack, setMusicTrack] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [textInputOpen, setTextInputOpen] = useState(false)
  const [orbModalOpen, setOrbModalOpen] = useState(false)
  const [memoryPrompt, setMemoryPrompt] = useState('')
  const [settings, setSettings] = useState({
    speed: 100,
    stability: 70,
    similarity: 80,
    voice: '',
  })

  useEffect(() => {
    api
      .getMemory()
      .then(memories => setMemoryPrompt(buildMemoryPrompt(memories)))
      .catch(e => console.warn('HENA: bellek yüklenemedi', e))
  }, [])

  const handleState = useCallback(nextState => {
    setMode(prev => {
      if (nextState === 'idle') return 'idle'
      if (prev === 'music' || prev === 'tasks' || prev === 'history') {
        // user is on a sub-page; don't auto-jump unless we hit idle
        return nextState
      }
      return nextState
    })
  }, [])

  const handleTranscript = useCallback(msg => {
    setTranscript(prev => [...prev, msg])
  }, [])

  const handleAgentMessage = useCallback(text => {
    const track = detectMusicRequest(text)
    if (track) {
      setMusicTrack(track)
      setMode('music')
    }
  }, [])

  useElevenLabs({
    settings,
    memoryPrompt,
    onState: handleState,
    onTranscript: handleTranscript,
    onAgentMessage: handleAgentMessage,
  })

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleQuickAction = (id) => {
    if (id === 'tasks') setMode('tasks')
    else if (id === 'history') setMode('history')
    else if (id === 'music') setMode('music')
    else if (id === 'note') setTextInputOpen(true)
  }

  const handleTalk = () => {
    const ok = startCall()
    if (ok) setMode('listening')
    else setOrbModalOpen(true)
  }

  const handleWrite = () => setTextInputOpen(true)

  const handleOrb = () => setOrbModalOpen(true)

  const handleSubmitText = async (text) => {
    handleTranscript({ role: 'user', text, time: Date.now() })
    try {
      const reply = await api.postUserMessage(text)
      if (reply && typeof reply === 'object') {
        const replyText = reply.text || reply.message || reply.reply
        if (replyText) {
          handleTranscript({ role: 'agent', text: replyText, time: Date.now() })
          handleAgentMessage(replyText)
        }
      }
    } catch (e) {
      console.warn('HENA: mesaj gönderilemedi', e)
    }
  }

  const exitToIdle = () => {
    setMode('idle')
    setMusicTrack(null)
  }

  let smartArea
  if (CONVO_MODES.includes(mode)) {
    smartArea = (
      <ConversationMode
        mode={mode}
        transcript={transcript}
        agentId={AGENT_ID}
      />
    )
  } else if (mode === 'music') {
    smartArea = (
      <MusicMode
        track={musicTrack}
        onStop={() => console.log('HENA: müzik duraklat')}
        onResume={() => console.log('HENA: müzik devam')}
        onExit={exitToIdle}
      />
    )
  } else if (mode === 'tasks') {
    smartArea = <TasksMode onExit={exitToIdle} />
  } else if (mode === 'history') {
    smartArea = <HistoryMode onExit={exitToIdle} />
  } else {
    smartArea = <IdleMode onQuickAction={handleQuickAction} />
  }

  return (
    <>
      <div className="app-shell">
        <Header mode={mode} />

        <main className="smart-area">{smartArea}</main>

        <Footer
          onTalk={handleTalk}
          onWrite={handleWrite}
          onOrb={handleOrb}
          onToggleSettings={() => setSettingsOpen(o => !o)}
          settingsOpen={settingsOpen}
        />

        <SettingsDrawer
          open={settingsOpen}
          settings={settings}
          onChange={handleSettingChange}
        />
      </div>

      {/* Hidden host so the widget element is mounted even outside conversation mode. */}
      {!CONVO_MODES.includes(mode) && !orbModalOpen && (
        <div style={{ position: 'fixed', left: -9999, top: -9999, opacity: 0 }}>
          <elevenlabs-convai agent-id={AGENT_ID} />
        </div>
      )}

      <TextInput
        open={textInputOpen}
        onClose={() => setTextInputOpen(false)}
        onSubmit={handleSubmitText}
      />

      {orbModalOpen && (
        <div className="orb-modal" onClick={() => setOrbModalOpen(false)}>
          <div className="orb-modal-inner" onClick={e => e.stopPropagation()}>
            <AnimatedRings mode={mode}>
              <elevenlabs-convai agent-id={AGENT_ID} />
            </AnimatedRings>
            <button
              className="orb-modal-close"
              onClick={() => setOrbModalOpen(false)}
            >
              KAPAT
            </button>
          </div>
        </div>
      )}
    </>
  )
}
