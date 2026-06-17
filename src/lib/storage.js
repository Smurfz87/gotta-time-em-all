const SESSION_KEY = 'gtta:session'
const SETTINGS_KEY = 'gtta:settings'
const ROSTERS_KEY = 'gtta:rosters'

export function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {}
  return {}
}

export function writeSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

export function readSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {}
  return {}
}

export function writeSettings(data) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data))
}

export function readRosters() {
  try {
    const raw = localStorage.getItem(ROSTERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {}
  return []
}

export function writeRosters(data) {
  localStorage.setItem(ROSTERS_KEY, JSON.stringify(data))
}