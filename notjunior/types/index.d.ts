export type NotebookView = {
  exists: boolean
  openQuestions: string[]
  corrections: string[]
  mapAsOf: string | null
  commitsBehind: number | null
}

declare module 'claude-code' {
  interface PluginState {
    notjunior: {
      pending: string[]
      isBandHidden: boolean
      notebook: NotebookView | null
    }
  }
}
