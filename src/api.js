const WORKER_URL = 'https://hena-api.gurkan-ture.workers.dev'

async function request(path, opts = {}) {
  const res = await fetch(`${WORKER_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  })
  if (!res.ok) {
    throw new Error(`${opts.method || 'GET'} ${path} → ${res.status}`)
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? res.json() : res.text()
}

export const api = {
  getTasks(status = 'pending', limit = 3) {
    const qs = new URLSearchParams()
    if (status) qs.set('status', status)
    if (limit)  qs.set('limit', String(limit))
    return request(`/tasks?${qs.toString()}`)
  },

  markTaskDone(id) {
    return request(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ Status: 'done' }),
    })
  },

  getMemory() {
    return request('/memory')
  },

  postUserMessage(text) {
    return request('/message', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  },
}

export { WORKER_URL }
