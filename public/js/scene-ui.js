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

    // Pause button (top-right corner, always visible)
    SceneUI.addPauseButton(scene);
    SceneUI.addFullscreenButton(scene);

    // Fade in
    scene.cameras.main.fadeIn(400, 10, 14, 23);
  },

  // Pause overlay with resume / quit options
  addPauseButton(scene) {
    const pauseBtn = scene.add.text(GAME_WIDTH - 70, 22, '\u2759\u2759', {
      fontFamily: FONT_MONO,
      fontSize: '14px',
      color: '#6A7A8A'
    }).setOrigin(1, 0.5).setDepth(300).setInteractive({ useHandCursor: true });

    pauseBtn.on('pointerover', () => pauseBtn.setColor(LEGO_COLORS.YELLOW));
    pauseBtn.on('pointerout', () => pauseBtn.setColor('#6A7A8A'));
    pauseBtn.on('pointerdown', () => SceneUI.showPauseMenu(scene));

    // Escape key also opens pause
    scene.input.keyboard.on('keydown-ESC', () => {
      if (!scene._pauseOverlay) SceneUI.showPauseMenu(scene);
      else SceneUI.hidePauseMenu(scene);
    });

    // B button (Circle) on controller opens pause when no focusables active
    InputSystem.on('cancel', () => {
      if (!scene._pauseOverlay && scene.scene.isActive()) {
        SceneUI.showPauseMenu(scene);
      } else if (scene._pauseOverlay) {
        SceneUI.hidePauseMenu(scene);
      }
    });
  },

  addFullscreenButton(scene) {
    if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) return;
    const fsBtn = scene.add.text(GAME_WIDTH - 45, 22, '\u26F6', {
      fontFamily: FONT_MONO,
      fontSize: '14px',
      color: '#5A6A7A'
    }).setOrigin(0.5).setDepth(300).setInteractive({ useHandCursor: true });
    fsBtn.on('pointerover', () => fsBtn.setColor(LEGO_COLORS.YELLOW));
    fsBtn.on('pointerout', () => fsBtn.setColor('#5A6A7A'));
    fsBtn.on('pointerdown', () => {
      if (scene.scale.isFullscreen) scene.scale.stopFullscreen();
      else scene.scale.startFullscreen();
    });
  },

  // Milestone celebration overlay with confetti
  showCelebration(scene, roomNumber, callback) {
    const msg = CELEBRATION_MESSAGES[roomNumber];
    if (!msg) { if (callback) callback(); return; }

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const overlay = scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x0A0E17, 0.85).setDepth(400);
    overlay.setInteractive();

    // Confetti burst
    launchCelebrationConfetti(scene, cx, cy - 50, 50);
    scene.time.delayedCall(300, () => launchCelebrationConfetti(scene, cx - 150, cy, 30));
    scene.time.delayedCall(600, () => launchCelebrationConfetti(scene, cx + 150, cy, 30));

    // Brick count
    const brickText = scene.add.text(cx, cy - 80, roomNumber + '/40', {
      fontFamily: FONT_TITLE,
      fontSize: '48px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(401).setAlpha(0).setScale(0.5);

    // Message
    const msgText = scene.add.text(cx, cy + 10, msg, {
      fontFamily: FONT_BODY,
      fontSize: '18px',
      color: '#D0D8E8',
      align: 'center',
      lineSpacing: 8,
      wordWrap: { width: 500 }
    }).setOrigin(0.5).setDepth(401).setAlpha(0);

    // Room 20 special: gate locks message
    let gateText = null;
    if (roomNumber === 20) {
      gateText = scene.add.text(cx, cy + 80, 'THE GATE LOCKS', {
        fontFamily: FONT_TITLE,
        fontSize: '16px',
        fontStyle: 'bold',
        color: LEGO_COLORS.RED,
        letterSpacing: 4
      }).setOrigin(0.5).setDepth(401).setAlpha(0);
    }

    // Animate in
    scene.tweens.add({
      targets: brickText,
      alpha: 1, scale: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
    scene.tweens.add({
      targets: msgText,
      alpha: 1,
      duration: 600,
      delay: 300
    });
    if (gateText) {
      scene.tweens.add({
        targets: gateText,
        alpha: 1,
        duration: 600,
        delay: 600
      });
    }

    // Tap to continue
    const continueText = scene.add.text(cx, GAME_HEIGHT - 60, 'TAP TO CONTINUE', {
      fontFamily: FONT_MONO,
      fontSize: '11px',
      color: '#4A5A6A'
    }).setOrigin(0.5).setDepth(401).setAlpha(0);
    scene.tweens.add({ targets: continueText, alpha: 1, duration: 400, delay: 1500 });

    // Dismiss
    scene.time.delayedCall(1500, () => {
      overlay.on('pointerdown', () => {
        scene.tweens.add({
          targets: [overlay, brickText, msgText, continueText, gateText].filter(Boolean),
          alpha: 0,
          duration: 300,
          onComplete: () => {
            [overlay, brickText, msgText, continueText, gateText].filter(Boolean).forEach(o => o.destroy());
            if (callback) callback();
          }
        });
      });
    });

    // Auto-dismiss after 8 seconds
    scene.time.delayedCall(8000, () => {
      if (overlay.active) {
        [overlay, brickText, msgText, continueText, gateText].filter(Boolean).forEach(o => { if (o.active) o.destroy(); });
        if (callback) callback();
      }
    });
  },

  showPauseMenu(scene) {
    if (scene._pauseOverlay) return;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dim overlay
    const overlay = scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setDepth(400);
    overlay.setInteractive(); // block clicks through

    // Panel
    const panel = scene.add.graphics().setDepth(401);
    panel.fillStyle(0x131824, 0.95);
    panel.fillRoundedRect(cx - 160, cy - 120, 320, 240, 12);
    panel.lineStyle(1, 0x00D4FF, 0.2);
    panel.strokeRoundedRect(cx - 160, cy - 120, 320, 240, 12);

    const title = scene.add.text(cx, cy - 85, 'PAUSED', {
      fontFamily: FONT_TITLE,
      fontSize: '22px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5).setDepth(402);

    // Resume button
    const resumeBtn = scene.add.container(cx, cy - 20).setDepth(402);
    const resumeBg = scene.add.graphics();
    resumeBg.fillStyle(hexToInt(LEGO_COLORS.GREEN), 0.8);
    resumeBg.fillRoundedRect(-100, -20, 200, 40, 6);
    const resumeLbl = scene.add.text(0, 0, 'RESUME', {
      fontFamily: FONT_TITLE, fontSize: '14px', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    resumeBtn.add([resumeBg, resumeLbl]);
    resumeBtn.setSize(200, 40).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerdown', () => SceneUI.hidePauseMenu(scene));

    // World Map button
    const mapBtn = scene.add.container(cx, cy + 40).setDepth(402);
    const mapBg = scene.add.graphics();
    mapBg.fillStyle(hexToInt(LEGO_COLORS.BLUE), 0.8);
    mapBg.fillRoundedRect(-100, -20, 200, 40, 6);
    const mapLbl = scene.add.text(0, 0, 'WORLD MAP', {
      fontFamily: FONT_TITLE, fontSize: '14px', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    mapBtn.add([mapBg, mapLbl]);
    mapBtn.setSize(200, 40).setInteractive({ useHandCursor: true });
    mapBtn.on('pointerdown', () => {
      SceneUI.hidePauseMenu(scene);
      scene.cameras.main.fadeOut(300, 10, 14, 23);
      scene.time.delayedCall(300, () => scene.scene.start('WorldMapScene'));
    });

    // Skip Room button (only if scene has nextRoom + we're in a chapter)
    let skipBtn = null;
    const canSkip = typeof scene.nextRoom === 'function' && scene.currentRoom !== undefined;
    if (canSkip) {
      // Redraw panel a bit taller
      panel.clear();
      panel.fillStyle(0x131824, 0.95);
      panel.fillRoundedRect(cx - 160, cy - 150, 320, 300, 12);
      panel.lineStyle(1, 0x00D4FF, 0.2);
      panel.strokeRoundedRect(cx - 160, cy - 150, 320, 300, 12);
      title.setY(cy - 115);

      skipBtn = scene.add.container(cx, cy + 100).setDepth(402);
      const skipBg = scene.add.graphics();
      skipBg.fillStyle(hexToInt(LEGO_COLORS.ORANGE), 0.8);
      skipBg.fillRoundedRect(-100, -20, 200, 40, 6);
      const skipLbl = scene.add.text(0, 0, 'SKIP ROOM', {
        fontFamily: FONT_TITLE, fontSize: '14px', fontStyle: 'bold', color: '#FFFFFF'
      }).setOrigin(0.5);
      skipBtn.add([skipBg, skipLbl]);
      skipBtn.setSize(200, 40).setInteractive({ useHandCursor: true });
      skipBtn.on('pointerdown', () => {
        SceneUI.hidePauseMenu(scene);
        try { scene.nextRoom(); } catch (e) { console.warn('[Skip]', e); }
      });
    }

    // Main Menu button (moved down if skip is present)
    const menuY = canSkip ? cy + 160 : cy + 100;
    const menuBtn = scene.add.container(cx, menuY).setDepth(402);
    const menuBg = scene.add.graphics();
    menuBg.fillStyle(hexToInt(LEGO_COLORS.RED), 0.8);
    menuBg.fillRoundedRect(-100, -20, 200, 40, 6);
    const menuLbl = scene.add.text(0, 0, 'MAIN MENU', {
      fontFamily: FONT_TITLE, fontSize: '14px', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    menuBtn.add([menuBg, menuLbl]);
    menuBtn.setSize(200, 40).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      SceneUI.hidePauseMenu(scene);
      scene.cameras.main.fadeOut(300, 10, 14, 23);
      scene.time.delayedCall(300, () => scene.scene.start('TitleScene'));
    });

    scene._pauseOverlay = { overlay, panel, title, resumeBtn, mapBtn, menuBtn, skipBtn };

    // Controller focusables for pause menu
    const pauseFocus = [
      { element: resumeBtn, x: cx, y: cy - 20, callback: () => SceneUI.hidePauseMenu(scene) },
      { element: mapBtn, x: cx, y: cy + 40, callback: () => { SceneUI.hidePauseMenu(scene); scene.cameras.main.fadeOut(300, 10, 14, 23); scene.time.delayedCall(300, () => scene.scene.start('WorldMapScene')); }}
    ];
    if (skipBtn) {
      pauseFocus.push({ element: skipBtn, x: cx, y: cy + 100, callback: () => { SceneUI.hidePauseMenu(scene); try { scene.nextRoom(); } catch (e) {} } });
    }
    pauseFocus.push({ element: menuBtn, x: cx, y: menuY, callback: () => { SceneUI.hidePauseMenu(scene); scene.cameras.main.fadeOut(300, 10, 14, 23); scene.time.delayedCall(300, () => scene.scene.start('TitleScene')); }});
    InputSystem.setFocusables(pauseFocus);
  },

  hidePauseMenu(scene) {
    if (!scene._pauseOverlay) return;
    const p = scene._pauseOverlay;
    p.overlay.destroy();
    p.panel.destroy();
    p.title.destroy();
    p.resumeBtn.destroy();
    p.mapBtn.destroy();
    p.menuBtn.destroy();
    if (p.skipBtn) p.skipBtn.destroy();
    scene._pauseOverlay = null;
    InputSystem.clearFocusables();
  },

  // Premium room header with chapter badge + room counter
  // All elements added to scene.roomContainer so they get cleaned up between rooms
  createRoomHeader(scene, chapterNum, chapterTitle, roomTitle, roomNum, totalRooms) {
    const c = scene.roomContainer;

    // Full-width header bar background (kept 46px so existing puzzles don't overlap)
    const headerH = 46;
    const headerBg = scene.add.graphics().setDepth(50);
    headerBg.fillStyle(0x0A0E17, 0.95);
    headerBg.fillRect(0, 0, GAME_WIDTH, headerH);
    c.add(headerBg);

    // Chapter badge (top-left)
    const badgeBg = scene.add.graphics().setDepth(51);
    badgeBg.fillStyle(0x131824, 0.9);
    badgeBg.fillRoundedRect(8, 6, 90, 34, 6);
    badgeBg.lineStyle(2, 0x00D4FF, 0.25);
    badgeBg.strokeRoundedRect(8, 6, 90, 34, 6);
    c.add(badgeBg);

    const chLabel = scene.add.text(53, 23, 'CH.' + chapterNum, {
      fontFamily: FONT_MONO,
      fontSize: '18px',
      fontStyle: 'bold',
      color: LEGO_COLORS.CYAN,
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(52);
    c.add(chLabel);

    // Room title (center - prominent but constrained to header height)
    const titleText = scene.add.text(GAME_WIDTH / 2, 23, roomTitle.toUpperCase(), {
      fontFamily: FONT_TITLE,
      fontSize: '22px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW,
      stroke: '#0A0E17',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(52);
    c.add(titleText);

    // Room progress (top-right)
    const progBg = scene.add.graphics().setDepth(51);
    progBg.fillStyle(0x131824, 0.9);
    progBg.fillRoundedRect(GAME_WIDTH - 120, 6, 110, 34, 6);
    progBg.lineStyle(2, 0x00D4FF, 0.25);
    progBg.strokeRoundedRect(GAME_WIDTH - 120, 6, 110, 34, 6);
    c.add(progBg);

    const progText = scene.add.text(GAME_WIDTH - 65, 23, roomNum + '/' + totalRooms, {
      fontFamily: FONT_MONO,
      fontSize: '18px',
      fontStyle: 'bold',
      color: LEGO_COLORS.WHITE
    }).setOrigin(0.5).setDepth(52);
    c.add(progText);

    // Hint button
    const hintBtn = scene.add.text(GAME_WIDTH - 145, 23, '?', {
      fontFamily: FONT_TITLE,
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#6A7A8A'
    }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });
    hintBtn.on('pointerover', () => hintBtn.setColor(LEGO_COLORS.YELLOW));
    hintBtn.on('pointerout', () => hintBtn.setColor('#4A5A6A'));
    hintBtn.on('pointerdown', () => SceneUI.showHint(scene, chapterNum, roomNum));
    c.add(hintBtn);

    // Bottom glow line
    const topLine = scene.add.graphics().setDepth(51);
    topLine.lineStyle(2, 0x00D4FF, 0.2);
    topLine.lineBetween(0, headerH - 2, GAME_WIDTH, headerH - 2);
    c.add(topLine);
  },

  // Hint system - vague clues to nudge the player
  showHint(scene, chapter, room) {
    if (scene._hintOverlay) return;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    SaveManager.useHint();

    const hints = {
      1: [
        'Look carefully at the colors. They cycle in a fixed order.',
        'Patterns repeat. Focus on one row at a time.',
        'Watch the rhythm. Each flash is a clue.',
        'Some pairs hide in plain sight. Try the corners first.',
        'The order matters more than the colors.',
        'Memorize the top row first, then work down.',
        'Count the unique colors. That narrows it down.',
        'The first and last positions are often the same.',
        'Try matching from left to right.',
        'Almost there. Trust your instincts.'
      ],
      2: [
        'Burglars always enter from the edges.',
        'Watch the timing. The red zone has a rhythm.',
        'Some rooms are decoys. Focus on the path.',
        'The sequence follows a pattern. Look for repeats.',
        'Not every door needs to be open.',
        'Corners are safe spots. Start there.',
        'The shortest path is not always the safest.',
        'Count the steps before you commit.',
        'Speed matters less than accuracy.',
        'Kevin always has a backup plan.'
      ],
      3: [
        'The runes mirror each other. Look for symmetry.',
        'Move before the beam reaches you.',
        'Not every book tells the truth. Read the clues twice.',
        'Each rotation has six faces now. Count carefully.',
        'The Ring has a will of its own. Follow the lore.',
        'Ancient symbols have patterns. Compare the shapes.',
        'The Eye sweeps in arcs. Predict its path.',
        'Colors can be warm, cool, or neutral. Think about it.',
        'The tower aligns when all arrows point the same direction.',
        'Some characters refuse the Ring. That narrows the order.'
      ],
      4: [
        'You know this one. Think about what Ante would say.',
        'Speed over perfection. Just go in order.',
        'Her words have a distinct style. Listen for the passion.',
        'Count methodically. Row by row.',
        'The journey is almost over. Every brick counts.',
        'Memories are the key. What year was it?',
        'Think Billund. Think Croatia. Think home.',
        'The final brick completes the wall.',
        'Trust what you know about her work.',
        'This is your story. You know the answer.'
      ]
    };

    const chapterHints = hints[chapter] || hints[1];
    const hintIndex = Math.min(room - 1, chapterHints.length - 1);
    const hintText = chapterHints[hintIndex];

    const overlay = scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setDepth(350);
    overlay.setInteractive();

    const panel = scene.add.graphics().setDepth(351);
    panel.fillStyle(0x131824, 0.95);
    panel.fillRoundedRect(cx - 200, cy - 60, 400, 120, 10);
    panel.lineStyle(1, hexToInt(LEGO_COLORS.YELLOW), 0.3);
    panel.strokeRoundedRect(cx - 200, cy - 60, 400, 120, 10);

    const label = scene.add.text(cx, cy - 35, 'HINT', {
      fontFamily: FONT_MONO, fontSize: '14px', fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW, letterSpacing: 3
    }).setOrigin(0.5).setDepth(352);

    const hint = scene.add.text(cx, cy + 5, hintText, {
      fontFamily: FONT_BODY, fontSize: '18px', color: '#D0D8E8',
      wordWrap: { width: 360 }, align: 'center', lineSpacing: 4
    }).setOrigin(0.5).setDepth(352);

    const dismiss = scene.add.text(cx, cy + 45, 'TAP TO CLOSE', {
      fontFamily: FONT_MONO, fontSize: '14px', color: '#5A6A7A'
    }).setOrigin(0.5).setDepth(352);

    scene._hintOverlay = { overlay, panel, label, hint, dismiss };

    overlay.on('pointerdown', () => {
      overlay.destroy(); panel.destroy(); label.destroy(); hint.destroy(); dismiss.destroy();
      scene._hintOverlay = null;
    });

    // Auto-dismiss after 5 seconds
    scene.time.delayedCall(5000, () => {
      if (scene._hintOverlay) {
        overlay.destroy(); panel.destroy(); label.destroy(); hint.destroy(); dismiss.destroy();
        scene._hintOverlay = null;
      }
    });
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

  // Register interactive elements as controller-focusable
  registerFocusables(scene, items) {
    InputSystem.clearFocusables();
    const focusItems = items.map(item => ({
      element: item.hitArea || item.container || item.element,
      x: item.x,
      y: item.y,
      callback: item.callback,
      originalScale: 1
    }));
    InputSystem.setFocusables(focusItems);
  },

  // Show controller prompt at bottom of screen
  showControllerPrompts(scene) {
    if (!InputSystem.connected) return null;
    const cx = GAME_WIDTH / 2;
    const confirmIcon = InputSystem.getButtonIcon(0);
    const cancelIcon = InputSystem.getButtonIcon(1);
    const promptText = scene.add.text(cx, GAME_HEIGHT - 15,
      confirmIcon + ' Select    ' + cancelIcon + ' Back    D-Pad Navigate', {
      fontFamily: FONT_MONO,
      fontSize: '14px',
      color: '#4A5A6A',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(200);
    return promptText;
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
