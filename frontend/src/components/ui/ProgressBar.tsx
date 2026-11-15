/** Accessible progress bar: value / max with a visible label for screen readers. */
export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} of ${max}`}
    >
      <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${percent}%` }} />
    </div>
  )
}
