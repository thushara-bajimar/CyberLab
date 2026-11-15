import type { ChallengeContent, ModuleContent } from '../content/types.js'
import type { DB } from './connection.js'

/**
 * Copies the version-controlled course content into the content tables. Runs at every startup inside one
 * transaction, so edits to content files appear after a restart and a failure leaves the old content intact.
 *
 * - Existing rows are updated in place (upsert), so learner progress that references them is kept.
 * - Modules/challenges removed from the content files are deleted; ON DELETE CASCADE then removes their
 *   hints and any progress for them, because that progress refers to content that no longer exists.
 * - Hints are replaced per challenge.
 */
export function seedContent(db: DB, modules: ModuleContent[], challenges: ChallengeContent[]): void {
  db.transaction(() => {
    // sort_order columns are UNIQUE; move existing values out of the way first so reordering cannot collide.
    db.exec('UPDATE modules SET sort_order = -rowid; UPDATE challenges SET sort_order = -rowid')

    const upsertModule = db.prepare(`
      INSERT INTO modules (id, title, summary, introduction, concept, objectives_json, difficulty, sort_order)
      VALUES (@id, @title, @summary, @introduction, @concept, @objectives, @difficulty, @order)
      ON CONFLICT(id) DO UPDATE SET title = excluded.title, summary = excluded.summary,
        introduction = excluded.introduction, concept = excluded.concept, objectives_json = excluded.objectives_json,
        difficulty = excluded.difficulty, sort_order = excluded.sort_order`)
    for (const module of modules) {
      upsertModule.run({ ...module, objectives: JSON.stringify(module.objectives) })
    }

    const upsertChallenge = db.prepare(`
      INSERT INTO challenges (id, module_id, title, difficulty, answer_type, scenario, objective, instructions_json,
        resources_json, options_json, terminal_env, answer_json, explanation_json, sort_order)
      VALUES (@id, @moduleId, @title, @difficulty, @answerType, @scenario, @objective, @instructions, @resources,
        @options, @terminalEnv, @answer, @explanation, @order)
      ON CONFLICT(id) DO UPDATE SET module_id = excluded.module_id, title = excluded.title,
        difficulty = excluded.difficulty, answer_type = excluded.answer_type, scenario = excluded.scenario,
        objective = excluded.objective, instructions_json = excluded.instructions_json,
        resources_json = excluded.resources_json, options_json = excluded.options_json,
        terminal_env = excluded.terminal_env, answer_json = excluded.answer_json,
        explanation_json = excluded.explanation_json, sort_order = excluded.sort_order`)
    const deleteHints = db.prepare('DELETE FROM challenge_hints WHERE challenge_id = ?')
    const insertHint = db.prepare('INSERT INTO challenge_hints (challenge_id, hint_number, text) VALUES (?, ?, ?)')

    for (const challenge of challenges) {
      upsertChallenge.run({
        id: challenge.id,
        moduleId: challenge.moduleId,
        title: challenge.title,
        difficulty: challenge.difficulty,
        answerType: challenge.answer.type,
        scenario: challenge.scenario,
        objective: challenge.objective,
        instructions: JSON.stringify(challenge.instructions),
        resources: JSON.stringify(challenge.resources),
        options: challenge.answer.type === 'choice' ? JSON.stringify(challenge.answer.options) : null,
        terminalEnv: challenge.terminalEnv ?? null,
        answer: JSON.stringify(challenge.answer),
        explanation: JSON.stringify(challenge.explanation),
        order: challenge.order,
      })
      deleteHints.run(challenge.id)
      challenge.hints.forEach((text, index) => insertHint.run(challenge.id, index + 1, text))
    }

    const keepChallenges = JSON.stringify(challenges.map((challenge) => challenge.id))
    db.prepare('DELETE FROM challenges WHERE id NOT IN (SELECT value FROM json_each(?))').run(keepChallenges)
    const keepModules = JSON.stringify(modules.map((module) => module.id))
    db.prepare('DELETE FROM modules WHERE id NOT IN (SELECT value FROM json_each(?))').run(keepModules)
  })()
}
