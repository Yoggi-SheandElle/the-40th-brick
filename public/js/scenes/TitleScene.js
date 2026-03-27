class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.setBackgroundColor('#0A0E17');

    // LEGO stud pattern background (futuristic glow version)
    this.drawStudPattern();
    drawGridBg(this);

    // Floating glow particles
    for (let i = 0; i < 20; i++) {
      const dot = this.add.circle(
        Math.random() * GAME_WIDTH,
        Math.random() * GAME_HEIGHT,
        Math.random() * 1.5 + 0.5,
        0x00D4FF,
        Math.random() * 0.1 + 0.02
      );
      this.tweens.add({
        targets: dot,
        y: dot.y - 30 - Math.random() * 40,
        alpha: 0,
        duration: 4000 + Math.random() * 3000,
        repeat: -1,
        delay: Math.random() * 3000
      });
    }

    // Top badge
    this.add.text(cx, cy - 175, 'BUILT FOR ANTICA BRACANOV', {
      fontFamily: FONT_MONO,
      fontSize: '9px',
      color: LEGO_COLORS.CYAN,
      letterSpacing: 4
    }).setOrigin(0.5).setAlpha(0.6);

    // Title
    const title = this.add.text(cx, cy - 130, 'THE 40TH BRICK', {
      fontFamily: FONT_TITLE,
      fontSize: '38px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Title glow
    const titleGlow = this.add.text(cx, cy - 130, 'THE 40TH BRICK', {
      fontFamily: FONT_TITLE,
      fontSize: '38px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5).setAlpha(0.08).setDepth(-1);

    // Subtitle
    this.add.text(cx, cy - 88, 'A Co-Op Puzzle Adventure for Antica', {
      fontFamily: FONT_BODY,
      fontSize: '15px',
      color: '#8896AA'
    }).setOrigin(0.5);

    // LEGO decorative bricks row (glowing neon versions)
    this.drawBrick(cx - 190, cy - 55, 4, LEGO_COLORS.RED);
    this.drawBrick(cx - 85, cy - 55, 3, LEGO_COLORS.BLUE);
    this.drawBrick(cx + 15, cy - 55, 4, LEGO_COLORS.GREEN);
    this.drawBrick(cx + 125, cy - 55, 3, LEGO_COLORS.ORANGE);

    // Stats bar below bricks
    const statsY = cy - 15;
    const stats = [
      { val: '40', label: 'ROOMS' },
      { val: '4', label: 'CHAPTERS' },
      { val: '57+', label: 'SETS DESIGNED' },
      { val: '1', label: 'DESIGNER' }
    ];
    const spacing = 130;
    const startX = cx - (spacing * 1.5);

    stats.forEach((s, i) => {
      const sx = startX + i * spacing;
      this.add.text(sx, statsY, s.val, {
        fontFamily: FONT_TITLE,
        fontSize: '18px',
        fontStyle: 'bold',
        color: LEGO_COLORS.YELLOW
      }).setOrigin(0.5);
      this.add.text(sx, statsY + 16, s.label, {
        fontFamily: FONT_MONO,
        fontSize: '7px',
        color: LEGO_COLORS.GREY,
        letterSpacing: 1
      }).setOrigin(0.5);
    });

    // Quote box
    const quote = getRandomQuote();
    const quoteBg = this.add.graphics();
    quoteBg.fillStyle(0x131824, 0.7);
    quoteBg.fillRoundedRect(cx - 320, cy + 20, 640, 50, 8);
    quoteBg.lineStyle(1, 0x00D4FF, 0.08);
    quoteBg.strokeRoundedRect(cx - 320, cy + 20, 640, 50, 8);

    this.add.text(cx, cy + 36, '"' + quote.text + '"', {
      fontFamily: FONT_BODY,
      fontSize: '12px',
      fontStyle: 'italic',
      color: '#A0AABB',
      wordWrap: { width: 580 },
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);

    this.add.text(cx, cy + 55, '- Antica Bracanov, ' + quote.source, {
      fontFamily: FONT_MONO,
      fontSize: '8px',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);

    // Buttons (LEGO brick style with neon glow)
    const btnTogether = this.createBrickButton(cx, cy + 100, 'PLAY TOGETHER', () => {
      this.cameras.main.fadeOut(400, 10, 14, 23);
      this.time.delayedCall(400, () => this.scene.start('LobbyScene', { mode: 'multi' }));
    }, LEGO_COLORS.RED, 280);

    const btnSolo = this.createBrickButton(cx, cy + 155, 'SOLO ADVENTURE', () => {
      this.cameras.main.fadeOut(400, 10, 14, 23);
      this.time.delayedCall(400, () => this.scene.start('LobbyScene', { mode: 'solo' }));
    }, LEGO_COLORS.BLUE, 280);

    // Gamepad focus
    GamepadManager.setFocusables([
      { element: btnTogether, callback: () => {
        this.cameras.main.fadeOut(400, 10, 14, 23);
        this.time.delayedCall(400, () => this.scene.start('LobbyScene', { mode: 'multi' }));
      }},
      { element: btnSolo, callback: () => {
        this.cameras.main.fadeOut(400, 10, 14, 23);
        this.time.delayedCall(400, () => this.scene.start('LobbyScene', { mode: 'solo' }));
      }}
    ]);

    // Footer
    this.add.text(cx, GAME_HEIGHT - 35, '40 rooms \u00B7 40 bricks \u00B7 40 years of amazing', {
      fontFamily: FONT_BODY,
      fontSize: '11px',
      color: '#4A5568'
    }).setOrigin(0.5);

    this.add.text(cx, GAME_HEIGHT - 18, 'Built with bricks by Yossi, for Antica', {
      fontFamily: FONT_BODY,
      fontSize: '11px',
      color: '#3A4558'
    }).setOrigin(0.5);

    // Title pulse
    this.tweens.add({
      targets: titleGlow,
      alpha: 0.15,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Title float
    this.tweens.add({
      targets: title,
      y: cy - 134,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Fade in
    this.cameras.main.fadeIn(600, 10, 14, 23);
  }

  drawStudPattern() {
    const gfx = this.add.graphics();
    // Glowing studs on dark background
    for (let x = 0; x < GAME_WIDTH; x += 28) {
      for (let y = 0; y < GAME_HEIGHT; y += 28) {
        gfx.fillStyle(0x00D4FF, 0.015);
        gfx.fillCircle(x + 14, y + 14, 4);
        gfx.lineStyle(0.5, 0x00D4FF, 0.04);
        gfx.strokeCircle(x + 14, y + 14, 4);
      }
    }
  }

  drawBrick(x, y, studs, color) {
    const gfx = this.add.graphics();
    const w = studs * STUD_SIZE * 2;
    const h = BRICK_HEIGHT;
    const c = Phaser.Display.Color.HexStringToColor(color);

    // Brick body with slight transparency for neon feel
    gfx.fillStyle(c.color, 0.85);
    gfx.fillRoundedRect(x, y, w, h, 3);

    // Bottom shadow (3D LEGO effect)
    gfx.fillStyle(c.darken(30).color, 0.9);
    gfx.fillRect(x, y + h - 4, w, 4);

    // Glow outline
    gfx.lineStyle(1, c.lighten(20).color, 0.3);
    gfx.strokeRoundedRect(x, y, w, h, 3);

    // Studs on top
    const studColor = c.lighten(15).color;
    for (let i = 0; i < studs; i++) {
      gfx.fillStyle(studColor, 1);
      gfx.fillCircle(x + STUD_SIZE + i * STUD_SIZE * 2, y - 3, STUD_RADIUS);
      // Stud highlight
      gfx.fillStyle(0xFFFFFF, 0.15);
      gfx.fillCircle(x + STUD_SIZE + i * STUD_SIZE * 2 - 1, y - 4, 2);
    }
  }

  createBrickButton(x, y, text, callback, color, width) {
    width = width || 240;
    const hw = width / 2;
    const h = 44;
    const btn = this.add.container(x, y);
    const c = Phaser.Display.Color.HexStringToColor(color);

    const bg = this.add.graphics();

    // Draw LEGO brick button
    const drawBtn = (fillAlpha, borderAlpha, bottomDarken) => {
      bg.clear();
      // Main body
      bg.fillStyle(c.color, fillAlpha);
      bg.fillRoundedRect(-hw, -h / 2, width, h, 6);
      // Bottom 3D edge (LEGO feel)
      bg.fillStyle(c.darken(bottomDarken).color, fillAlpha + 0.1);
      bg.fillRoundedRect(-hw, h / 2 - 6, width, 6, { bl: 6, br: 6 });
      // Glow border
      bg.lineStyle(1.5, c.lighten(20).color, borderAlpha);
      bg.strokeRoundedRect(-hw, -h / 2, width, h, 6);
      // Studs on button (3 centered)
      const studY = -h / 2 - 4;
      for (let i = -1; i <= 1; i++) {
        bg.fillStyle(c.lighten(10).color, fillAlpha);
        bg.fillCircle(i * 30, studY, 5);
        bg.fillStyle(0xFFFFFF, 0.1);
        bg.fillCircle(i * 30 - 1, studY - 1, 2);
      }
    };

    drawBtn(0.8, 0.3, 25);

    const label = this.add.text(0, 0, text, {
      fontFamily: FONT_TITLE,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 1,
      letterSpacing: 2
    }).setOrigin(0.5);

    btn.add([bg, label]);
    btn.setSize(width, h);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      drawBtn(1, 0.6, 15);
      label.setColor(LEGO_COLORS.YELLOW);
    });
    btn.on('pointerout', () => {
      drawBtn(0.8, 0.3, 25);
      label.setColor('#FFFFFF');
    });
    btn.on('pointerdown', callback);
    return btn;
  }
}
