export interface Objection {
  id: string
  objection: string
  keywords: string[]
  response: string
  proTip: string
}

export const OBJECTIONS: Objection[] = [
  {
    id: 'think-about-it',
    objection: 'I need to think about it.',
    keywords: ['think about it', 'need to think', 'let me think'],
    response:
      'I completely understand… I don\'t make decisions without thinking about it either. On a scale from 1–10, 10 meaning you\'re ready to move forward now and 1 meaning you wouldn\'t do this if it were free — where are you on that scale?',
    proTip:
      '"Thinking about it" isn\'t the real objection. Probe deeper and handle what\'s actually holding them back.',
  },
  {
    id: 'sleep-on-it',
    objection: 'I\'ll sleep on it.',
    keywords: ['sleep on it', 'sleep on', 'let me sleep'],
    response:
      'I completely understand. I tend to get my best sleep after making great decisions. When\'s the last time you tossed and turned all night after making a great decision?',
    proTip: 'Inject humor. The longer they delay, the colder the deal gets.',
  },
  {
    id: 'talk-to-spouse',
    objection: 'I need to talk to my spouse.',
    keywords: ['talk to my spouse', 'spouse', 'partner decision', 'my wife', 'my husband'],
    response:
      'I completely understand! I talk to my spouse before decisions too. Out of curiosity — what will you do if your spouse says no?',
    proTip:
      'The spouse is rarely the true objection. Be ready to pivot to price or product concerns.',
  },
  {
    id: 'going-to-wait',
    objection: 'We\'re going to wait.',
    keywords: ['going to wait', 'let\'s wait', 'wait for', 'wait and see'],
    response:
      'I understand and respect that. But if you\'re like me, waiting on things you enjoy isn\'t easy. You said you liked [feature 1] and [feature 2] — let\'s get this done so you can start enjoying it now.',
    proTip: 'Waiting rarely adds value — it only delays results.',
  },
  {
    id: 'best-price',
    objection: 'Is that your best price?',
    keywords: ['best price', 'lower price', 'can you do better', 'negotiate'],
    response:
      'Yes — our customers appreciate that we give our best price up front. You\'re also getting my personal service to ensure satisfaction.',
    proTip: 'Reinforce service value, not price negotiation.',
  },
  {
    id: 'too-expensive',
    objection: 'It\'s too expensive.',
    keywords: ['too expensive', 'cost too much', 'price too high', 'expensive'],
    response:
      'I understand — when you say "too expensive," do you mean compared to something else or outside your budget?',
    proTip: 'Clarify what "expensive" means — budget, comparison, or perception.',
  },
  {
    id: 'price-higher',
    objection: 'Your price is higher than theirs.',
    keywords: ['price is higher', 'higher than', 'cheaper elsewhere', 'competitors cheaper'],
    response:
      'I get it. Not saying I can, but if our prices were the same — who would you rather work with? Why?',
    proTip: 'Once they articulate why you, use their answer to reinforce value.',
  },
  {
    id: 'keep-what-we-have',
    objection: 'We\'ll keep what we have.',
    keywords: ['keep what we have', 'keep our current', 'stick with what we have'],
    response:
      'I understand. Is that because we\'re more expensive or because I haven\'t demonstrated enough value?',
    proTip: 'Force clarity. Once you know the real concern, you can solve it.',
  },
  {
    id: 'no-long-contract',
    objection: 'I don\'t want a long contract.',
    keywords: ['long contract', 'don\'t want contract', 'no contract', 'contract length'],
    response:
      'Totally understand. Many clients who feel the same pay in full — that way, there\'s no contract or monthly payments. Would that work better for you?',
    proTip: 'Offer flexibility — let them choose between full payment or term.',
  },
  {
    id: 'guarantee',
    objection: 'Do you offer a guarantee?',
    keywords: ['guarantee', 'warranty', 'money back', 'risk free'],
    response:
      'Guarantees are great, but we can\'t guarantee usage. The results depend on how the client uses it. Do you believe you\'ll use our product consistently?',
    proTip:
      'Reframe accountability — success depends on their action.',
  },
  {
    id: 'not-today',
    objection: 'I wasn\'t looking to make a decision today.',
    keywords: ['not looking to', 'wasn\'t planning', 'not today', 'today'],
    response:
      'I understand. But not making a decision is a decision. Which factor is keeping you from moving forward — price, term, or setup fee?',
    proTip: 'Turn indecision into a decision by isolating specifics.',
  },
  {
    id: 'done-it-this-way',
    objection: 'We\'ve done it this way for a long time.',
    keywords: ['done it this way', 'long time', 'always done it', 'traditional way'],
    response:
      'I get it — change is hard. What\'s your favorite thing about how you\'ve been doing it? And if you could change one thing, what would it be?',
    proTip:
      'Get them to identify the pain point themselves — then sell against it.',
  },
  {
    id: 'not-available',
    objection: 'They\'re not available.',
    keywords: ['not available', 'not here', 'not in', 'unavailable'],
    response:
      'Totally understand — this wasn\'t a scheduled call. If I was lucky, when would be the best time to catch them?',
    proTip: 'Politeness + humor often get you a callback opportunity.',
  },
  {
    id: 'not-interested',
    objection: 'I\'m not interested.',
    keywords: ['not interested', 'no interest', 'don\'t care', 'not interested in'],
    response:
      'Completely understand — this is a cold call. We help [industry] do [brief value]. Based on results, might be worth a quick 4 minutes?',
    proTip:
      'Acknowledge disinterest, deliver value fast, and re-engage with curiosity.',
  },
  {
    id: 'send-email',
    objection: 'Just send me an email.',
    keywords: ['send me an email', 'send email', 'email me', 'send it to me'],
    response:
      'Perfect — what\'s the best address? I want to make sure I send something relevant. What would pique your interest most?',
    proTip:
      'Use it to gather contact info and learn what matters before ending the call.',
  },
  {
    id: 'call-back',
    objection: 'Call me back another time.',
    keywords: ['call me back', 'call back', 'call later', 'another time'],
    response:
      'Sure — I\'ve got another call soon anyway. What\'s best — later today or tomorrow? And when I call, what info would you like to hear most?',
    proTip: 'Control the calendar — never leave a callback vague.',
  },
]
