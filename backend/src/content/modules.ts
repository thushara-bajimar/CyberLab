import type { ModuleContent } from './types.js'

export const modules: ModuleContent[] = [
  {
    id: 'fundamentals',
    order: 1,
    title: 'Cybersecurity Fundamentals',
    difficulty: 'beginner',
    summary: 'The core ideas every security decision is built on: the CIA triad and least privilege.',
    introduction:
      'Before learning tools, it helps to know what security is trying to protect. Every attack, defence and policy in this course can be described with a few basic ideas.',
    concept:
      'The CIA triad describes three properties of information. Confidentiality means only authorised people can read it. Integrity means it has not been changed without permission. Availability means it can be used when it is needed.\n\nLeast privilege means giving every person and program only the access they need for their task, and no more. If an account is compromised, the damage is limited to what that account could do.',
    objectives: [
      'Explain confidentiality, integrity and availability with real examples.',
      'Identify which CIA property an incident affects.',
      'Apply the principle of least privilege to an access request.',
    ],
  },
  {
    id: 'linux-basics',
    order: 2,
    title: 'Linux & Command-Line Basics',
    difficulty: 'beginner',
    summary: 'Move around a Linux system, list files (including hidden ones) and read their contents.',
    introduction:
      'Most servers on the internet run Linux, and security analysts work on them through a command line. Being able to find and read files quickly is the first practical skill you need.',
    concept:
      'A Linux filesystem is a tree that starts at the root directory "/". Your home directory, such as /home/student, is where you usually start. A path that begins with "/" is absolute; any other path is relative to your current directory, and ".." means "one level up".\n\nFiles whose names start with a dot (for example .env) are hidden: "ls" does not show them unless you add the -a option. Configuration files and secrets are often stored in hidden files.',
    objectives: [
      'Use pwd, ls, cd and cat to navigate and read files.',
      'Understand absolute and relative paths.',
      'Reveal hidden files with ls -a and explain why they matter for security.',
    ],
  },
  {
    id: 'networking',
    order: 3,
    title: 'Networking Fundamentals',
    difficulty: 'beginner',
    summary: 'Read your own network configuration and test whether other machines are reachable.',
    introduction:
      'Every attack or investigation that crosses a network involves addresses. Knowing your IP address, your gateway and how to test connectivity is the starting point for troubleshooting and for spotting unusual traffic.',
    concept:
      'An IP address identifies a device on a network. Addresses such as 192.168.x.x and 10.x.x.x are private: they are used inside homes and organisations and are not reachable directly from the internet. The default gateway is the router that forwards your traffic to other networks.\n\nThe ping command sends small "echo request" messages to another host. If the host answers, it is reachable; if every request times out, the host may be down, disconnected, or blocking ping.',
    objectives: [
      'Find a computer\'s IP address, subnet mask, gateway and DNS server.',
      'Explain what a default gateway does.',
      'Use ping results to decide whether a host is reachable.',
    ],
  },
  {
    id: 'passwords',
    order: 4,
    title: 'Password Security',
    difficulty: 'beginner',
    summary: 'What makes a password strong, and how organisations check that accounts are protected.',
    introduction:
      'Stolen and guessed passwords are one of the most common ways attackers get in. Strong passwords and multi-factor authentication (MFA) stop a large share of these attacks.',
    concept:
      'Password strength mostly comes from length and unpredictability. Attackers try leaked passwords and common patterns first ("Summer2024", "P@ssw0rd"), so replacing letters with symbols adds little. A passphrase of several random words is long, hard to guess and easy to remember.\n\nMulti-factor authentication requires a second proof of identity, such as a code from an app. Even if a password is stolen, the attacker cannot sign in without the second factor. Administrator accounts are the most valuable targets and should always use MFA.',
    objectives: [
      'Compare passwords by length and predictability.',
      'Explain why MFA protects accounts even when passwords leak.',
      'Audit an account list against a security policy.',
    ],
  },
  {
    id: 'cryptography',
    order: 5,
    title: 'Cryptography Basics',
    difficulty: 'beginner',
    summary: 'Tell encoding apart from encryption, and break a classic cipher by hand.',
    introduction:
      'Cryptography protects data by making it unreadable without a key. A common beginner mistake is to treat any unreadable-looking text as "encrypted". Some of it is only encoded, and anyone can reverse it.',
    concept:
      'Encoding changes the format of data so it can be stored or transmitted safely; Base64, for example, turns any bytes into letters, digits, "+" and "/". It uses no key, so anyone can decode it. Encryption uses a secret key; without the key the original text cannot be recovered in practice.\n\nThe Caesar cipher is one of the oldest ciphers: every letter is shifted by the same number of places in the alphabet. With only 25 possible shifts, it can be broken by simply trying them all, which shows why modern encryption needs huge key spaces.',
    objectives: [
      'Distinguish encoding from encryption.',
      'Decode Base64 data with a command-line tool.',
      'Decrypt a Caesar cipher and explain why it is insecure.',
    ],
  },
  {
    id: 'phishing',
    order: 6,
    title: 'Phishing Awareness',
    difficulty: 'beginner',
    summary: 'Read links and email headers the way an attacker hopes you will not.',
    introduction:
      'Phishing tricks people into clicking a link, opening a file or replying with information. Recognising a deceptive link or a forged sender is a skill that protects you every day.',
    concept:
      'The part of a web address that decides who controls the site is the registered domain: the name just before the top-level domain, such as example.com or example.co.uk. Everything to its left is a subdomain chosen by the owner, so "paypal.com.account-verify.co" belongs to account-verify.co, not PayPal.\n\nIn an email, the "From" name and address are easy to forge. Headers such as "Reply-To", "Return-Path" and the SPF/DMARC results in "Authentication-Results" often reveal where the message really came from and where your reply would go.',
    objectives: [
      'Identify the registered domain of any URL.',
      'Read email headers to spot a forged sender.',
      'Explain how Reply-To can redirect a victim\'s answer to an attacker.',
    ],
  },
  {
    id: 'forensics',
    order: 7,
    title: 'Digital Forensics Basics',
    difficulty: 'intermediate',
    summary: 'Investigate a compromised server using its logs and filesystem.',
    introduction:
      'After an incident, investigators reconstruct what happened from the evidence a system leaves behind: log entries, unusual files and timestamps. This module walks you through a small, realistic investigation.',
    concept:
      'Linux records authentication events in /var/log/auth.log. Each SSH login attempt produces a line saying whether the password was accepted or failed, for which user, and from which IP address. Many failures from one address in a short time are the signature of a brute-force attack.\n\nAttackers often leave tools behind, typically in writable locations such as /tmp and in hidden folders. Searching the filesystem for suspicious file types (for example shell scripts, *.sh) and reading them can reveal where stolen data was sent.',
    objectives: [
      'Search a log file with grep to find failed logins.',
      'Identify the source of a brute-force attack.',
      'Use find to locate files left behind by an attacker and read them safely.',
    ],
  },
]
