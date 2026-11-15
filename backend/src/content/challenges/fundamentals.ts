import type { ChallengeContent } from '../types.js'

export const fundamentalsChallenges: ChallengeContent[] = [
  {
    id: 'fundamentals-cia-triad',
    moduleId: 'fundamentals',
    order: 1,
    title: 'The CIA Triad in Practice',
    difficulty: 'beginner',
    scenario:
      'At 2 a.m. a hospital\'s patient-record server is hit by ransomware. The attackers did not copy any records, and the records were not altered, but every file is now encrypted with the attackers\' key. Doctors in the emergency department cannot open patient histories while they treat patients.',
    objective: 'Decide which property of the CIA triad this incident damages most directly.',
    instructions: [
      'Read the scenario carefully and note what the attackers did and did not do.',
      'Compare the impact with the definitions of confidentiality, integrity and availability.',
      'Choose the property that is most directly affected.',
    ],
    resources: [
      { title: 'Confidentiality', body: 'Only authorised people can read the information. Broken by data leaks and eavesdropping.' },
      { title: 'Integrity', body: 'Information is accurate and has not been changed without permission. Broken by tampering.' },
      { title: 'Availability', body: 'Information and systems can be used when needed. Broken by outages, DoS attacks and ransomware.' },
    ],
    answer: {
      type: 'choice',
      options: [
        { id: 'a', text: 'Confidentiality' },
        { id: 'b', text: 'Integrity' },
        { id: 'c', text: 'Availability' },
        { id: 'd', text: 'Authentication' },
      ],
      correct: 'c',
    },
    hints: [
      'Focus on what the doctors could no longer do, not on what the attackers wanted.',
      'The records were neither read by outsiders nor modified. Which property is left?',
      'If authorised people cannot use data when they need it, the data is not "available".',
    ],
    explanation: {
      solution: 'Availability.',
      why: 'The records still exist and nobody outside saw or changed them, but authorised staff can no longer use them when they need them. Losing access is a failure of availability.',
      concept: 'The CIA triad (confidentiality, integrity, availability) is a checklist for describing the impact of any incident. Many real incidents affect more than one property; analysts name the most direct impact first.',
      commands: [],
      commonMistakes: [
        'Choosing integrity because the files were "changed" by encryption. The data itself is intact; it is locked, not falsified.',
        'Choosing confidentiality because it was an attack. Confidentiality is only broken when someone unauthorised can read the data.',
        'Choosing authentication: it is a security control (proving identity), not one of the three CIA properties.',
      ],
      realWorld: 'Ransomware against hospitals has delayed treatment and forced ambulances to be diverted. Modern ransomware groups often also steal data before encrypting it ("double extortion"), which would add a confidentiality breach.',
    },
  },
  {
    id: 'fundamentals-least-privilege',
    moduleId: 'fundamentals',
    order: 2,
    title: 'Least Privilege',
    difficulty: 'beginner',
    scenario:
      'A summer intern has been asked to publish posts on the company blog. The IT team receives four suggestions for how to give the intern access.',
    objective: 'Choose the access that follows the principle of least privilege.',
    instructions: [
      'Work out exactly what the intern needs to do.',
      'For each option, think about what an attacker could do if the intern\'s account were stolen.',
      'Pick the option that allows the task and nothing more.',
    ],
    resources: [
      { title: 'Least privilege', body: 'Give each user and program the minimum access needed for their job, for the shortest time needed.' },
      { title: 'Blast radius', body: 'The damage an attacker can do with one compromised account. Least privilege keeps it small.' },
    ],
    answer: {
      type: 'choice',
      options: [
        { id: 'a', text: 'Make the intern a domain administrator so they are never blocked.' },
        { id: 'b', text: 'Share the existing administrator password with the intern.' },
        { id: 'c', text: 'Create a personal "blog editor" account that can only create and edit blog posts.' },
        { id: 'd', text: 'Give read-only access to the entire company file server.' },
      ],
      correct: 'c',
    },
    hints: [
      'The intern\'s task involves one system only: the blog.',
      'Options a and b give far more power than needed; option d gives the wrong kind of access.',
      'The right answer is a personal account limited to the one action the intern must perform.',
    ],
    explanation: {
      solution: 'Create a personal "blog editor" account that can only create and edit blog posts.',
      why: 'It allows exactly the task (publishing posts) and nothing else. If the account were stolen, the attacker could only edit the blog. A personal account also means actions can be traced to one person.',
      concept: 'Least privilege limits the blast radius of mistakes and compromised accounts. It is one of the most effective and cheapest security principles.',
      commands: [],
      commonMistakes: [
        'Giving broad access "to avoid support tickets". Convenience is the most common reason privileges grow too large.',
        'Sharing passwords: no individual accountability, and the password cannot be revoked for one person only.',
        'Thinking read-only is always safe: reading the whole file server can leak confidential data.',
      ],
      realWorld: 'Many breaches escalate because a compromised low-level account had administrator rights it did not need. Security standards such as ISO 27001 and NIST guidance require access to be granted on a need-to-know basis.',
    },
  },
]
