/** Accessible progress bar: value / max with a label for screen readers. `fill` sets the bar colour. */
export function ProgressBar({ value, max, label, fill = 'bg-indigo-500', track = 'bg-slate-200' }: { value: number; max: number; label: string; fill?: string; track?: string }) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full ${track}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} of ${max}`}
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ${percent === 100 ? 'bg-emerald-500' : fill}`} style={{ width: `${percent}%` }} />
    </div>
  )
}
