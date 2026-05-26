import { useState } from 'react'

export default function MusicMode({ track, onStop, onResume, onExit }) {
  const [paused, setPaused] = useState(false)

  const handlePause = () => {
    setPaused(true)
    onStop?.()
  }
  const handleResume = () => {
    setPaused(false)
    onResume?.()
  }

  return (
    <div className="music-mode">
      <div className="section-label mono">
        ŞİMDİ ÇALAN
        <span className="section-line" />
      </div>
      <div className="track-name">{track || 'YÜKLENİYOR...'}</div>
      <div className="music-actions">
        {paused ? (
          <button className="music-btn primary" onClick={handleResume}>
            <span>▶</span>
            <span className="mono">DEVAM</span>
          </button>
        ) : (
          <button className="music-btn" onClick={handlePause}>
            <span>⏸</span>
            <span className="mono">DURAKLAT</span>
          </button>
        )}
        <button className="music-btn ghost" onClick={onExit}>
          <span className="mono">KAPAT</span>
        </button>
      </div>
    </div>
  )
}
