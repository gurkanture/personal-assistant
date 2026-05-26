import { useRef, useState } from 'react'

export default function TextInput({ open, onClose, onSubmit }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const inputRef = useRef(null)

  if (!open) return null

  const submit = async () => {
    const v = text.trim()
    if (!v || sending) return
    setSending(true)
    try {
      await onSubmit(v)
      setText('')
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="text-input-overlay" onClick={onClose}>
      <div className="text-input-card" onClick={e => e.stopPropagation()}>
        <div className="text-input-label mono">HENA'YA YAZ</div>
        <input
          ref={node => {
            inputRef.current = node
            if (node && document.activeElement !== node) {
              setTimeout(() => node.focus(), 0)
            }
          }}
          className="text-input-field"
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') submit()
            else if (e.key === 'Escape') onClose()
          }}
          placeholder="Mesaj yaz, Enter ile gönder..."
        />
        <div className="text-input-hint mono">
          {sending ? 'GÖNDERİLİYOR...' : 'ENTER = GÖNDER · ESC = KAPAT'}
        </div>
      </div>
    </div>
  )
}
