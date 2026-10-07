import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

import {
  changedBetween,
  describeFiles,
  drawsToasts,
  fitFiles,
  isShipCommand,
  mapStamp,
  openQuestions,
  parsePorcelain,
  recentCorrections,
  relativeTo,
  shipMode,
} from '../hooks/notebook'

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 3, bodyColumns: 140, scroll: { offset: 0, bodyRows: 3 }, view: {} },
} as const

const PANE = {
  component: 'Pane',
  requestId: 'notjunior-notebook',
  props: { title: 'notjunior notebook', isFocused: false, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

// A command as the person types it at a fullscreen prompt.
const typed = (command: string) =>
  ({ command, args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } }) as const

// A prompt as the person sends it from the prompt box.
const said = (text: string) => ({ text, origin: { kind: 'composer' }, wait: false }) as const

type World = { ran: string[]; toasts: string[]; submitted: string[]; filled: string[] }

// A repository beneath the plugin, answering the read-only git commands the mod runs.
type Repo = { top: string; head: string; status: string; hashes: Record<string, string>; committed: string }

const fakeGit = (on: On, repo: Repo): void => {
  on('process.run', ($, e) => {
    const [command, ...args] = e.argv
    const out = (stdout: string, exitCode = 0) => ({
      value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
    })
    if (command !== 'git') return out('', 1)
    if (args[0] === 'rev-parse' && args[1] === '--show-toplevel') return out(`${repo.top}\n`)
    if (args[0] === 'rev-parse') return out(`${repo.head}\n`)
    if (args[0] === 'status') return out(repo.status)
    if (args[0] === 'hash-object') return out(`${args.slice(2).map(path => repo.hashes[path] ?? 'h0').join('\n')}\n`)
    if (args[0] === 'diff') return out(repo.committed)
    return out('', 1)
  })
}

// One of Claude's turns, with whatever happens to the working tree during it.
const turn = async ($: Engine, turnId: string, during: () => void): Promise<void> => {
  await $.turn.start({ text: 'do the thing', turnId })
  during()
  await $.turn.complete({ answer: 'done', durationMs: 10, isAborted: false, turnId, reason: 'answer' })
}

// The engine beneath the plugin: tools answer, toasts and prompts are recorded.
const world = (on: On, surfaces: readonly string[] = ['terminal']): World => {
  on('session.surfaces', () => ({ value: surfaces as never }))
  const w: World = { ran: [], toasts: [], submitted: [], filled: [] }
  on('tool.call', ($, e) => {
    w.ran.push(e.tool === 'Bash' ? e.command : e.tool)
    return { result: {} as never }
  })
  on('ui.toast', ($, e) => {
    w.toasts.push(e.text)
    return { value: undefined }
  })
  on('prompt.submit', ($, e) => {
    w.submitted.push(e.text)
    return { text: e.text }
  })
  on('prompt.fill', ($, e) => {
    w.filled.push(e.text)
    return { isFilled: true }
  })
  on('skill.prompt', ($, e) => ({ text: e.text }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', ($, e) => ({ text: e.answer }))
  // The engine's own drawing, where the plugin has nothing to show.
  on('ui.render', () => ({ type: 'Box' }))
  return w
}

describe('the band', () => {
  test('an edit raises it, and Later hides it', async ($, on) => {
    world(on)
    await $.tool.call({ tool: 'Edit', file_path: 'src/a.ts', old_string: 'a', new_string: 'b' })
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ plugin: 'notjunior', surface, ...BAND })
      expect(await ui.find({ key: 'check' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /1 file you haven't explained back \(\s*a\.ts\)/ })).toBeDefined()
      await ui.unmount()
    }
    const ui = await $.ui.mount({ plugin: 'notjunior', surface: 'terminal', ...BAND })
    await ui.press({ key: 'later' })
    expect(await ui.find({ key: 'check' })).toBeUndefined()
    await ui.unmount()
  })

  test('stays quiet while Claude is working', async ($, on) => {
    world(on)
    await $.tool.call({ tool: 'Edit', file_path: 'src/a.ts', old_string: 'a', new_string: 'b' })
    const ui = await $.ui.mount({
      plugin: 'notjunior',
      surface: 'terminal',
      component: 'AbovePrompt',
      props: { ...BAND.props, isWorking: true },
    })
    expect(await ui.find({ key: 'check' })).toBeUndefined()
    await ui.unmount()
  })

  test("ignores the skill's own notebook", async ($, on) => {
    world(on)
    await $.tool.call({ tool: 'Write', file_path: '.notjunior/log.md', content: '# log' })
    const ui = await $.ui.mount({ plugin: 'notjunior', surface: 'terminal', ...BAND })
    expect(await ui.find({ key: 'check' })).toBeUndefined()
    await ui.unmount()
  })

  test('Check I understand it asks for the own check and clears', async ($, on) => {
    const w = world(on)
    await $.tool.call({ tool: 'Write', file_path: 'src/b.ts', content: 'export {}' })
    const ui = await $.ui.mount({ plugin: 'notjunior', surface: 'terminal', ...BAND })
    await ui.press({ key: 'check' })
    expect(w.submitted.length).toBe(1)
    expect(w.submitted[0]).toContain('notjunior own:')
    expect(w.submitted[0]).toContain('src/b.ts')
    expect(await ui.find({ key: 'check' })).toBeUndefined()
    await ui.unmount()
  })
})

describe('what counts as changed', () => {
  test('paths read from the repository root, whatever directory the shell is in', async ($, on) => {
    world(on)
    fakeGit(on, { top: '/repo', head: 'a1', status: '', hashes: {}, committed: '' })
    await $.tool.call({ tool: 'Edit', file_path: '/repo/src/a.ts', old_string: 'a', new_string: 'b' })
    const ours = await $.skill.prompt({ skill: 'notjunior', text: 'BODY' })
    expect(ours.text).toContain(': src/a.ts.')
  })

  test('files outside the project are not its code', async ($, on) => {
    world(on)
    fakeGit(on, { top: '/repo', head: 'a1', status: '', hashes: {}, committed: '' })
    await $.tool.call({ tool: 'Write', file_path: '/home/me/.claude/memory/note.md', content: 'x' })
    const ours = await $.skill.prompt({ skill: 'notjunior', text: 'BODY' })
    expect(ours.text).toBe('BODY')
  })

  test('edits made through the shell are picked up when the turn ends', async ($, on) => {
    world(on)
    const repo = { top: '/repo', head: 'a1', status: '', hashes: {} as Record<string, string>, committed: '' }
    fakeGit(on, repo)
    await turn($, 't1', () => {
      repo.status = ' M src/x.ts\0?? src/new.ts\0'
      repo.hashes = { 'src/x.ts': 'h1', 'src/new.ts': 'h2' }
    })
    const ours = await $.skill.prompt({ skill: 'notjunior', text: 'BODY' })
    expect(ours.text).toContain('src/x.ts')
    expect(ours.text).toContain('src/new.ts')
  })

  test('a commit made during the turn counts', async ($, on) => {
    world(on)
    const repo = { top: '/repo', head: 'a1', status: '', hashes: {}, committed: '' }
    fakeGit(on, repo)
    await turn($, 't2', () => {
      repo.head = 'b2'
      repo.committed = 'src/c.ts\0'
    })
    const ours = await $.skill.prompt({ skill: 'notjunior', text: 'BODY' })
    expect(ours.text).toContain('src/c.ts')
  })

  test("the person's own edits from before the turn, untouched by it, do not count", async ($, on) => {
    world(on)
    fakeGit(on, { top: '/repo', head: 'a1', status: ' M src/mine.ts\0', hashes: { 'src/mine.ts': 'h9' }, committed: '' })
    await turn($, 't3', () => {})
    const ours = await $.skill.prompt({ skill: 'notjunior', text: 'BODY' })
    expect(ours.text).toBe('BODY')
  })

  test('outside a repository, turns change nothing', async ($, on) => {
    world(on)
    await turn($, 't4', () => {})
    const ours = await $.skill.prompt({ skill: 'notjunior', text: 'BODY' })
    expect(ours.text).toBe('BODY')
  })
})

describe('the commit moment', () => {
  test('nudge: a reminder, then the commit runs', async ($, on) => {
    const w = world(on)
    await $.tool.call({ tool: 'Edit', file_path: 'src/a.ts', old_string: 'a', new_string: 'b' })
    await $.tool.call({ tool: 'Bash', command: 'git add -A && git commit -m "change"' })
    expect(w.toasts.length).toBe(1)
    expect(w.toasts[0]).toContain('not explained back')
    expect(w.ran).toContain('git add -A && git commit -m "change"')
  })

  test('nudge where toasts do not draw: Claude is told to say it instead', async ($, on) => {
    const w = world(on, ['vscode'])
    await $.tool.call({ tool: 'Edit', file_path: 'src/a.ts', old_string: 'a', new_string: 'b' })
    const answer = await $.tool.call({ tool: 'Bash', command: 'git commit -m "change"' })
    expect(w.toasts.length).toBe(0)
    expect(w.ran).toContain('git commit -m "change"')
    expect(JSON.stringify(answer)).toContain('has not yet explained back')
  })

  test('nudge where toasts draw: no note for Claude', async ($, on) => {
    world(on, ['terminal'])
    await $.tool.call({ tool: 'Edit', file_path: 'src/a.ts', old_string: 'a', new_string: 'b' })
    const answer = await $.tool.call({ tool: 'Bash', command: 'git commit -m "change"' })
    expect(JSON.stringify(answer)).not.toContain('has not yet explained back')
  })

  test('nudge: nothing pending, nothing said', async ($, on) => {
    const w = world(on)
    await $.tool.call({ tool: 'Bash', command: 'git push' })
    expect(w.toasts.length).toBe(0)
    expect(w.ran).toContain('git push')
  })

  test('other shell commands are left alone', async ($, on) => {
    const w = world(on)
    await $.tool.call({ tool: 'Edit', file_path: 'src/a.ts', old_string: 'a', new_string: 'b' })
    await $.tool.call({ tool: 'Bash', command: 'git status && npm test' })
    expect(w.toasts.length).toBe(0)
    expect(w.ran).toContain('git status && npm test')
  })

  test('hold: the commit is refused with a reason', { options: { shipCheck: 'hold' } }, async ($, on) => {
    const w = world(on)
    await $.tool.call({ tool: 'Edit', file_path: 'src/a.ts', old_string: 'a', new_string: 'b' })
    const answer = await $.tool.call({ tool: 'Bash', command: 'gh pr create --fill' })
    expect(JSON.stringify(answer)).toContain('/notjunior-check')
    expect(w.ran).not.toContain('gh pr create --fill')
  })

  test('hold: released once the check request is sent', { options: { shipCheck: 'hold' } }, async ($, on) => {
    const w = world(on)
    await $.tool.call({ tool: 'Edit', file_path: 'src/a.ts', old_string: 'a', new_string: 'b' })
    await $.command.run(typed('notjunior-check'))
    await $.prompt.submit(said(w.filled[0] ?? ''))
    await $.tool.call({ tool: 'Bash', command: 'git push' })
    expect(w.ran).toContain('git push')
  })

  test('off: nothing at all', { options: { shipCheck: 'off' } }, async ($, on) => {
    const w = world(on)
    await $.tool.call({ tool: 'Edit', file_path: 'src/a.ts', old_string: 'a', new_string: 'b' })
    await $.tool.call({ tool: 'Bash', command: 'git commit -m x' })
    expect(w.toasts.length).toBe(0)
    expect(w.ran).toContain('git commit -m x')
  })
})

describe('the hand-off to the skill', () => {
  test('notjunior reads which files Claude changed; other skills are untouched', async ($, on) => {
    world(on)
    await $.tool.call({ tool: 'Edit', file_path: 'src/a.ts', old_string: 'a', new_string: 'b' })
    const ours = await $.skill.prompt({ skill: 'notjunior', text: 'BODY' })
    expect(ours.text.startsWith('BODY')).toBe(true)
    expect(ours.text).toContain('src/a.ts')
    const theirs = await $.skill.prompt({ skill: 'commit', text: 'OTHER' })
    expect(theirs.text).toBe('OTHER')
  })

  test('nothing pending, nothing added', async ($, on) => {
    world(on)
    const ours = await $.skill.prompt({ skill: 'notjunior', text: 'BODY' })
    expect(ours.text).toBe('BODY')
  })
})

describe('the commands', () => {
  test('/notjunior-check with nothing pending says so', async ($, on) => {
    const w = world(on)
    const run = await $.command.run(typed('notjunior-check'))
    expect(run.text).toContain('nothing to check')
    expect(w.submitted.length).toBe(0)
  })

  test('/notjunior-check drafts the request; sending it clears the list', async ($, on) => {
    const w = world(on)
    await $.tool.call({ tool: 'Edit', file_path: 'src/a.ts', old_string: 'a', new_string: 'b' })
    const run = await $.command.run(typed('notjunior-check'))
    expect(run.text).toContain('prompt box')
    expect(w.filled[0]).toContain('src/a.ts')
    expect(w.submitted.length).toBe(0)
    await $.prompt.submit(said(w.filled[0] ?? ''))
    const again = await $.command.run(typed('notjunior-check'))
    expect(again.text).toContain('nothing to check')
  })

  test("the person's own check request clears the list too", async ($, on) => {
    world(on)
    await $.tool.call({ tool: 'Edit', file_path: 'src/a.ts', old_string: 'a', new_string: 'b' })
    await $.prompt.submit(said('Notjunior own: walk me through what you just changed'))
    const ours = await $.skill.prompt({ skill: 'notjunior', text: 'BODY' })
    expect(ours.text).toBe('BODY')
  })

  test('/notjunior-notebook with no notebook answers in text, and the pane says the same', async ($, on) => {
    world(on)
    const run = await $.command.run(typed('notjunior-notebook'))
    expect(run.text).toContain('no .notjunior/ notebook')
    const ui = await $.ui.mount({ plugin: 'notjunior', surface: 'terminal', ...PANE })
    expect(await ui.find({ type: 'Text', text: /No \.notjunior\/ notebook/ })).toBeDefined()
    await ui.unmount()
  })
})

describe('notebook helpers', () => {
  test('ship commands', () => {
    expect(isShipCommand('git commit -m "x"')).toBe(true)
    expect(isShipCommand('git add . && git commit')).toBe(true)
    expect(isShipCommand('git -C ../repo push origin main')).toBe(true)
    expect(isShipCommand('gh pr create --fill')).toBe(true)
    expect(isShipCommand('git -c user.email=a@b -c user.name=a commit -qm wip')).toBe(true)
    expect(isShipCommand('git --no-pager commit --amend')).toBe(true)
    expect(isShipCommand('git -c color.ui=never status')).toBe(false)
    expect(isShipCommand('git status')).toBe(false)
    expect(isShipCommand('git commit-tree abc')).toBe(false)
    expect(isShipCommand('echo "git pushes"')).toBe(false)
  })

  test('ship mode defaults to nudge', () => {
    expect(shipMode('hold')).toBe('hold')
    expect(shipMode('off')).toBe('off')
    expect(shipMode('nudge')).toBe('nudge')
    expect(shipMode('loud')).toBe('nudge')
    expect(shipMode(undefined)).toBe('nudge')
  })

  test('reading the notebook files', () => {
    const questions = '# questions\n- [ ] Why does the client retry only once? — from stack, 2026-10-07 — ask: the lead\n- [x] Who owns CI? — answer: the platform team\n'
    expect(openQuestions(questions)).toEqual(['Why does the client retry only once?'])
    const log = '## a\n- misconception → corrected: a 404 means the server is down → the route does not exist\n## b\n- explained well: rollback\n'
    expect(recentCorrections(log)).toEqual(['a 404 means the server is down → the route does not exist'])
    expect(mapStamp('# map\nas of: 1a2b3c4 (2026-10-07)\n')).toBe('1a2b3c4')
    expect(mapStamp('# map\nas of: HEAD\n')).toBe(null)
  })

  test('reading git status', () => {
    expect(parsePorcelain(' M src/a.ts\0R  src/new.ts\0src/old.ts\0 D gone.ts\0?? fresh.ts\0')).toEqual([
      { path: 'src/a.ts', isDeleted: false },
      { path: 'src/new.ts', isDeleted: false },
      { path: 'gone.ts', isDeleted: true },
      { path: 'fresh.ts', isDeleted: false },
    ])
    const before = { head: 'a', files: new Map([['kept.ts', 'h1'], ['edited.ts', 'h2']]) }
    const after = { head: 'a', files: new Map([['kept.ts', 'h1'], ['edited.ts', 'h3'], ['new.ts', 'h4'], ['.notjunior/log.md', 'h5']]) }
    expect(changedBetween(before, after, ['committed.ts'])).toEqual(['edited.ts', 'new.ts', 'committed.ts'])
    expect(drawsToasts(['vscode'])).toBe(false)
    expect(drawsToasts(['vscode', 'terminal'])).toBe(true)
    expect(drawsToasts([])).toBe(false)
  })

  test('paths and names', () => {
    expect(relativeTo('/repo/src/a.ts', '/repo')).toBe('src/a.ts')
    expect(relativeTo('/elsewhere/a.ts', '/repo')).toBe('/elsewhere/a.ts')
    expect(describeFiles(['src/a.ts', 'src/b.ts', 'lib/c.ts', 'd.ts'], 2)).toBe('a.ts, b.ts +2')
  })

  test('the band fits its file names to the width, and drops them before the buttons', () => {
    const files = ['src/payments/client.ts', 'src/payments/retry.ts']
    expect(fitFiles(files, 160)).toBe('client.ts, retry.ts')
    expect(fitFiles(files, 113)).toBe('client.ts +1')
    expect(fitFiles(files, 90)).toBe('')
  })

  test('a narrow band keeps both buttons', async ($, on) => {
    world(on)
    await $.tool.call({ tool: 'Edit', file_path: 'src/payments/client.ts', old_string: 'a', new_string: 'b' })
    const ui = await $.ui.mount({
      plugin: 'notjunior',
      surface: 'terminal',
      component: 'AbovePrompt',
      props: { ...BAND.props, bodyColumns: 90 },
    })
    expect(await ui.find({ key: 'check' })).toBeDefined()
    expect(await ui.find({ key: 'later' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /explained back\s*$/ })).toBeDefined()
    await ui.unmount()
  })
})
