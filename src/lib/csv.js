import { formatElapsed } from './time.js'

export function buildHeatCsv(entry) {
  const heats = entry.heats ?? [{ id: entry.id, number: 1, results: entry.results }]
  const participants = entry.participants ?? []

  const sorted = [...participants].sort((a, b) => {
    const best = (p) => heats.reduce((m, h) => {
      const t = h.results[p.id]
      return t != null && (m == null || t < m) ? t : m
    }, null)
    const bA = best(a), bB = best(b)
    if (bA == null && bB == null) return 0
    if (bA == null) return 1
    if (bB == null) return -1
    return bA - bB
  })

  const header = ['Participant', ...heats.map(h => `Heat ${h.number}`), 'Best'].join(',')
  const rows = sorted.map(p => {
    const times = heats.map(h => {
      const t = h.results[p.id]
      return t != null ? formatElapsed(t) : 'DNF'
    })
    const best = heats.reduce((m, h) => {
      const t = h.results[p.id]
      return t != null && (m == null || t < m) ? t : m
    }, null)
    return [p.name, ...times, best != null ? formatElapsed(best) : 'DNF'].join(',')
  })
  return [header, ...rows].join('\n')
}

export function buildRunCsv(entry) {
  const lines = ['Participant,Lap,Gap,Cumulative']
  for (const p of entry.participants ?? []) {
    const result = entry.results?.[p.id]
    if (!result) continue
    for (const lap of result.laps) {
      lines.push(`${p.name},${lap.number},${formatElapsed(lap.gap)},${formatElapsed(lap.cumulative)}`)
    }
    lines.push(`${p.name},Total,,${formatElapsed(result.elapsed)}`)
  }
  return lines.join('\n')
}