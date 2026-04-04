class AchievementScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AchievementScene' });
  }

  init(data) {
    this.achievementId = data.achievementId;
    this.nextScene = data.nextScene || 'WorldMapScene';
    this.nextData = data.nextData || {};
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dark overlay
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x0A0E17, 0.92);

    const achievement = ACHIEVEMENTS.find(a => a.id === this.achievementId);
    if (!achievement) {
      this.scene.start(this.nextScene, this.nextData);
      return;
    }

    // Save achievement
    SaveManager.unlockAchievement(this.achievementId);

    // Brick building animation
    const brickCount = 8;
    for (let i = 0; i < brickCount; i++) {
      const brick = this.add.graphics();
      const bw = 40 + Math.random() * 30;
      const bh = 16;
      const bx = cx - bw / 2 + (Math.random() - 0.5) * 20;
      const by = cy + 80 - i * bh;

      const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.YELLOW, LEGO_COLORS.GREEN, LEGO_COLORS.ORANGE];
      const color = Phaser.Display.Color.HexStringToColor(colors[i % colors.length]);

      brick.fillStyle(color.color, 0.9);
      brick.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 2);
      // 3D bottom
      brick.fillStyle(color.darken(25).color, 0.9);
      brick.fillRect(-bw / 2, bh / 2 - 3, bw, 3);
      // Glow edge
      brick.lineStyle(1, color.lighten(20).color, 0.2);
      brick.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 2);

      brick.setPosition(bx, -50);

      this.tweens.add({
        targets: brick,
        y: by,
        delay: i * 150,
        duration: 300,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          // Studs on top
          const studGfx = this.add.graphics();
          studGfx.setPosition(bx, by);
          const studs = Math.floor(bw / 16);
          for (let s = 0; s < studs; s++) {
            studGfx.fillStyle(color.lighten(15).color, 1);
            studGfx.fillCircle(-bw / 2 + 10 + s * 16, -bh / 2 - 2, 4);
            studGfx.fillStyle(0xFFFFFF, 0.12);
            studGfx.fillCircle(-bw / 2 + 9 + s * 16, -bh / 2 - 3, 1.5);
          }
          // Vibrate on landing
          GamepadManager.vibrate(50, 0.1, 0.2);
        }
      });
    }

    // Achievement content
    this.time.delayedCall(brickCount * 150 + 500, () => {
      const header = this.add.text(cx, cy - 130, 'BRICK UNLOCKED', {
        fontFamily: FONT_TITLE,
        fontSize: '18px',
        fontStyle: 'bold',
        color: LEGO_COLORS.YELLOW
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: header, alpha: 1, duration: 500 });

      // Glow line
      const line = this.add.graphics();
      line.lineStyle(1, hexToInt(LEGO_COLORS.YELLOW), 0.3);
      line.lineBetween(cx - 100, cy - 112, cx + 100, cy - 112);

      const title = this.add.text(cx, cy - 95, achievement.title, {
        fontFamily: FONT_TITLE,
        fontSize: '14px',
        fontStyle: 'bold',
        color: achievement.color || LEGO_COLORS.WHITE
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: title, alpha: 1, duration: 500, delay: 200 });

      const year = this.add.text(cx, cy - 75, achievement.year + '', {
        fontFamily: FONT_MONO,
        fontSize: '10px',
        color: LEGO_COLORS.CYAN
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: year, alpha: 1, duration: 500, delay: 300 });

      const desc = this.add.text(cx, cy - 45, achievement.description, {
        fontFamily: FONT_BODY,
        fontSize: '13px',
        color: '#D0D8E8',
        wordWrap: { width: 500 },
        align: 'center',
        lineSpacing: 6
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: desc, alpha: 1, duration: 500, delay: 400 });

      if (achievement.quote) {
        const quote = this.add.text(cx, cy + 15, '"' + achievement.quote + '"', {
          fontFamily: FONT_BODY,
          fontSize: '12px',
          fontStyle: 'italic',
          color: LEGO_COLORS.YELLOW,
          wordWrap: { width: 500 },
          align: 'center',
          lineSpacing: 6
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: quote, alpha: 1, duration: 500, delay: 600 });

        if (achievement.quoteSource) {
          const src = this.add.text(cx, cy + 50, '- ' + achievement.quoteSource, {
            fontFamily: FONT_MONO,
            fontSize: '8px',
            color: '#6A7A8A'
          }).setOrigin(0.5).setAlpha(0);
          this.tweens.add({ targets: src, alpha: 1, duration: 500, delay: 700 });
        }
      }

      // Continue prompt
      this.time.delayedCall(1500, () => {
        const continueText = this.add.text(cx, GAME_HEIGHT - 50, 'PRESS A OR CLICK TO CONTINUE', {
          fontFamily: FONT_MONO,
          fontSize: '9px',
          color: LEGO_COLORS.GREEN,
          letterSpacing: 1
        }).setOrigin(0.5);

        this.tweens.add({
          targets: continueText,
          alpha: 0.3,
          duration: 600,
          yoyo: true,
          repeat: -1
        });

        // Click or gamepad A
        this.input.once('pointerdown', () => this.proceed());
        GamepadManager.on('button_0', () => this.proceed());

        // Register focusables for controller navigation
        InputSystem.setFocusables([
          { element: null, x: cx, y: GAME_HEIGHT - 50, callback: () => this.proceed() }
        ]);
      });
    });
  }

  proceed() {
    InputSystem.clearFocusables();
    this.cameras.main.fadeOut(400, 10, 14, 23);
    this.time.delayedCall(400, () => {
      this.scene.stop('AchievementScene');
      if (this.nextScene) {
        this.scene.start(this.nextScene, this.nextData);
      }
    });
  }
}
