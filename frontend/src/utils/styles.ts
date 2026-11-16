/** Shared button styles so every action looks the same across the app. */
export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50'

export const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2 font-medium text-ink transition-colors hover:border-accent hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50'

/** Text input used by answer, reset and similar forms. */
export const textInput =
  'w-full rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-base text-ink placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent-line focus:outline-none'
