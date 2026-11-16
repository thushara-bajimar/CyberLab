import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { mockFetch } from '../../test/helpers'
import { ResetProgressPanel } from './ResetProgressPanel'

describe('ResetProgressPanel', () => {
  it('stays disabled until RESET is typed exactly, then sends the confirmation word', async () => {
    const requests = mockFetch(() => [200, { deleted: { progressRows: 4, activityRows: 1 }, progress: {} }])
    const onReset = vi.fn()
    const user = userEvent.setup()
    render(<ResetProgressPanel onReset={onReset} />)
    const button = screen.getByRole('button', { name: 'Reset all progress' })
    const input = screen.getByLabelText(/to confirm/)

    expect(button).toBeDisabled()
    await user.type(input, 'reset')
    expect(button).toBeDisabled()
    await user.clear(input)
    await user.type(input, 'RESET')
    expect(button).toBeEnabled()

    await user.click(button)
    await waitFor(() => expect(onReset).toHaveBeenCalledWith('Progress reset: 4 challenge record(s) and 1 activity entry were deleted.'))
    expect(requests).toEqual([{ url: '/api/progress/reset', method: 'POST', body: { confirm: 'RESET' } }])
    expect(input).toHaveValue('')
  })

  it('reports a failed reset', async () => {
    mockFetch(() => [500, { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } }])
    const user = userEvent.setup()
    render(<ResetProgressPanel onReset={vi.fn()} />)
    await user.type(screen.getByLabelText(/to confirm/), 'RESET')
    await user.click(screen.getByRole('button', { name: 'Reset all progress' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('An unexpected server error occurred.')
  })
})
