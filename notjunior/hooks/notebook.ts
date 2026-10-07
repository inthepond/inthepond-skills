import type { NotebookView } from '../types'

export type ShipMode = 'nudge' | 'hold' | 'off'

// A `git commit`, `git push` or `gh pr create` anywhere in a shell line, including after
// `&&` or `;`, and after git's own options (`-C <dir>`, `-c key=value`, `--no-pager`).
const SHIP = /(?:^|[\s;&|()])(?:git(?:\s+(?:-[cC]\s+\S+|--[\w-]+(?:=\S+)?))*\s+(?:commit|push)|gh\s+pr\s+create)(?=\s|$)/

export const shipMode = (value: unknown): ShipMode =>
  value === 'hold' || value === 'off' ? value : 'nudge'

export const isShipCommand = (command: string): boolean => SHIP.test(command)

// The skill's own notebook is not code the person needs to explain.
export const isNotebookPath = (path: string): boolean => /(^|\/)\.notjunior\//.test(path)

export const relativeTo = (path: string, cwd: string): string => {
  const root = cwd.endsWith('/') ? cwd : `${cwd}/`
  return cwd !== '' && path.startsWith(root) ? path.slice(root.length) : path
}

export const addPending = (list: readonly string[], path: string): string[] =>
  list.includes(path) ? [...list] : [...list, path].slice(-200)

export const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`

export const describeFiles = (files: readonly string[], max: number): string => {
  const shown = files.slice(0, Math.max(1, max)).map(file => file.split('/').pop() ?? file)
  const more = files.length - shown.length
  return more > 0 ? `${shown.join(', ')} +${more}` : shown.join(', ')
}

const CHECK_PREFIX = 'notjunior own:'

export const bandLead = (n: number): string =>
  `notjunior · Claude changed ${plural(n, 'file')} you haven't explained back`

const BUTTONS = '[ Check I understand it ] [ Later ]'.length

// As many file names as fit beside the lead and the buttons on one line; none when none fit.
export const fitFiles = (files: readonly string[], columns: number): string => {
  const room = columns - bandLead(files.length).length - BUTTONS - 4
  for (let shown = files.length; shown >= 1; shown--) {
    const text = describeFiles(files, shown)
    if (text.length <= room) return text
  }
  return ''
}

export const checkPrompt = (files: readonly string[]): string =>
  `${CHECK_PREFIX} Claude changed these files in this session — check I understand the changes before I ship them: ${files.join(', ')}`

// A prompt asking for the own check, whether the mod or the person wrote it.
export const isCheckRequest = (text: string): boolean => text.trimStart().toLowerCase().startsWith(CHECK_PREFIX)

export const handoffNote = (files: readonly string[]): string =>
  `\n\n---\nFrom the notjunior mod: in this session the coding agent changed ${plural(files.length, 'file')} ` +
  `that the person has not yet explained back: ${files.join(', ')}. ` +
  'For an `own` check, scope it to these files.'

// Said to the model, for surfaces that draw no toast: it tells the person in the conversation.
export const nudgeContext = (files: readonly string[]): string =>
  `notjunior (a mod the person installed): this command ships changes made in this session that the person ` +
  `has not yet explained back — ${plural(files.length, 'file')}: ${files.join(', ')}. ` +
  'Let them know in one short line, once: /notjunior-check, or asking "notjunior own", walks through them. Do not hold anything up.'

// The surfaces that draw a mod's toasts (and its band and pane).
export const drawsToasts = (surfaces: readonly string[]): boolean =>
  surfaces.some(surface => surface === 'terminal' || surface === 'desktop')

export type Snapshot = { head: string | null; files: ReadonlyMap<string, string> }

// `git status --porcelain=v1 -z`: "XY path\0", with renames and copies as "XY new\0old\0".
export const parsePorcelain = (out: string): { path: string; isDeleted: boolean }[] => {
  const parts = out.split('\0')
  const entries: { path: string; isDeleted: boolean }[] = []
  for (let i = 0; i < parts.length; i++) {
    const entry = parts[i] ?? ''
    if (entry.length < 4) continue
    const status = entry.slice(0, 2)
    entries.push({ path: entry.slice(3), isDeleted: status.includes('D') })
    if (status.includes('R') || status.includes('C')) i++
  }
  return entries
}

export const splitNames = (out: string): string[] => out.split('\0').filter(name => name !== '')

// What a turn changed: content that differs from before it, plus whatever it committed.
export const changedBetween = (before: Snapshot, after: Snapshot, committed: readonly string[]): string[] => {
  const changed = new Set<string>()
  for (const [path, hash] of after.files) {
    if (before.files.get(path) !== hash) changed.add(path)
  }
  for (const path of committed) changed.add(path)
  return [...changed].filter(path => !isNotebookPath(path))
}

export const nudgeText = (files: readonly string[]): string =>
  `notjunior: ${plural(files.length, 'changed file')} not explained back yet — /notjunior-check when you're ready`

export const holdReason = (files: readonly string[]): string =>
  `notjunior: ${plural(files.length, 'file')} changed in this session (${files.join(', ')}) ` +
  'have not been explained back yet, and the person set shipCheck to hold. ' +
  'Ask them to run /notjunior-check first, or to set shipCheck to nudge in /config.'

export const openQuestions = (markdown: string): string[] =>
  markdown
    .split('\n')
    .map(line => /^\s*- \[ \] (.+)$/.exec(line)?.[1])
    .filter((question): question is string => question !== undefined)
    .map(question => (question.split(' — ')[0] ?? question).trim())

export const recentCorrections = (markdown: string, max = 3): string[] =>
  markdown
    .split('\n')
    .map(line => /^\s*- misconception → corrected: (.+)$/.exec(line)?.[1]?.trim())
    .filter((entry): entry is string => entry !== undefined)
    .slice(-max)

export const mapStamp = (markdown: string): string | null =>
  /^as of:\s*([0-9a-f]{7,40})\b/m.exec(markdown)?.[1] ?? null

export const EMPTY_NOTEBOOK: NotebookView = {
  exists: false,
  openQuestions: [],
  corrections: [],
  mapAsOf: null,
  commitsBehind: null,
}

export const mapLine = (view: NotebookView): string => {
  if (view.mapAsOf === null) return 'Map: none yet.'
  if (view.commitsBehind === null) return `Map: as of ${view.mapAsOf}.`
  if (view.commitsBehind === 0) return `Map: as of ${view.mapAsOf}, up to date.`
  return `Map: as of ${view.mapAsOf}, ${plural(view.commitsBehind, 'commit')} behind HEAD — ask notjunior to re-verify it.`
}

// The notebook as text, for a surface that draws no pane.
export const notebookText = (view: NotebookView): string => {
  if (!view.exists) {
    return 'notjunior: no .notjunior/ notebook in this project yet. Ask notjunior about this project and it will offer to start one.'
  }
  const lines = [`notjunior notebook — open questions for your team (${view.openQuestions.length}):`]
  lines.push(...(view.openQuestions.length === 0 ? ['  none'] : view.openQuestions.map(q => `  - ${q}`)))
  if (view.corrections.length > 0) {
    lines.push('Recently corrected:', ...view.corrections.map(c => `  - ${c}`))
  }
  lines.push(mapLine(view))
  return lines.join('\n')
}
