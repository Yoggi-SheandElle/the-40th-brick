// Shared text style helpers - Futuristic theme. Sizes tuned for 75" TV
// at couch distance: anything below ~22px disappears.
const TEXT_STYLES = {
  title: {
    fontFamily: FONT_TITLE,
    fontSize: '38px',
    fontStyle: 'bold',
    color: LEGO_COLORS.CYAN,
    stroke: '#000000',
    strokeThickness: 2
  },
  subtitle: {
    fontFamily: FONT_BODY,
    fontSize: '26px',
    fontStyle: 'bold',
    color: '#D0DCEC',
    lineSpacing: 8
  },
  body: {
    fontFamily: FONT_BODY,
    fontSize: '22px',
    fontStyle: 'bold',
    color: '#E0E8F8',
    lineSpacing: 6,
    wordWrap: { width: 1000 },
    align: 'center'
  },
  small: {
    fontFamily: FONT_MONO,
    fontSize: '20px',
    color: LEGO_COLORS.GREY,
    letterSpacing: 2
  },
  label: {
    fontFamily: FONT_MONO,
    fontSize: '22px',
    fontStyle: 'bold',
    color: LEGO_COLORS.CYAN,
    letterSpacing: 1
  },
  quote: {
    fontFamily: FONT_BODY,
    fontSize: '24px',
    color: LEGO_COLORS.YELLOW,
    fontStyle: 'italic',
    wordWrap: { width: 1100 },
    align: 'center',
    lineSpacing: 6
  },
  hud: {
    fontFamily: FONT_MONO,
    fontSize: '24px',
    fontStyle: 'bold',
    color: LEGO_COLORS.WHITE
  },
  success: {
    fontFamily: FONT_TITLE,
    fontSize: '44px',
    fontStyle: 'bold',
    color: LEGO_COLORS.GREEN,
    stroke: '#000000',
    strokeThickness: 4
  },
  error: {
    fontFamily: FONT_TITLE,
    fontSize: '32px',
    fontStyle: 'bold',
    color: LEGO_COLORS.RED,
    stroke: '#000000',
    strokeThickness: 3
  },
  button: {
    fontFamily: FONT_TITLE,
    fontSize: '26px',
    fontStyle: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1
  },
  room: {
    fontFamily: FONT_TITLE,
    fontSize: '36px',
    fontStyle: 'bold',
    color: LEGO_COLORS.WHITE
  },
  chapter: {
    fontFamily: FONT_MONO,
    fontSize: '22px',
    fontStyle: 'bold',
    color: LEGO_COLORS.CYAN,
    letterSpacing: 3
  }
};

// Apply device-aware font scaling to all TEXT_STYLES
(function applyDeviceScaling() {
  const profile = getDeviceProfile();
  if (profile.fontScale === 1.0) return;
  Object.keys(TEXT_STYLES).forEach(key => {
    const style = TEXT_STYLES[key];
    if (style.fontSize) {
      const base = parseInt(style.fontSize);
      style.fontSize = Math.round(base * profile.fontScale) + 'px';
    }
  });
})();

// Draw futuristic grid background
function drawGridBg(scene) {
  const gfx = scene.add.graphics();
  // Subtle grid lines
  gfx.lineStyle(1, 0x00D4FF, 0.03);
  for (let x = 0; x < GAME_WIDTH; x += 40) {
    gfx.lineBetween(x, 0, x, GAME_HEIGHT);
  }
  for (let y = 0; y < GAME_HEIGHT; y += 40) {
    gfx.lineBetween(0, y, GAME_WIDTH, y);
  }
  // Corner accents
  gfx.lineStyle(2, 0x00D4FF, 0.15);
  // Top-left
  gfx.lineBetween(0, 0, 60, 0);
  gfx.lineBetween(0, 0, 0, 60);
  // Top-right
  gfx.lineBetween(GAME_WIDTH, 0, GAME_WIDTH - 60, 0);
  gfx.lineBetween(GAME_WIDTH, 0, GAME_WIDTH, 60);
  // Bottom-left
  gfx.lineBetween(0, GAME_HEIGHT, 60, GAME_HEIGHT);
  gfx.lineBetween(0, GAME_HEIGHT, 0, GAME_HEIGHT - 60);
  // Bottom-right
  gfx.lineBetween(GAME_WIDTH, GAME_HEIGHT, GAME_WIDTH - 60, GAME_HEIGHT);
  gfx.lineBetween(GAME_WIDTH, GAME_HEIGHT, GAME_WIDTH, GAME_HEIGHT - 60);
  return gfx;
}

