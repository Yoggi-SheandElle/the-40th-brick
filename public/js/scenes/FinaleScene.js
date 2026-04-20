// Chapter 4: "Room 40" - The Birthday Finale
// Mix of quick puzzles + grand birthday reveal at the end
class FinaleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FinaleScene' });
  }

  init(data) {
    this.chapter = 4;
    this.players = data?.players || [];
    this.currentRoom = 0;
    this.totalRooms = 10;
  }

  create() {
    SceneUI.initPremiumUI(this, LEGO_COLORS.YELLOW);

    this.roomLabel = null;
    this.progressText = null;

    this.startRoom(0);

    network.on('puzzle_update', (data) => this.onPuzzleUpdate(data));
    network.on('achievement_unlocked', (data) => {
      // For the finale, go to birthday reveal instead of achievement
      this.showBirthdayReveal();
    });
  }

  startRoom(roomIndex) {
    this.currentRoom = roomIndex;
    InputSystem.clearFocusables();
    if (this.roomContainer) this.roomContainer.destroy();
    if (this.assemblyTimerEvent) { this.assemblyTimerEvent.remove(false); this.assemblyTimerEvent = null; }
    if (this.speedTimerEvent) { this.speedTimerEvent.remove(false); this.speedTimerEvent = null; }
    this.assemblyLocked = false;
    this.roomContainer = this.add.container(0, 0);

    // Last room is the birthday reveal
    if (roomIndex >= this.totalRooms - 1) {
      this.showBirthdayReveal();
      return;
    }

    const titles = [
      'The Journey Begins', 'Croatia Memories', 'Billund Dreams',
      'First Design', 'Friends Forever', 'Ideas Factory',
      'Icons Rising', 'Design Master', 'The Final Brick'
    ];
    SceneUI.createRoomHeader(this, 4, 'ROOM 40', titles[roomIndex] || 'Room ' + (roomIndex + 1), 30 + roomIndex + 1, 40);

    // Personal celebration intro (Ante's milestones)
    const milestones = ['2021: Home Alone ships!', '2022: Table Football', '2023: New challenges',
                        '2024: Alpine Lodge + Barad-dur', '2025: Flying Machine', '2026: Master Designer',
                        'The legacy continues', 'Almost there...', 'The final brick'];
    const introText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20,
      milestones[roomIndex] || 'A milestone in the journey', {
      fontFamily: FONT_BODY, fontSize: '20px', fontStyle: 'italic', color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5).setAlpha(0).setDepth(10);
    this.roomContainer.add(introText);
    this.tweens.add({ targets: introText, alpha: 0.8, duration: 500, yoyo: true, hold: 2500 });

    // Second-to-last room (index 8 / displayed room 39) is Ante's Mega Speed Build,
    // the gauntlet before the birthday reveal. All other rooms rotate through
    // the 5 main puzzle types.
    if (roomIndex === this.totalRooms - 2) {
      this.createMegaSpeedBuildPuzzle();
      return;
    }

    const puzzleType = roomIndex % 5;
    switch (puzzleType) {
      case 0: this.createTriviaPuzzle(roomIndex); break;
      case 1: this.createSpeedBuildPuzzle(); break;
      case 2: this.createQuoteGuessPuzzle(); break;
      case 3: this.createBrickCountPuzzle(roomIndex); break;
      case 4: this.createSetAssemblyPuzzle(roomIndex); break;
    }
  }

  // PUZZLE: Ante's request - 100 bricks, click in order, wrong = full restart
  // 10x10 grid with slight jitter, HUGE "FIND" indicator so she can scan fast
  createMegaSpeedBuildPuzzle() {
    const cx = GAME_WIDTH / 2;
    const TOTAL = 100;
    const TIME_LIMIT = 75;

    // Title - big and obvious
    this.roomContainer.add(
      this.add.text(cx, 82, "ANTE'S GAUNTLET", {
        fontFamily: '"Rajdhani"',
        fontSize: '34px',
        fontStyle: 'bold',
        color: LEGO_COLORS.YELLOW,
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5)
    );
    this.roomContainer.add(
      this.add.text(cx, 110, 'Click bricks 1 to 100 in order. Wrong click = START OVER.', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        fontStyle: 'bold',
        color: LEGO_COLORS.CYAN
      }).setOrigin(0.5)
    );

    // Grid layout: 10 cols x 10 rows centered, room for HUD at the bottom
    const cols = 10;
    const rows = 10;
    const cellW = 58;
    const cellH = 50;
    const gridW = cols * cellW;
    const gridH = rows * cellH;
    const gridLeft = (GAME_WIDTH - gridW) / 2;
    const gridTop = 140;

    this.megaNext = 1;
    this.megaBricks = [];        // { graphic, label, hitArea, num }
    this.megaStartTime = this.time.now;
    this.megaFailed = false;

    // Persistent state holders so we can rebuild on restart
    const self = this;
    const brickColors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN, LEGO_COLORS.YELLOW,
                         LEGO_COLORS.ORANGE, LEGO_COLORS.BRIGHT_PINK, LEGO_COLORS.MEDIUM_LAVENDER,
                         LEGO_COLORS.BRIGHT_LIGHT_BLUE, LEGO_COLORS.SAND_GREEN, LEGO_COLORS.TAN];

    const buildGrid = () => {
      // Clear any previous bricks
      self.megaBricks.forEach(b => {
        if (b.graphic && b.graphic.active) b.graphic.destroy();
        if (b.label && b.label.active) b.label.destroy();
        if (b.hitArea && b.hitArea.active) b.hitArea.destroy();
      });
      self.megaBricks = [];
      self.megaNext = 1;

      // Build a shuffled index list so number 1 isn't always top-left
      const cellIndices = Array.from({ length: TOTAL }, (_, i) => i);
      for (let i = cellIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cellIndices[i], cellIndices[j]] = [cellIndices[j], cellIndices[i]];
      }

      for (let num = 1; num <= TOTAL; num++) {
        const cell = cellIndices[num - 1];
        const col = cell % cols;
        const row = Math.floor(cell / cols);
        // Small jitter so it doesn't look perfectly gridded
        const jitterX = (Math.random() - 0.5) * 6;
        const jitterY = (Math.random() - 0.5) * 6;
        const x = gridLeft + col * cellW + cellW / 2 + jitterX;
        const y = gridTop + row * cellH + cellH / 2 + jitterY;
        const color = brickColors[(num - 1) % brickColors.length];

        const brick = self.add.graphics();
        brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
        brick.fillRoundedRect(x - 26, y - 18, 52, 36, 6);
        brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).lighten(18).color, 1);
        brick.fillCircle(x - 11, y - 20, 6);
        brick.fillCircle(x + 11, y - 20, 6);
        self.roomContainer.add(brick);

        const label = self.add.text(x, y, num.toString(), {
          fontFamily: '"Rajdhani"',
          fontSize: '22px',
          fontStyle: 'bold',
          color: LEGO_COLORS.WHITE,
          stroke: '#000000',
          strokeThickness: 4
        }).setOrigin(0.5);
        self.roomContainer.add(label);

        const hitArea = self.add.rectangle(x, y, 56, 44, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => self.handleMegaClick(num));
        self.roomContainer.add(hitArea);

        self.megaBricks.push({ graphic: brick, label, hitArea, num });
      }

      // Controller focusables
      const focusables = self.megaBricks.map(b => ({
        element: null, x: b.hitArea.x, y: b.hitArea.y,
        callback: () => self.handleMegaClick(b.num)
      }));
      InputSystem.setFocusables(focusables);
    };

    // HUD: big "FIND: N" target indicator
    this.megaTargetText = this.add.text(cx - 170, GAME_HEIGHT - 40, 'FIND: 1', {
      fontFamily: '"Rajdhani"',
      fontSize: '36px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(20);
    this.roomContainer.add(this.megaTargetText);

    // HUD: progress
    this.megaProgressText = this.add.text(cx, GAME_HEIGHT - 40, '0 / 100', {
      fontFamily: '"Rajdhani"',
      fontSize: '32px',
      fontStyle: 'bold',
      color: LEGO_COLORS.WHITE,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(20);
    this.roomContainer.add(this.megaProgressText);

    // HUD: timer
    this.megaTimer = TIME_LIMIT;
    this.megaTimerText = this.add.text(cx + 170, GAME_HEIGHT - 40, `${TIME_LIMIT}s`, {
      fontFamily: '"Rajdhani"',
      fontSize: '36px',
      fontStyle: 'bold',
      color: LEGO_COLORS.CYAN,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(20);
    this.roomContainer.add(this.megaTimerText);

    const startTimer = () => {
      if (this.megaTimerEvent) this.megaTimerEvent.remove();
      this.megaTimerEvent = this.time.addEvent({
        delay: 1000,
        repeat: TIME_LIMIT - 1,
        callback: () => {
          if (this.megaFailed) return;
          this.megaTimer--;
          if (this.megaTimerText && this.megaTimerText.active) {
            this.megaTimerText.setText(`${this.megaTimer}s`);
            if (this.megaTimer <= 10) this.megaTimerText.setColor(LEGO_COLORS.RED);
            else this.megaTimerText.setColor(LEGO_COLORS.CYAN);
          }
          if (this.megaTimer <= 0) {
            this.megaFailed = true;
            this.showFeedback('TIME UP!\nStart over...', LEGO_COLORS.RED, () => this.megaRestart());
          }
        }
      });
    };

    this.megaRestart = () => {
      this.megaFailed = false;
      this.megaTimer = TIME_LIMIT;
      this.megaStartTime = this.time.now;
      if (this.megaTargetText && this.megaTargetText.active) this.megaTargetText.setText('FIND: 1');
      if (this.megaProgressText && this.megaProgressText.active) this.megaProgressText.setText('0 / 100');
      if (this.megaTimerText && this.megaTimerText.active) {
        this.megaTimerText.setText(`${TIME_LIMIT}s`);
        this.megaTimerText.setColor(LEGO_COLORS.CYAN);
      }
      buildGrid();
      startTimer();
    };

    buildGrid();
    startTimer();
  }

  handleMegaClick(num) {
    if (this.megaFailed) return;
    if (num === this.megaNext) {
      // Correct - make this brick vanish
      const b = this.megaBricks[num - 1];
      if (b) {
        if (b.graphic && b.graphic.active) b.graphic.destroy();
        if (b.label && b.label.active) b.label.destroy();
        if (b.hitArea && b.hitArea.active) b.hitArea.destroy();
      }
      this.megaNext++;
      const progress = this.megaNext - 1;
      if (this.megaProgressText && this.megaProgressText.active) {
        this.megaProgressText.setText(`${progress} / 100`);
      }
      if (this.megaTargetText && this.megaTargetText.active && this.megaNext <= 100) {
        this.megaTargetText.setText(`FIND: ${this.megaNext}`);
      }
      // Milestone flashes so the long grind feels alive
      if (progress === 25 || progress === 50 || progress === 75) {
        const msg = progress + '/100. Keep going, Ante!';
        launchCelebrationConfetti(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 18);
        SceneUI.showAchievementFlash(this, msg, progress === 75 ? '⭐' : '🧱');
      }
      network.sendPuzzleAction('mega_click', { brick: num });

      if (this.megaNext > 100) {
        // WIN!
        this.megaFailed = true; // stops timer
        const elapsed = Math.round((this.time.now - this.megaStartTime) / 100) / 10;
        this.showFeedback(`100/100!\nTime: ${elapsed}s`, LEGO_COLORS.GREEN, () => this.nextRoom());
      }
    } else {
      // WRONG - full restart per Ante's request
      this.megaFailed = true;
      this.showFeedback(`WRONG! You clicked ${num}, needed ${this.megaNext}\nSTART OVER`, LEGO_COLORS.RED, () => {
        this.megaRestart();
      });
    }
  }

  // PUZZLE: Trivia about Antica's career
  createTriviaPuzzle(roomIndex) {
    const cx = GAME_WIDTH / 2;

    const trivia = [
      {
        q: 'What country is Ante from?',
        options: ['Denmark', 'Croatia', 'Germany', 'Sweden'],
        correct: 1
      },
      {
        q: 'What year did Ante join LEGO?',
        options: ['2012', '2014', '2016', '2018'],
        correct: 2
      },
      {
        q: 'How many pieces is Barad-dur?',
        options: ['3,955', '4,032', '5,471', '6,200'],
        correct: 2
      },
      {
        q: 'Which theme did Ante work on for 5 years?',
        options: ['City', 'Friends', 'Technic', 'Creator'],
        correct: 1
      },
      {
        q: 'What was hidden in Table Football foundations?',
        options: ['A coin', 'A minifig', 'A postcard', 'A key'],
        correct: 2
      },
      {
        q: 'How often does Ante rewatch LOTR?',
        options: ['Every year', 'Every few months', 'Every week', 'Never'],
        correct: 1
      },
      {
        q: "What room was placed for Kevin's scream?",
        options: ['Bedroom', 'Kitchen', 'Bathroom', 'Basement'],
        correct: 2
      },
      {
        q: "What's the Flying Machine described as?",
        options: ['A sculpture', 'One big function', 'A display piece', 'A toy'],
        correct: 1
      },
      {
        q: "What is Ante's current title at LEGO?",
        options: ['Junior Designer', 'Model Designer', 'Design Master', 'Art Director'],
        correct: 2
      },
      {
        q: 'What color is Dori, the older dog?',
        options: ['Black', 'Brown', 'White', 'Golden'],
        correct: 2
      },
      {
        q: 'What color is Pino, the younger dog?',
        options: ['White', 'Brown', 'Golden', 'Black'],
        correct: 3
      },
      {
        q: 'Total pieces: Home Alone + Table Football + Barad-dur?',
        options: ['9,450', '10,295', '11,765', '12,890'],
        correct: 2
      },
      {
        q: 'Which object shows your deepest desire in Harry Potter?',
        options: ['Pensieve', 'Mirror of Erised', 'Marauders Map', 'Time Turner'],
        correct: 1
      }
    ];

    const t = trivia[roomIndex % trivia.length];

    this.roomContainer.add(
      this.add.text(cx, 80, 'ANTE TRIVIA', {
        fontFamily: '"Rajdhani"',
        fontSize: '38px',
        fontStyle: 'bold',
        color: LEGO_COLORS.BRIGHT_PINK
      }).setOrigin(0.5)
    );

    this.roomContainer.add(
      this.add.text(cx, 155, t.q, {
        fontFamily: '"Rajdhani"',
        fontSize: '30px',
        fontStyle: 'bold',
        color: LEGO_COLORS.WHITE,
        wordWrap: { width: 1000 },
        align: 'center'
      }).setOrigin(0.5)
    );

    // Timer - 15 seconds, no hard lock on wrong. Reveals answer on timeout.
    this.triviaTimer = 15;
    this.triviaLocked = false;
    this.triviaWrongs = new Set();
    const timerText = this.add.text(cx, 220, `Time: ${this.triviaTimer}`, {
      fontFamily: '"Rajdhani"', fontSize: '36px', fontStyle: 'bold', color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);
    this.roomContainer.add(timerText);

    const btnRefs = [];

    const revealAndAdvance = (msg, color) => {
      this.triviaLocked = true;
      // Flash correct answer
      if (btnRefs[t.correct]) {
        const { bg } = btnRefs[t.correct];
        this.tweens.add({
          targets: bg, alpha: 0.3, duration: 300, yoyo: true, repeat: 3
        });
      }
      this.showFeedback(msg + '\nAnswer: ' + t.options[t.correct], color, () => this.nextRoom());
    };

    this.triviaTimerEvent = this.time.addEvent({
      delay: 1000,
      repeat: 14,
      callback: () => {
        if (!timerText || !timerText.active || this.triviaLocked) return;
        this.triviaTimer--;
        timerText.setText(`Time: ${this.triviaTimer}`);
        if (this.triviaTimer <= 5) timerText.setColor(LEGO_COLORS.RED);
        if (this.triviaTimer <= 0) revealAndAdvance('TIME UP!', LEGO_COLORS.RED);
      }
    });

    const pickAnswer = (i) => {
      if (this.triviaLocked) return;
      network.sendPuzzleAction('trivia_answer', { answer: i });
      if (i === t.correct) {
        this.triviaLocked = true;
        this.showFeedback('CORRECT!', LEGO_COLORS.GREEN, () => this.nextRoom());
      } else {
        this.triviaWrongs.add(i);
        // Grey out wrong answer, short shake, no lockout
        const ref = btnRefs[i];
        if (ref) {
          ref.bg.clear();
          ref.bg.fillStyle(0x2A2A3E, 0.6);
          ref.bg.fillRoundedRect(-200, -42, 400, 84, 10);
          ref.bg.lineStyle(2, hexToInt(LEGO_COLORS.RED), 0.5);
          ref.bg.strokeRoundedRect(-200, -42, 400, 84, 10);
          ref.lbl.setColor('#666666');
          ref.btn.disableInteractive();
        }
        this.cameras.main.shake(120, 0.003);
        InputSystem.vibrate(100, 0.4, 0.4);
        // If all wrong options tried, reveal
        if (this.triviaWrongs.size >= 3) {
          revealAndAdvance('ALMOST!', LEGO_COLORS.YELLOW);
        }
      }
    };

    t.options.forEach((opt, i) => {
      const bx = cx + (i % 2 === 0 ? -220 : 220);
      const by = 340 + Math.floor(i / 2) * 110;

      const btn = this.add.container(bx, by);
      const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN, LEGO_COLORS.ORANGE];
      const bg = this.add.graphics();
      bg.fillStyle(Phaser.Display.Color.HexStringToColor(colors[i]).color, 1);
      bg.fillRoundedRect(-200, -42, 400, 84, 10);
      bg.lineStyle(3, 0xffffff, 0.3);
      bg.strokeRoundedRect(-200, -42, 400, 84, 10);
      const lbl = this.add.text(0, 0, opt, {
        fontFamily: '"Rajdhani"',
        fontSize: '30px',
        fontStyle: 'bold',
        color: LEGO_COLORS.WHITE,
        wordWrap: { width: 380 },
        align: 'center'
      }).setOrigin(0.5);
      btn.add([bg, lbl]);
      btn.setSize(400, 84);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => pickAnswer(i));
      this.roomContainer.add(btn);
      btnRefs[i] = { btn, bg, lbl };
    });

    // SKIP button - Ante can always move on
    const skipBtn = this.add.container(cx, GAME_HEIGHT - 55);
    const skipBg = this.add.graphics();
    skipBg.fillStyle(0x1A2030, 0.9);
    skipBg.fillRoundedRect(-80, -22, 160, 44, 8);
    skipBg.lineStyle(2, hexToInt(LEGO_COLORS.CYAN), 0.6);
    skipBg.strokeRoundedRect(-80, -22, 160, 44, 8);
    const skipLbl = this.add.text(0, 0, 'SKIP >', {
      fontFamily: '"Rajdhani"', fontSize: '22px', fontStyle: 'bold', color: LEGO_COLORS.CYAN
    }).setOrigin(0.5);
    skipBtn.add([skipBg, skipLbl]);
    skipBtn.setSize(160, 44);
    skipBtn.setInteractive({ useHandCursor: true });
    skipBtn.on('pointerdown', () => revealAndAdvance('SKIPPED', LEGO_COLORS.CYAN));
    this.roomContainer.add(skipBtn);

    const triviaFocusables = t.options.map((opt, i) => {
      const bx = cx + (i % 2 === 0 ? -220 : 220);
      const by = 340 + Math.floor(i / 2) * 110;
      return { element: null, x: bx, y: by, callback: () => pickAnswer(i) };
    });
    triviaFocusables.push({ element: skipBtn, x: cx, y: GAME_HEIGHT - 55, callback: () => skipBtn.emit('pointerdown') });
    InputSystem.setFocusables(triviaFocusables);
  }

  // PUZZLE: Speed build - click bricks in order as fast as possible
  createSpeedBuildPuzzle() {
    const cx = GAME_WIDTH / 2;

    this.roomContainer.add(
      this.add.text(cx, 78, 'SPEED BUILD!\nClick bricks 1-12 in order!', {
        fontFamily: '"Rajdhani"',
        fontSize: '30px',
        fontStyle: 'bold',
        color: LEGO_COLORS.YELLOW,
        align: 'center',
        lineSpacing: 8
      }).setOrigin(0.5)
    );

    const numBricks = 12;
    const positions = [];
    for (let i = 0; i < numBricks; i++) {
      positions.push({
        x: 80 + Math.random() * (GAME_WIDTH - 160),
        y: 130 + Math.random() * (GAME_HEIGHT - 250)
      });
    }

    this.buildNext = 1;
    this.buildLocked = false;
    const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN, LEGO_COLORS.YELLOW,
                    LEGO_COLORS.ORANGE, LEGO_COLORS.BRIGHT_PINK, LEGO_COLORS.MEDIUM_LAVENDER, LEGO_COLORS.BRIGHT_LIGHT_BLUE];

    const brickRefs = [];

    const paintBrick = (brick, label, color, num) => {
      brick.clear();
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
      brick.fillRoundedRect(-38, -26, 76, 52, 6);
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).lighten(15).color, 1);
      brick.fillCircle(-14, -28, 7);
      brick.fillCircle(14, -28, 7);
      label.setColor(LEGO_COLORS.WHITE);
      label.setText(num.toString());
    };

    positions.forEach((pos, i) => {
      const num = i + 1;
      const color = colors[i % colors.length];

      const brick = this.add.graphics({ x: pos.x, y: pos.y });
      this.roomContainer.add(brick);

      const label = this.add.text(pos.x, pos.y, num.toString(), {
        fontFamily: '"Rajdhani"',
        fontSize: '40px',
        fontStyle: 'bold',
        color: LEGO_COLORS.WHITE,
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      this.roomContainer.add(label);
      paintBrick(brick, label, color, num);
      brickRefs.push({ brick, label, color, num });

      const hitArea = this.add.rectangle(pos.x, pos.y, 80, 60, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        if (this.buildLocked) return;
        if (num === this.buildNext) {
          brick.clear();
          brick.fillStyle(hexToInt(LEGO_COLORS.GREEN), 0.5);
          brick.fillRoundedRect(-38, -26, 76, 52, 6);
          label.setColor(LEGO_COLORS.GREEN);
          label.setText('OK');
          this.buildNext++;
          network.sendPuzzleAction('speed_click', { brick: num });

          if (this.buildNext > numBricks) {
            this.buildLocked = true;
            this.showFeedback('SPEED BUILD COMPLETE!', LEGO_COLORS.GREEN, () => this.nextRoom());
          }
        }
      });
      this.roomContainer.add(hitArea);
    });

    const resetBricks = () => {
      brickRefs.forEach(r => paintBrick(r.brick, r.label, r.color, r.num));
    };

    // Register focusables for controller navigation
    const speedFocusables = positions.map((pos, i) => ({
      element: null, x: pos.x, y: pos.y, callback: () => {
        if (this.buildLocked) return;
        const num = i + 1;
        if (num === this.buildNext) {
          this.buildNext++;
          network.sendPuzzleAction('speed_click', { brick: num });
          if (this.buildNext > numBricks) {
            this.buildLocked = true;
            this.showFeedback('SPEED BUILD COMPLETE!', LEGO_COLORS.GREEN, () => this.nextRoom());
          }
        }
      }
    }));
    InputSystem.setFocusables(speedFocusables);

    // Timer
    this.buildTimer = 15;
    this.timerText = this.add.text(cx, GAME_HEIGHT - 40, `Time: ${this.buildTimer}`, {
      fontFamily: '"Rajdhani"',
      fontSize: '36px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.roomContainer.add(this.timerText);

    const startTimer = () => {
      if (this.speedTimerEvent) this.speedTimerEvent.remove(false);
      this.speedTimerEvent = this.time.addEvent({
        delay: 1000,
        repeat: 14,
        callback: () => {
          if (this.buildLocked) return;
          this.buildTimer--;
          if (this.timerText) this.timerText.setText(`Time: ${this.buildTimer}`);
          if (this.buildTimer <= 0 && this.buildNext <= numBricks) {
            this.buildLocked = true;
            this.showFeedback('TOO SLOW! Try again.', LEGO_COLORS.RED, () => {
              this.buildNext = 1;
              this.buildTimer = 15;
              if (this.timerText) this.timerText.setText(`Time: ${this.buildTimer}`);
              resetBricks();
              this.buildLocked = false;
              startTimer();
            });
          }
        }
      });
    };
    startTimer();
  }

  // PUZZLE: Guess which quote belongs to Ante
  createQuoteGuessPuzzle() {
    const cx = GAME_WIDTH / 2;

    const realQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const fakeQuotes = [
      'I always start with the color palette before anything else.',
      'The most important thing is making sure every stud is visible.',
      'I prefer working alone rather than in teams.',
      'Technic bricks are my favorite element to use.',
      'My designs always begin with the minifigure in mind.',
      'The box art is what I design first, then work backwards.'
    ];

    // Shuffle fakes and pick 3
    const shuffledFakes = [...fakeQuotes].sort(() => Math.random() - 0.5);
    const options = [realQuote.text, shuffledFakes[0], shuffledFakes[1], shuffledFakes[2]];

    // Shuffle all options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    const correctFinal = options.indexOf(realQuote.text);

    this.roomContainer.add(
      this.add.text(cx, 75, "Which quote is really Ante's?", {
        fontFamily: '"Rajdhani"',
        fontSize: '34px',
        fontStyle: 'bold',
        color: LEGO_COLORS.BRIGHT_PINK
      }).setOrigin(0.5)
    );

    const quoteColors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN, LEGO_COLORS.ORANGE];
    const boxWidth = GAME_WIDTH - 120;        // 1160
    const boxHeight = 135;                    // fits 3 lines at 30px + padding
    const boxSpacing = 148;                   // vertical gap between boxes
    const firstBoxY = 110;                    // top of first box (below title)
    const textWrapWidth = GAME_WIDTH - 240;   // 1040, leaves room for number label + padding

    this.quoteGreyed = new Set();
    const quoteRefs = [];

    const greyOutBox = (ref) => {
      ref.bg.clear();
      ref.bg.fillStyle(0x1A1A24, 0.9);
      ref.bg.fillRoundedRect(60, ref.boxTop, boxWidth, boxHeight, 12);
      ref.bg.lineStyle(2, 0x444444, 0.4);
      ref.bg.strokeRoundedRect(60, ref.boxTop, boxWidth, boxHeight, 12);
      ref.numLbl.setColor('#4A4A5A');
      ref.quoteText.setColor('#555566');
      if (ref.hitArea.disableInteractive) ref.hitArea.disableInteractive();
    };

    options.forEach((quote, i) => {
      const boxTop = firstBoxY + i * boxSpacing;
      const boxCenterY = boxTop + boxHeight / 2;

      const bg = this.add.graphics();
      bg.fillStyle(0x2A2A3E, 1);
      bg.fillRoundedRect(60, boxTop, boxWidth, boxHeight, 12);
      bg.lineStyle(3, hexToInt(quoteColors[i]), 0.8);
      bg.strokeRoundedRect(60, boxTop, boxWidth, boxHeight, 12);
      this.roomContainer.add(bg);

      const numLbl = this.add.text(90, boxTop + 14, `${i + 1}.`, {
        fontFamily: '"Rajdhani"',
        fontSize: '38px',
        fontStyle: 'bold',
        color: quoteColors[i]
      });
      this.roomContainer.add(numLbl);

      const quoteText = this.add.text(cx, boxCenterY, `"${quote}"`, {
        fontFamily: '"Rajdhani"',
        fontSize: '30px',
        fontStyle: 'bold',
        color: LEGO_COLORS.WHITE,
        wordWrap: { width: textWrapWidth },
        align: 'center',
        lineSpacing: 6
      }).setOrigin(0.5);
      this.roomContainer.add(quoteText);

      const hitArea = this.add.rectangle(cx, boxCenterY, boxWidth, boxHeight, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      const ref = { bg, numLbl, quoteText, hitArea, boxTop };
      quoteRefs.push(ref);

      hitArea.on('pointerdown', () => {
        if (this.quoteGreyed.has(i)) return;
        network.sendPuzzleAction('quote_guess', { choice: i });
        if (i === correctFinal) {
          this.showFeedback(`YES! - ${realQuote.source}`, LEGO_COLORS.GREEN, () => this.nextRoom());
        } else {
          this.quoteGreyed.add(i);
          greyOutBox(ref);
          this.showFeedback("That wasn't Ante!", LEGO_COLORS.RED);
        }
      });
      this.roomContainer.add(hitArea);
    });

    // Register focusables for controller navigation
    const quoteFocusables = options.map((quote, i) => {
      const boxCenterY = firstBoxY + i * boxSpacing + boxHeight / 2;
      return { element: null, x: cx, y: boxCenterY,
        callback: () => quoteRefs[i].hitArea.emit('pointerdown') };
    });
    InputSystem.setFocusables(quoteFocusables);
  }

  // PUZZLE: Count bricks
  createBrickCountPuzzle(roomIndex) {
    const cx = GAME_WIDTH / 2;
    const targetCount = 10 + Math.floor(Math.random() * 11);

    this.roomContainer.add(
      this.add.text(cx, 80, 'How many bricks do you count?', {
        fontFamily: '"Rajdhani"',
        fontSize: '34px',
        fontStyle: 'bold',
        color: LEGO_COLORS.YELLOW
      }).setOrigin(0.5)
    );

    // Scatter bricks with overlapping for difficulty.
    // Draw each brick at LOCAL (0,0) and position the Graphics object via x/y so
    // setAngle rotates around the brick centre instead of the canvas origin.
    const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN,
                    LEGO_COLORS.YELLOW, LEGO_COLORS.ORANGE, LEGO_COLORS.BRIGHT_PINK];
    for (let i = 0; i < targetCount; i++) {
      const bx = 120 + Math.random() * (GAME_WIDTH - 240);
      const by = 170 + Math.random() * 340;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const angle = (Math.random() - 0.5) * 30;

      const brick = this.add.graphics();
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.85 + Math.random() * 0.15);
      brick.fillRoundedRect(-28, -18, 56, 36, 5);
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).lighten(15).color, 1);
      brick.fillCircle(-10, -20, 6);
      brick.fillCircle(10, -20, 6);
      brick.setPosition(bx, by);
      brick.setAngle(angle);
      this.roomContainer.add(brick);
    }

    // Number buttons - options are very close together (consecutive numbers)
    const options = [targetCount - 1, targetCount, targetCount + 1, targetCount + 2]
      .sort(() => Math.random() - 0.5);

    options.forEach((num, i) => {
      const bx = cx - 270 + i * 180;
      const by = GAME_HEIGHT - 80;

      const btn = this.add.container(bx, by);
      const bg = this.add.graphics();
      bg.fillStyle(hexToInt(LEGO_COLORS.BLUE), 1);
      bg.fillRoundedRect(-70, -40, 140, 80, 10);
      bg.lineStyle(3, 0xffffff, 0.4);
      bg.strokeRoundedRect(-70, -40, 140, 80, 10);
      const lbl = this.add.text(0, 0, num.toString(), {
        fontFamily: '"Rajdhani"',
        fontSize: '48px',
        fontStyle: 'bold',
        color: LEGO_COLORS.WHITE
      }).setOrigin(0.5);
      btn.add([bg, lbl]);
      btn.setSize(140, 80);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => this._handleBrickCountPick(num, targetCount));
      this.roomContainer.add(btn);
    });

    // Register focusables for controller navigation
    const countFocusables = options.map((num, i) => {
      const bx = cx - 270 + i * 180;
      const by = GAME_HEIGHT - 80;
      return { element: null, x: bx, y: by,
        callback: () => this._handleBrickCountPick(num, targetCount) };
    });
    InputSystem.setFocusables(countFocusables);
  }

  _handleBrickCountPick(num, targetCount) {
    network.sendPuzzleAction('count_answer', { answer: num });
    if (num === targetCount) {
      launchCelebrationConfetti(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 40);
      this.showFeedback('CORRECT!', LEGO_COLORS.GREEN, () => this.nextRoom());
    } else {
      this.showFeedback(`It was ${targetCount}!`, LEGO_COLORS.RED);
    }
  }

  // PUZZLE: Timed Set Assembly - reassemble Ante's iconic LEGO sets
  createSetAssemblyPuzzle(roomIndex) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const sets = [
      { name: "Emma's Fashion Shop", year: 2018, theme: 'Friends', pieces: 6,
        parts: ['Corner wall', 'Shop window', 'Upstairs room', 'Dress rack', 'Sewing machine', 'Balcony'] },
      { name: 'Home Alone House', year: 2021, theme: 'Ideas', pieces: 6,
        parts: ['Front wall (opening)', 'Kitchen', 'Bathroom', 'Attic', 'Treehouse', 'Zipline'] },
      { name: 'Table Football', year: 2022, theme: 'Ideas', pieces: 6,
        parts: ['Pitch base', 'Goal mechanism', 'Player rods', 'Score counter', 'Side walls', 'Ball launcher'] },
      { name: 'Alpine Lodge', year: 2024, theme: 'Icons', pieces: 7,
        parts: ['Log cabin base', 'A-frame roof', 'Balcony', 'Fireplace', 'Snowmobile', 'Ski rack', 'Chimney'] },
      { name: 'Barad-dur', year: 2024, theme: 'Icons', pieces: 8,
        parts: ['Tower base', 'Orc forge', "Sauron's library", 'Prison cell', 'Spiral staircase', 'Upper tower', 'Eye of Sauron', 'Sauron minifig'] },
      { name: "Da Vinci's Flying Machine", year: 2025, theme: 'Icons', pieces: 7,
        parts: ['Wing frame L', 'Wing frame R', 'String mechanism', 'Pilot seat', 'Tail section', 'Display stand', 'Crank handle'] },
      { name: 'Sherlock Holmes Book Nook', year: 2025, theme: 'Icons', pieces: 8,
        parts: ['Book spine frame', '221B apartment', 'Fireplace', 'Violin', 'Clue board', 'Holmes minifig', 'Watson minifig', 'Moriarty minifig'] }
    ];

    const setData = sets[roomIndex % sets.length];
    const numParts = setData.parts.length;

    // Shuffle parts
    const shuffled = [...setData.parts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    this.assemblyOrder = [];
    this.assemblyTarget = setData.parts; // correct order
    this.assemblyTimer = 20;

    this.roomContainer.add(
      this.add.text(cx, 86, 'ASSEMBLE: ' + setData.name.toUpperCase(), {
        fontFamily: FONT_TITLE, fontSize: '30px', fontStyle: 'bold',
        color: LEGO_COLORS.YELLOW
      }).setOrigin(0.5)
    );

    this.roomContainer.add(
      this.add.text(cx, 122, setData.theme + ' (' + setData.year + ') - ' + numParts + ' sections', {
        fontFamily: FONT_BODY, fontSize: '22px', color: '#BBCCDD'
      }).setOrigin(0.5)
    );

    this.roomContainer.add(
      this.add.text(cx, 152, 'Tap parts in the correct build order!', {
        fontFamily: FONT_BODY, fontSize: '24px', fontStyle: 'bold', color: LEGO_COLORS.CYAN
      }).setOrigin(0.5)
    );

    // Assembly progress display
    this.assemblyProgress = this.add.text(cx, 188, '', {
      fontFamily: FONT_BODY, fontSize: '22px', fontStyle: 'bold', color: LEGO_COLORS.GREEN,
      align: 'center', wordWrap: { width: 1100 }
    }).setOrigin(0.5);
    this.roomContainer.add(this.assemblyProgress);

    // Part buttons (shuffled)
    const cols = Math.min(4, numParts);
    const rows = Math.ceil(numParts / cols);
    const btnW = 260;
    const btnH = 72;
    const gapX = 20;
    const gapY = 16;
    const startX = cx - ((cols * (btnW + gapX) - gapX) / 2) + btnW / 2;
    const startY = 250;
    const focusItems = [];

    this.assemblyLocked = false;
    this.assemblyBtns = [];

    shuffled.forEach((part, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = startX + col * (btnW + gapX);
      const by = startY + row * (btnH + gapY);

      const btn = this.add.container(bx, by);
      const bg = this.add.graphics();
      bg.fillStyle(0x1A2030, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
      bg.lineStyle(2, hexToInt(LEGO_COLORS.CYAN), 0.5);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
      const lbl = this.add.text(0, 0, part, {
        fontFamily: FONT_BODY, fontSize: '22px', fontStyle: 'bold', color: '#E8EEFA',
        wordWrap: { width: btnW - 20 }, align: 'center'
      }).setOrigin(0.5);
      btn.add([bg, lbl]);
      btn.setSize(btnW, btnH);
      btn.setInteractive({ useHandCursor: true });
      this.assemblyBtns.push(btn);

      const idx = i;
      btn.on('pointerdown', () => {
        if (this.assemblyLocked) return;
        const correctNext = this.assemblyTarget[this.assemblyOrder.length];
        if (part === correctNext) {
          // Correct!
          this.assemblyOrder.push(part);
          bg.clear();
          bg.fillStyle(hexToInt(LEGO_COLORS.GREEN), 0.3);
          bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
          bg.lineStyle(2, hexToInt(LEGO_COLORS.GREEN), 0.8);
          bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
          lbl.setColor(LEGO_COLORS.GREEN);
          btn.disableInteractive();
          InputSystem.vibrate(50, 0.2, 0.3);

          this.assemblyProgress.setText(
            this.assemblyOrder.map((p, j) => (j + 1) + '. ' + p).join('  >  ')
          );

          network.sendPuzzleAction('assembly_pick', { part, index: this.assemblyOrder.length });

          if (this.assemblyOrder.length === numParts) {
            this.showFeedback('SET COMPLETE!\n' + setData.name, LEGO_COLORS.GREEN, () => this.nextRoom());
          }
        } else {
          // Wrong order - lock all buttons during the flash
          this.assemblyLocked = true;
          bg.clear();
          bg.fillStyle(hexToInt(LEGO_COLORS.RED), 0.35);
          bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
          bg.lineStyle(2, hexToInt(LEGO_COLORS.RED), 0.8);
          bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
          InputSystem.vibrate(100, 0.4, 0.6);
          this.time.delayedCall(500, () => {
            bg.clear();
            bg.fillStyle(0x1A2030, 1);
            bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
            bg.lineStyle(2, hexToInt(LEGO_COLORS.CYAN), 0.5);
            bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
            lbl.setColor('#E8EEFA');
            this.assemblyLocked = false;
          });
        }
      });
      this.roomContainer.add(btn);
      focusItems.push({ element: btn, x: bx, y: by, callback: () => btn.emit('pointerdown') });
    });

    // Timer
    this.assemblyTimerText = this.add.text(cx, GAME_HEIGHT - 40, 'Time: ' + this.assemblyTimer, {
      fontFamily: FONT_MONO, fontSize: '32px', fontStyle: 'bold', color: LEGO_COLORS.YELLOW,
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);
    this.roomContainer.add(this.assemblyTimerText);

    this.assemblyTimerEvent = this.time.addEvent({
      delay: 1000,
      repeat: this.assemblyTimer - 1,
      callback: () => {
        if (!this.assemblyTimerText || !this.assemblyTimerText.active) return;
        this.assemblyTimer--;
        if (this.assemblyTimerText) {
          this.assemblyTimerText.setText('Time: ' + this.assemblyTimer);
          if (this.assemblyTimer <= 5) this.assemblyTimerText.setColor(LEGO_COLORS.RED);
        }
        if (this.assemblyTimer <= 0) {
          this.assemblyLocked = true;
          if (this.assemblyTimerEvent) { this.assemblyTimerEvent.remove(false); this.assemblyTimerEvent = null; }
          this.showFeedback('TIME UP!\nThe set stays unfinished...', LEGO_COLORS.RED);
          this.time.delayedCall(2000, () => this.startRoom(this.currentRoom));
        }
      }
    });

    InputSystem.setFocusables(focusItems);
  }

  showBirthdayReveal() {
    // Clear everything
    this.children.removeAll(true);
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.roomContainer = this.add.container(0, 0);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dark background
    this.cameras.main.setBackgroundColor('#0A0A1A');

    // Build-up animation: bricks falling to form "40"
    const brickPositions = [];
    // Number "4"
    const four = [[0,0],[0,1],[0,2],[1,2],[2,0],[2,1],[2,2],[2,3],[2,4]];
    // Number "0"
    const zero = [
      [4,0],[4,1],[4,2],[4,3],[4,4],
      [5,0],[5,4],
      [6,0],[6,1],[6,2],[6,3],[6,4]
    ];

    const allDigits = [...four, ...zero];
    const brickSize = 20;
    const startX = cx - 70;
    const startY = cy - 60;

    const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.YELLOW,
                    LEGO_COLORS.GREEN, LEGO_COLORS.ORANGE, LEGO_COLORS.BRIGHT_PINK];

    allDigits.forEach((pos, i) => {
      const bx = startX + pos[0] * (brickSize + 2);
      const by = startY + pos[1] * (brickSize + 2);
      const color = colors[i % colors.length];

      const brick = this.add.graphics();
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
      brick.fillRect(-brickSize / 2, -brickSize / 2, brickSize, brickSize);
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).lighten(15).color, 1);
      brick.fillCircle(0, -brickSize / 2 - 2, 4);
      brick.setPosition(bx, -50);
      brick.setAlpha(0);
      this.roomContainer.add(brick);

      this.tweens.add({
        targets: brick,
        y: by,
        alpha: 1,
        delay: i * 80,
        duration: 400,
        ease: 'Bounce.easeOut'
      });
    });

    // After bricks land, show message
    const totalDelay = allDigits.length * 80 + 800;

    this.time.delayedCall(totalDelay, () => {
      // Happy Birthday text
      const title = this.add.text(cx, cy - 120, 'HAPPY BIRTHDAY', {
        fontFamily: '"Rajdhani"',
        fontSize: '28px',
        color: LEGO_COLORS.YELLOW,
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: title, alpha: 1, duration: 800 });

      // Ante's name
      const name = this.add.text(cx, cy + 70, 'ANTE!', {
        fontFamily: '"Rajdhani"',
        fontSize: '32px',
        color: LEGO_COLORS.BRIGHT_PINK,
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: name, alpha: 1, duration: 800, delay: 500 });

      // Personal message
      const msg = this.add.text(cx, cy + 120,
        'From Croatia to Billund, from fan to Design Master.\nEvery brick you\'ve placed tells a story.\nHere\'s to 40 more years of building dreams!', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.WHITE,
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 550 }
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: msg, alpha: 1, duration: 800, delay: 1200 });

      // Signature
      const sig = this.add.text(cx, cy + 190,
        'Designed by Yossi, for Ante\nEvery brick counts.', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.YELLOW,
        align: 'center',
        lineSpacing: 6
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: sig, alpha: 1, duration: 800, delay: 2000 });

      // Confetti
      this.time.delayedCall(1500, () => this.launchConfetti());

      // "40/40 Bricks Collected" at bottom
      const complete = this.add.text(cx, GAME_HEIGHT - 30, '40/40 Bricks Collected', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.GREEN
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: complete, alpha: 1, duration: 500, delay: 2500 });

      // Bonus chapter launcher button (Chapter 5: The Designer's Desk)
      this.time.delayedCall(3500, () => this.showBonusChapterButton());
    });
  }

  showBonusChapterButton() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT - 90;

    const btn = this.add.container(cx, cy).setAlpha(0).setDepth(150);
    const w = 460;
    const h = 70;

    const bg = this.add.graphics();
    bg.fillStyle(hexToInt(LEGO_COLORS.CYAN), 0.18);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.lineStyle(3, hexToInt(LEGO_COLORS.CYAN), 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

    const lbl = this.add.text(0, 0, "BONUS: THE DESIGNER'S DESK >", {
      fontFamily: '"Rajdhani"',
      fontSize: '26px',
      fontStyle: 'bold',
      color: LEGO_COLORS.CYAN,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    btn.add([bg, lbl]);
    btn.setSize(w, h);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      this.scene.start('Chapter5Scene', { players: this.players });
    });
    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(hexToInt(LEGO_COLORS.CYAN), 0.4);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      bg.lineStyle(4, hexToInt(LEGO_COLORS.CYAN), 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      lbl.setColor(LEGO_COLORS.WHITE);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(hexToInt(LEGO_COLORS.CYAN), 0.18);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      bg.lineStyle(3, hexToInt(LEGO_COLORS.CYAN), 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      lbl.setColor(LEGO_COLORS.CYAN);
    });

    this.tweens.add({ targets: btn, alpha: 1, duration: 800 });

    InputSystem.setFocusables([{
      element: btn, x: cx, y: cy, callback: () => btn.emit('pointerdown')
    }]);
  }

  launchConfetti() {
    const colors = [0xB40000, 0x0055BF, 0xF2CD37, 0x237841, 0xA83D15, 0xE4ADC8, 0xAC78BA];

    for (let i = 0; i < 60; i++) {
      const x = Math.random() * GAME_WIDTH;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 6;

      const confetti = this.add.graphics();
      confetti.fillStyle(color, 1);
      confetti.fillRect(-size / 2, -size / 2, size, size);
      confetti.setPosition(x, -20);
      this.roomContainer.add(confetti);

      this.tweens.add({
        targets: confetti,
        y: GAME_HEIGHT + 20,
        x: x + (Math.random() - 0.5) * 200,
        angle: Math.random() * 720,
        alpha: 0,
        delay: Math.random() * 2000,
        duration: 2000 + Math.random() * 2000,
        ease: 'Quad.easeIn'
      });
    }

    // Repeat confetti (limited to 8 rounds)
    this.confettiCount = (this.confettiCount || 0) + 1;
    if (this.confettiCount < 8) {
      this.time.delayedCall(3000, () => this.launchConfetti());
    }
  }

  showFeedback(msg, color, onComplete) {
    const cx = GAME_WIDTH / 2;
    // Dim background so the message pops off the busy puzzle
    const bg = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, 180, 0x000000, 0.78)
      .setDepth(99);
    const text = this.add.text(cx, GAME_HEIGHT / 2, msg, {
      fontFamily: '"Rajdhani"',
      fontSize: '44px',
      fontStyle: 'bold',
      color: color,
      align: 'center',
      stroke: '#000000',
      strokeThickness: 5,
      lineSpacing: 8
    }).setOrigin(0.5).setDepth(100);

    this.time.delayedCall(1400, () => {
      if (bg.active) bg.destroy();
      if (text.active) text.destroy();
      if (onComplete) onComplete();
    });
  }

  onPuzzleUpdate(data) {
    // Sync quiz answers etc
  }

  nextRoom() {
    SaveManager.solveRoom(this.chapter || 4, (this.currentRoom || 0) + 1);
    const totalSolved = SaveManager.getProgress().solved;

    const proceed = () => {
      if (this.currentRoom >= this.totalRooms - 1) {
        this.showBirthdayReveal();
        return;
      }
      const cx = GAME_WIDTH / 2;
      const cy = GAME_HEIGHT / 2;
      const transition = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0);
      this.tweens.add({
        targets: transition,
        alpha: 1,
        duration: 300,
        onComplete: () => {
          this.startRoom(this.currentRoom + 1);
          this.tweens.add({
            targets: transition,
            alpha: 0,
            duration: 300,
            onComplete: () => transition.destroy()
          });
        }
      });
    };

    if (CELEBRATION_MESSAGES[totalSolved]) {
      SceneUI.showCelebration(this, totalSolved, proceed);
    } else {
      proceed();
    }
  }
}
