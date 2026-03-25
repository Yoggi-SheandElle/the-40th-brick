// Personal puzzles for Ante. Difficulty tiers:
// Level 1-10: Anyone who knows her casually could solve (LEGO career facts)
// Level 11-20: Close friends only (personal details, pets, habits)
// Level 21-30: Best friends / family (deep memories, inside jokes)
// Level 31-40: Only Ante herself (things only she would know)

const PERSONAL_PUZZLES = {

  // ===== TIER 1: PUBLIC KNOWLEDGE (Rooms 1-10) =====
  tier1: [
    {
      type: 'trivia',
      question: 'What country did Ante grow up in before moving to Denmark?',
      answer: 'croatia',
      hint: 'A beautiful Adriatic coast country',
      reward: '🧱'
    },
    {
      type: 'trivia',
      question: 'In what year did Ante join the LEGO Group?',
      answer: '2016',
      hint: 'After 7 years as a fan builder',
      reward: '⭐'
    },
    {
      type: 'trivia',
      question: 'How many LEGO sets has Ante designed?',
      answer: '57',
      hint: 'More than fifty',
      reward: '🏆'
    },
    {
      type: 'trivia',
      question: 'Which LEGO theme did Ante spend her first 5 years on?',
      answer: 'friends',
      hint: 'A theme about five best friends in Heartlake City',
      reward: '💜'
    },
    {
      type: 'trivia',
      question: 'What iconic movie house did Ante co-design as a 3,955-piece set?',
      answer: 'home alone',
      hint: 'Kevin McCallister lives here',
      reward: '🏠'
    },
    {
      type: 'word_unscramble',
      scrambled: 'DABRU-RU',
      answer: 'barad-dur',
      hint: "Sauron's Dark Tower. 5,471 pieces.",
      reward: '🗼'
    },
    {
      type: 'trivia',
      question: "What Leonardo da Vinci invention did Ante build as a LEGO Icons set where 'the whole model is one big function'?",
      answer: 'flying machine',
      hint: 'It has wings and was sketched in the 1400s',
      reward: '✈️'
    },
    {
      type: 'trivia',
      question: 'Which LEGO theme does Ante currently work on?',
      answer: 'icons',
      hint: 'Premium adult-focused theme for display builds',
      reward: '👑'
    },
    {
      type: 'trivia',
      question: "Ante watches movies from this trilogy 'every few months.' Name the trilogy.",
      answer: 'lord of the rings',
      hint: 'One ring to rule them all',
      reward: '💍'
    },
    {
      type: 'number_puzzle',
      question: 'How many years was Ante an AFOL (Adult Fan of LEGO) before joining the company?',
      answer: '7',
      hint: 'From 2009 to 2016',
      reward: '🎯'
    }
  ],

  // ===== TIER 2: CLOSE FRIENDS (Rooms 11-20) =====
  tier2: [
    {
      type: 'trivia',
      question: "What is the name of Ante's white dog?",
      answer: 'dori',
      hint: "She's the older one, 14 years old",
      reward: '🐕'
    },
    {
      type: 'trivia',
      question: "What is the name of Ante's black dog?",
      answer: 'pino',
      hint: "He's the younger one, 4 years old",
      reward: '🐕‍🦺'
    },
    {
      type: 'trivia',
      question: 'What musical instrument does Ante play a little?',
      answer: 'piano',
      hint: 'Black and white keys',
      reward: '🎹'
    },
    {
      type: 'trivia',
      question: 'What other instrument does Ante dabble in?',
      answer: 'drums',
      hint: 'You hit them with sticks',
      reward: '🥁'
    },
    {
      type: 'trivia',
      question: 'What does Ante love to do while driving?',
      answer: 'yell at drivers',
      hint: "She has strong opinions about other people's driving",
      reward: '🚗'
    },
    {
      type: 'trivia',
      question: 'What type of chocolate does Ante especially love around Easter?',
      answer: 'easter bunnies',
      hint: 'Chocolate shaped like a spring animal',
      reward: '🐰'
    },
    {
      type: 'trivia',
      question: "What is Ante's love language?",
      answer: 'gifts',
      hint: 'She pampers her close people with thoughtful presents and gestures',
      reward: '🎁'
    },
    {
      type: 'trivia',
      question: "What fantasy world did Ante 'build from imagination' because there was no visual reference?",
      answer: 'barad-dur',
      hint: "The interior of Sauron's tower was never shown in the movies or books",
      reward: '🌋'
    },
    {
      type: 'trivia',
      question: 'What does Ante like to do that fills the room with melody?',
      answer: 'sing',
      hint: 'Using her voice, not an instrument',
      reward: '🎤'
    },
    {
      type: 'word_unscramble',
      scrambled: 'RNCUOESPIY',
      answer: 'neurospicy',
      hint: 'A fun way to describe a brain that never stops creating',
      reward: '🌶️'
    }
  ],

  // ===== TIER 3: BEST FRIENDS (Rooms 21-30) =====
  tier3: [
    {
      type: 'trivia',
      question: 'How old is Dori?',
      answer: '14',
      hint: 'A very good old girl',
      reward: '🦴'
    },
    {
      type: 'trivia',
      question: 'How old is Pino?',
      answer: '4',
      hint: 'Still a young energetic boy',
      reward: '🎾'
    },
    {
      type: 'trivia',
      question: 'What did Ante hide in the foundations of the Table Football set?',
      answer: 'heartlake city postcard',
      hint: 'A tribute to where she spent 5 years designing',
      reward: '💌'
    },
    {
      type: 'trivia',
      question: 'What wizard school would Ante attend if she could?',
      answer: 'hogwarts',
      hint: 'She loves this particular magical universe',
      reward: '⚡'
    },
    {
      type: 'trivia',
      question: 'What small creature is Bilbo Baggins called in the story Ante loves?',
      answer: 'hobbit',
      hint: 'Lives in a hole in the ground. Not a nasty, dirty, wet hole.',
      reward: '🧙'
    },
    {
      type: 'cipher',
      encrypted: 'GSVIV DZH ML IVUVIVMXV',
      answer: 'there was no reference',
      hint: "Atbash cipher. Ante's most iconic design quote about Barad-dur's interior.",
      reward: '🔐'
    },
    {
      type: 'math',
      question: 'Home Alone pieces (3,955) minus Table Football pieces (2,339) = ?',
      answer: '1616',
      hint: 'Subtract and check the year she joined LEGO',
      reward: '🧮'
    },
    {
      type: 'trivia',
      question: "What does Ante describe as the 'spirit' that the Table Football set harnesses?",
      answer: 'sport',
      hint: 'Competition, teamwork, energy',
      reward: '⚽'
    },
    {
      type: 'pattern',
      sequence: ['Friends', 'Ideas', 'Icons', '?'],
      answer: 'the future',
      hint: "What comes after her current theme? Only she knows.",
      reward: '🔮'
    },
    {
      type: 'trivia',
      question: 'What is the style of humor that makes Ante laugh the most?',
      answer: 'silly',
      hint: 'hihihi kind of funny',
      reward: '😂'
    }
  ],

  // ===== TIER 4: ONLY ANTE (Rooms 31-40) =====
  tier4: [
    {
      type: 'trivia',
      question: 'What color is Dori?',
      answer: 'white',
      hint: 'Think snow',
      reward: '⬜'
    },
    {
      type: 'trivia',
      question: 'What color is Pino?',
      answer: 'black',
      hint: 'The opposite of Dori',
      reward: '⬛'
    },
    {
      type: 'locked',
      message: 'This room requires you to play a melody on the piano. Press the keys in the right order.',
      notes: ['C', 'E', 'G', 'C', 'E', 'G', 'C'],
      hint: 'Happy Birthday, first 7 notes',
      reward: '🎵'
    },
    {
      type: 'trivia',
      question: 'What is the total number of pieces across Home Alone + Table Football + Barad-dur? (no calculator allowed)',
      answer: '11765',
      hint: '3,955 + 2,339 + 5,471',
      reward: '🧱'
    },
    {
      type: 'essay',
      question: 'Write one thing you appreciate about yourself as a designer.',
      validation: 'any',
      hint: 'There is no wrong answer here. Just be honest.',
      reward: '💎'
    },
    {
      type: 'countdown_puzzle',
      question: 'How many days until April 17th?',
      answer: 'dynamic',
      hint: 'Count from today',
      reward: '🎂'
    },
    {
      type: 'trivia',
      question: 'In the Harry Potter universe, what object shows you your deepest desire?',
      answer: 'mirror of erised',
      hint: 'Erised is desire spelled backwards',
      reward: '🪞'
    },
    {
      type: 'cipher',
      encrypted: '01011001 01101111 01110101 00100000 01100001 01110010 01100101 00100000 01101100 01101111 01110110 01100101 01100100',
      answer: 'you are loved',
      hint: 'Binary. Convert each byte to a letter.',
      reward: '❤️'
    },
    {
      type: 'final_question',
      question: "Complete this sentence: 'There was no reference.' But Ante built it anyway, because...",
      answer: 'any',
      hint: "The answer is yours. No one else can answer this for you.",
      reward: '🏰'
    },
    {
      type: 'birthday_reveal',
      message: "Room 40. The final brick. Happy 40th Birthday, Ante. From Croatia to Billund. From fan to Design Master. 57 sets and counting. You spoke your mind and the right people heard it. Dori and Pino are proud. This game was built for you. Every brick counts.",
      reward: '🎉🎂🧱'
    }
  ]
};

// Chocolate rewards for passing rooms
const CHOCOLATE_REWARDS = [
  'You earned a chocolate bunny! 🐰🍫',
  'Ante would approve: chocolate reward unlocked! 🍫',
  'Sweet. Literally. 🍫',
  'Easter bunny delivered! 🐰',
  'Chocolate break. You earned it. 🍫'
];

function getChocolateReward() {
  return CHOCOLATE_REWARDS[Math.floor(Math.random() * CHOCOLATE_REWARDS.length)];
}
