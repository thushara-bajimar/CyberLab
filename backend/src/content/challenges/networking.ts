import type { ChallengeContent } from '../types.js'

export const networkingChallenges: ChallengeContent[] = [
  {
    id: 'networking-gateway',
    moduleId: 'networking',
    order: 1,
    title: 'Find the Default Gateway',
    difficulty: 'beginner',
    scenario:
      'A colleague cannot reach any website from their office computer, but other computers on the same desk work fine. The help desk asks you to read the computer\'s network configuration and report the address of its default gateway so it can be compared with the correct router.',
    objective: 'Display the workstation\'s network configuration and report its default gateway address.',
    instructions: [
      'Use the terminal to display the network configuration with "ipconfig".',
      'Identify the IPv4 address, the subnet mask, the default gateway and the DNS server.',
      'Submit the default gateway address (four numbers separated by dots).',
    ],
    resources: [
      { title: 'IPv4 address', body: 'The address of this computer on the local network, e.g. 192.168.10.42.' },
      { title: 'Default gateway', body: 'The router that forwards traffic to other networks, including the internet.' },
      { title: 'DNS server', body: 'Translates names such as example.com into IP addresses.' },
      { title: 'ipconfig', body: 'Shows network settings on Windows. On Linux the equivalent is "ip addr" (and the older "ifconfig"). This simulation supports ipconfig.' },
    ],
    answer: { type: 'text', accepted: ['192.168.10.1'] },
    terminalEnv: 'network-office',
    hints: [
      'Type "ipconfig" and press Enter.',
      'Look for the line labelled "Default Gateway", not the computer\'s own IPv4 address.',
      'The gateway is usually the first address in the network, ending in .1 here.',
    ],
    explanation: {
      solution: 'The default gateway is 192.168.10.1.',
      why: 'ipconfig lists the gateway explicitly. 192.168.10.42 is the workstation itself and 192.168.10.53 is the DNS server, so neither is the gateway.',
      concept: 'A computer sends traffic for other networks to its default gateway. If the gateway is wrong or unreachable, local devices may work but nothing outside the network does.',
      commands: [{ command: 'ipconfig', purpose: 'Display interface addresses, subnet mask, gateway and DNS servers.' }],
      commonMistakes: [
        'Submitting the computer\'s own IPv4 address instead of the gateway.',
        'Confusing the DNS server with the gateway: they can be the same device, but here they are different.',
      ],
      realWorld: 'Attackers on a local network sometimes impersonate the gateway (ARP spoofing) to intercept traffic. Knowing the legitimate gateway address is the first step in spotting this.',
    },
  },
  {
    id: 'networking-ping',
    moduleId: 'networking',
    order: 2,
    title: 'Which Server Is Down?',
    difficulty: 'beginner',
    scenario:
      'Help-desk ticket #4471 says last night\'s backups failed and one of the office servers is not responding. Your morning checklist in servers.txt lists the servers to check.',
    objective: 'Test each server with ping and identify the one that does not respond.',
    instructions: [
      'Read servers.txt to see the server names.',
      'Ping each server, e.g. "ping fileserver.lab".',
      'Compare the replies: a reachable host answers every request; an unreachable one times out.',
      'Submit the name of the server that does not respond.',
    ],
    resources: [
      { title: 'ping', body: 'Sends ICMP echo requests and waits for replies. Replies show the host is reachable and how long a round trip takes.' },
      { title: 'Request timed out', body: 'No reply arrived. The host may be down, disconnected, or blocking ping with a firewall.' },
      { title: 'Packet loss', body: 'The percentage of requests that got no reply. 100% loss means no reply at all.' },
    ],
    answer: { type: 'text', accepted: ['backup.lab', '10.0.5.30'] },
    terminalEnv: 'network-office',
    hints: [
      'Run "cat servers.txt" to get the three server names.',
      'Ping them one at a time: "ping fileserver.lab", "ping mail.lab", "ping backup.lab".',
      'Look for the server whose ping shows "Request timed out" and 100% packet loss.',
    ],
    explanation: {
      solution: 'backup.lab (10.0.5.30) does not respond.',
      why: 'fileserver.lab and mail.lab return replies with low latency, while every request to backup.lab times out with 100% packet loss. That also explains why the backups failed.',
      concept: 'ping tests basic reachability. A timeout tells you there is a problem but not its cause; the next step is to check the server itself, its cables and any firewall rules.',
      commands: [
        { command: 'cat servers.txt', purpose: 'Get the list of servers to test.' },
        { command: 'ping backup.lab', purpose: 'Shows request timeouts and 100% packet loss.' },
      ],
      commonMistakes: [
        'Concluding a server is down from one lost reply: occasional loss happens on busy networks.',
        'Assuming "no ping" always means "down": many servers block ping on purpose and still run normally.',
      ],
      realWorld: 'Monitoring systems ping critical servers every few seconds and alert when replies stop. Security teams also treat sudden unreachability of security tools (backups, logging) as a possible sign of an attack.',
    },
  },
]
