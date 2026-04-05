// Chapter 1: "The First Brick" - Collaborative Painting Puzzle
// Ante sees the target pattern, Yossi has the paint tools.
// They must communicate to paint the canvas correctly.
class Chapter1Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Chapter1Scene' });
  }

  init(data) {
    this.chapter = data?.chapter || 1;
    this.players = data?.players || [];
    this.currentRoom = 0;
    this.totalRooms = 10;
  }

  create() {
    SceneUI.initPremiumUI(this, LEGO_COLORS.BRIGHT_PINK);

    // Room header (will be updated by startRoom)
    this.roomLabel = null;
    this.progressText = null;

    // Start first room
    this.startRoom(0);

    // Network puzzle updates
    network.on('puzzle_update', (data) => {
      this.onPuzzleUpdate(data);
    });

    network.on('achievement_unlocked', (data) => {
      this.scene.start('AchievementScene', {
        achievementId: data.achievementId,
        nextScene: data.nextChapter > 4 ? 'WorldMapScene' : 'WorldMapScene',
        nextData: { achievements: data.achievements }
      });
    });
  }

  startRoom(roomIndex) {
    this.currentRoom = roomIndex;
    InputSystem.clearFocusables();

    // Clear previous room content
    if (this.roomContainer) this.roomContainer.destroy();
    this.roomContainer = this.add.container(0, 0);

    SceneUI.createRoomHeader(this, 1, 'THE FIRST BRICK', this.getRoomTitle(roomIndex), roomIndex + 1, this.totalRooms);

    // Different puzzle types per room
    const puzzleType = roomIndex % 5;
    switch (puzzleType) {
      case 0: this.createColorMatchPuzzle(); break;
      case 1: this.createPatternPuzzle(); break;
      case 2: this.createSequencePuzzle(); break;
      case 3: this.createMemoryPuzzle(); break;
      case 4: this.createBrickBuildPuzzle(); break;
    }
  }

  getRoomTitle(index) {
    const titles = [
      'The Workshop', 'Color Theory', 'Brick Patterns',
      'Memory Lane', 'First Build', 'Heartlake Sunrise',
      'Friendship Colors', 'The Blueprint', 'Stud Symphony',
      'The Masterpiece'
    ];
    return titles[index] || `Room ${index + 1}`;
  }

  // PUZZLE 1: Color Match - Both players select colors to match a target
  createColorMatchPuzzle() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Generate target colors (3-6 bricks to color)
    const brickColors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN,
                          LEGO_COLORS.YELLOW, LEGO_COLORS.ORANGE, LEGO_COLORS.BRIGHT_PINK,
                          LEGO_COLORS.MEDIUM_LAVENDER, LEGO_COLORS.SAND_GREEN, LEGO_COLORS.TAN];
    const numBricks = 4 + Math.floor(this.currentRoom / 2);
    const target = [];
    for (let i = 0; i < numBricks; i++) {
      target.push(brickColors[Math.floor(Math.random() * brickColors.length)]);
    }
    this.puzzleTarget = target;
    this.puzzleAnswer = new Array(numBricks).fill(null);

    const isHost = isSolo() || network.playerRole === 'host';
    const canInteract = isSolo() || network.playerRole === 'guest';

    // Instructions
    const instrText = isSolo()
      ? 'Match the target colors below!\nClick bricks to change their color.'
      : isHost
        ? 'You can see the target colors!\nTell your partner which colors to pick.'
        : 'Your partner sees the target.\nClick bricks to set their colors.';

    this.roomContainer.add(
      this.add.text(cx, 55, instrText, TEXT_STYLES.body).setOrigin(0.5)
    );

    // Target display (only visible to host/Ante)
    if (isHost) {
      this.roomContainer.add(
        this.add.text(cx, 100, 'TARGET:', TEXT_STYLES.label).setOrigin(0.5)
      );

      const targetBricks = [];
      target.forEach((color, i) => {
        const bx = cx - ((numBricks - 1) * 35) / 2 + i * 35;
        const brick = this.add.graphics();
        brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
        brick.fillRoundedRect(bx - 14, 115, 28, 20, 3);
        // Stud
        brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).lighten(15).color, 1);
        brick.fillCircle(bx, 113, 5);
        this.roomContainer.add(brick);
        targetBricks.push(brick);
      });

      // In rooms 5+, hide the target after 3 seconds (player must memorize)
      if (this.currentRoom >= 5) {
        this.time.delayedCall(3000, () => {
          targetBricks.forEach(b => b.setVisible(false));
          const hiddenMsg = this.add.text(cx, 125, 'MEMORIZE!', {
            fontFamily: '"Rajdhani"', fontSize: '22px', color: LEGO_COLORS.RED
          }).setOrigin(0.5);
          this.roomContainer.add(hiddenMsg);
        });
      }
    }

    // Answer slots
    this.answerSlots = [];
    this.roomContainer.add(
      this.add.text(cx, 170, 'YOUR BUILD:', TEXT_STYLES.label).setOrigin(0.5)
    );

    target.forEach((_, i) => {
      const bx = cx - ((numBricks - 1) * 50) / 2 + i * 50;
      const slot = this.add.graphics();
      slot.fillStyle(0x444444, 1);
      slot.fillRoundedRect(bx - 20, 185, 40, 30, 3);
      slot.lineStyle(2, 0x666666, 1);
      slot.strokeRoundedRect(bx - 20, 185, 40, 30, 3);
      this.roomContainer.add(slot);

      if (canInteract) {
        const hitArea = this.add.rectangle(bx, 200, 40, 30, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => this.cycleSlotColor(i, bx, slot));
        this.roomContainer.add(hitArea);
      }

      this.answerSlots.push({ gfx: slot, x: bx, colorIndex: -1 });
    });

    // Color palette hint
    if (canInteract) {
      this.roomContainer.add(
        this.add.text(cx, 260, 'Click bricks to cycle colors', TEXT_STYLES.small).setOrigin(0.5)
      );
    }

    // Submit button
    const submitBtn = this.add.container(cx, cy + 150);
    const bg = this.add.graphics();
    bg.fillStyle(hexToInt(LEGO_COLORS.GREEN), 1);
    bg.fillRoundedRect(-60, -15, 120, 30, 4);
    const lbl = this.add.text(0, -2, 'CHECK', {
      fontFamily: '"Rajdhani"',
      fontSize: '28px',
      color: LEGO_COLORS.WHITE
    }).setOrigin(0.5);
    submitBtn.add([bg, lbl]);
    submitBtn.setSize(120, 30);
    submitBtn.setInteractive({ useHandCursor: true });
    submitBtn.on('pointerdown', () => this.checkAnswer());
    this.roomContainer.add(submitBtn);

    // Register focusables for controller navigation
    const puzzleFocusables = [];
    this.answerSlots.forEach((slot, i) => {
      puzzleFocusables.push({ element: null, x: slot.x, y: 200, callback: () => this.cycleSlotColor(i, slot.x, slot.gfx) });
    });
    puzzleFocusables.push({ element: submitBtn, x: cx, y: cy + 150, callback: () => this.checkAnswer() });
    InputSystem.setFocusables(puzzleFocusables);
    SceneUI.showControllerPrompts(this);

    // Quote at bottom
    drawQuoteBox(this, this.roomContainer, 'friends');
  }

  cycleSlotColor(slotIndex, bx, slotGfx) {
    const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN,
                    LEGO_COLORS.YELLOW, LEGO_COLORS.ORANGE, LEGO_COLORS.BRIGHT_PINK,
                    LEGO_COLORS.MEDIUM_LAVENDER, LEGO_COLORS.SAND_GREEN, LEGO_COLORS.TAN];
    const slot = this.answerSlots[slotIndex];
    slot.colorIndex = (slot.colorIndex + 1) % colors.length;
    const color = colors[slot.colorIndex];
    this.puzzleAnswer[slotIndex] = color;

    // Redraw slot with color
    slotGfx.clear();
    slotGfx.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
    slotGfx.fillRoundedRect(bx - 20, 185, 40, 30, 3);
    // Stud
    slotGfx.fillStyle(Phaser.Display.Color.HexStringToColor(color).lighten(15).color, 1);
    slotGfx.fillCircle(bx, 183, 5);

    // Send to partner
    network.sendPuzzleAction('color_set', {
      slot: slotIndex,
      color: color
    });
  }

  onPuzzleUpdate(data) {
    if (data.action === 'color_set') {
      const { slot, color } = data.payload;
      this.puzzleAnswer[slot] = color;
      const slotData = this.answerSlots[slot];
      if (slotData) {
        slotData.gfx.clear();
        slotData.gfx.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
        slotData.gfx.fillRoundedRect(slotData.x - 20, 185, 40, 30, 3);
        slotData.gfx.fillStyle(Phaser.Display.Color.HexStringToColor(color).lighten(15).color, 1);
        slotData.gfx.fillCircle(slotData.x, 183, 5);
      }
    }
  }

  checkAnswer() {
    if (!this.puzzleTarget) return;

    const correct = this.puzzleTarget.every((color, i) => this.puzzleAnswer[i] === color);
    const cx = GAME_WIDTH / 2;

    if (correct) {
      const successText = this.add.text(cx, GAME_HEIGHT / 2, 'PERFECT!', {
        fontFamily: '"Rajdhani"',
        fontSize: '32px',
        color: LEGO_COLORS.GREEN,
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: successText,
        alpha: 1,
        scale: 1.2,
        duration: 500,
        yoyo: true,
        onComplete: () => {
          successText.destroy();
          this.nextRoom();
        }
      });
    } else {
      // Show how many correct
      let correctCount = 0;
      this.puzzleTarget.forEach((color, i) => {
        if (this.puzzleAnswer[i] === color) correctCount++;
      });

      const tryAgain = this.add.text(cx, GAME_HEIGHT / 2 + 80, `${correctCount}/${this.puzzleTarget.length} correct. Try again!`, {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.RED
      }).setOrigin(0.5);

      this.time.delayedCall(2000, () => tryAgain.destroy());
    }
  }

  // PUZZLE 2: Pattern - Recreate a LEGO stud pattern on a grid
  createPatternPuzzle() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const gridSize = 4 + Math.floor(this.currentRoom / 4);
    const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN, LEGO_COLORS.YELLOW];

    // Generate target pattern
    const pattern = [];
    for (let r = 0; r < gridSize; r++) {
      pattern[r] = [];
      for (let c = 0; c < gridSize; c++) {
        pattern[r][c] = colors[Math.floor(Math.random() * colors.length)];
      }
    }
    this.patternAnswer = Array.from({length: gridSize}, () => new Array(gridSize).fill(null));

    this.roomContainer.add(
      this.add.text(cx, 55, 'Recreate the pattern below!\nClick cells to cycle colors.', {
        fontFamily: '"Rajdhani"', fontSize: '22px', color: LEGO_COLORS.WHITE,
        align: 'center', lineSpacing: 4
      }).setOrigin(0.5)
    );

    // Target pattern (top)
    this.roomContainer.add(
      this.add.text(cx - 120, 85, 'TARGET:', {
        fontFamily: '"Orbitron"', fontSize: '10px', color: LEGO_COLORS.CYAN, letterSpacing: 1
      }).setOrigin(0, 0.5)
    );
    const cellSize = Math.min(30, 180 / gridSize);
    const targetStartX = cx - 120;
    const targetStartY = 100;
    const targetGfx = this.add.graphics();
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        targetGfx.fillStyle(Phaser.Display.Color.HexStringToColor(pattern[r][c]).color, 1);
        targetGfx.fillRect(targetStartX + c * (cellSize + 2), targetStartY + r * (cellSize + 2), cellSize, cellSize);
      }
    }
    this.roomContainer.add(targetGfx);

    // Player grid (bottom)
    this.roomContainer.add(
      this.add.text(cx - 120, 100 + gridSize * (cellSize + 2) + 15, 'YOUR BUILD:', {
        fontFamily: '"Orbitron"', fontSize: '10px', color: LEGO_COLORS.CYAN, letterSpacing: 1
      }).setOrigin(0, 0.5)
    );
    const buildStartY = 100 + gridSize * (cellSize + 2) + 30;
    this.patternCells = [];
    const focusItems = [];
    for (let r = 0; r < gridSize; r++) {
      this.patternCells[r] = [];
      for (let c = 0; c < gridSize; c++) {
        const cellX = targetStartX + c * (cellSize + 2);
        const cellY = buildStartY + r * (cellSize + 2);
        const cell = this.add.graphics();
        cell.fillStyle(0x444444, 1);
        cell.fillRect(cellX, cellY, cellSize, cellSize);
        cell.lineStyle(1, 0x666666, 1);
        cell.strokeRect(cellX, cellY, cellSize, cellSize);
        this.roomContainer.add(cell);
        this.patternCells[r][c] = { gfx: cell, colorIndex: -1, x: cellX, y: cellY };

        const hitArea = this.add.rectangle(cellX + cellSize/2, cellY + cellSize/2, cellSize, cellSize, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        const row = r, col = c;
        hitArea.on('pointerdown', () => {
          const pc = this.patternCells[row][col];
          pc.colorIndex = (pc.colorIndex + 1) % colors.length;
          this.patternAnswer[row][col] = colors[pc.colorIndex];
          pc.gfx.clear();
          pc.gfx.fillStyle(Phaser.Display.Color.HexStringToColor(colors[pc.colorIndex]).color, 1);
          pc.gfx.fillRect(pc.x, pc.y, cellSize, cellSize);
          network.sendPuzzleAction('pattern_set', { r: row, c: col, color: colors[pc.colorIndex] });
        });
        this.roomContainer.add(hitArea);
        focusItems.push({ element: hitArea, x: cellX + cellSize/2, y: cellY + cellSize/2, callback: () => hitArea.emit('pointerdown') });
      }
    }

    // Check button
    const checkY = buildStartY + gridSize * (cellSize + 2) + 15;
    const checkBtn = this.add.container(cx, checkY);
    const bg = this.add.graphics();
    bg.fillStyle(hexToInt(LEGO_COLORS.GREEN), 1);
    bg.fillRoundedRect(-60, -15, 120, 30, 4);
    const lbl = this.add.text(0, -2, 'CHECK', {
      fontFamily: '"Rajdhani"', fontSize: '28px', color: LEGO_COLORS.WHITE
    }).setOrigin(0.5);
    checkBtn.add([bg, lbl]);
    checkBtn.setSize(120, 30);
    checkBtn.setInteractive({ useHandCursor: true });
    checkBtn.on('pointerdown', () => {
      let correct = true;
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (this.patternAnswer[r][c] !== pattern[r][c]) { correct = false; break; }
        }
        if (!correct) break;
      }
      if (correct) {
        const text = this.add.text(cx, cy, 'PERFECT!', {
          fontFamily: '"Rajdhani"', fontSize: '28px', color: LEGO_COLORS.GREEN,
          stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);
        this.time.delayedCall(1000, () => { text.destroy(); this.nextRoom(); });
      } else {
        const text = this.add.text(cx, cy + 80, 'Not quite! Try again.', {
          fontFamily: '"Rajdhani"', fontSize: '22px', color: LEGO_COLORS.RED
        }).setOrigin(0.5);
        this.time.delayedCall(1500, () => text.destroy());
      }
    });
    this.roomContainer.add(checkBtn);
    focusItems.push({ element: checkBtn, x: cx, y: checkY, callback: () => checkBtn.emit('pointerdown') });
    InputSystem.setFocusables(focusItems);

    drawQuoteBox(this, this.roomContainer, 'friends');
  }

  // PUZZLE 3: Sequence - Remember and repeat a sequence of brick colors
  createSequencePuzzle() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const seqLength = 5 + Math.floor(this.currentRoom / 2);
    const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN, LEGO_COLORS.YELLOW];

    // Generate sequence
    this.sequence = [];
    for (let i = 0; i < seqLength; i++) {
      this.sequence.push(colors[Math.floor(Math.random() * colors.length)]);
    }
    this.playerSequence = [];

    this.roomContainer.add(
      this.add.text(cx, 60, 'Watch the sequence, then repeat it!', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.WHITE
      }).setOrigin(0.5)
    );

    // Display bricks for input
    const brickBtns = [];
    colors.forEach((color, i) => {
      const bx = cx - 120 + i * 80;
      const brick = this.add.graphics();
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
      brick.fillRoundedRect(bx - 25, cy + 40, 50, 35, 4);
      brick.fillStyle(Phaser.Display.Color.HexStringToColor(color).lighten(15).color, 1);
      brick.fillCircle(bx, cy + 37, 6);
      this.roomContainer.add(brick);

      const hitArea = this.add.rectangle(bx, cy + 57, 50, 35, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        this.playerSequence.push(color);
        // Flash effect
        const fc = Phaser.Display.Color.HexStringToColor(color);
        this.cameras.main.flash(100, fc.red, fc.green, fc.blue);

        network.sendPuzzleAction('seq_press', { color });

        if (this.playerSequence.length === this.sequence.length) {
          this.checkSequence();
        }
      });
      this.roomContainer.add(hitArea);
      brickBtns.push({ brick, hitArea, color });
    });

    // Register focusables for controller navigation
    const seqFocusables = brickBtns.map(b => ({
      element: b.hitArea, x: b.hitArea.x, y: b.hitArea.y, callback: () => b.hitArea.emit('pointerdown')
    }));
    InputSystem.setFocusables(seqFocusables);

    // Play sequence animation
    this.showSequence = this.add.graphics();
    this.roomContainer.add(this.showSequence);

    this.time.delayedCall(500, () => {
      this.playSequenceAnimation(0);
    });
  }

  playSequenceAnimation(index) {
    if (index >= this.sequence.length) return;

    const cx = GAME_WIDTH / 2;
    const color = this.sequence[index];

    const flash = this.add.graphics();
    flash.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
    flash.fillRoundedRect(cx - 30, 140, 60, 45, 6);
    flash.fillStyle(Phaser.Display.Color.HexStringToColor(color).lighten(20).color, 1);
    flash.fillCircle(cx, 137, 8);
    this.roomContainer.add(flash);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      delay: 300,
      duration: 200,
      onComplete: () => {
        flash.destroy();
        this.playSequenceAnimation(index + 1);
      }
    });
  }

  checkSequence() {
    const correct = this.sequence.every((color, i) => this.playerSequence[i] === color);
    const cx = GAME_WIDTH / 2;

    if (correct) {
      const text = this.add.text(cx, 120, 'CORRECT!', {
        fontFamily: '"Rajdhani"',
        fontSize: '28px',
        color: LEGO_COLORS.GREEN
      }).setOrigin(0.5);

      this.time.delayedCall(1000, () => {
        text.destroy();
        this.nextRoom();
      });
    } else {
      this.playerSequence = [];
      const text = this.add.text(cx, 120, 'TRY AGAIN!', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.RED
      }).setOrigin(0.5);

      this.time.delayedCall(1000, () => {
        text.destroy();
        this.time.delayedCall(300, () => this.playSequenceAnimation(0));
      });
    }
  }

  // PUZZLE 4: Memory Match - Flip cards to find LEGO set pairs
  createMemoryPuzzle() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const cols = 4;
    const rows = 3;
    const cardW = 120;
    const cardH = 80;
    const gap = 12;

    const setNames = ['Home Alone', 'Barad-dur', 'Alpine Lodge', 'Tree House',
                       'Table Football', 'Flying Machine', 'Book Nook', 'Fashion Shop'];
    const pairs = setNames.slice(0, (cols * rows) / 2);
    let cards = [...pairs, ...pairs];

    // Shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    this.flippedCards = [];
    this.matchedPairs = 0;
    this.totalPairs = pairs.length;

    this.roomContainer.add(
      this.add.text(cx, 50, 'Find matching LEGO set pairs!', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.WHITE
      }).setOrigin(0.5)
    );

    const totalW = cols * (cardW + gap) - gap;
    const totalH = rows * (cardH + gap) - gap;
    const startX = cx - totalW / 2 + cardW / 2;
    const startY = 100 + cardH / 2;

    this.cardObjects = cards.map((name, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + gap);

      // Card back (visible) - LEGO brick style
      const back = this.add.graphics();
      back.fillStyle(hexToInt(LEGO_COLORS.RED), 1);
      back.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 8);
      back.lineStyle(2, hexToInt(LEGO_COLORS.DARK_RED), 0.6);
      back.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 8);
      // LEGO studs on card back
      for (let si = -1; si <= 1; si++) {
        back.fillStyle(hexToInt(LEGO_COLORS.DARK_RED), 0.7);
        back.fillCircle(x + si * 25, y, 8);
      }
      this.roomContainer.add(back);

      // Card front (hidden) - clean white with colored border
      const front = this.add.graphics();
      front.fillStyle(0xF0F4F8, 1);
      front.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 8);
      front.lineStyle(3, hexToInt(LEGO_COLORS.YELLOW), 0.8);
      front.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 8);
      front.setVisible(false);
      this.roomContainer.add(front);

      const label = this.add.text(x, y, name, {
        fontFamily: FONT_TITLE,
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#1B2A34',
        align: 'center',
        wordWrap: { width: cardW - 16 }
      }).setOrigin(0.5).setVisible(false);
      this.roomContainer.add(label);

      // Hit area
      const hitArea = this.add.rectangle(x, y, cardW, cardH, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => this.flipCard(i));
      this.roomContainer.add(hitArea);

      return { back, front, label, name, flipped: false, matched: false, hitArea };
    });

    // Register focusables for controller navigation
    const cardFocusables = this.cardObjects.map((card, i) => ({
      element: card.hitArea, x: card.hitArea.x, y: card.hitArea.y, callback: () => this.flipCard(i)
    }));
    InputSystem.setFocusables(cardFocusables);
  }

  flipCard(index) {
    const card = this.cardObjects[index];
    if (card.flipped || card.matched || this.flippedCards.length >= 2) return;

    card.flipped = true;
    card.back.setVisible(false);
    card.front.setVisible(true);
    card.label.setVisible(true);
    this.flippedCards.push(index);

    network.sendPuzzleAction('flip_card', { index });

    if (this.flippedCards.length === 2) {
      const [a, b] = this.flippedCards;
      if (this.cardObjects[a].name === this.cardObjects[b].name) {
        // Match!
        this.cardObjects[a].matched = true;
        this.cardObjects[b].matched = true;
        this.matchedPairs++;
        this.flippedCards = [];

        if (this.matchedPairs === this.totalPairs) {
          this.time.delayedCall(500, () => this.nextRoom());
        }
      } else {
        // No match - flip back
        this.time.delayedCall(1000, () => {
          this.cardObjects[a].flipped = false;
          this.cardObjects[a].back.setVisible(true);
          this.cardObjects[a].front.setVisible(false);
          this.cardObjects[a].label.setVisible(false);
          this.cardObjects[b].flipped = false;
          this.cardObjects[b].back.setVisible(true);
          this.cardObjects[b].front.setVisible(false);
          this.cardObjects[b].label.setVisible(false);
          this.flippedCards = [];
        });
      }
    }
  }

  // PUZZLE 5: Brick Build - Drag bricks to complete a structure
  createBrickBuildPuzzle() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const numBricks = 6 + Math.floor(this.currentRoom / 2);
    const colors = [LEGO_COLORS.RED, LEGO_COLORS.BLUE, LEGO_COLORS.GREEN, LEGO_COLORS.YELLOW, LEGO_COLORS.ORANGE, LEGO_COLORS.BRIGHT_PINK];

    // Generate correct order
    const correctOrder = [];
    for (let i = 0; i < numBricks; i++) {
      correctOrder.push(colors[i % colors.length]);
    }
    // Shuffled order for player
    const shuffled = [...correctOrder].sort(() => Math.random() - 0.5);
    this.buildOrder = [...shuffled];
    this.buildTarget = correctOrder;

    this.roomContainer.add(
      this.add.text(cx, 55, 'Arrange the bricks in the correct order!\nClick two bricks to swap them.', {
        fontFamily: '"Rajdhani"', fontSize: '22px', color: LEGO_COLORS.WHITE,
        align: 'center', lineSpacing: 4
      }).setOrigin(0.5)
    );

    // Target order display
    this.roomContainer.add(
      this.add.text(cx, 90, 'TARGET ORDER:', {
        fontFamily: '"Orbitron"', fontSize: '10px', color: LEGO_COLORS.CYAN, letterSpacing: 1
      }).setOrigin(0.5)
    );
    const targetGfx = this.add.graphics();
    correctOrder.forEach((color, i) => {
      const bx = cx - ((numBricks - 1) * 35) / 2 + i * 35;
      targetGfx.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
      targetGfx.fillRoundedRect(bx - 14, 105, 28, 20, 3);
    });
    this.roomContainer.add(targetGfx);

    // Player bricks (swappable)
    this.roomContainer.add(
      this.add.text(cx, 155, 'YOUR BUILD:', {
        fontFamily: '"Orbitron"', fontSize: '10px', color: LEGO_COLORS.CYAN, letterSpacing: 1
      }).setOrigin(0.5)
    );

    this.selectedBrick = -1;
    this.brickSlots = [];
    const focusItems = [];

    const redrawBricks = () => {
      this.brickSlots.forEach((slot, i) => {
        slot.gfx.clear();
        slot.gfx.fillStyle(Phaser.Display.Color.HexStringToColor(this.buildOrder[i]).color, 1);
        slot.gfx.fillRoundedRect(slot.x - 20, 170, 40, 30, 3);
        if (i === this.selectedBrick) {
          slot.gfx.lineStyle(2, 0xFFFFFF, 1);
          slot.gfx.strokeRoundedRect(slot.x - 20, 170, 40, 30, 3);
        }
      });
    };

    for (let i = 0; i < numBricks; i++) {
      const bx = cx - ((numBricks - 1) * 50) / 2 + i * 50;
      const slotGfx = this.add.graphics();
      this.roomContainer.add(slotGfx);
      this.brickSlots.push({ gfx: slotGfx, x: bx });

      const hitArea = this.add.rectangle(bx, 185, 40, 30, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      const idx = i;
      hitArea.on('pointerdown', () => {
        if (this.selectedBrick === -1) {
          this.selectedBrick = idx;
        } else {
          // Swap
          const temp = this.buildOrder[this.selectedBrick];
          this.buildOrder[this.selectedBrick] = this.buildOrder[idx];
          this.buildOrder[idx] = temp;
          this.selectedBrick = -1;
          network.sendPuzzleAction('brick_swap', { a: this.selectedBrick, b: idx });
        }
        redrawBricks();
      });
      this.roomContainer.add(hitArea);
      focusItems.push({ element: hitArea, x: bx, y: 185, callback: () => hitArea.emit('pointerdown') });
    }
    redrawBricks();

    // Check button
    const submitBtn = this.add.container(cx, 250);
    const bg = this.add.graphics();
    bg.fillStyle(hexToInt(LEGO_COLORS.GREEN), 1);
    bg.fillRoundedRect(-60, -15, 120, 30, 4);
    const lbl = this.add.text(0, -2, 'CHECK', {
      fontFamily: '"Rajdhani"', fontSize: '28px', color: LEGO_COLORS.WHITE
    }).setOrigin(0.5);
    submitBtn.add([bg, lbl]);
    submitBtn.setSize(120, 30);
    submitBtn.setInteractive({ useHandCursor: true });
    submitBtn.on('pointerdown', () => {
      const correct = this.buildOrder.every((c, i) => c === this.buildTarget[i]);
      if (correct) {
        const text = this.add.text(cx, cy, 'PERFECT BUILD!', {
          fontFamily: '"Rajdhani"', fontSize: '28px', color: LEGO_COLORS.GREEN,
          stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);
        this.time.delayedCall(1000, () => { text.destroy(); this.nextRoom(); });
      } else {
        const text = this.add.text(cx, cy + 50, 'Not in order! Try swapping.', {
          fontFamily: '"Rajdhani"', fontSize: '22px', color: LEGO_COLORS.RED
        }).setOrigin(0.5);
        this.time.delayedCall(1500, () => text.destroy());
      }
    });
    this.roomContainer.add(submitBtn);
    focusItems.push({ element: submitBtn, x: cx, y: 250, callback: () => submitBtn.emit('pointerdown') });
    InputSystem.setFocusables(focusItems);

    drawQuoteBox(this, this.roomContainer, 'friends');
  }

  nextRoom() {
    SaveManager.solveRoom(this.chapter || 1, (this.currentRoom || 0) + 1);
    if (this.currentRoom >= this.totalRooms - 1) {
      // Chapter complete!
      const chapterAchievements = CHAPTER_ACHIEVEMENTS[this.chapter] || [];
      const firstAchievement = chapterAchievements[0];

      if (firstAchievement) {
        network.sendChapterComplete(firstAchievement, this.chapter + 1);
      }
      return;
    }

    // Brief transition
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
