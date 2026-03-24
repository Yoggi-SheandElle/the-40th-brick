// Shared text style helpers for readability
const TEXT_STYLES = {
  title: {
    fontFamily: '"Press Start 2P"',
    fontSize: '12px',
    color: LEGO_COLORS.YELLOW,
    stroke: '#000000',
    strokeThickness: 3
  },
  subtitle: {
    fontFamily: '"Press Start 2P"',
    fontSize: '9px',
    color: '#FFFFFF',
    stroke: '#000000',
    strokeThickness: 2,
    lineSpacing: 8
  },
  body: {
    fontFamily: '"Press Start 2P"',
    fontSize: '8px',
    color: '#FFFFFF',
    stroke: '#000000',
    strokeThickness: 2,
    lineSpacing: 8,
    wordWrap: { width: 600 },
    align: 'center'
  },
  small: {
    fontFamily: '"Press Start 2P"',
    fontSize: '7px',
    color: LEGO_COLORS.GREY,
    stroke: '#000000',
    strokeThickness: 2
  },
  label: {
    fontFamily: '"Press Start 2P"',
    fontSize: '8px',
    color: LEGO_COLORS.YELLOW,
    stroke: '#000000',
    strokeThickness: 2
  },
  quote: {
    fontFamily: '"Press Start 2P"',
    fontSize: '7px',
    color: LEGO_COLORS.YELLOW,
    stroke: '#000000',
    strokeThickness: 2,
    wordWrap: { width: 600 },
    align: 'center',
    lineSpacing: 6
  },
  hud: {
    fontFamily: '"Press Start 2P"',
    fontSize: '8px',
    color: LEGO_COLORS.GREY,
    stroke: '#000000',
    strokeThickness: 2
  },
  success: {
    fontFamily: '"Press Start 2P"',
    fontSize: '18px',
    color: LEGO_COLORS.GREEN,
    stroke: '#000000',
    strokeThickness: 4
  },
  error: {
    fontFamily: '"Press Start 2P"',
    fontSize: '12px',
    color: LEGO_COLORS.RED,
    stroke: '#000000',
    strokeThickness: 3
  },
  button: {
    fontFamily: '"Press Start 2P"',
    fontSize: '10px',
    color: '#FFFFFF',
    stroke: '#000000',
    strokeThickness: 2
  }
};

// Check if in solo mode
function isSolo() {
  return network.solo === true;
}

// Draw a quote box at the bottom of a scene
function drawQuoteBox(scene, container, era) {
  const cx = GAME_WIDTH / 2;
  const quote = getRandomQuote(era);

  const bg = scene.add.graphics();
  bg.fillStyle(0x000000, 0.4);
  bg.fillRoundedRect(30, GAME_HEIGHT - 55, GAME_WIDTH - 60, 45, 6);
  container.add(bg);

  container.add(
    scene.add.text(cx, GAME_HEIGHT - 38, `"${quote.text}"`, {
      ...TEXT_STYLES.quote,
      fontSize: '6px'
    }).setOrigin(0.5)
  );

  container.add(
    scene.add.text(cx, GAME_HEIGHT - 20, `- Ante, ${quote.source}`, {
      ...TEXT_STYLES.small,
      fontSize: '6px',
      color: LEGO_COLORS.SAND_GREEN
    }).setOrigin(0.5)
  );
}

// Create a standard game button
function createGameButton(scene, container, x, y, text, callback, color, width) {
  color = color || LEGO_COLORS.GREEN;
  width = width || 140;
  const hw = width / 2;
  const btn = scene.add.container(x, y);
  const c = Phaser.Display.Color.HexStringToColor(color);

  const bg = scene.add.graphics();
  bg.fillStyle(c.color, 1);
  bg.fillRoundedRect(-hw, -18, width, 36, 6);

  const label = scene.add.text(0, -2, text, TEXT_STYLES.button).setOrigin(0.5);

  btn.add([bg, label]);
  btn.setSize(width, 36);
  btn.setInteractive({ useHandCursor: true });

  btn.on('pointerover', () => {
    bg.clear();
    bg.fillStyle(c.lighten(20).color, 1);
    bg.fillRoundedRect(-hw, -18, width, 36, 6);
  });
  btn.on('pointerout', () => {
    bg.clear();
    bg.fillStyle(c.color, 1);
    bg.fillRoundedRect(-hw, -18, width, 36, 6);
  });
  btn.on('pointerdown', callback);

  container.add(btn);
  return btn;
}
