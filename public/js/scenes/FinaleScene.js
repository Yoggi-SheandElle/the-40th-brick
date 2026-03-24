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
    this.cameras.main.setBackgroundColor('#1B1B2E');

    this.roomLabel = this.add.text(GAME_WIDTH / 2, 20, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);

    this.progressText = this.add.text(GAME_WIDTH - 20, 20, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: LEGO_COLORS.GREY
    }).setOrigin(1, 0.5);

    this.startRoom(0);

    network.on('puzzle_update', (data) => this.onPuzzleUpdate(data));
    network.on('achievement_unlocked', (data) => {
      // For the finale, go to birthday reveal instead of achievement
      this.showBirthdayReveal();
    });
  }

  startRoom(roomIndex) {
    this.currentRoom = roomIndex;
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
    this.roomLabel.setText(titles[roomIndex] || `Room ${roomIndex + 1}`);
    this.progressText.setText(`Brick ${30 + roomIndex + 1}/40`);

    // Mix of fast puzzles from all chapters
    const puzzleType = roomIndex % 4;
    switch (puzzleType) {
      case 0: this.createTriviaPuzzle(roomIndex); break;
      case 1: this.createSpeedBuildPuzzle(); break;
      case 2: this.createQuoteGuessPuzzle(); break;
      case 3: this.createBrickCountPuzzle(roomIndex); break;
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
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
        color: LEGO_COLORS.BRIGHT_PINK
      }).setOrigin(0.5)
    );

    this.roomContainer.add(
      this.add.text(cx, 130, t.q, {
        fontFamily: '"Press Start 2P"',
        fontSize: '9px',
        color: LEGO_COLORS.WHITE,
        wordWrap: { width: 600 },
        align: 'center'
      }).setOrigin(0.5)
    );

    t.options.forEach((opt, i) => {
      const bx = cx + (i % 2 === 0 ? -130 : 130);
      const by = 220 + Math.floor(i / 2) * 70;

      const btn = this.add.container(bx, by);
      const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN, LEGO_COLORS.ORANGE];
      const bg = this.add.graphics();
      bg.fillStyle(Phaser.Display.Color.HexStringToColor(colors[i]).color, 1);
      bg.fillRoundedRect(-110, -22, 220, 44, 6);
      const lbl = this.add.text(0, -2, opt, {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: LEGO_COLORS.WHITE
      }).setOrigin(0.5);
      btn.add([bg, lbl]);
      btn.setSize(220, 44);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        network.sendPuzzleAction('trivia_answer', { answer: i });
        if (i === t.correct) {
          this.showFeedback('CORRECT!', LEGO_COLORS.GREEN, () => this.nextRoom());
        } else {
          this.showFeedback('NOPE!', LEGO_COLORS.RED);
        }
      });
      this.roomContainer.add(btn);
    });
  }

  // PUZZLE: Speed build - click bricks in order as fast as possible
  createSpeedBuildPuzzle() {
    const cx = GAME_WIDTH / 2;

    this.roomContainer.add(
      this.add.text(cx, 70, 'SPEED BUILD!\nClick bricks 1-8 in order!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: LEGO_COLORS.YELLOW,
        align: 'center',
        lineSpacing: 6
      }).setOrigin(0.5)
    );

    const numBricks = 8;
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
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
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

    // Timer
    this.buildTimer = 15;
    this.timerText = this.add.text(cx, GAME_HEIGHT - 50, `Time: ${this.buildTimer}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);
    this.roomContainer.add(this.timerText);

    this.time.addEvent({
      delay: 1000,
      repeat: 14,
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
      'Technic bricks are my favorite element to use.'
    ];

    const options = [realQuote.text, fakeQuotes[Math.floor(Math.random() * fakeQuotes.length)]];
    const correctIndex = 0;

    // Shuffle
    if (Math.random() > 0.5) {
      options.reverse();
    }
    const correctFinal = options.indexOf(realQuote.text);

    this.roomContainer.add(
      this.add.text(cx, 70, "Which quote is really Ante's?", {
        fontFamily: '"Press Start 2P"',
        fontSize: '9px',
        color: LEGO_COLORS.BRIGHT_PINK
      }).setOrigin(0.5)
    );

    options.forEach((quote, i) => {
      const by = 160 + i * 130;

      const bg = this.add.graphics();
      bg.fillStyle(0x2A2A3E, 1);
      bg.fillRoundedRect(60, by - 30, GAME_WIDTH - 120, 80, 8);
      bg.lineStyle(2, i === 0 ? hexToInt(LEGO_COLORS.RED) : hexToInt(LEGO_COLORS.BLUE), 0.6);
      bg.strokeRoundedRect(60, by - 30, GAME_WIDTH - 120, 80, 8);
      this.roomContainer.add(bg);

      this.roomContainer.add(
        this.add.text(80, by - 15, `${i + 1}.`, {
          fontFamily: '"Press Start 2P"',
          fontSize: '12px',
          color: i === 0 ? LEGO_COLORS.RED : LEGO_COLORS.BLUE
        })
      );

      this.roomContainer.add(
        this.add.text(cx, by + 5, `"${quote}"`, {
          fontFamily: '"Press Start 2P"',
          fontSize: '6px',
          color: LEGO_COLORS.WHITE,
          wordWrap: { width: 500 },
          align: 'center',
          lineSpacing: 5
        }).setOrigin(0.5)
      );

      const hitArea = this.add.rectangle(cx, by + 5, GAME_WIDTH - 120, 80, 0x000000, 0);
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
  }

  // PUZZLE: Count bricks
  createBrickCountPuzzle(roomIndex) {
    const cx = GAME_WIDTH / 2;
    const targetCount = 5 + Math.floor(Math.random() * 10);

    this.roomContainer.add(
      this.add.text(cx, 70, 'How many bricks do you count?', {
        fontFamily: '"Press Start 2P"',
        fontSize: '9px',
        color: LEGO_COLORS.YELLOW
      }).setOrigin(0.5)
    );

    // Scatter bricks
    const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN,
                    LEGO_COLORS.YELLOW, LEGO_COLORS.ORANGE];
    for (let i = 0; i < targetCount; i++) {
      const bx = 80 + Math.random() * (GAME_WIDTH - 160);
      const by = 120 + Math.random() * 250;
      const color = colors[Math.floor(Math.random() * colors.length)];

      const brick = this.add.graphics();
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
      brick.fillRoundedRect(bx - 15, by - 10, 30, 20, 3);
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).lighten(15).color, 1);
      brick.fillCircle(bx, by - 12, 4);
      this.roomContainer.add(brick);
    }

    // Number buttons
    const options = [targetCount - 2, targetCount, targetCount + 1, targetCount + 3]
      .sort(() => Math.random() - 0.5);

    options.forEach((num, i) => {
      const bx = cx - 150 + i * 100;
      const by = GAME_HEIGHT - 100;

      const btn = this.add.container(bx, by);
      const bg = this.add.graphics();
      bg.fillStyle(hexToInt(LEGO_COLORS.BLUE), 1);
      bg.fillRoundedRect(-30, -18, 60, 36, 4);
      const lbl = this.add.text(0, -2, num.toString(), {
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
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
    const four = [
      [0,0],[0,1],[0,2],[0,3],[0,4],
      [1,2],
      [2,0],[2,1],[2,2]
    ];
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
        fontFamily: '"Press Start 2P"',
        fontSize: '18px',
        color: LEGO_COLORS.YELLOW,
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: title, alpha: 1, duration: 800 });

      // Ante's name
      const name = this.add.text(cx, cy + 70, 'ANTE!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '24px',
        color: LEGO_COLORS.BRIGHT_PINK,
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: name, alpha: 1, duration: 800, delay: 500 });

      // Personal message
      const msg = this.add.text(cx, cy + 120,
        'From Croatia to Billund, from fan to Design Master.\nEvery brick you\'ve placed tells a story.\nHere\'s to 40 more years of building dreams!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: LEGO_COLORS.WHITE,
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 550 }
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: msg, alpha: 1, duration: 800, delay: 1200 });

      // Signature
      const sig = this.add.text(cx, cy + 190,
        'Designed by Yossi, for Ante\nEvery brick counts.', {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: LEGO_COLORS.YELLOW,
        align: 'center',
        lineSpacing: 6
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: sig, alpha: 1, duration: 800, delay: 2000 });

      // Confetti
      this.time.delayedCall(1500, () => this.launchConfetti());

      // "40/40 Bricks Collected" at bottom
      const complete = this.add.text(cx, GAME_HEIGHT - 30, '40/40 Bricks Collected', {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
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

    // Repeat confetti
    this.time.delayedCall(3000, () => this.launchConfetti());
  }

  showFeedback(msg, color, onComplete) {
    const cx = GAME_WIDTH / 2;
    const text = this.add.text(cx, GAME_HEIGHT / 2, msg, {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
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
  }
}
