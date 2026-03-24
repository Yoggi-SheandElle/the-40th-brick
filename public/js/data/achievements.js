const ACHIEVEMENTS = [
  {
    id: 'first_brick',
    title: 'The First Brick',
    year: 2009,
    description: 'Discovered LEGO as an adult in Croatia. Became an AFOL and never looked back.',
    quote: '"I love exploring architecture, shapes and layouts."',
    quoteSource: 'Brickset Designer Insight',
    icon: 'brick',
    color: LEGO_COLORS.RED
  },
  {
    id: 'golden_brick',
    title: 'The Golden Brick',
    year: 2016,
    description: 'After 7 years as a fan, joined the LEGO Group in Billund, Denmark. Dream achieved.',
    quote: null,
    icon: 'star',
    color: LEGO_COLORS.YELLOW
  },
  {
    id: 'heartlake_era',
    title: 'Heartlake Era',
    year: '2016-2021',
    description: 'Designed 30+ LEGO Friends sets over 5 years. Built an entire city brick by brick.',
    quote: '"I wanted to do a corner building with a shop downstairs and a small, cozy personal space upstairs."',
    quoteSource: 'On Emma\'s Fashion Shop',
    icon: 'heart',
    color: LEGO_COLORS.BRIGHT_PINK
  },
  {
    id: 'kevins_architect',
    title: "Kevin's Architect",
    year: 2021,
    description: 'Co-designed the iconic Home Alone McCallister House. 3,955 pieces of movie magic.',
    quote: '"We decided upon the bathroom because that is where Kevin\'s famous scream takes place."',
    quoteSource: 'Brickset Interview',
    icon: 'house',
    color: LEGO_COLORS.RED
  },
  {
    id: 'grand_designer',
    title: 'The Grand Designer',
    year: 2021,
    description: 'Heartlake City Grand Hotel - 1,308 pieces. Her biggest Friends set.',
    quote: '"There are some compromises where we would love to show more, but we cannot always do so."',
    quoteSource: 'Brickset Interview',
    icon: 'hotel',
    color: LEGO_COLORS.MEDIUM_LAVENDER
  },
  {
    id: 'game_master',
    title: 'Game Master',
    year: 2022,
    description: 'Table Football set - hid a Heartlake City postcard in the foundations as a secret easter egg.',
    quote: '"It harnesses the spirit of sport."',
    quoteSource: 'On Table Football',
    icon: 'trophy',
    color: LEGO_COLORS.GREEN
  },
  {
    id: 'treehouse_builder',
    title: 'The Treehouse',
    year: 2022,
    description: 'Friendship Tree House - 1,114 pieces. Built friendship into every branch.',
    quote: null,
    icon: 'tree',
    color: LEGO_COLORS.GREEN
  },
  {
    id: 'mountain_summit',
    title: 'Mountain Summit',
    year: 2023,
    description: 'Alpine Lodge - her LEGO Icons debut. Co-designed with Chris McVeigh.',
    quote: null,
    icon: 'mountain',
    color: LEGO_COLORS.BLUE
  },
  {
    id: 'dark_lords_architect',
    title: "The Dark Lord's Architect",
    year: 2024,
    description: 'Barad-dur - 5,471 pieces. The tower whose interior was never seen in movies or books.',
    quote: '"There was no reference. We thought Sauron has been around for thousands of years, so he has books containing all his knowledge and magic."',
    quoteSource: 'Brick Fanatics Interview',
    icon: 'tower',
    color: LEGO_COLORS.BLACK
  },
  {
    id: 'the_inventor',
    title: 'The Inventor',
    year: 2024,
    description: "Leonardo da Vinci's Flying Machine - the whole model is one big function.",
    quote: '"It doesn\'t look like it, but it was a really challenging model, and also really fun to work on, because the whole model is basically one big function."',
    quoteSource: 'New Elementary Interview',
    icon: 'gear',
    color: LEGO_COLORS.TAN
  },
  {
    id: 'design_master',
    title: 'Design Master',
    year: 2025,
    description: 'Promoted to Design Master. Sherlock Holmes Book Nook - her brainchild.',
    quote: '"My favourite challenge was to calculate where the string had to be; you know, tight but not too tight?"',
    quoteSource: 'On the Flying Machine',
    icon: 'crown',
    color: LEGO_COLORS.YELLOW
  },
  {
    id: 'lotr_superfan',
    title: 'LOTR Superfan',
    year: 2024,
    description: 'Watches the Lord of the Rings movies every few months. Built the Dark Tower from imagination.',
    quote: '"I am someone who loves the movies so much that I watch them every few months!"',
    quoteSource: 'LEGO.com Interview',
    icon: 'ring',
    color: LEGO_COLORS.YELLOW
  },
  {
    id: 'easter_egg_queen',
    title: 'Easter Egg Queen',
    year: 'Always',
    description: 'Hides personal tributes in every set - colleague paintings on walls, postcards in foundations.',
    quote: null,
    icon: 'egg',
    color: LEGO_COLORS.ORANGE
  },
  {
    id: 'room_46',
    title: 'Room 46',
    year: 2026,
    description: 'Happy 40th Birthday, Ante! From Croatia to Billund, from fan to Design Master. This is your story.',
    quote: 'Designed by Yossi, for Ante. Every brick counts.',
    icon: 'cake',
    color: LEGO_COLORS.BRIGHT_PINK
  }
];

// Achievements unlocked per chapter completion
const CHAPTER_ACHIEVEMENTS = {
  1: ['first_brick', 'golden_brick', 'heartlake_era'],
  2: ['kevins_architect', 'grand_designer', 'game_master'],
  3: ['dark_lords_architect', 'the_inventor', 'lotr_superfan'],
  4: ['design_master', 'easter_egg_queen', 'room_46']
};
