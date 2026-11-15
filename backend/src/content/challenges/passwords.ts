import type { ChallengeContent } from '../types.js'

export const passwordChallenges: ChallengeContent[] = [
  {
    id: 'passwords-strongest',
    moduleId: 'passwords',
    order: 1,
    title: 'Choose the Strongest Password',
    difficulty: 'beginner',
    scenario:
      'Your friend is creating a password for their email account and asks you to pick the strongest of four candidates. Their email is the key to resetting every other account they own.',
    objective: 'Pick the password that would be hardest for an attacker to guess or crack.',
    instructions: [
      'Think about how attackers guess passwords: they start with leaked passwords and common patterns.',
      'Compare the length of each candidate and how predictable it is.',
      'Choose the strongest option.',
    ],
    resources: [
      { title: 'Dictionary attacks', body: 'Attackers try lists of real leaked passwords and common variations (adding years, swapping letters for symbols) before anything else.' },
      { title: 'Length matters most', body: 'Each extra character multiplies the number of possibilities, so long passwords are much harder to brute-force.' },
      { title: 'Passphrases', body: 'Several unrelated random words form a long, memorable password.' },
    ],
    answer: {
      type: 'choice',
      options: [
        { id: 'a', text: 'P@ssw0rd!' },
        { id: 'b', text: 'Summer2024' },
        { id: 'c', text: 'violin-oatmeal-harbor-lantern-91' },
        { id: 'd', text: 'Qw3rty!!' },
      ],
      correct: 'c',
    },
    hints: [
      'Three of the options follow patterns that appear in leaked-password lists.',
      '"P@ssw0rd!" is "Password!" with predictable substitutions; "Qw3rty" is a keyboard pattern; "Summer2024" is a season plus a year.',
      'Pick the longest option made of unrelated random words.',
    ],
    explanation: {
      solution: 'violin-oatmeal-harbor-lantern-91.',
      why: 'At 32 characters made of unrelated words, it is far longer than the others and does not follow a common pattern. The other three are short and match patterns attackers try first.',
      concept: 'Strength comes from length and unpredictability. Symbol substitutions such as @ for a and 0 for o are well known to cracking tools, so they add little.',
      commands: [],
      commonMistakes: [
        'Believing complexity rules (symbols, digits) beat length. A short "complex" password is still weak.',
        'Using personal or seasonal information (names, birthdays, years) that can be guessed.',
        'Reusing a strong password on several sites: one breach exposes all of them.',
      ],
      realWorld: 'Modern guidance (such as NIST SP 800-63B) recommends long passwords or passphrases, checking new passwords against breach lists, using a password manager, and enabling multi-factor authentication.',
    },
  },
  {
    id: 'passwords-policy-audit',
    moduleId: 'passwords',
    order: 2,
    title: 'Audit Admin Accounts for MFA',
    difficulty: 'intermediate',
    scenario:
      'You are helping with a security audit. The IT team exported a list of accounts with their role, MFA status and the date each password was last changed. Company policy says every administrator must use multi-factor authentication.',
    objective: 'Find the administrator account that breaks the MFA policy.',
    instructions: [
      'Read the policy in audit/policy.txt.',
      'Use grep to show only the administrator accounts in audit/accounts.txt.',
      'Check the MFA column of each administrator.',
      'Submit the username of the administrator without MFA.',
    ],
    resources: [
      { title: 'grep', body: 'Prints only the lines of a file that contain a pattern, e.g. grep admin audit/accounts.txt.' },
      { title: 'grep -i', body: 'Makes the search case-insensitive.' },
      { title: 'MFA', body: 'Multi-factor authentication: a second proof of identity in addition to the password.' },
    ],
    answer: { type: 'text', accepted: ['rkhan'] },
    terminalEnv: 'password-audit',
    hints: [
      'Run "cat audit/policy.txt" to read rule 2.',
      'Run "grep admin audit/accounts.txt" to see only the administrators.',
      'Of the three administrators, one has "no" in the mfa column. Submit that username.',
    ],
    explanation: {
      solution: 'rkhan is an administrator with mfa=no (and a password unchanged since 2024).',
      why: 'grep admin shows bnair, rkhan and tjoseph. Only rkhan has "no" in the MFA column, which breaks policy rule 2. The 2024 password date also breaks rule 1.',
      concept: 'Auditing means comparing real configuration against a written policy. Filtering with grep turns a long list into the handful of lines that matter.',
      commands: [
        { command: 'cat audit/policy.txt', purpose: 'Read the rules you are checking.' },
        { command: 'grep admin audit/accounts.txt', purpose: 'Show only administrator accounts.' },
        { command: 'grep no audit/accounts.txt', purpose: 'An alternative view: every account without MFA (rkhan is the only admin).' },
      ],
      commonMistakes: [
        'Reporting cmehta or vrao: they lack MFA but are staff, and the rule covers administrators.',
        'Reading the whole file by eye in a real audit with thousands of rows. Filtering is faster and less error-prone.',
      ],
      realWorld: 'Many major breaches began with a stolen administrator password on an account without MFA. Auditors routinely run exactly this check, and some regulations require MFA for privileged access.',
    },
  },
]
