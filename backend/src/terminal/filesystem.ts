import type { FsDirectory, FsNode } from '../content/environments.js'

/**
 * Step 2 of the terminal: paths in the simulated filesystem.
 *
 * Paths are resolved purely as strings against the in-memory tree of the current environment. There is no
 * access to the real disk: "/" here is the root of the simulated tree, ".." can never go above it, and a
 * Windows path such as C:\Windows is just an unknown name.
 */

/** Turns any user-typed path into a normalised absolute path such as /home/student/documents. */
export function resolvePath(cwd: string, input: string, home: string): string {
  let path = input
  if (path === '~') path = home
  else if (path.startsWith('~/')) path = home + path.slice(1)

  const parts = path.startsWith('/') ? [] : splitPath(cwd)
  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') parts.pop() // popping at the root does nothing: you cannot leave "/"
    else parts.push(segment)
  }
  return '/' + parts.join('/')
}

export function splitPath(absolute: string): string[] {
  return absolute.split('/').filter((segment) => segment !== '')
}

/**
 * Finds the node at an absolute path. Uses Object.hasOwn so names such as "constructor" or "__proto__"
 * can never reach JavaScript's built-in object properties.
 */
export function lookup(root: FsDirectory, absolute: string): FsNode | null {
  let node: FsNode = root
  for (const segment of splitPath(absolute)) {
    if (node.type !== 'dir' || !Object.hasOwn(node.children, segment)) return null
    node = node.children[segment]!
  }
  return node
}

/** Shows paths inside the home directory with "~", like a real shell prompt. */
export function displayPath(absolute: string, home: string): string {
  if (absolute === home) return '~'
  if (absolute.startsWith(home + '/')) return '~' + absolute.slice(home.length)
  return absolute
}

export function isHidden(name: string): boolean {
  return name.startsWith('.')
}
