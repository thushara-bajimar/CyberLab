/** Same rule as the backend: show paths inside the home folder with "~". */
export function displayPath(path: string, home: string): string {
  if (path === home) return '~'
  if (path.startsWith(home + '/')) return '~' + path.slice(home.length)
  return path
}
