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
      fontFamily: FONT_BODY, fontSize: '13px', color: LEGO_COLORS.YELLOW, fontStyle: 'italic'
    }).setOrigin(0.5).setAlpha(0).setDepth(10);
    this.roomContainer.add(introText);
    this.tweens.add({ targets: introText, alpha: 0.8, duration: 500, yoyo: true, hold: 2500 });

    // Mix of fast puzzles from all chapters
    const puzzleType = roomIndex % 5;
    switch (puzzleType) {
      case 0: this.createTriviaPuzzle(roomIndex); break;
      case 1: this.createSpeedBuildPuzzle(); break;
      case 2: this.createQuoteGuessPuzzle(); break;
      case 3: this.createBrickCountPuzzle(roomIndex); break;
      case 4: this.createSetAssemblyPuzzle(roomIndex); break;
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
      }
    ];

    const t = trivia[roomIndex % trivia.length];

    this.roomContainer.add(
      this.add.text(cx, 80, 'ANTE TRIVIA', {
        fontFamily: '"Rajdhani"',
        fontSize: '28px',
        color: LEGO_COLORS.BRIGHT_PINK
      }).setOrigin(0.5)
    );

    this.roomContainer.add(
      this.add.text(cx, 130, t.q, {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.WHITE,
        wordWrap: { width: 600 },
        align: 'center'
      }).setOrigin(0.5)
    );

    // Timer - 10 seconds to answer
    this.triviaTimer = 10;
    this.triviaLocked = false;
    const timerText = this.add.text(cx, 165, `Time: ${this.triviaTimer}`, {
      fontFamily: '"Rajdhani"', fontSize: '28px', color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);
    this.roomContainer.add(timerText);

    const timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: 9,
      callback: () => {
        if (!timerText || !timerText.active) return;
        this.triviaTimer--;
        timerText.setText(`Time: ${this.triviaTimer}`);
        if (this.triviaTimer <= 0 && !this.triviaLocked) {
          this.triviaLocked = true;
          this.showFeedback('TIME UP!', LEGO_COLORS.RED);
          this.time.delayedCall(3000, () => { this.triviaLocked = false; this.triviaTimer = 10; timerEvent.reset({ delay: 1000, repeat: 9 }); });
        }
      }
    });

    t.options.forEach((opt, i) => {
      const bx = cx + (i % 2 === 0 ? -130 : 130);
      const by = 220 + Math.floor(i / 2) * 70;

      const btn = this.add.container(bx, by);
      const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN, LEGO_COLORS.ORANGE];
      const bg = this.add.graphics();
      bg.fillStyle(Phaser.Display.Color.HexStringToColor(colors[i]).color, 1);
      bg.fillRoundedRect(-110, -22, 220, 44, 6);
      const lbl = this.add.text(0, -2, opt, {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.WHITE
      }).setOrigin(0.5);
      btn.add([bg, lbl]);
      btn.setSize(220, 44);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        if (this.triviaLocked) return;
        network.sendPuzzleAction('trivia_answer', { answer: i });
        if (i === t.correct) {
          this.triviaLocked = true;
          this.showFeedback('CORRECT!', LEGO_COLORS.GREEN, () => this.nextRoom());
        } else {
          this.triviaLocked = true;
          this.showFeedback('NOPE! Wait 3s...', LEGO_COLORS.RED);
          this.time.delayedCall(3000, () => { this.triviaLocked = false; });
        }
      });
      this.roomContainer.add(btn);
    });

    // Register focusables for controller navigation
    const triviaFocusables = t.options.map((opt, i) => {
      const bx = cx + (i % 2 === 0 ? -130 : 130);
      const by = 220 + Math.floor(i / 2) * 70;
      return { element: null, x: bx, y: by, callback: () => {
        if (this.triviaLocked) return;
        network.sendPuzzleAction('trivia_answer', { answer: i });
        if (i === t.correct) {
          this.triviaLocked = true;
          this.showFeedback('CORRECT!', LEGO_COLORS.GREEN, () => this.nextRoom());
        } else {
          this.triviaLocked = true;
          this.showFeedback('NOPE! Wait 3s...', LEGO_COLORS.RED);
          this.time.delayedCall(3000, () => { this.triviaLocked = false; });
        }
      }};
    });
    InputSystem.setFocusables(triviaFocusables);
  }

  // PUZZLE: Speed build - click bricks in order as fast as possible
  createSpeedBuildPuzzle() {
    const cx = GAME_WIDTH / 2;

    this.roomContainer.add(
      this.add.text(cx, 70, 'SPEED BUILD!\nClick bricks 1-12 in order!', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.YELLOW,
        align: 'center',
        lineSpacing: 6
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
    const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN, LEGO_COLORS.YELLOW,
                    LEGO_COLORS.ORANGE, LEGO_COLORS.BRIGHT_PINK, LEGO_COLORS.MEDIUM_LAVENDER, LEGO_COLORS.BRIGHT_LIGHT_BLUE];

    positions.forEach((pos, i) => {
      const num = i + 1;
      const color = colors[i % colors.length];

      const brick = this.add.graphics();
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
      brick.fillRoundedRect(pos.x - 22, pos.y - 15, 44, 30, 4);
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).lighten(15).color, 1);
      brick.fillCircle(pos.x - 8, pos.y - 17, 5);
      brick.fillCircle(pos.x + 8, pos.y - 17, 5);
      this.roomContainer.add(brick);

      const label = this.add.text(pos.x, pos.y, num.toString(), {
        fontFamily: '"Rajdhani"',
        fontSize: '28px',
        color: LEGO_COLORS.WHITE,
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      this.roomContainer.add(label);

      const hitArea = this.add.rectangle(pos.x, pos.y, 44, 30, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        if (num === this.buildNext) {
          brick.clear();
          brick.fillStyle(hexToInt(LEGO_COLORS.GREEN), 0.5);
          brick.fillRoundedRect(pos.x - 22, pos.y - 15, 44, 30, 4);
          label.setColor(LEGO_COLORS.GREEN);
          label.setText('OK');
          this.buildNext++;
          network.sendPuzzleAction('speed_click', { brick: num });

          if (this.buildNext > numBricks) {
            this.showFeedback('SPEED BUILD COMPLETE!', LEGO_COLORS.GREEN, () => this.nextRoom());
          }
        }
      });
      this.roomContainer.add(hitArea);
    });

    // Register focusables for controller navigation
    const speedFocusables = positions.map((pos, i) => ({
      element: null, x: pos.x, y: pos.y, callback: () => {
        const num = i + 1;
        if (num === this.buildNext) {
          this.buildNext++;
          network.sendPuzzleAction('speed_click', { brick: num });
          if (this.buildNext > numBricks) {
            this.showFeedback('SPEED BUILD COMPLETE!', LEGO_COLORS.GREEN, () => this.nextRoom());
          }
        }
      }
    }));
    InputSystem.setFocusables(speedFocusables);

    // Timer
    this.buildTimer = 10;
    this.timerText = this.add.text(cx, GAME_HEIGHT - 50, `Time: ${this.buildTimer}`, {
      fontFamily: '"Rajdhani"',
      fontSize: '28px',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);
    this.roomContainer.add(this.timerText);

    this.time.addEvent({
      delay: 1000,
      repeat: 9,
      callback: () => {
        this.buildTimer--;
        if (this.timerText) this.timerText.setText(`Time: ${this.buildTimer}`);
        if (this.buildTimer <= 0 && this.buildNext <= numBricks) {
          this.buildNext = 1;
          this.showFeedback('TOO SLOW!', LEGO_COLORS.RED);
        }
      }
    });
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
      this.add.text(cx, 70, "Which quote is really Ante's?", {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.BRIGHT_PINK
      }).setOrigin(0.5)
    );

    const quoteColors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN, LEGO_COLORS.ORANGE];
    options.forEach((quote, i) => {
      const by = 120 + i * 95;

      const bg = this.add.graphics();
      bg.fillStyle(0x2A2A3E, 1);
      bg.fillRoundedRect(60, by - 25, GAME_WIDTH - 120, 70, 8);
      bg.lineStyle(2, hexToInt(quoteColors[i]), 0.6);
      bg.strokeRoundedRect(60, by - 25, GAME_WIDTH - 120, 70, 8);
      this.roomContainer.add(bg);

      this.roomContainer.add(
        this.add.text(80, by - 10, `${i + 1}.`, {
          fontFamily: '"Rajdhani"',
          fontSize: '28px',
          color: quoteColors[i]
        })
      );

      this.roomContainer.add(
        this.add.text(cx, by + 5, `"${quote}"`, {
          fontFamily: '"Rajdhani"',
          fontSize: '22px',
          color: LEGO_COLORS.WHITE,
          wordWrap: { width: 500 },
          align: 'center',
          lineSpacing: 5
        }).setOrigin(0.5)
      );

      const hitArea = this.add.rectangle(cx, by + 5, GAME_WIDTH - 120, 70, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        network.sendPuzzleAction('quote_guess', { choice: i });
        if (i === correctFinal) {
          this.showFeedback(`YES! - ${realQuote.source}`, LEGO_COLORS.GREEN, () => this.nextRoom());
        } else {
          this.showFeedback("That wasn't Ante!", LEGO_COLORS.RED);
        }
      });
      this.roomContainer.add(hitArea);
    });

    // Register focusables for controller navigation
    const quoteFocusables = options.map((quote, i) => {
      const by = 120 + i * 95;
      return { element: null, x: cx, y: by + 5, callback: () => {
        network.sendPuzzleAction('quote_guess', { choice: i });
        if (i === correctFinal) {
          this.showFeedback(`YES! - ${realQuote.source}`, LEGO_COLORS.GREEN, () => this.nextRoom());
        } else {
          this.showFeedback("That wasn't Ante!", LEGO_COLORS.RED);
        }
      }};
    });
    InputSystem.setFocusables(quoteFocusables);
  }

  // PUZZLE: Count bricks
  createBrickCountPuzzle(roomIndex) {
    const cx = GAME_WIDTH / 2;
    const targetCount = 10 + Math.floor(Math.random() * 11);

    this.roomContainer.add(
      this.add.text(cx, 70, 'How many bricks do you count?', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.YELLOW
      }).setOrigin(0.5)
    );

    // Scatter bricks with overlapping for difficulty
    const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN,
                    LEGO_COLORS.YELLOW, LEGO_COLORS.ORANGE, LEGO_COLORS.BRIGHT_PINK];
    for (let i = 0; i < targetCount; i++) {
      const bx = 70 + Math.random() * (GAME_WIDTH - 140);
      const by = 110 + Math.random() * 260;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const angle = (Math.random() - 0.5) * 30; // slight rotation for overlap confusion

      const brick = this.add.graphics();
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.85 + Math.random() * 0.15);
      brick.fillRoundedRect(bx - 15, by - 10, 30, 20, 3);
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).lighten(15).color, 1);
      brick.fillCircle(bx, by - 12, 4);
      brick.setAngle(angle);
      this.roomContainer.add(brick);
    }

    // Number buttons - options are very close together (consecutive numbers)
    const options = [targetCount - 1, targetCount, targetCount + 1, targetCount + 2]
      .sort(() => Math.random() - 0.5);

    options.forEach((num, i) => {
      const bx = cx - 150 + i * 100;
      const by = GAME_HEIGHT - 100;

      const btn = this.add.container(bx, by);
      const bg = this.add.graphics();
      bg.fillStyle(hexToInt(LEGO_COLORS.BLUE), 1);
      bg.fillRoundedRect(-30, -18, 60, 36, 4);
      const lbl = this.add.text(0, -2, num.toString(), {
        fontFamily: '"Rajdhani"',
        fontSize: '28px',
        color: LEGO_COLORS.WHITE
      }).setOrigin(0.5);
      btn.add([bg, lbl]);
      btn.setSize(60, 36);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        network.sendPuzzleAction('count_answer', { answer: num });
        if (num === targetCount) {
          this.showFeedback('CORRECT!', LEGO_COLORS.GREEN, () => this.nextRoom());
        } else {
          this.showFeedback(`It was ${targetCount}!`, LEGO_COLORS.RED);
        }
      });
      this.roomContainer.add(btn);
    });

    // Register focusables for controller navigation
    const countFocusables = options.map((num, i) => {
      const bx = cx - 150 + i * 100;
      const by = GAME_HEIGHT - 100;
      return { element: null, x: bx, y: by, callback: () => {
        network.sendPuzzleAction('count_answer', { answer: num });
        if (num === targetCount) {
          this.showFeedback('CORRECT!', LEGO_COLORS.GREEN, () => this.nextRoom());
        } else {
          this.showFeedback(`It was ${targetCount}!`, LEGO_COLORS.RED);
        }
      }};
    });
    InputSystem.setFocusables(countFocusables);
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
        parts: ['Wing frame L', 'Wing frame R', 'String mechanism', 'Pilot seat', 'Tail section', 'Display stand', 'Crank handle'] }
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
      this.add.text(cx, 58, 'ASSEMBLE: ' + setData.name.toUpperCase(), {
        fontFamily: FONT_TITLE, fontSize: '16px', fontStyle: 'bold',
        color: LEGO_COLORS.YELLOW
      }).setOrigin(0.5)
    );

    this.roomContainer.add(
      this.add.text(cx, 78, setData.theme + ' (' + setData.year + ') - ' + numParts + ' sections', {
        fontFamily: FONT_BODY, fontSize: '13px', color: '#8896AA'
      }).setOrigin(0.5)
    );

    this.roomContainer.add(
      this.add.text(cx, 98, 'Tap parts in the correct build order!', {
        fontFamily: FONT_BODY, fontSize: '14px', color: LEGO_COLORS.CYAN
      }).setOrigin(0.5)
    );

    // Assembly progress display
    this.assemblyProgress = this.add.text(cx, 120, '', {
      fontFamily: FONT_BODY, fontSize: '13px', color: LEGO_COLORS.GREEN,
      align: 'center', wordWrap: { width: 500 }
    }).setOrigin(0.5);
    this.roomContainer.add(this.assemblyProgress);

    // Part buttons (shuffled)
    const cols = Math.min(4, numParts);
    const rows = Math.ceil(numParts / cols);
    const btnW = 180;
    const btnH = 40;
    const gapX = 12;
    const gapY = 10;
    const startX = cx - ((cols * (btnW + gapX) - gapX) / 2) + btnW / 2;
    const startY = 155;
    const focusItems = [];

    shuffled.forEach((part, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = startX + col * (btnW + gapX);
      const by = startY + row * (btnH + gapY);

      const btn = this.add.container(bx, by);
      const bg = this.add.graphics();
      bg.fillStyle(0x1A2030, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
      bg.lineStyle(1, hexToInt(LEGO_COLORS.CYAN), 0.3);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
      const lbl = this.add.text(0, 0, part, {
        fontFamily: FONT_BODY, fontSize: '13px', color: '#D0D8E8'
      }).setOrigin(0.5);
      btn.add([bg, lbl]);
      btn.setSize(btnW, btnH);
      btn.setInteractive({ useHandCursor: true });

      const idx = i;
      btn.on('pointerdown', () => {
        const correctNext = this.assemblyTarget[this.assemblyOrder.length];
        if (part === correctNext) {
          // Correct!
          this.assemblyOrder.push(part);
          bg.clear();
          bg.fillStyle(hexToInt(LEGO_COLORS.GREEN), 0.3);
          bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
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
          // Wrong order
          bg.clear();
          bg.fillStyle(hexToInt(LEGO_COLORS.RED), 0.2);
          bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
          bg.lineStyle(1, hexToInt(LEGO_COLORS.RED), 0.5);
          bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
          InputSystem.vibrate(100, 0.4, 0.6);
          this.time.delayedCall(500, () => {
            bg.clear();
            bg.fillStyle(0x1A2030, 1);
            bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
            bg.lineStyle(1, hexToInt(LEGO_COLORS.CYAN), 0.3);
            bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
            lbl.setColor('#D0D8E8');
          });
        }
      });
      this.roomContainer.add(btn);
      focusItems.push({ element: btn, x: bx, y: by, callback: () => btn.emit('pointerdown') });
    });

    // Timer
    this.assemblyTimerText = this.add.text(cx, GAME_HEIGHT - 40, 'Time: ' + this.assemblyTimer, {
      fontFamily: FONT_MONO, fontSize: '14px', color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);
    this.roomContainer.add(this.assemblyTimerText);

    this.time.addEvent({
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
    });
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
    const text = this.add.text(cx, GAME_HEIGHT / 2, msg, {
      fontFamily: '"Rajdhani"',
      fontSize: '22px',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(100);

    this.time.delayedCall(1200, () => {
      text.destroy();
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
