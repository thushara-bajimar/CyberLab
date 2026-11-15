import { AlertCircle, BookOpen, CheckCircle2, Globe, Lightbulb, TerminalSquare } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Explanation } from '../../api/types'

function Block({ icon: Icon, title, children }: { icon: typeof BookOpen; title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Icon className="size-4 text-emerald-400" aria-hidden="true" /> {title}
      </h3>
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  )
}

/** Shown only after completion: the full worked solution. */
export function ExplanationPanel({ explanation }: { explanation: Explanation }) {
  return (
    <section className="rounded-lg border border-emerald-900/70 bg-emerald-950/20 p-5" aria-labelledby="explanation-heading">
      <h2 id="explanation-heading" className="mb-4 text-lg font-semibold text-emerald-200">
        Solution explained
      </h2>
      <div className="flex flex-col gap-4">
        <Block icon={CheckCircle2} title="Answer">{explanation.solution}</Block>
        <Block icon={Lightbulb} title="Why it is correct">{explanation.why}</Block>
        <Block icon={BookOpen} title="Concept">{explanation.concept}</Block>
        {explanation.commands.length > 0 && (
          <Block icon={TerminalSquare} title="Commands used">
            <dl className="mt-1 flex flex-col gap-2">
              {explanation.commands.map((item) => (
                <div key={item.command}>
                  <dt>
                    <code className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-emerald-300">{item.command}</code>
                  </dt>
                  <dd className="mt-0.5 text-slate-400">{item.purpose}</dd>
                </div>
              ))}
            </dl>
          </Block>
        )}
        <Block icon={AlertCircle} title="Common mistakes">
          <ul className="list-disc pl-5">
            {explanation.commonMistakes.map((mistake) => (
              <li key={mistake}>{mistake}</li>
            ))}
          </ul>
        </Block>
        <Block icon={Globe} title="In the real world">{explanation.realWorld}</Block>
      </div>
    </section>
  )
}
