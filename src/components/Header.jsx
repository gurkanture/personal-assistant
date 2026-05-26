const STATUS_LABEL = {
  idle: 'HAZIR',
  listening: 'DİNLİYOR',
  speaking: 'KONUŞUYOR',
  music: 'MÜZİK',
  tasks: 'GÖREVLER',
  history: 'GEÇMİŞ',
}

const ACTIVE_MODES = ['listening', 'speaking']

export default function Header({ mode }) {
  const active = ACTIVE_MODES.includes(mode)
  return (
    <header className="header">
      <div className="logo-group">
        <div className="logo-mark">
          <div className="logo-mark-inner" />
        </div>
        <div className="logo-text">
          <span className="logo-name">HENA</span>
          <span className="logo-sub mono">KİŞİSEL ASİSTAN</span>
        </div>
      </div>
      <div className={`status-pill mono ${active ? 'active' : ''}`}>
        <span className="status-dot" />
        {STATUS_LABEL[mode] || 'HAZIR'}
      </div>
    </header>
  )
}
