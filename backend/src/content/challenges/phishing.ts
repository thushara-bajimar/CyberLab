import type { ChallengeContent } from '../types.js'

export const phishingChallenges: ChallengeContent[] = [
  {
    id: 'phishing-real-domain',
    moduleId: 'phishing',
    order: 1,
    title: 'Who Really Owns This Link?',
    difficulty: 'beginner',
    scenario:
      'You receive a text message: "Your PayPal account is limited. Verify now: https://paypal.com.account-verify.co/login". The link starts with "paypal.com", so it looks genuine at first glance.',
    objective: 'Identify the registered domain that actually controls this link.',
    instructions: [
      'Remove the scheme (https://) and the path (/login) to isolate the hostname.',
      'Read the hostname from right to left, starting with the top-level domain.',
      'The registered domain is the label just before the top-level domain, plus that top-level domain.',
      'Submit the registered domain.',
    ],
    resources: [
      { title: 'Hostname', body: 'The part between "://" and the next "/": here paypal.com.account-verify.co.' },
      { title: 'Top-level domain (TLD)', body: 'The last label, such as .com, .org or .co. Some TLDs have two parts, such as .co.uk.' },
      { title: 'Registered domain', body: 'The name someone bought from a registrar, e.g. example.com. Whoever owns it can create any subdomain, including "paypal.com.".' },
    ],
    answer: { type: 'text', accepted: ['account-verify.co'] },
    hints: [
      'The hostname is everything between "https://" and "/login".',
      'Read from the right: the TLD is ".co". What comes just before it?',
      'The words "paypal.com." on the left are only subdomain labels chosen by the owner of account-verify.co.',
    ],
    explanation: {
      solution: 'The registered domain is account-verify.co.',
      why: 'In the hostname paypal.com.account-verify.co, the TLD is .co and the label before it is account-verify. "paypal" and "com" are subdomains that the owner of account-verify.co created to look trustworthy.',
      concept: 'Domains are read from right to left. Only the registered domain tells you who controls a site; anything to its left can be chosen freely by that owner.',
      commands: [],
      commonMistakes: [
        'Reading from the left and stopping at the first familiar brand name.',
        'Trusting the padlock (HTTPS): attackers get certificates for their own domains easily.',
        'Answering "paypal.com", which is exactly what the attacker hopes you will see.',
      ],
      realWorld: 'This "brand as subdomain" trick is one of the most common phishing techniques. Password managers help because they only fill in passwords on the real domain they were saved for.',
    },
  },
  {
    id: 'phishing-email-headers',
    moduleId: 'phishing',
    order: 2,
    title: 'Read the Email Headers',
    difficulty: 'intermediate',
    scenario:
      'A message in your mailbox claims to be from "Microsoft 365 Billing" and asks you to reply with your card details. The From address shows no-reply@microsoft.com. Your mail client has exported the raw message so you can inspect it.',
    objective: 'Find out where a reply to this message would actually be sent.',
    instructions: [
      'Go to the mail folder and list the exported messages.',
      'Read the raw headers of invoice_alert.eml with cat.',
      'Compare the From, Reply-To and Return-Path headers, and read the Authentication-Results line.',
      'Submit the email address that would receive your reply.',
    ],
    resources: [
      { title: 'From', body: 'The sender shown by your mail app. It is easy to forge.' },
      { title: 'Reply-To', body: 'If present, the address your reply goes to, even if From shows someone else.' },
      { title: 'SPF / DMARC', body: 'Checks of whether the sending server is allowed to send for that domain. "fail" is a strong warning sign.' },
      { title: 'grep', body: 'Use "grep Reply-To mail/invoice_alert.eml" to show one header line.' },
    ],
    answer: { type: 'text', accepted: ['billing@micros0ft-support.net'] },
    terminalEnv: 'phishing-mailbox',
    hints: [
      'Run "ls mail" and then "cat mail/invoice_alert.eml".',
      'One header decides where replies go, regardless of the From line.',
      'Look at the Reply-To header. Notice the zero in "micros0ft".',
    ],
    explanation: {
      solution: 'Replies go to billing@micros0ft-support.net (with a zero instead of the letter "o").',
      why: 'The Reply-To header overrides the forged From address. The headers also show the real origin: Return-Path and Received both point to micros0ft-support.net, and Authentication-Results reports spf=fail and dmarc=fail for the claimed microsoft.com sender.',
      concept: 'Display names and From addresses are not authenticated by default. SPF, DKIM and DMARC let receiving servers check whether a message really came from the domain it claims.',
      commands: [
        { command: 'cat mail/invoice_alert.eml', purpose: 'Show the full raw message with headers.' },
        { command: 'grep Reply-To mail/invoice_alert.eml', purpose: 'Show only the Reply-To header.' },
        { command: 'grep Authentication-Results mail/invoice_alert.eml', purpose: 'Show the SPF and DMARC results.' },
      ],
      commonMistakes: [
        'Trusting the From line because it shows the real microsoft.com domain.',
        'Missing the lookalike spelling (zero instead of "o").',
        'Comparing with library_notice.eml is useful: its SPF and DMARC pass and it has no Reply-To trick.',
      ],
      realWorld: 'Business email compromise (BEC) scams use exactly this Reply-To trick to divert payments, and cause larger financial losses than most other cybercrime. Checking headers before acting on payment requests prevents it.',
    },
  },
]