// Draw a quote box at the bottom of a scene. Tall enough for a wrapped quote
// at TV-readable size and a bigger source line.
function drawQuoteBox(scene, container, era) {
  const cx = GAME_WIDTH / 2;
  const quote = getRandomQuote(era);
  const boxH = 110;
  const boxTop = GAME_HEIGHT - boxH - 8;

  const bg = scene.add.graphics();
  bg.fillStyle(0x131824, 0.92);
  bg.fillRoundedRect(40, boxTop, GAME_WIDTH - 80, boxH, 12);
  bg.lineStyle(2, 0x00D4FF, 0.25);
  bg.strokeRoundedRect(40, boxTop, GAME_WIDTH - 80, boxH, 12);
  container.add(bg);

  container.add(
    scene.add.text(cx, boxTop + 38, '"' + quote.text + '"', {
      ...TEXT_STYLES.quote,
      fontSize: '22px',
      wordWrap: { width: GAME_WIDTH - 140 }
    }).setOrigin(0.5)
  );

  container.add(
    scene.add.text(cx, boxTop + boxH - 22, '- Antica Bracanov, ' + quote.source, {
      ...TEXT_STYLES.small,
      fontSize: '18px',
      color: '#A0A8B8'
    }).setOrigin(0.5)
  );
}

// Celebration confetti burst
function launchCelebrationConfetti(scene, x, y, count) {
  count = count || 30;
  const colors = [0xE05545, 0xF2CD37, 0x0055BF, 0x237841, 0xE4ADC8, 0xA83D15, 0x00D4FF];
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 3 + Math.random() * 5;
    const particle = scene.add.rectangle(x, y, size, size * 0.6, color).setDepth(500);
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 300;
    const rotation = Math.random() * 6 - 3;
    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed + 200,
      angle: rotation * 180,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 1500 + Math.random() * 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => particle.destroy()
    });
  }
}

// Create a futuristic glass-morphism button
function createGameButton(scene, container, x, y, text, callback, color, width) {
  color = color || LEGO_COLORS.CYAN;
  width = width || 200;
  const hw = width / 2;
  const h = 42;
  const btn = scene.add.container(x, y);
  const c = Phaser.Display.Color.HexStringToColor(color);

  const bg = scene.add.graphics();
  // Glass panel
  bg.fillStyle(c.color, 0.12);
  bg.fillRoundedRect(-hw, -h / 2, width, h, 8);
  // Glow border
  bg.lineStyle(1.5, c.color, 0.5);
  bg.strokeRoundedRect(-hw, -h / 2, width, h, 8);
  // Bottom accent line
  bg.lineStyle(2, c.color, 0.3);
  bg.lineBetween(-hw + 20, h / 2, hw - 20, h / 2);

  const label = scene.add.text(0, 0, text, {
    ...TEXT_STYLES.button,
    fontSize: '16px'
  }).setOrigin(0.5);

  btn.add([bg, label]);
  btn.setSize(width, h);
  btn.setInteractive({ useHandCursor: true });

  btn.on('pointerover', () => {
    bg.clear();
    bg.fillStyle(c.color, 0.25);
    bg.fillRoundedRect(-hw, -h / 2, width, h, 8);
    bg.lineStyle(2, c.color, 0.8);
    bg.strokeRoundedRect(-hw, -h / 2, width, h, 8);
    bg.lineStyle(2, c.color, 0.5);
    bg.lineBetween(-hw + 10, h / 2, hw - 10, h / 2);
    label.setColor(LEGO_COLORS.WHITE);
  });

  btn.on('pointerout', () => {
    bg.clear();
    bg.fillStyle(c.color, 0.12);
    bg.fillRoundedRect(-hw, -h / 2, width, h, 8);
    bg.lineStyle(1.5, c.color, 0.5);
    bg.strokeRoundedRect(-hw, -h / 2, width, h, 8);
    bg.lineStyle(2, c.color, 0.3);
    bg.lineBetween(-hw + 20, h / 2, hw - 20, h / 2);
    label.setColor('#FFFFFF');
  });

  btn.on('pointerdown', callback);
  container.add(btn);
  return btn;
}
