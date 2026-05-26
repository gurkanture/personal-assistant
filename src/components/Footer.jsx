export default function Footer({
  onTalk,
  onWrite,
  onOrb,
  onToggleSettings,
  settingsOpen,
}) {
  return (
    <footer className="footer">
      <div className="footer-actions">
        <button className="action-btn primary" onClick={onTalk} title="Konuş">
          <span className="action-icon">🎙</span>
          <span className="action-label mono">KONUŞ</span>
        </button>
        <button className="action-btn" onClick={onWrite} title="Yaz">
          <span className="action-icon">⌨</span>
          <span className="action-label mono">YAZ</span>
        </button>
        <button className="action-btn" onClick={onOrb} title="Orb">
          <span className="action-icon">👁</span>
          <span className="action-label mono">ORB</span>
        </button>
      </div>
      <button
        className={`settings-btn mono ${settingsOpen ? 'active' : ''}`}
        onClick={onToggleSettings}
        title="Ayarlar"
      >
        ⚙
      </button>
    </footer>
  )
}
