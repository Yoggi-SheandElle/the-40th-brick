// LEGO Official Color Palette
const LEGO_COLORS = {
  RED: '#B40000',
  BLUE: '#0055BF',
  YELLOW: '#F2CD37',
  GREEN: '#237841',
  ORANGE: '#A83D15',
  WHITE: '#FFFFFF',
  BLACK: '#1B2A34',
  GREY: '#A0A5A9',
  DARK_GREY: '#6D6E5C',
  BRIGHT_PINK: '#E4ADC8',
  MEDIUM_LAVENDER: '#AC78BA',
  BRIGHT_LIGHT_BLUE: '#9FC3E9',
  SAND_GREEN: '#708E7C',
  DARK_RED: '#720E0F',
  DARK_BROWN: '#352100',
  TAN: '#E4CD9E',
  LIGHT_GREY: '#C8C8C8'
};

// Hex to Phaser int
function hexToInt(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

const COLORS = {
  BG: hexToInt('#2C2C2C'),
  BG_WARM: hexToInt('#3A2F28'),
  TEXT: hexToInt(LEGO_COLORS.YELLOW),
  TEXT_WHITE: hexToInt(LEGO_COLORS.WHITE),
  BRICK_RED: hexToInt(LEGO_COLORS.RED),
  BRICK_BLUE: hexToInt(LEGO_COLORS.BLUE),
  BRICK_GREEN: hexToInt(LEGO_COLORS.GREEN),
  ACCENT: hexToInt(LEGO_COLORS.ORANGE)
};

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

const PLAYER_SPEED = 160;
const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 40;

// Stud dimensions for LEGO-style drawing
const STUD_SIZE = 12;
const STUD_RADIUS = 5;
const PLATE_HEIGHT = 8;
const BRICK_HEIGHT = 24;
