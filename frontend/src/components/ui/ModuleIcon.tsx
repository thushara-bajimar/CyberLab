import { moduleTheme } from '../../utils/moduleTheme'

const sizes = { sm: 'size-9 rounded-lg [&>svg]:size-4', md: 'size-11 rounded-xl [&>svg]:size-5', lg: 'size-14 rounded-2xl [&>svg]:size-7' }

/** The coloured icon tile that identifies a module everywhere in the app. */
export function ModuleIcon({ moduleId, size = 'md' }: { moduleId: string; size?: keyof typeof sizes }) {
  const { icon: Icon, tile } = moduleTheme(moduleId)
  return (
    <span className={`grid shrink-0 place-items-center ${tile} ${sizes[size]}`} aria-hidden="true">
      <Icon />
    </span>
  )
}
