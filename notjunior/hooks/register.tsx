import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { NotebookView } from '../types'
import type { Snapshot } from './notebook'
import {
  EMPTY_NOTEBOOK,
  addPending,
  bandLead,
  changedBetween,
  checkPrompt,
  drawsToasts,
  fitFiles,
  handoffNote,
  holdReason,
  isCheckRequest,
  isNotebookPath,
  isShipCommand,
  mapLine,
  mapStamp,
  notebookText,
  nudgeContext,
  nudgeText,
  openQuestions,
  parsePorcelain,
  plural,
  recentCorrections,
  relativeTo,
  shipMode,
  splitNames,
} from './notebook'

const PANE = 'notjunior-notebook'

// Files Claude changed this session that the person has not explained back.
const pending = atom({ plugin: 'notjunior', key: 'pending' } as const, [])
const isBandHidden = atom({ plugin: 'notjunior', key: 'isBandHidden' } as const, false)
const notebook = atom({ plugin: 'notjunior', key: 'notebook' } as const, null)

const isThisSkill = (skill: string): boolean => skill === 'notjunior' || skill.endsWith(':notjunior')

// The repository root, so a path reads the same whichever directory the shell is in.
// null until first asked; isRepo says whether git found one.
let root: string | null = null
let isRepo = false

// The working tree as each of Claude's turns began, by turn.
const snapshots = new Map<string, Snapshot>()

// A read-only git command's output, or null when it fails or there is no repository.
const gitOut = async ($: EngineInterface, args: readonly string[]): Promise<string | null> => {
  try {
    const ran = await $.process.run(['git', ...args], { cwd: root || undefined, timeoutMs: 5000 })
    return ran.exitCode === 0 ? ran.stdout : null
  } catch {
    return null
  }
}

const ensureRoot = async ($: EngineInterface): Promise<string> => {
  if (root !== null) return root
  const top = (await gitOut($, ['rev-parse', '--show-toplevel']))?.trim() ?? ''
  isRepo = top !== ''
  if (isRepo) {
    root = top
  } else {
    root = await $.session.root().catch(() => '')
  }
  return root
}

// Changed files with a content hash each, capped so a huge working tree stays cheap.
const takeSnapshot = async ($: EngineInterface): Promise<Snapshot | null> => {
  await ensureRoot($)
  if (!isRepo) return null
  const status = await gitOut($, ['status', '--porcelain=v1', '-z', '--untracked-files=all'])
  if (status === null) return null
  const head = (await gitOut($, ['rev-parse', '--verify', '-q', 'HEAD']))?.trim() || null
  const entries = parsePorcelain(status)
    .filter(entry => !isNotebookPath(entry.path))
    .slice(0, 300)
  const live = entries.filter(entry => !entry.isDeleted).map(entry => entry.path)
  const hashed = live.length === 0 ? '' : ((await gitOut($, ['hash-object', '--', ...live])) ?? '')
  const hashes = hashed.split('\n')
  const files = new Map<string, string>()
  let next = 0
  for (const entry of entries) {
    files.set(entry.path, entry.isDeleted ? 'deleted' : (hashes[next++] ?? 'unknown'))
  }
  return { head, files }
}

const readText = async ($: EngineInterface, path: string): Promise<string | null> => {
  try {
    return await $.fs.read(path)
  } catch {
    return null
  }
}

// Reads the skill's notebook from the project root; writes nothing.
const loadNotebook = async ($: EngineInterface): Promise<NotebookView> => {
  const base = await ensureRoot($)
  const at = (name: string): string => (base === '' ? `.notjunior/${name}` : `${base}/.notjunior/${name}`)
  const [questions, log, map] = await Promise.all([
    readText($, at('questions.md')),
    readText($, at('log.md')),
    readText($, at('map.md')),
  ])
  if (questions === null && log === null && map === null) return EMPTY_NOTEBOOK

  const stamp = map === null ? null : mapStamp(map)
  const counted = stamp === null ? null : await gitOut($, ['rev-list', '--count', `${stamp}..HEAD`])
  const n = counted === null ? Number.NaN : Number.parseInt(counted.trim(), 10)

  return {
    exists: true,
    openQuestions: questions === null ? [] : openQuestions(questions),
    corrections: log === null ? [] : recentCorrections(log),
    mapAsOf: stamp,
    commitsBehind: Number.isFinite(n) ? n : null,
  }
}

// From a Button: sends the check request as the person's own words, and clears the list.
const requestCheck = async ($: EngineInterface): Promise<number> => {
  const files = await read($, pending)
  if (files.length === 0) return 0
  await update($, pending, () => [])
  void $.prompt.submit({ text: checkPrompt(files), asUser: true })
  return files.length
}

// Records a file Claude changed. Tracking is a courtesy; it never disturbs the edit itself.
const track = async ($: EngineInterface, path: string): Promise<void> => {
  if (isNotebookPath(path)) return
  try {
    const relative = relativeTo(path, await ensureRoot($))
    // A file outside the project (a memory note, a config in the home folder) is not this project's code.
    if (isRepo && relative.startsWith('/')) return
    await update($, pending, list => addPending(list, relative))
    await update($, isBandHidden, () => false)
  } catch {
    // nothing to undo
  }
}

const refreshNotebook = async ($: EngineInterface): Promise<void> => {
  const fresh = await loadNotebook($)
  await update($, notebook, () => fresh)
}

