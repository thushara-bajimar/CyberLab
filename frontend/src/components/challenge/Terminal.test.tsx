import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockFetch } from '../../test/helpers'
import { Terminal } from './Terminal'

const environment = { environmentId: 'linux-onboarding', title: 'Lab workstation', user: 'student', hostname: 'lab-ws01', home: '/home/student' }

function setup(respond: Parameters<typeof mockFetch>[0]) {
  const requests = mockFetch(respond)
  render(<Terminal challengeId="linux-find-note" environment={environment} />)
  const input = screen.getByLabelText(/type a command/i)
  const log = screen.getByRole('log', { name: 'Terminal output' })
  return { requests, input, log, user: userEvent.setup() }
}

describe('Terminal', () => {
  it('sends the command with the current folder and shows the server output', async () => {
    const { requests, input, log, user } = setup(() => [200, { output: 'documents/  README.txt', cwd: '/home/student', clear: false, isError: false }])
    await user.type(input, 'ls{Enter}')
    // Raw textContent: the terminal preserves spacing (whitespace-pre-wrap), so the double space must survive.
    await waitFor(() => expect(log.textContent).toContain('documents/  README.txt'))
    expect(requests).toEqual([
      { url: '/api/terminal/execute', method: 'POST', body: { challengeId: 'linux-find-note', command: 'ls', cwd: '/home/student', history: [] } },
    ])
    expect(log).toHaveTextContent('student@lab-ws01:~$ ls')
    expect(input).toHaveValue('')
  })

  it('updates the prompt after cd and sends earlier commands as history', async () => {
    const { requests, input, log, user } = setup(({ body }) => {
      const command = (body as { command: string }).command
      return [200, { output: '', cwd: command === 'cd documents' ? '/home/student/documents' : '/home/student/documents', clear: false, isError: false }]
    })
    await user.type(input, 'cd documents{Enter}')
    await waitFor(() => expect(screen.getByText('student@lab-ws01:~/documents$', { exact: false, selector: 'label' })).toBeInTheDocument())
    await user.type(input, 'pwd{Enter}')
    await waitFor(() => expect(requests).toHaveLength(2))
    expect(requests[1]!.body).toMatchObject({ command: 'pwd', cwd: '/home/student/documents', history: ['cd documents'] })
    expect(log).toHaveTextContent('student@lab-ws01:~/documents$ pwd')
  })

  it('recalls earlier commands with the arrow keys', async () => {
    const { input, user } = setup(() => [200, { output: '', cwd: '/home/student', clear: false, isError: false }])
    await user.type(input, 'pwd{Enter}')
    await waitFor(() => expect(input).toBeEnabled())
    await user.type(input, 'whoami{Enter}')
    await waitFor(() => expect(input).toHaveValue(''))
    await user.keyboard('{ArrowUp}')
    expect(input).toHaveValue('whoami')
    await user.keyboard('{ArrowUp}')
    expect(input).toHaveValue('pwd')
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(input).toHaveValue('')
  })

  it('clears the screen when the server says so, and with Ctrl+L', async () => {
    const { input, log, user } = setup(({ body }) => [200, { output: (body as { command: string }).command === 'clear' ? '' : 'hello', cwd: '/home/student', clear: (body as { command: string }).command === 'clear', isError: false }])
    await user.type(input, 'echo hello{Enter}')
    await waitFor(() => expect(log).toHaveTextContent('hello'))
    await user.type(input, 'clear{Enter}')
    await waitFor(() => expect(log).toBeEmptyDOMElement())
    await user.type(input, 'echo hello{Enter}')
    await waitFor(() => expect(log).toHaveTextContent('hello'))
    await user.keyboard('{Control>}l{/Control}')
    expect(log).toBeEmptyDOMElement()
  })

  it('does not contact the server for an empty line', async () => {
    const { requests, input, log, user } = setup(() => [200, {}])
    await user.type(input, '   {Enter}')
    expect(requests).toHaveLength(0)
    expect(log).toHaveTextContent('student@lab-ws01:~$')
  })

  it('shows API failures inside the terminal', async () => {
    const { input, log, user } = setup(() => [400, { error: { code: 'VALIDATION_ERROR', message: 'The request is not valid.' } }])
    await user.type(input, 'ls{Enter}')
    await waitFor(() => expect(log).toHaveTextContent('Terminal unavailable: The request is not valid.'))
  })

  it('renders output as text, never as HTML', async () => {
    const payload = '<img src=x onerror="window.hacked=1"><script>window.hacked=1</script>'
    const { input, log, user } = setup(() => [200, { output: payload, cwd: '/home/student', clear: false, isError: false }])
    await user.type(input, 'cat evil.html{Enter}')
    await waitFor(() => expect(log).toHaveTextContent(payload))
    expect(log.querySelector('img, script')).toBeNull()
    expect((window as unknown as { hacked?: number }).hacked).toBeUndefined()
  })
})
