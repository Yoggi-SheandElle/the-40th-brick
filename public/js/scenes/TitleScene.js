class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.setBackgroundColor('#1B2A34');
    this.drawStudPattern();

    // Title
    const title = this.add.text(cx, cy - 120, 'THE 40TH BRICK', {
      fontFamily: '"Press Start 2P"',
      fontSize: '32px',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, cy - 78, 'A Co-Op Adventure for Ante', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: LEGO_COLORS.WHITE,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Decorative bricks
    this.drawBrick(cx - 180, cy - 40, 4, LEGO_COLORS.RED);
    this.drawBrick(cx - 80, cy - 40, 3, LEGO_COLORS.BLUE);
    this.drawBrick(cx + 20, cy - 40, 4, LEGO_COLORS.GREEN);
    this.drawBrick(cx + 130, cy - 40, 3, LEGO_COLORS.ORANGE);

    // Quote box with background for readability
    const quote = getRandomQuote();
    const quoteBg = this.add.graphics();
    quoteBg.fillStyle(0x000000, 0.4);
    quoteBg.fillRoundedRect(cx - 340, cy - 10, 680, 70, 8);

    this.add.text(cx, cy + 10, `"${quote.text}"`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#FFFFFF',
      wordWrap: { width: 620 },
      align: 'center',
      lineSpacing: 8,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(cx, cy + 48, `- ${quote.source}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Buttons
    const btnTogether = this.createButton(cx, cy + 100, 'PLAY TOGETHER', () => {
      this.scene.start('LobbyScene', { mode: 'multi' });
    }, LEGO_COLORS.RED, 260);

    const btnSolo = this.createButton(cx, cy + 150, 'PLAY SOLO', () => {
      this.scene.start('LobbyScene', { mode: 'solo' });
    }, LEGO_COLORS.BLUE, 260);

    // Gamepad focus navigation
    GamepadManager.setFocusables([
      { element: btnTogether, callback: () => this.scene.start('LobbyScene', { mode: 'multi' }) },
      { element: btnSolo, callback: () => this.scene.start('LobbyScene', { mode: 'solo' }) }
    ]);

    // Controller hint
    if (GamepadManager.isConnected()) {
      this.add.text(cx, GAME_HEIGHT - 8, '\u24B6 Select   \u24B7 Back   \u24CD Hint', {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: LEGO_COLORS.DARK_GREY,
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
    }

    // Title float animation
    this.tweens.add({
      targets: title,
      y: cy - 125,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Footer
    this.add.text(cx, GAME_HEIGHT - 25, 'Built with bricks by Yossi, for Ante', {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: LEGO_COLORS.GREY,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Set count
    this.add.text(cx, GAME_HEIGHT - 45, '40 rooms \u00B7 40 bricks \u00B7 57+ sets designed \u00B7 1 amazing designer', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      color: LEGO_COLORS.SAND_GREEN,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
  }

  drawStudPattern() {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x222E36, 0.3);
    for (let x = 0; x < GAME_WIDTH; x += 24) {
      for (let y = 0; y < GAME_HEIGHT; y += 24) {
        gfx.fillCircle(x + 12, y + 12, 4);
      }
    }
  }

  drawBrick(x, y, studs, color) {
    const gfx = this.add.graphics();
    const w = studs * STUD_SIZE * 2;
    const h = BRICK_HEIGHT;
    const c = Phaser.Display.Color.HexStringToColor(color);

    gfx.fillStyle(c.color, 1);
    gfx.fillRect(x, y, w, h);
    gfx.fillStyle(c.darken(20).color, 1);
    gfx.fillRect(x, y + h - 3, w, 3);

    const studColor = c.lighten(15).color;
    gfx.fillStyle(studColor, 1);
    for (let i = 0; i < studs; i++) {
      gfx.fillCircle(x + STUD_SIZE + i * STUD_SIZE * 2, y - 3, STUD_RADIUS);
    }
  }

  createButton(x, y, text, callback, color, width) {
    width = width || 200;
    const hw = width / 2;
    const btn = this.add.container(x, y);
    const c = Phaser.Display.Color.HexStringToColor(color);

    const bg = this.add.graphics();
    bg.fillStyle(c.color, 1);
    bg.fillRoundedRect(-hw, -20, width, 40, 6);
    bg.fillStyle(c.darken(25).color, 1);
    bg.fillRoundedRect(-hw, 14, width, 6, { bl: 6, br: 6 });

    const label = this.add.text(0, -3, text, {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    btn.add([bg, label]);
    btn.setSize(width, 40);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(c.lighten(15).color, 1);
      bg.fillRoundedRect(-hw, -20, width, 40, 6);
      bg.fillStyle(c.darken(15).color, 1);
      bg.fillRoundedRect(-hw, 14, width, 6, { bl: 6, br: 6 });
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(c.color, 1);
      bg.fillRoundedRect(-hw, -20, width, 40, 6);
      bg.fillStyle(c.darken(25).color, 1);
      bg.fillRoundedRect(-hw, 14, width, 6, { bl: 6, br: 6 });
    });
    btn.on('pointerdown', callback);
    return btn;
  }
}
