export default function AnimatedRings({ mode = 'idle', children }) {
  const cls = `hena-rings hena-rings--${mode}`
  return (
    <div className={cls}>
      <div className="hena-ring" />
      <div className="hena-core">{children}</div>
    </div>
  )
}
