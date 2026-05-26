const PATTERN = /m[üu]zik_iste:\s*\[([^\]]+)\]/i

export function detectMusicRequest(text) {
  if (!text) return null
  const m = text.match(PATTERN)
  return m ? m[1].trim() : null
}
