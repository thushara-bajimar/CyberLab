import { cryptographyChallenges } from './challenges/cryptography.js'
import { forensicsChallenges } from './challenges/forensics.js'
import { fundamentalsChallenges } from './challenges/fundamentals.js'
import { linuxChallenges } from './challenges/linux.js'
import { networkingChallenges } from './challenges/networking.js'
import { passwordChallenges } from './challenges/passwords.js'
import { phishingChallenges } from './challenges/phishing.js'
import { environments } from './environments.js'
import { modules } from './modules.js'
import type { ChallengeContent } from './types.js'

export const challenges: ChallengeContent[] = [
  ...fundamentalsChallenges,
  ...linuxChallenges,
  ...networkingChallenges,
  ...passwordChallenges,
  ...cryptographyChallenges,
  ...phishingChallenges,
  ...forensicsChallenges,
]

export { environments, modules }