// From a command, where a submit would wait on the command itself: the request goes in
// the prompt box for the person to send. The list clears when it is sent.
const draftCheck = async ($: EngineInterface): Promise<string> => {
  const files = await read($, pending)
  if (files.length === 0) {
    return 'notjunior: nothing to check — Claude has not changed any files this session that you have not already checked.'
  }
  let isFilled = false
  try {
    isFilled = (await $.prompt.fill({ text: checkPrompt(files) })).isFilled
  } catch {
    isFilled = false
  }
  return isFilled
    ? `notjunior: the check request for ${plural(files.length, 'file')} is in your prompt box — press Enter when you're ready.`
    : `notjunior: when you're ready, send this:\n${checkPrompt(files)}`
}

export const register: Register = (on, options) => {
  const mode = shipMode(options['shipCheck'])

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'notjunior-check',
      description: 'notjunior: check you understand the changes Claude made this session',
    })
    await $.command.register({
      name: 'notjunior-notebook',
      description: 'notjunior: your notebook for this project — open questions, corrections, map freshness',
    })
    const started = await next(e)
    root = null
    await ensureRoot($)
    return started
  })

  // Edits made through the shell never pass Edit or Write: compare the working tree around each turn.
  on('turn.start', async ($, e, next) => {
    const snapshot = await takeSnapshot($).catch(() => null)
    if (snapshot !== null) snapshots.set(e.turnId, snapshot)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const answered = await next(e)
    const before = snapshots.get(e.turnId)
    snapshots.delete(e.turnId)
    if (before === undefined) return answered
    try {
      const after = await takeSnapshot($)
      if (after !== null) {
        const moved = before.head !== null && after.head !== null && before.head !== after.head
        const committed = moved
          ? splitNames((await gitOut($, ['diff', '--name-only', '-z', `${before.head}..${after.head}`])) ?? '')
          : []
        for (const path of changedBetween(before, after, committed)) await track($, path)
      }
    } catch {
      // the answer stands whatever happens here
    }
    return answered
  })

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && ran.isError !== true) await track($, e.file_path)
    return ran
  })

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && ran.isError !== true) await track($, e.file_path)
    return ran
  })

  on('tool.call', { tool: 'NotebookEdit' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && ran.isError !== true) await track($, e.notebook_path)
    return ran
  })

  // The commit moment. Fails open: a fault here never blocks the person's commit.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (mode === 'off' || !isShipCommand(e.command)) return next(e)
    const files = await read($, pending)
    if (files.length === 0) return next(e)
    if (mode === 'hold') return { deny: holdReason(files) }
    // Where toasts draw, a toast; elsewhere (the VS Code panel, a headless run) Claude says it instead.
    const isDrawn = drawsToasts(await $.session.surfaces().catch(() => []))
    if (isDrawn) $.ui.toast(nudgeText(files))
    const ran = await next(e)
    if (isDrawn || ran.deny !== undefined) return ran
    return { ...ran, context: [...(ran.context ?? []), nudgeContext(files)] }
  }).catch(($, e, next) => next(e))

  // Tells the skill which files the coding agent changed, so `own` checks exactly those.
  on('skill.prompt', async ($, e, next) => {
    const computed = await next(e)
    if (!isThisSkill(e.skill)) return computed
    const files = await read($, pending)
    return files.length === 0 ? computed : { text: computed.text + handoffNote(files) }
  })

  // Once the check request is sent, by the band, the command's draft, or the person's own words.
  on('prompt.submit', async ($, e, next) => {
    if (isCheckRequest(e.text)) await update($, pending, () => [])
    return next(e)
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'notjunior-check' }, async $ => ({ text: await draftCheck($) }))

  on('command.run', { command: 'notjunior-notebook' }, async $ => {
    const view = await loadNotebook($)
    await update($, notebook, () => view)
    let isPlaced = false
    try {
      isPlaced = (await $.ui.open({ id: PANE, title: 'notjunior notebook' })).isPlaced
    } catch {
      isPlaced = false
    }
    return { text: isPlaced ? 'notjunior: notebook pane opened.' : notebookText(view) }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.props.isWorking) return next(e)
    const files = await read($, pending)
    if (files.length === 0 || (await read($, isBandHidden))) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const names = fitFiles(files, e.props.bodyColumns)

    return (
      <Box>
        <Text dimColor>
          {bandLead(files.length)}
          {names === '' ? ' ' : ` (${names}) `}
        </Text>
        <Button key="check" label="Check I understand it" onPress={() => requestCheck($)} />
        <Button key="later" label="Later" onPress={() => update($, isBandHidden, () => true)} />
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const view = (await read($, notebook)) ?? EMPTY_NOTEBOOK

    if (!view.exists) {
      return (
        <Box flexDirection="column">
          <Text dimColor>No .notjunior/ notebook in this project yet.</Text>
          <Text dimColor>Ask notjunior about this project and it will offer to start one.</Text>
          <Button key="refresh" label="Refresh" onPress={() => refreshNotebook($)} />
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Text bold>Open questions for your team ({view.openQuestions.length})</Text>
        {view.openQuestions.length === 0 && <Text dimColor>none</Text>}
        {view.openQuestions.map(question => (
          <Text>- {question}</Text>
        ))}
        {view.corrections.length > 0 && <Text bold>Recently corrected</Text>}
        {view.corrections.map(correction => (
          <Text dimColor>- {correction}</Text>
        ))}
        <Text dimColor>{mapLine(view)}</Text>
        <Button key="refresh" label="Refresh" onPress={() => refreshNotebook($)} />
      </Box>
    )
  })
}
