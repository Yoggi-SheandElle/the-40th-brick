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
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);

    const achievement = ACHIEVEMENTS.find(a => a.id === this.achievementId);
    if (!achievement) {
      this.scene.start(this.nextScene, this.nextData);
      return;
    }

    // Brick building animation
    const bricks = [];
    const brickCount = 8;
    for (let i = 0; i < brickCount; i++) {
      const brick = this.add.graphics();
      const bw = 40 + Math.random() * 30;
      const bh = 16;
      const bx = cx - bw / 2 + (Math.random() - 0.5) * 20;
      const by = cy + 80 - i * bh;

      const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.YELLOW, LEGO_COLORS.GREEN, LEGO_COLORS.ORANGE];
      const color = Phaser.Display.Color.HexStringToColor(colors[i % colors.length]).color;

      brick.fillStyle(color, 1);
      brick.fillRect(-bw / 2, -bh / 2, bw, bh);
      brick.setPosition(bx, -50);
      bricks.push(brick);

      // Animate brick falling into place
      this.tweens.add({
        targets: brick,
        y: by,
        delay: i * 150,
        duration: 300,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          // Add stud circles on top
          const studGfx = this.add.graphics();
          studGfx.setPosition(bx, by);
          const studs = Math.floor(bw / 16);
          for (let s = 0; s < studs; s++) {
            studGfx.fillStyle(Phaser.Display.Color.IntegerToColor(color).lighten(15).color, 1);
            studGfx.fillCircle(-bw / 2 + 10 + s * 16, -bh / 2 - 2, 4);
          }
        }
      });
    }

    // Achievement content (appears after bricks)
    this.time.delayedCall(brickCount * 150 + 500, () => {
      // ACHIEVEMENT UNLOCKED header
      const header = this.add.text(cx, cy - 120, 'BRICK UNLOCKED!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '14px',
        color: LEGO_COLORS.YELLOW,
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: header, alpha: 1, duration: 500 });

      // Achievement title
      const title = this.add.text(cx, cy - 85, achievement.title, {
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
        color: achievement.color || LEGO_COLORS.WHITE
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: title, alpha: 1, duration: 500, delay: 200 });

      // Year
      const year = this.add.text(cx, cy - 68, `${achievement.year}`, {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: LEGO_COLORS.GREY
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: year, alpha: 1, duration: 500, delay: 300 });

      // Description
      const desc = this.add.text(cx, cy - 40, achievement.description, {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: LEGO_COLORS.WHITE,
        wordWrap: { width: 500 },
        align: 'center',
        lineSpacing: 6
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: desc, alpha: 1, duration: 500, delay: 400 });

      // Quote (if exists)
      if (achievement.quote) {
        const quote = this.add.text(cx, cy + 20, `"${achievement.quote}"`, {
          fontFamily: '"Press Start 2P"',
          fontSize: '7px',
          color: LEGO_COLORS.YELLOW,
          fontStyle: 'italic',
          wordWrap: { width: 500 },
          align: 'center',
          lineSpacing: 6
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: quote, alpha: 1, duration: 500, delay: 600 });

        if (achievement.quoteSource) {
          const src = this.add.text(cx, cy + 55, `- ${achievement.quoteSource}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '6px',
            color: LEGO_COLORS.GREY
          }).setOrigin(0.5).setAlpha(0);

          this.tweens.add({ targets: src, alpha: 1, duration: 500, delay: 700 });
        }
      }

      // Continue button
      this.time.delayedCall(1500, () => {
        const continueText = this.add.text(cx, GAME_HEIGHT - 60, 'CLICK TO CONTINUE', {
          fontFamily: '"Press Start 2P"',
          fontSize: '9px',
          color: LEGO_COLORS.GREEN
        }).setOrigin(0.5);

        this.tweens.add({
          targets: continueText,
          alpha: 0.4,
          duration: 600,
          yoyo: true,
          repeat: -1
        });

        this.input.once('pointerdown', () => {
          this.scene.stop('AchievementScene');
          // If there's a callback scene, go there
          if (this.nextScene) {
            this.scene.start(this.nextScene, this.nextData);
          }
        });
      });
    });
  }
}
