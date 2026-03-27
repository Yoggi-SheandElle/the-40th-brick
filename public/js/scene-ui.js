// Scene UI Mixin - Premium futuristic layer for all chapter scenes
// Adds: dark background, grid, HUD, depth effects, transitions, shared buttons

const SceneUI = {
  // Initialize premium UI for any chapter scene
  initPremiumUI(scene, chapterColor) {
    scene.cameras.main.setBackgroundColor('#0A0E17');
    drawGridBg(scene);

    // Ambient floating particles
    for (let i = 0; i < 12; i++) {
      const dot = scene.add.circle(
        Math.random() * GAME_WIDTH,
        Math.random() * GAME_HEIGHT,
        Math.random() * 1.5 + 0.3,
        Phaser.Display.Color.HexStringToColor(chapterColor || LEGO_COLORS.CYAN).color,
        Math.random() * 0.06 + 0.01
      );
      scene.tweens.add({
        targets: dot,
        y: dot.y - 20 - Math.random() * 30,
        alpha: 0,
        duration: 5000 + Math.random() * 3000,
        repeat: -1,
        delay: Math.random() * 3000
      });
    }

    // Fade in
    scene.cameras.main.fadeIn(400, 10, 14, 23);
  },

  // Premium room header with chapter badge + room counter
  createRoomHeader(scene, chapterNum, chapterTitle, roomTitle, roomNum, totalRooms) {
    // Chapter badge (top-left)
    const badgeBg = scene.add.graphics();
    badgeBg.fillStyle(0x131824, 0.7);
    badgeBg.fillRoundedRect(12, 8, 160, 28, 6);
    badgeBg.lineStyle(1, 0x00D4FF, 0.1);
    badgeBg.strokeRoundedRect(12, 8, 160, 28, 6);

    scene.add.text(20, 22, 'CH.' + chapterNum, {
      fontFamily: FONT_MONO,
      fontSize: '9px',
      fontStyle: 'bold',
      color: LEGO_COLORS.CYAN,
      letterSpacing: 1
    }).setOrigin(0, 0.5);

    scene.add.text(60, 22, chapterTitle, {
      fontFamily: FONT_BODY,
      fontSize: '12px',
      color: '#8896AA'
    }).setOrigin(0, 0.5);

    // Room title (center)
    scene.add.text(GAME_WIDTH / 2, 22, roomTitle, {
      fontFamily: FONT_TITLE,
      fontSize: '14px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);

    // Room progress (top-right)
    const progBg = scene.add.graphics();
    progBg.fillStyle(0x131824, 0.7);
    progBg.fillRoundedRect(GAME_WIDTH - 120, 8, 108, 28, 6);
    progBg.lineStyle(1, 0x00D4FF, 0.1);
    progBg.strokeRoundedRect(GAME_WIDTH - 120, 8, 108, 28, 6);

    scene.add.text(GAME_WIDTH - 16, 22, 'Room ' + roomNum + '/' + totalRooms, {
      fontFamily: FONT_MONO,
      fontSize: '9px',
      color: LEGO_COLORS.GREY
    }).setOrigin(1, 0.5);

    // Top border glow
    const topLine = scene.add.graphics();
    topLine.lineStyle(1, 0x00D4FF, 0.08);
    topLine.lineBetween(0, 42, GAME_WIDTH, 42);
  },

  // Premium brick-style action button
  createPremiumButton(scene, container, x, y, text, callback, color, width) {
    color = color || LEGO_COLORS.GREEN;
    width = width || 160;
    const hw = width / 2;
    const h = 38;
    const btn = scene.add.container(x, y);
    const c = Phaser.Display.Color.HexStringToColor(color);

    const bg = scene.add.graphics();
    const drawBtn = (alpha, border) => {
      bg.clear();
      bg.fillStyle(c.color, alpha);
      bg.fillRoundedRect(-hw, -h / 2, width, h, 6);
      bg.fillStyle(c.darken(25).color, alpha + 0.05);
      bg.fillRoundedRect(-hw, h / 2 - 5, width, 5, { bl: 6, br: 6 });
      bg.lineStyle(1, c.lighten(15).color, border);
      bg.strokeRoundedRect(-hw, -h / 2, width, h, 6);
    };
    drawBtn(0.8, 0.2);

    const label = scene.add.text(0, 0, text, {
      fontFamily: FONT_TITLE,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      letterSpacing: 1
    }).setOrigin(0.5);

    btn.add([bg, label]);
    btn.setSize(width, h);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => { drawBtn(1, 0.5); label.setColor(LEGO_COLORS.YELLOW); });
    btn.on('pointerout', () => { drawBtn(0.8, 0.2); label.setColor('#FFFFFF'); });
    btn.on('pointerdown', callback);
    if (container) container.add(btn);
    return btn;
  },

  // Premium success/error feedback with camera shake and vibration
  showPremiumSuccess(scene, msg, callback) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Flash
    scene.cameras.main.flash(200, 48, 209, 88, false);
    GamepadManager.vibrate(150, 0.3, 0.6);

    // Save progress
    SaveManager.solveRoom(scene.chapter || 1, (scene.currentRoom || 0) + 1);

    const overlay = scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x0A0E17, 0.7).setDepth(90);

    const text = scene.add.text(cx, cy, msg, {
      fontFamily: FONT_TITLE,
      fontSize: '22px',
      fontStyle: 'bold',
      color: LEGO_COLORS.GREEN
    }).setOrigin(0.5).setDepth(100).setAlpha(0).setScale(0.5);

    scene.tweens.add({
      targets: text,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.time.delayedCall(800, () => {
          scene.tweens.add({
            targets: [text, overlay],
            alpha: 0,
            duration: 300,
            onComplete: () => {
              text.destroy();
              overlay.destroy();
              if (callback) callback();
            }
          });
        });
      }
    });
  },

  showPremiumError(scene, msg) {
    const cx = GAME_WIDTH / 2;
    scene.cameras.main.shake(100, 0.005);
    GamepadManager.vibrate(80, 0.2, 0.3);

    const text = scene.add.text(cx, GAME_HEIGHT / 2, msg, {
      fontFamily: FONT_TITLE,
      fontSize: '14px',
      fontStyle: 'bold',
      color: LEGO_COLORS.RED
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    scene.tweens.add({
      targets: text,
      alpha: 1,
      duration: 200,
      onComplete: () => {
        scene.time.delayedCall(1200, () => {
          scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 300,
            onComplete: () => text.destroy()
          });
        });
      }
    });
  },

  // Premium room transition with wipe effect
  premiumTransition(scene, callback) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    scene.cameras.main.fadeOut(350, 10, 14, 23);
    scene.time.delayedCall(350, () => {
      callback();
      scene.cameras.main.fadeIn(350, 10, 14, 23);
    });
  }
};
