import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readSession, writeSession, readSettings, writeSettings } from './storage.js'

function mockLocalStorage() {
  const store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) }
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', mockLocalStorage())
})

describe('readSession', () => {
  it('returns empty object when key is missing', () => {
    expect(readSession()).toEqual({})
  })

  it('returns empty object when stored value is malformed JSON', () => {
    localStorage.setItem('gtta:session', 'not-json')
    expect(readSession()).toEqual({})
  })

  it('returns parsed object when key exists', () => {
    const data = { mode: 'heat', participants: [] }
    localStorage.setItem('gtta:session', JSON.stringify(data))
    expect(readSession()).toEqual(data)
  })
})

describe('writeSession', () => {
  it('serialises and writes to gtta:session', () => {
    const data = { mode: 'lap', archive: [] }
    writeSession(data)
    expect(JSON.parse(localStorage.getItem('gtta:session'))).toEqual(data)
  })

  it('round-trips through readSession', () => {
    const data = { mode: 'heat', participants: [{ id: '1', name: 'Alice' }] }
    writeSession(data)
    expect(readSession()).toEqual(data)
  })
})

describe('readSettings', () => {
  it('returns empty object when key is missing', () => {
    expect(readSettings()).toEqual({})
  })

  it('returns empty object when stored value is malformed JSON', () => {
    localStorage.setItem('gtta:settings', '{bad')
    expect(readSettings()).toEqual({})
  })

  it('returns parsed object when key exists', () => {
    const data = { vibrateOnLap: true }
    localStorage.setItem('gtta:settings', JSON.stringify(data))
    expect(readSettings()).toEqual(data)
  })
})

describe('writeSettings', () => {
  it('serialises and writes to gtta:settings', () => {
    const data = { vibrateOnLap: false }
    writeSettings(data)
    expect(JSON.parse(localStorage.getItem('gtta:settings'))).toEqual(data)
  })

  it('round-trips through readSettings', () => {
    const data = { vibrateOnLap: true }
    writeSettings(data)
    expect(readSettings()).toEqual(data)
  })
})