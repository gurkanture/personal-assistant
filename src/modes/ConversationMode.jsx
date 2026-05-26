import { useEffect, useRef } from 'react'
import AnimatedRings from '../components/AnimatedRings.jsx'

export default function ConversationMode({ mode, transcript, agentId }) {
  const listRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [transcript])

  return (
    <div className="conversation-mode">
      <div className="convo-orb">
        <AnimatedRings mode={mode}>
          <div className="convo-widget-host">
            <elevenlabs-convai agent-id={agentId} />
          </div>
        </AnimatedRings>
      </div>

      <div className="convo-transcript" ref={listRef}>
        {transcript.length === 0 ? (
          <div className="hint mono">
            {mode === 'listening' ? 'DİNLİYORUM...' : 'KONUŞUYORUM...'}
          </div>
        ) : (
          transcript.map((m, i) => (
            <div key={i} className={`convo-msg ${m.role}`}>
              <span className="convo-role mono">
                {m.role === 'agent' ? 'HENA' : 'SEN'}
              </span>
              <span className="convo-text">{m.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
