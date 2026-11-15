import { Eraser, TerminalSquare } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ApiError } from '../../api/client'
import { executeTerminalCommand } from '../../api/endpoints'
import type { ChallengeDetail } from '../../api/types'
import { displayPath } from '../../utils/terminal'

type Environment = NonNullable<ChallengeDetail['terminal']>

interface Line {
  id: number
  kind: 'input' | 'output' | 'error' | 'system'
  text: string
  prompt?: string
}

const MAX_LINES = 500
const MAX_HISTORY = 50
const MAX_COMMAND_LENGTH = 200

/**
 * The simulated terminal. The browser only displays text: every command is sent to the server, which runs
 * it in a read-only, in-memory environment and returns the output. Nothing typed here runs on any computer.
 */
export function Terminal({ challengeId, environment }: { challengeId: string; environment: Environment }) {
  const welcome = (): Line[] => [
    { id: 0, kind: 'system', text: `CyberLab simulated terminal: ${environment.title}. Nothing you type runs on a real computer.` },
    { id: 1, kind: 'system', text: 'Type "help" to see the available commands.' },
  ]
  const [lines, setLines] = useState<Line[]>(welcome)
  const [cwd, setCwd] = useState(environment.home)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const nextId = useRef(2)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  const prompt = (path: string) => `${environment.user}@${environment.hostname}:${displayPath(path, environment.home)}$`
  const append = (...added: Omit<Line, 'id'>[]) =>
    setLines((current) => [...current, ...added.map((line) => ({ ...line, id: nextId.current++ }))].slice(-MAX_LINES))

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const command = input
    setInput('')
    setHistoryIndex(null)
    append({ kind: 'input', text: command, prompt: prompt(cwd) })
    if (command.trim() === '') return

    setBusy(true)
    try {
      const result = await executeTerminalCommand({ challengeId, command, cwd, history: history.slice(-MAX_HISTORY) })
      if (result.clear) setLines([])
      else if (result.output !== '') append({ kind: result.isError ? 'error' : 'output', text: result.output })
      setCwd(result.cwd)
    } catch (error) {
      append({ kind: 'error', text: `Terminal unavailable: ${error instanceof ApiError ? error.message : 'unexpected error.'}` })
    } finally {
      setHistory((current) => [...current, command].slice(-MAX_HISTORY))
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp' && history.length > 0) {
      event.preventDefault()
      const index = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(index)
      setInput(history[index] ?? '')
    } else if (event.key === 'ArrowDown' && historyIndex !== null) {
      event.preventDefault()
      const index = historyIndex + 1
      if (index >= history.length) {
        setHistoryIndex(null)
        setInput('')
      } else {
        setHistoryIndex(index)
        setInput(history[index] ?? '')
      }
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault()
      setLines([])
    }
  }

  const color: Record<Line['kind'], string> = {
    input: 'text-slate-100',
    output: 'text-slate-300',
    error: 'text-rose-400',
    system: 'text-slate-500',
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-800 bg-black">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-400">
        <span className="inline-flex items-center gap-2">
          <TerminalSquare className="size-3.5" aria-hidden="true" />
          {environment.user}@{environment.hostname} · simulated
        </span>
        <button type="button" onClick={() => setLines([])} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-slate-800 hover:text-slate-200">
          <Eraser className="size-3.5" aria-hidden="true" /> Clear
        </button>
      </div>
      {/* Clicking anywhere in the terminal focuses the command line, like a real terminal. */}
      <div
        ref={scrollRef}
        className="h-80 overflow-y-auto p-3 font-mono text-[13px] leading-relaxed sm:h-96"
        onClick={() => {
          if (!window.getSelection()?.toString()) inputRef.current?.focus()
        }}
      >
        <div role="log" aria-live="polite" aria-label="Terminal output">
          {lines.map((line) => (
            <div key={line.id} className={`wrap-break-word whitespace-pre-wrap ${color[line.kind]}`}>
              {line.prompt && <span className="text-emerald-400">{line.prompt} </span>}
              {line.text}
            </div>
          ))}
        </div>
        <form onSubmit={submit} className="flex items-baseline gap-2">
          <label htmlFor={`terminal-${challengeId}`} className="shrink-0 text-emerald-400">
            {prompt(cwd)}
            <span className="sr-only"> type a command and press Enter</span>
          </label>
          <input
            id={`terminal-${challengeId}`}
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            maxLength={MAX_COMMAND_LENGTH}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-busy={busy}
            className="min-w-0 flex-1 bg-transparent text-slate-100 caret-emerald-400 outline-none"
          />
        </form>
        {busy && <p className="text-slate-600">running…</p>}
      </div>
    </div>
  )
}
