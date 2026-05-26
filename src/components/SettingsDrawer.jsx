const SLIDERS = [
  { key: 'speed', label: 'HIZ', min: 70, max: 120, fmt: v => (v / 100).toFixed(1) + '×' },
  { key: 'stability', label: 'STABİLİTE', min: 30, max: 100, fmt: v => (v / 100).toFixed(2) },
  { key: 'similarity', label: 'BENZERLİK', min: 50, max: 100, fmt: v => (v / 100).toFixed(2) },
]

const VOICES = [
  { value: '', label: '— Varsayılan —' },
  { value: 'AmW3oHMmMm7pJX7z8Kj3', label: 'Amelia' },
  { value: 'jsCqWAovK2LkecY7zXl4', label: 'Freya' },
  { value: 'XB0fDUnXU5powFXDhCwa', label: 'Charlotte' },
  { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah' },
]

export default function SettingsDrawer({ open, settings, onChange }) {
  return (
    <div className={`drawer ${open ? 'open' : ''}`}>
      <div className="drawer-inner">
        <div className="drawer-title mono">SES AYARLARI</div>
        <div className="drawer-grid">
          {SLIDERS.map(s => (
            <div className="ctrl-row" key={s.key}>
              <span className="ctrl-label mono">{s.label}</span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step="5"
                value={settings[s.key]}
                onChange={e => onChange(s.key, +e.target.value)}
              />
              <span className="ctrl-value mono">{s.fmt(settings[s.key])}</span>
            </div>
          ))}
          <div className="ctrl-row">
            <span className="ctrl-label mono">SES</span>
            <select
              value={settings.voice}
              onChange={e => onChange('voice', e.target.value)}
            >
              {VOICES.map(v => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
