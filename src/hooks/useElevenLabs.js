import { useEffect, useRef } from 'react'

const SPEAK_TYPES = ['agent-speaking', 'agent_speaking', 'agentResponse', 'agent_response']
const LISTEN_TYPES = ['user-speaking', 'user_speaking', 'userTranscript', 'user_transcript']
const END_TYPES = ['disconnect', 'call-end', 'call_end']

function matchType(raw, list) {
  const t = String(raw || '').toLowerCase()
  return list.some(k => t.includes(k.toLowerCase()))
}

function parseTranscript(payload) {
  if (!payload || typeof payload !== 'object') return null
  const candidates = [
    payload.message,
    payload.text,
    payload.transcript,
    payload.content,
    payload.data?.text,
    payload.data?.message,
  ]
  const text = candidates.find(v => typeof v === 'string' && v.trim().length > 0)
  if (!text) return null

  const rawRole =
    payload.role ||
    payload.speaker ||
    payload.source ||
    payload.from ||
    (payload.type && /agent|assistant|hena/i.test(payload.type) ? 'agent' : null) ||
    (payload.type && /user|human/i.test(payload.type) ? 'user' : null)
  const role = /agent|assistant|hena/i.test(String(rawRole)) ? 'agent' : 'user'

  return { role, text: text.trim(), time: Date.now() }
}

export function useElevenLabs({ settings, memoryPrompt, onState, onTranscript, onAgentMessage }) {
  const onStateRef = useRef(onState)
  const onTranscriptRef = useRef(onTranscript)
  const onAgentMessageRef = useRef(onAgentMessage)

  useEffect(() => { onStateRef.current = onState }, [onState])
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])
  useEffect(() => { onAgentMessageRef.current = onAgentMessage }, [onAgentMessage])

  useEffect(() => {
    const onCall = (e) => {
      if (!e.detail?.config) return
      const tts = {
        speed: settings.speed / 100,
        stability: settings.stability / 100,
        similarity_boost: settings.similarity / 100,
      }
      if (settings.voice) tts.voice_id = settings.voice
      e.detail.config.overrides = { tts }
      if (memoryPrompt) {
        e.detail.config.overrides.agent = { prompt: { prompt: memoryPrompt } }
      }
    }
    window.addEventListener('elevenlabs-convai:call', onCall)
    return () => window.removeEventListener('elevenlabs-convai:call', onCall)
  }, [settings, memoryPrompt])

  useEffect(() => {
    const onConnect = () => onStateRef.current?.('listening')
    const onDisconnect = () => onStateRef.current?.('idle')
    const onMessage = (e) => {
      const parsed = parseTranscript(e.detail || e.data)
      if (parsed) {
        onTranscriptRef.current?.(parsed)
        if (parsed.role === 'agent') onAgentMessageRef.current?.(parsed.text)
      }
    }
    window.addEventListener('elevenlabs-convai:connect', onConnect)
    window.addEventListener('elevenlabs-convai:disconnect', onDisconnect)
    window.addEventListener('elevenlabs-convai:message', onMessage)
    return () => {
      window.removeEventListener('elevenlabs-convai:connect', onConnect)
      window.removeEventListener('elevenlabs-convai:disconnect', onDisconnect)
      window.removeEventListener('elevenlabs-convai:message', onMessage)
    }
  }, [])

  useEffect(() => {
    const onWindow = (ev) => {
      if (!ev.data || typeof ev.data !== 'object') return
      const t = ev.data.type
      if (matchType(t, SPEAK_TYPES)) onStateRef.current?.('speaking')
      else if (matchType(t, LISTEN_TYPES)) onStateRef.current?.('listening')
      else if (matchType(t, END_TYPES)) onStateRef.current?.('idle')

      const parsed = parseTranscript(ev.data)
      if (parsed) {
        onTranscriptRef.current?.(parsed)
        if (parsed.role === 'agent') onAgentMessageRef.current?.(parsed.text)
      }
    }
    window.addEventListener('message', onWindow)
    return () => window.removeEventListener('message', onWindow)
  }, [])
}

export function startCall() {
  const el = document.querySelector('elevenlabs-convai')
  if (!el) return false
  const btn = el.shadowRoot?.querySelector('button')
  if (btn) {
    btn.click()
    return true
  }
  el.dispatchEvent(new CustomEvent('start'))
  return true
}
