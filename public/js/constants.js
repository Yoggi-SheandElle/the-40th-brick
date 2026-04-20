// The 40th Brick - LEGO Official Color Palette
// Authentic LEGO colors with futuristic UI chrome

const LEGO_COLORS = {
  // Official LEGO palette (unchanged)
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
  LIGHT_GREY: '#C8C8C8',
  // UI chrome (futuristic wrapper only)
  CYAN: '#00D4FF',
  NEON_PURPLE: '#AC78BA',
  DARK_BG: '#0A0E17',
  PANEL_BG: '#131824'
};

// Hex to Phaser int
function hexToInt(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

const COLORS = {
  BG: hexToInt('#0A0E17'),
  BG_WARM: hexToInt('#131824'),
  BG_PANEL: hexToInt('#1A2030'),
  TEXT: hexToInt(LEGO_COLORS.YELLOW),
  TEXT_WHITE: hexToInt(LEGO_COLORS.WHITE),
  BRICK_RED: hexToInt(LEGO_COLORS.RED),
  BRICK_BLUE: hexToInt(LEGO_COLORS.BLUE),
  BRICK_GREEN: hexToInt(LEGO_COLORS.GREEN),
  ACCENT: hexToInt(LEGO_COLORS.ORANGE),
  GLOW: hexToInt(LEGO_COLORS.CYAN)
};

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const PLAYER_SPEED = 160;
const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 40;

// Stud dimensions for LEGO-style drawing
const STUD_SIZE = 12;
const STUD_RADIUS = 5;
const PLATE_HEIGHT = 8;
const BRICK_HEIGHT = 24;

// Typography
const FONT_TITLE = '"Orbitron", "Press Start 2P", monospace';
const FONT_BODY = '"Rajdhani", "Press Start 2P", monospace';
const FONT_MONO = '"Orbitron", monospace';

// Device-aware UI scaling
// NOTE: Ante plays Steam Deck DOCKED to a 75" TV, so steamdeck profile is
// tuned for TV readability, not handheld. Desktop also bumped because legibility
// complaints came from couch distance even on normal monitors.
const DEVICE_PROFILES = {
  mobile:    { fontScale: 0.85, hitScale: 1.6, buttonScale: 1.2 },
  desktop:   { fontScale: 1.15, hitScale: 1.0, buttonScale: 1.1 },
  steamdeck: { fontScale: 1.35, hitScale: 1.5, buttonScale: 1.3 },
  tv:        { fontScale: 1.45, hitScale: 1.6, buttonScale: 1.4 }
};

let _cachedProfile = null;
function getDeviceProfile() {
  if (_cachedProfile) return _cachedProfile;

  // Manual override via ?scale=1.3 query or localStorage
  let manualScale = null;
  try {
    const urlScale = new URLSearchParams(window.location.search).get('scale');
    const lsScale = localStorage.getItem('fontScale');
    const raw = parseFloat(urlScale || lsScale);
    if (!isNaN(raw) && raw > 0.5 && raw < 2.5) manualScale = raw;
  } catch (_) {}

  const p = detectPlatform();
  let base;
  if (p === 'mobile') base = DEVICE_PROFILES.mobile;
  else if (p === 'steamdeck') base = DEVICE_PROFILES.steamdeck;
  else if (p === 'tv' || (window.screen.width >= 1920 && !isTouchDevice())) base = DEVICE_PROFILES.tv;
  else base = DEVICE_PROFILES.desktop;

  _cachedProfile = manualScale
    ? { ...base, fontScale: manualScale }
    : base;
  return _cachedProfile;
}

function scaledFont(basePx) {
  return Math.round(basePx * getDeviceProfile().fontScale) + 'px';
}

// Celebration messages at room milestones
const CELEBRATION_MESSAGES = {
  5:  "5 bricks down! You're building something beautiful.",
  10: "Chapter 1 complete! From Croatia to Heartlake City.",
  15: "Halfway through Kevin's house! The traps are working.",
  20: "20 bricks collected!\nFrom here, only the designer herself can pass.",
  25: "Deep in Barad-dur now. Sauron's got nothing on you.",
  30: "30 bricks. The tower is almost complete.",
  35: "5 rooms to go. The final brick awaits.",
  39: "One more. Just one more brick.",
  40: "40.\nHappy Birthday, Antica.\nYou built this."
};
