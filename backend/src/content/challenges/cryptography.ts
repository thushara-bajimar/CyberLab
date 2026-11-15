import type { ChallengeContent } from '../types.js'

export const cryptographyChallenges: ChallengeContent[] = [
  {
    id: 'crypto-base64',
    moduleId: 'cryptography',
    order: 1,
    title: 'Encoding Is Not Encryption',
    difficulty: 'beginner',
    scenario:
      'An application\'s config file proudly states that the database password is "stored encrypted" in a separate file. A quick look at that file shows a short string of letters and digits.',
    objective: 'Find out whether the password is really encrypted, and recover it.',
    instructions: [
      'Read app/config.ini and then app/db_password.txt.',
      'Look at the characters used: letters, digits, and possibly "+", "/" or "=" padding at the end.',
      'Try decoding the value with "base64 -d app/db_password.txt".',
      'Submit the recovered password.',
    ],
    resources: [
      { title: 'Base64', body: 'An encoding that represents any data using 64 characters (A-Z, a-z, 0-9, +, /), with "=" as padding. It has no key.' },
      { title: 'base64 -d FILE', body: 'Decodes the Base64 text in FILE and prints the original data.' },
      { title: 'Encoding vs encryption', body: 'Encoding changes format and is reversible by anyone. Encryption needs a secret key to reverse.' },
    ],
    answer: { type: 'text', accepted: ['Orchid-77'] },
    terminalEnv: 'crypto-workbench',
    hints: [
      'The value contains only letters and digits, and its length is a multiple of 4: typical of Base64.',
      'No key is mentioned anywhere. Base64 needs no key to decode.',
      'Run "base64 -d app/db_password.txt".',
    ],
    explanation: {
      solution: 'The value T3JjaGlkLTc3 is Base64 for Orchid-77.',
      why: 'Decoding needed no key, which proves the password was only encoded, not encrypted. Anyone who can read the file can recover the password.',
      concept: 'Encoding (Base64, hex, URL encoding) only changes how data is represented. Encryption (for example AES) transforms data with a secret key. Passwords that an application must use should come from a secret manager; passwords that users log in with should be stored as slow, salted hashes.',
      commands: [
        { command: 'cat app/config.ini', purpose: 'See the claim that the password is encrypted.' },
        { command: 'cat app/db_password.txt', purpose: 'See the encoded value.' },
        { command: 'base64 -d app/db_password.txt', purpose: 'Decode it without any key.' },
      ],
      commonMistakes: [
        'Calling Base64 "encryption" because the text looks unreadable.',
        'Submitting the encoded string instead of the decoded password.',
      ],
      realWorld: 'Security reviews regularly find credentials "protected" with Base64 in config files, scripts and even HTTP Basic authentication headers, which are also just Base64. It provides no confidentiality.',
    },
  },
  {
    id: 'crypto-caesar',
    moduleId: 'cryptography',
    order: 2,
    title: 'Break a Caesar Cipher',
    difficulty: 'intermediate',
    scenario:
      'During a museum escape-room event, players find a note in Julius Caesar\'s display case: "WKH YDXOW FRGH LV ILUHIOB". The organisers say the vault opens with the last word of the decrypted message.',
    objective: 'Decrypt the message and submit the vault code word.',
    instructions: [
      'Every letter has been shifted the same number of places forward in the alphabet.',
      'Find the shift (try small shifts, or guess what a common 3-letter first word could be).',
      'Shift every letter back by that amount to decrypt the message.',
      'Submit the last word of the plaintext.',
    ],
    resources: [
      { title: 'Caesar cipher', body: 'Each letter is replaced by the letter a fixed number of positions later. With a shift of 1, A becomes B and Z wraps to A.' },
      { title: 'Alphabet', body: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z' },
      { title: 'Brute force', body: 'There are only 25 useful shifts, so trying all of them is quick, even by hand.' },
    ],
    answer: { type: 'text', accepted: ['FIREFLY'] },
    hints: [
      'A very common 3-letter English word to start a sentence is "THE".',
      'If WKH means THE, then W -> T, K -> H, H -> E: every letter moved 3 places forward. Caesar himself used a shift of 3.',
      'Shift each letter of ILUHIOB back by 3: I -> F, L -> I, U -> R, H -> E ...',
    ],
    explanation: {
      solution: 'With a shift of 3 the message reads "THE VAULT CODE IS FIREFLY", so the code word is FIREFLY.',
      why: 'Guessing that WKH is "THE" reveals the shift, and applying the same shift to every letter decrypts the whole message.',
      concept: 'The Caesar cipher has only 25 possible keys, so it can be broken by trying them all (brute force) or by spotting common words (frequency analysis). Modern ciphers such as AES use keys with 2^128 or more possibilities, which makes brute force infeasible.',
      commands: [],
      commonMistakes: [
        'Shifting forward instead of backward when decrypting.',
        'Forgetting to wrap around the alphabet (shifting A back by 3 gives X).',
        'Submitting the whole sentence instead of the last word.',
      ],
      realWorld: 'Nobody protects real data with Caesar ciphers, but the same ideas, key space size and recognising patterns in ciphertext, are how cryptographers judge whether a modern algorithm is strong.',
    },
  },
]
