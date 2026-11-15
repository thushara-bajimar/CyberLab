import type { ChallengeContent } from '../types.js'

export const linuxChallenges: ChallengeContent[] = [
  {
    id: 'linux-find-note',
    moduleId: 'linux-basics',
    order: 1,
    title: 'Find the Onboarding Note',
    difficulty: 'beginner',
    scenario:
      'It is your first day on the security team. Your mentor left an onboarding note for you somewhere in your home directory on the lab workstation. It contains the access code you need to activate your lab account.',
    objective: 'Navigate the filesystem with the terminal, find the onboarding note and read your lab access code.',
    instructions: [
      'Use the simulated terminal below. Type "help" to see the available commands.',
      'Start with "pwd" to see where you are and "ls" to list the files.',
      'Move between folders with "cd" and read files with "cat".',
      'Submit the lab access code exactly as written in the note.',
    ],
    resources: [
      { title: 'pwd', body: 'Print working directory: shows the folder you are currently in.' },
      { title: 'ls', body: 'Lists the files and folders in the current folder (or in a folder you name, e.g. "ls documents").' },
      { title: 'cd', body: 'Changes folder. "cd documents" moves into a folder, "cd .." moves up one level, "cd" alone returns home.' },
      { title: 'cat', body: 'Prints the contents of a file, e.g. "cat README.txt".' },
    ],
    answer: { type: 'text', accepted: ['TUX-4821'] },
    terminalEnv: 'linux-onboarding',
    hints: [
      'Read README.txt in your home directory first: it tells you which folder to look in.',
      'The note is inside documents. Run "cd documents" and then "ls" to see the sub-folders.',
      'Run "cat documents/onboarding/note.txt" from your home directory.',
    ],
    explanation: {
      solution: 'The code is TUX-4821, found in /home/student/documents/onboarding/note.txt.',
      why: 'The README pointed to the documents folder. Inside it, the onboarding sub-folder contains note.txt, and cat prints its contents, including the access code.',
      concept: 'Linux organises files in a tree starting at "/". Relative paths (documents/onboarding) start from your current folder; absolute paths (/home/student/documents) start from the root.',
      commands: [
        { command: 'pwd', purpose: 'Confirm you start in /home/student.' },
        { command: 'cat README.txt', purpose: 'Read the clue left in your home folder.' },
        { command: 'cd documents/onboarding', purpose: 'Move two levels down in one step.' },
        { command: 'cat note.txt', purpose: 'Read the note and find the code.' },
      ],
      commonMistakes: [
        'Typing "cat documents" on a folder: cat only reads files. Use ls for folders.',
        'Forgetting that names are case-sensitive: Note.txt and note.txt are different files on Linux.',
        'Getting lost: run pwd to check where you are, or "cd" with no argument to go home.',
      ],
      realWorld: 'During incident response, analysts constantly navigate unfamiliar servers to find configuration files, logs and evidence. Fast, confident navigation saves time when it matters.',
    },
  },
  {
    id: 'linux-hidden-files',
    moduleId: 'linux-basics',
    order: 2,
    title: 'Hidden Files',
    difficulty: 'beginner',
    scenario:
      'A developer is about to publish the "webapp" project folder to a public code repository. Your team lead asks you to check it first: developers sometimes leave secrets in configuration files that are easy to miss.',
    objective: 'Find the secret hidden in the webapp folder and report the leaked database password.',
    instructions: [
      'Use the terminal to look inside the webapp folder.',
      'Remember that a normal "ls" does not show every file.',
      'Read any file that looks like it might contain configuration.',
      'Submit the database password you find.',
    ],
    resources: [
      { title: 'Hidden files', body: 'On Linux, a file whose name starts with "." is hidden from a normal directory listing.' },
      { title: 'ls -a', body: 'The -a ("all") option makes ls show hidden files as well.' },
      { title: '.env files', body: 'Applications often read settings, including passwords and API keys, from a file called .env.' },
    ],
    answer: { type: 'text', accepted: ['Pa55-Lab-Only'] },
    terminalEnv: 'linux-hidden',
    hints: [
      'Run "ls" inside webapp, then run "ls -a" and compare the two lists.',
      'One hidden file is a backup of the application\'s environment settings.',
      'Run "cat webapp/.env.backup" from your home folder and look at the DB_PASSWORD line.',
    ],
    explanation: {
      solution: 'The leaked password is Pa55-Lab-Only, in the hidden file webapp/.env.backup.',
      why: 'The project correctly ignores ".env" in .gitignore, but a backup copy named ".env.backup" does not match that rule, so it would have been published. It is hidden, so a normal "ls" does not reveal it.',
      concept: 'Hidden files are a convenience, not a security feature: anyone who lists with -a can see them. Secrets belong in a secret manager or in environment variables, never in files that might be shared.',
      commands: [
        { command: 'ls webapp', purpose: 'Shows only the visible files.' },
        { command: 'ls -a webapp', purpose: 'Shows hidden files too, including .env.backup and .gitignore.' },
        { command: 'cat webapp/.env.backup', purpose: 'Reads the leaked settings.' },
      ],
      commonMistakes: [
        'Stopping after a normal "ls" and concluding the folder is safe.',
        'Assuming .gitignore protects every copy of a secret: it only matches the exact patterns it lists.',
        'Submitting the whole line (DB_PASSWORD=...) instead of only the password value.',
      ],
      realWorld: 'Leaked .env files and credentials in public repositories are a leading cause of cloud account takeovers. Attackers continuously scan public code hosting sites for exactly these files; the fix is to rotate (change) any leaked secret immediately.',
    },
  },
]
