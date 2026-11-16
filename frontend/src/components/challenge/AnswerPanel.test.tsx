import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { ChallengeDetail } from '../../api/types'
import { makeChallenge, mockFetch } from '../../test/helpers'
import { AnswerPanel } from './AnswerPanel'

const renderPanel = (challenge: ChallengeDetail, onUpdate = vi.fn()) => {
  render(
    <MemoryRouter>
      <AnswerPanel challenge={challenge} onUpdate={onUpdate} />
    </MemoryRouter>,
  )
  return onUpdate
}

describe('AnswerPanel', () => {
  it('asks for an answer before contacting the server', async () => {
    const requests = mockFetch(() => [200, {}])
    renderPanel(makeChallenge())
    await userEvent.setup().click(screen.getByRole('button', { name: 'Submit answer' }))
    expect(screen.getByText('Type your answer first.')).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('sends only the answer text and shows retry feedback for a wrong answer', async () => {
    const challenge = makeChallenge()
    const requests = mockFetch(() => [200, { outcome: 'incorrect', correct: false, message: 'Not quite.', pointsAwarded: 0, attempts: 1, challenge }])
    const user = userEvent.setup()
    const onUpdate = renderPanel(challenge)
    await user.type(screen.getByLabelText('Type your answer'), 'guess')
    await user.click(screen.getByRole('button', { name: 'Submit answer' }))
    expect(await screen.findByText('Not quite. (Attempt 1.)')).toBeInTheDocument()
    expect(requests).toEqual([{ url: '/api/challenges/linux-hidden-files/submit', method: 'POST', body: { answer: 'guess' } }])
    expect(onUpdate).toHaveBeenCalledWith(challenge)
    expect(screen.getByLabelText('Type your answer')).toHaveValue('guess') // kept so it can be corrected
  })

  it('passes the completed challenge up after a correct answer', async () => {
    const completed = makeChallenge({ status: 'completed', pointsAwarded: 90 })
    mockFetch(() => [200, { outcome: 'correct', correct: true, message: 'Correct! You earned 90 of 100 points (1 hint used).', pointsAwarded: 90, attempts: 2, challenge: completed }])
    const user = userEvent.setup()
    const onUpdate = renderPanel(makeChallenge())
    await user.type(screen.getByLabelText('Type your answer'), 'Pa55-Lab-Only')
    await user.click(screen.getByRole('button', { name: 'Submit answer' }))
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(completed))
    expect(screen.getByText(/Correct! You earned 90 of 100 points/)).toBeInTheDocument()
  })

  it('submits the selected option id for multiple-choice challenges', async () => {
    const challenge = makeChallenge({
      answerType: 'choice',
      terminal: null,
      options: [
        { id: 'a', text: 'Confidentiality' },
        { id: 'c', text: 'Availability' },
      ],
    })
    const requests = mockFetch(() => [200, { outcome: 'incorrect', correct: false, message: 'Not quite.', pointsAwarded: 0, attempts: 1, challenge }])
    const user = userEvent.setup()
    renderPanel(challenge)
    await user.click(screen.getByRole('button', { name: 'Submit answer' }))
    expect(screen.getByText('Choose one of the options first.')).toBeInTheDocument()
    await user.click(screen.getByLabelText(/Availability/))
    await user.click(screen.getByRole('button', { name: 'Submit answer' }))
    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]!.body).toEqual({ answer: 'c' })
  })

  it('shows a completion summary instead of the form', () => {
    renderPanel(
      makeChallenge({
        status: 'completed',
        pointsAwarded: 80,
        progress: { status: 'completed', attempts: 3, hintsUsed: 2, pointsAwarded: 80, startedAt: '2026-11-15T10:00:00Z', completedAt: '2026-11-15T10:05:00Z' },
      }),
    )
    expect(screen.queryByRole('button', { name: 'Submit answer' })).toBeNull()
    expect(screen.getByText('80/100')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Next challenge' })).toHaveAttribute('href', '/challenges/networking-gateway')
  })

  it('shows server errors', async () => {
    mockFetch(() => [400, { error: { code: 'INVALID_CHOICE', message: 'Choose one of the listed options.' } }])
    const user = userEvent.setup()
    renderPanel(makeChallenge())
    await user.type(screen.getByLabelText('Type your answer'), 'x')
    await user.click(screen.getByRole('button', { name: 'Submit answer' }))
    expect(await screen.findByText('Choose one of the listed options.')).toBeInTheDocument()
  })
})
