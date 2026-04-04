// Shared text style helpers - Futuristic theme
const TEXT_STYLES = {
  title: {
    fontFamily: FONT_TITLE,
    fontSize: '28px',
    fontStyle: 'bold',
    color: LEGO_COLORS.CYAN,
    stroke: '#000000',
    strokeThickness: 1
  },
  subtitle: {
    fontFamily: FONT_BODY,
    fontSize: '16px',
    color: '#B0BCCC',
    lineSpacing: 6
  },
  body: {
    fontFamily: FONT_BODY,
    fontSize: '16px',
    color: '#D0D8E8',
    lineSpacing: 6,
    wordWrap: { width: 600 },
    align: 'center'
  },
  small: {
    fontFamily: FONT_MONO,
    fontSize: '11px',
    color: LEGO_COLORS.GREY,
    letterSpacing: 2
  },
  label: {
    fontFamily: FONT_MONO,
    fontSize: '12px',
    fontStyle: 'bold',
    color: LEGO_COLORS.CYAN,
    letterSpacing: 1
  },
  quote: {
    fontFamily: FONT_BODY,
    fontSize: '13px',
    color: LEGO_COLORS.YELLOW,
    fontStyle: 'italic',
    wordWrap: { width: 600 },
    align: 'center',
    lineSpacing: 6
  },
  hud: {
    fontFamily: FONT_MONO,
    fontSize: '11px',
    color: LEGO_COLORS.GREY
  },
  success: {
    fontFamily: FONT_TITLE,
    fontSize: '24px',
    fontStyle: 'bold',
    color: LEGO_COLORS.GREEN
  },
  error: {
    fontFamily: FONT_TITLE,
    fontSize: '16px',
    fontStyle: 'bold',
    color: LEGO_COLORS.RED
  },
  button: {
    fontFamily: FONT_TITLE,
    fontSize: '14px',
    fontStyle: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1
  },
  room: {
    fontFamily: FONT_TITLE,
    fontSize: '20px',
    fontStyle: 'bold',
    color: LEGO_COLORS.WHITE
  },
  chapter: {
    fontFamily: FONT_MONO,
    fontSize: '10px',
    color: LEGO_COLORS.CYAN,
    letterSpacing: 3
  }
};

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

// Draw a quote box at the bottom of a scene
function drawQuoteBox(scene, container, era) {
  const cx = GAME_WIDTH / 2;
  const quote = getRandomQuote(era);

  const bg = scene.add.graphics();
  bg.fillStyle(0x131824, 0.85);
  bg.fillRoundedRect(40, GAME_HEIGHT - 65, GAME_WIDTH - 80, 55, 8);
  bg.lineStyle(1, 0x00D4FF, 0.12);
  bg.strokeRoundedRect(40, GAME_HEIGHT - 65, GAME_WIDTH - 80, 55, 8);
  container.add(bg);

  container.add(
    scene.add.text(cx, GAME_HEIGHT - 44, '"' + quote.text + '"', {
      ...TEXT_STYLES.quote,
      fontSize: '12px'
    }).setOrigin(0.5)
  );

  container.add(
    scene.add.text(cx, GAME_HEIGHT - 22, '- Antica Bracanov, ' + quote.source, {
      ...TEXT_STYLES.small,
      color: LEGO_COLORS.GREY
    }).setOrigin(0.5)
  );
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
    fontSize: '13px'
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
