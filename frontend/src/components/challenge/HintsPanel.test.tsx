import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeChallenge, mockFetch } from '../../test/helpers'
import { HintsPanel } from './HintsPanel'

describe('HintsPanel', () => {
  it('states the cost and asks for confirmation before revealing a hint', async () => {
    const updated = makeChallenge({ hints: { total: 3, used: 1, revealed: [{ number: 1, text: 'Try ls -a.' }] }, scoring: { basePoints: 100, hintPenaltyPercent: 10, pointsAvailable: 90 } })
    const requests = mockFetch(() => [200, { revealed: true, challenge: updated }])
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    render(<HintsPanel challenge={makeChallenge()} onUpdate={onUpdate} />)

    await user.click(screen.getByRole('button', { name: 'Reveal hint 1 of 3 (-10 points)' }))
    expect(requests).toHaveLength(0) // nothing is sent before confirming
    expect(screen.getByRole('alertdialog')).toHaveTextContent('worth 90 points instead of 100')

    await user.click(screen.getByRole('button', { name: 'Reveal hint 1' }))
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(updated))
    expect(requests).toEqual([{ url: '/api/challenges/linux-hidden-files/hints', method: 'POST', body: { hintNumber: 1 } }])
  })

  it('can be cancelled', async () => {
    const requests = mockFetch(() => [200, {}])
    const user = userEvent.setup()
    render(<HintsPanel challenge={makeChallenge()} onUpdate={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Reveal hint 1 of 3/ }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(requests).toHaveLength(0)
  })

  it('shows revealed hints and offers the next one with the intermediate cost', () => {
    render(
      <HintsPanel
        challenge={makeChallenge({
          difficulty: 'intermediate',
          basePoints: 200,
          scoring: { basePoints: 200, hintPenaltyPercent: 10, pointsAvailable: 180 },
          hints: { total: 3, used: 1, revealed: [{ number: 1, text: 'Think about THE.' }] },
        })}
        onUpdate={vi.fn()}
      />,
    )
    expect(screen.getByText('Think about THE.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reveal hint 2 of 3 (-20 points)' })).toBeInTheDocument()
  })

  it('shows all hints for free once the challenge is completed', () => {
    const revealed = [1, 2, 3].map((number) => ({ number, text: `Hint text ${number}` }))
    render(<HintsPanel challenge={makeChallenge({ status: 'completed', hints: { total: 3, used: 0, revealed } })} onUpdate={vi.fn()} />)
    expect(screen.getByText(/all hints are shown for review, free of charge/)).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('reports a server error', async () => {
    mockFetch(() => [409, { error: { code: 'HINT_ORDER', message: 'Hints are revealed in order: reveal hint 1 first.' } }])
    const user = userEvent.setup()
    render(<HintsPanel challenge={makeChallenge()} onUpdate={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Reveal hint 1 of 3/ }))
    await user.click(screen.getByRole('button', { name: 'Reveal hint 1' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Hints are revealed in order')
  })
})
