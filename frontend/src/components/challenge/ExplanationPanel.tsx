import { AlertCircle, BookOpen, CheckCircle2, Globe, GraduationCap, Lightbulb, SquareTerminal } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Explanation } from '../../api/types'

const blockTones = {
  emerald: 'bg-success-tile text-success-ink',
  indigo: 'bg-accent-tile text-accent-ink',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  slate: 'bg-track text-ink',
  amber: 'bg-warning-tile text-warning-ink',
  sky: 'bg-info-tile text-info-ink',
}

function Block({ icon: Icon, title, tone, children }: { icon: typeof BookOpen; title: string; tone: keyof typeof blockTones; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${blockTones[tone]}`} aria-hidden="true">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-ink">{title}</h3>
        <div className="mt-1 leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  )
}

/** Shown only after completion: the full worked solution. */
export function ExplanationPanel({ explanation }: { explanation: Explanation }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-success-line bg-surface shadow-sm" aria-labelledby="explanation-heading">
      <div className="flex items-center gap-3 bg-success-soft px-5 py-4 sm:px-6">
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white" aria-hidden="true">
          <GraduationCap className="size-5" />
        </span>
        <div>
          <h2 id="explanation-heading" className="text-lg font-bold text-ink">
            Solution explained
          </h2>
          <p className="text-sm text-success-ink">Here is what this challenge was teaching you.</p>
        </div>
      </div>
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <Block icon={CheckCircle2} tone="emerald" title="Answer">
          {explanation.solution}
        </Block>
        <Block icon={Lightbulb} tone="amber" title="Why it is correct">
          {explanation.why}
        </Block>
        <Block icon={BookOpen} tone="indigo" title="Concept">
          {explanation.concept}
        </Block>
        {explanation.commands.length > 0 && (
          <Block icon={SquareTerminal} tone="slate" title="Commands used">
            <dl className="mt-1 flex flex-col gap-2.5">
              {explanation.commands.map((item) => (
                <div key={item.command}>
                  <dt>
                    <code className="rounded-md bg-slate-900 px-2 py-1 font-mono text-sm text-emerald-300">{item.command}</code>
                  </dt>
                  <dd className="mt-1">{item.purpose}</dd>
                </div>
              ))}
            </dl>
          </Block>
        )}
        <Block icon={AlertCircle} tone="violet" title="Common mistakes">
          <ul className="list-disc space-y-1 pl-5">
            {explanation.commonMistakes.map((mistake) => (
              <li key={mistake}>{mistake}</li>
            ))}
          </ul>
        </Block>
        <Block icon={Globe} tone="sky" title="In the real world">
          {explanation.realWorld}
        </Block>
      </div>
    </section>
  )
}
