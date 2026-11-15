import type { ChallengeContent } from '../types.js'

export const forensicsChallenges: ChallengeContent[] = [
  {
    id: 'forensics-brute-force',
    moduleId: 'forensics',
    order: 1,
    title: 'Investigate a Brute-Force Attack',
    difficulty: 'intermediate',
    scenario:
      'The web server web01 sent unusual traffic overnight. You are given a read-only snapshot of the server. Your first task is to find out whether someone broke in through SSH.',
    objective: 'Find the IP address that carried out the password-guessing attack.',
    instructions: [
      'Read case-notes.txt in your home folder.',
      'Look in /var/log for the authentication log.',
      'Use grep to show only the failed login attempts.',
      'Submit the IP address responsible for the brute-force attempts.',
    ],
    resources: [
      { title: '/var/log/auth.log', body: 'Linux records logins here: "Failed password" for wrong passwords and "Accepted password" or "Accepted publickey" for successful logins.' },
      { title: 'grep "PATTERN" FILE', body: 'Shows only matching lines. Quote patterns that contain spaces, e.g. grep "Failed password" /var/log/auth.log.' },
      { title: 'grep -c', body: 'Counts matching lines instead of printing them.' },
      { title: 'Brute force', body: 'Trying many passwords quickly, usually against common usernames such as root and admin.' },
    ],
    answer: { type: 'text', accepted: ['203.0.113.45'] },
    terminalEnv: 'forensics-server',
    hints: [
      'Run "ls /var/log" and then look at auth.log.',
      'Run grep "Failed password" /var/log/auth.log to see only the failures.',
      'One address fails again and again within seconds, trying root, test and admin. Submit that address.',
    ],
    explanation: {
      solution: 'The attack came from 203.0.113.45, which failed 7 times in about 2 minutes and then logged in successfully as admin.',
      why: 'grep "Failed password" shows repeated failures from 203.0.113.45 against several usernames, seconds apart. 192.0.2.15 failed once (priya mistyping her password) and otherwise logs in normally. The line "Accepted password for admin from 203.0.113.45" shows the attack succeeded.',
      concept: 'Log analysis is about patterns: many failures from one source, many usernames, short intervals. Filtering with grep removes noise so the pattern stands out.',
      commands: [
        { command: 'cat /home/analyst/case-notes.txt', purpose: 'Read the case background.' },
        { command: 'grep "Failed password" /var/log/auth.log', purpose: 'Show only failed logins.' },
        { command: 'grep -c 203.0.113.45 /var/log/auth.log', purpose: 'Count all events from the suspicious address.' },
        { command: 'grep Accepted /var/log/auth.log', purpose: 'Check whether any attempt succeeded.' },
      ],
      commonMistakes: [
        'Reporting 192.0.2.15: a single failure followed by successful logins is normal user behaviour.',
        'Stopping after finding the attacker\'s IP without checking for an "Accepted" line. The successful login is the most important finding.',
        'Forgetting the quotes around "Failed password": without them grep treats "password" as a file name.',
      ],
      realWorld: 'Internet-facing SSH servers receive brute-force attempts constantly. Defences include key-based authentication, disabling root login, MFA, and tools such as fail2ban that block addresses after repeated failures.',
    },
  },
  {
    id: 'forensics-find-script',
    moduleId: 'forensics',
    order: 2,
    title: 'Find What the Attacker Left Behind',
    difficulty: 'intermediate',
    scenario:
      'The attacker logged in as admin, and the system log shows a scheduled task running a script at 03:10. Attackers often hide tools in temporary folders. Find the script and work out where the stolen data was sent.',
    objective: 'Locate the attacker\'s script and identify the IP address it uploads data to.',
    instructions: [
      'Use find to list every shell script (*.sh) on the system.',
      'Decide which scripts are legitimate and which one is suspicious (location, hidden folder, comments).',
      'Read the suspicious script with cat. Reading it is safe: nothing in this terminal is executed.',
      'Submit the IP address the script sends data to.',
    ],
    resources: [
      { title: 'find PATH -name PATTERN', body: 'Searches PATH and all sub-folders for names matching PATTERN. "*" matches anything, so "*.sh" matches every shell script.' },
      { title: 'Hidden folders', body: 'Folders starting with "." are hidden from a normal ls; attackers use them to avoid casual inspection.' },
      { title: '/tmp', body: 'A temporary folder every user can write to, which makes it a common place to drop attack tools.' },
      { title: 'Exfiltration', body: 'Copying data out of an organisation without permission, often by uploading it to an attacker-controlled server.' },
    ],
    answer: { type: 'text', accepted: ['198.51.100.23'] },
    terminalEnv: 'forensics-server',
    hints: [
      'Run find / -name "*.sh" to list every shell script.',
      'Two scripts have comments explaining an approved purpose. The third sits in a hidden folder under /tmp.',
      'Run "cat /tmp/.cache/sync.sh" and look at the address in the curl command.',
    ],
    explanation: {
      solution: 'The script /tmp/.cache/sync.sh uploads an archive of /home/admin/documents to 198.51.100.23.',
      why: 'find lists three scripts. backup.sh and start.sh are documented, approved tasks. sync.sh hides in /tmp/.cache, archives the admin\'s documents, uploads them with curl to http://198.51.100.23/upload and deletes the archive to cover its tracks. /var/log/syslog shows it ran at 03:10.',
      concept: 'Investigators combine clues: the log showed when and how the attacker got in; the filesystem shows what they did afterwards. Reading a suspicious script is safe; running it is not.',
      commands: [
        { command: 'find / -name "*.sh"', purpose: 'List all shell scripts on the system.' },
        { command: 'ls -a /tmp', purpose: 'Reveal the hidden .cache folder.' },
        { command: 'cat /tmp/.cache/sync.sh', purpose: 'Read the attacker\'s script.' },
        { command: 'cat /var/log/syslog', purpose: 'Confirm when the script was scheduled to run.' },
      ],
      commonMistakes: [
        'Flagging backup.sh just because it creates an archive: its comment, location and ticket number show it is approved.',
        'Running or "testing" a suspicious script on a real system. Always analyse it as text, ideally on an isolated copy.',
        'Submitting the file path instead of the destination IP address.',
      ],
      realWorld: 'This pattern, a hidden script in a temporary folder plus a scheduled task that uploads data, is typical of real intrusions. The next steps would be blocking 198.51.100.23, removing the scheduled task, resetting the admin password and notifying the affected clients.',
    },
  },
]
