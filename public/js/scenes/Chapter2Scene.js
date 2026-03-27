// Chapter 2: "Home Alone" - Co-op Trap Defense
// Yossi places traps, Ante opens/closes doors.
// Burglars walk through the house - stop them with teamwork!
class Chapter2Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Chapter2Scene' });
  }

  init(data) {
    this.chapter = 2;
    this.players = data?.players || [];
    this.currentRoom = 0;
    this.totalRooms = 10;
  }

  create() {
    SceneUI.initPremiumUI(this, LEGO_COLORS.RED);
    this.score = 0;
    this.lives = 5;

    this.roomLabel = null;
    this.progressText = null;

    this.startRoom(0);

    network.on('puzzle_update', (data) => this.onPuzzleUpdate(data));
    network.on('achievement_unlocked', (data) => {
      this.scene.start('AchievementScene', {
        achievementId: data.achievementId,
        nextScene: 'WorldMapScene',
        nextData: { achievements: data.achievements }
      });
    });
  }

  startRoom(roomIndex) {
    this.currentRoom = roomIndex;
    if (this.roomContainer) this.roomContainer.destroy();
    this.roomContainer = this.add.container(0, 0);

    const titles = [
      'The Front Door', 'Kitchen Chaos', 'Stairway Surprise',
      'Basement Battle', 'Attic Attack', 'Bathroom Blitz',
      'Living Room Lockdown', 'Garage Gauntlet', 'Backyard Ambush',
      'The Grand Finale'
    ];
    SceneUI.createRoomHeader(this, 2, 'HOME ALONE', titles[roomIndex] || 'Room ' + (roomIndex + 1), roomIndex + 1, this.totalRooms);

    const puzzleType = roomIndex % 5;
    switch (puzzleType) {
      case 0: this.createTrapPlacementPuzzle(); break;
      case 1: this.createTimingPuzzle(); break;
      case 2: this.createTrapSequencePuzzle(); break;
      case 3: this.createDoorMazePuzzle(); break;
      case 4: this.createBurglarPatternPuzzle(); break;
    }
  }

  // PUZZLE 1: Place traps in the right spots before burglars arrive
  createTrapPlacementPuzzle() {
    const cx = GAME_WIDTH / 2;
    const isHost = isSolo() || network.playerRole === 'host';
    const canInteract = isSolo() || network.playerRole === 'guest';

    // Draw the house cross-section (3 floors)
    this.drawHouse();

    // Instructions
    const instrText = isHost
      ? "You see where burglars will enter!\nTell Yossi where to place traps."
      : "Ante sees the burglar paths!\nClick rooms to place traps.";

    this.roomContainer.add(
      this.add.text(cx, 55, instrText, {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: LEGO_COLORS.WHITE,
        align: 'center',
        lineSpacing: 6
      }).setOrigin(0.5)
    );

    // Grid of rooms (3x3)
    const rooms = [];
    const gridStartX = cx - 140;
    const gridStartY = 110;
    const roomW = 90;
    const roomH = 70;
    const gap = 5;

    // Randomly select 3 rooms that need traps (only host knows)
    const totalCells = 9;
    const trapCount = 3 + Math.floor(this.currentRoom / 3);
    this.trapPositions = [];
    while (this.trapPositions.length < Math.min(trapCount, totalCells)) {
      const pos = Math.floor(Math.random() * totalCells);
      if (!this.trapPositions.includes(pos)) this.trapPositions.push(pos);
    }
    this.playerTraps = new Array(totalCells).fill(false);

    const roomNames = [
      'Attic L', 'Attic R', 'Attic C',
      'Bedroom', 'Bathroom', 'Study',
      'Kitchen', 'Living Rm', 'Hallway'
    ];

    for (let i = 0; i < totalCells; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = gridStartX + col * (roomW + gap);
      const y = gridStartY + row * (roomH + gap);

      const roomGfx = this.add.graphics();

      // Room background
      roomGfx.fillStyle(0x3A2F28, 1);
      roomGfx.fillRect(x, y, roomW, roomH);
      roomGfx.lineStyle(2, 0x6D5D4E, 1);
      roomGfx.strokeRect(x, y, roomW, roomH);

      // Room name
      this.roomContainer.add(roomGfx);
      this.roomContainer.add(
        this.add.text(x + roomW / 2, y + 12, roomNames[i], {
          fontFamily: '"Press Start 2P"',
          fontSize: '6px',
          color: LEGO_COLORS.TAN
        }).setOrigin(0.5)
      );

      // Show burglar path for host
      if (isHost && this.trapPositions.includes(i)) {
        const burglarIcon = this.add.text(x + roomW / 2, y + roomH / 2, 'BURGLAR', {
          fontFamily: '"Press Start 2P"',
          fontSize: '6px',
          color: LEGO_COLORS.RED
        }).setOrigin(0.5);
        this.roomContainer.add(burglarIcon);

        this.tweens.add({
          targets: burglarIcon,
          alpha: 0.4,
          duration: 500,
          yoyo: true,
          repeat: -1
        });
      }

      // Trap slot (clickable for guest)
      const trapLabel = this.add.text(x + roomW / 2, y + roomH - 15, '', {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: LEGO_COLORS.GREEN
      }).setOrigin(0.5);
      this.roomContainer.add(trapLabel);

      if (canInteract) {
        const hitArea = this.add.rectangle(x + roomW / 2, y + roomH / 2, roomW, roomH, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        const roomIndex = i;
        hitArea.on('pointerdown', () => {
          this.playerTraps[roomIndex] = !this.playerTraps[roomIndex];
          trapLabel.setText(this.playerTraps[roomIndex] ? 'TRAP!' : '');
          roomGfx.clear();
          roomGfx.fillStyle(this.playerTraps[roomIndex] ? 0x2A4020 : 0x3A2F28, 1);
          roomGfx.fillRect(x, y, roomW, roomH);
          roomGfx.lineStyle(2, this.playerTraps[roomIndex] ? 0x55AA33 : 0x6D5D4E, 1);
          roomGfx.strokeRect(x, y, roomW, roomH);

          network.sendPuzzleAction('trap_toggle', {
            room: roomIndex,
            trapped: this.playerTraps[roomIndex]
          });
        });
        this.roomContainer.add(hitArea);
      }

      rooms.push({ gfx: roomGfx, trapLabel });
    }
    this.roomSlots = rooms;

    // Submit button
    const submitBtn = this.add.container(cx, GAME_HEIGHT - 80);
    const bg = this.add.graphics();
    bg.fillStyle(hexToInt(LEGO_COLORS.GREEN), 1);
    bg.fillRoundedRect(-70, -15, 140, 30, 4);
    const lbl = this.add.text(0, -2, 'ACTIVATE!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: LEGO_COLORS.WHITE
    }).setOrigin(0.5);
    submitBtn.add([bg, lbl]);
    submitBtn.setSize(140, 30);
    submitBtn.setInteractive({ useHandCursor: true });
    submitBtn.on('pointerdown', () => this.checkTraps());
    this.roomContainer.add(submitBtn);

    // Quote
    const quote = getRandomQuote('ideas');
    this.roomContainer.add(
      this.add.text(cx, GAME_HEIGHT - 35, `"${quote.text}"`, {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: LEGO_COLORS.GREY,
        wordWrap: { width: 600 },
        align: 'center'
      }).setOrigin(0.5)
    );
  }

  // PUZZLE 2: Timing - Hit the button when the burglar is over the trap
  createTimingPuzzle() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.roomContainer.add(
      this.add.text(cx, 60, 'Hit TRAP when the burglar\ncrosses the red zone!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: LEGO_COLORS.WHITE,
        align: 'center',
        lineSpacing: 6
      }).setOrigin(0.5)
    );

    // Floor
    const floorY = cy + 80;
    const floorGfx = this.add.graphics();
    floorGfx.fillStyle(0x6D5D4E, 1);
    floorGfx.fillRect(50, floorY, GAME_WIDTH - 100, 20);
    this.roomContainer.add(floorGfx);

    // Trap zone (red area)
    const trapX = cx - 30 + (Math.random() - 0.5) * 200;
    const trapZone = this.add.graphics();
    trapZone.fillStyle(hexToInt(LEGO_COLORS.RED), 0.3);
    trapZone.fillRect(trapX, floorY - 50, 60, 50);
    trapZone.lineStyle(2, hexToInt(LEGO_COLORS.RED), 0.6);
    trapZone.strokeRect(trapX, floorY - 50, 60, 50);
    this.roomContainer.add(trapZone);

    this.roomContainer.add(
      this.add.text(trapX + 30, floorY - 55, 'TRAP', {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: LEGO_COLORS.RED
      }).setOrigin(0.5)
    );

    // Burglar (moving across)
    const burglar = this.add.graphics();
    burglar.fillStyle(0x1B2A34, 1);
    burglar.fillRect(-10, -40, 20, 40);
    burglar.fillStyle(0x333333, 1);
    burglar.fillRect(-8, -48, 16, 10);
    burglar.fillStyle(0xFFFFFF, 1);
    burglar.fillRect(-5, -42, 3, 3);
    burglar.fillRect(2, -42, 3, 3);
    burglar.setPosition(30, floorY);
    this.roomContainer.add(burglar);

    // Animate burglar walking
    const speed = 2000 + Math.random() * 2000;
    this.tweens.add({
      targets: burglar,
      x: GAME_WIDTH - 30,
      duration: speed,
      repeat: -1,
      yoyo: true
    });

    this.burglar = burglar;
    this.trapZoneX = trapX;
    this.trapZoneW = 60;
    this.timingSuccess = false;

    // Big TRAP button
    const trapBtn = this.add.container(cx, floorY + 80);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(hexToInt(LEGO_COLORS.RED), 1);
    btnBg.fillRoundedRect(-80, -25, 160, 50, 8);
    const btnLbl = this.add.text(0, -3, 'TRAP!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '18px',
      color: LEGO_COLORS.WHITE
    }).setOrigin(0.5);
    trapBtn.add([btnBg, btnLbl]);
    trapBtn.setSize(160, 50);
    trapBtn.setInteractive({ useHandCursor: true });
    trapBtn.on('pointerdown', () => this.checkTiming());
    this.roomContainer.add(trapBtn);
  }

  checkTiming() {
    if (this.timingSuccess) return;
    const bx = this.burglar.x;
    if (bx >= this.trapZoneX && bx <= this.trapZoneX + this.trapZoneW) {
      this.timingSuccess = true;
      const text = this.add.text(GAME_WIDTH / 2, 140, 'GOT HIM!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '20px',
        color: LEGO_COLORS.GREEN,
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);

      network.sendPuzzleAction('timing_hit', { success: true });

      this.time.delayedCall(1200, () => {
        text.destroy();
        this.nextRoom();
      });
    } else {
      const text = this.add.text(GAME_WIDTH / 2, 140, 'MISSED!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '14px',
        color: LEGO_COLORS.RED
      }).setOrigin(0.5);
      this.time.delayedCall(800, () => text.destroy());
    }
  }

  // PUZZLE 3: Trap sequence - place traps in order before timer runs out
  createTrapSequencePuzzle() {
    const cx = GAME_WIDTH / 2;
    const numTraps = 4 + Math.floor(this.currentRoom / 3);
    const trapTypes = ['Paint Can', 'Iron', 'Toy Car', 'Tarantula', 'Blowtorch', 'Feather'];
    const isHost = isSolo() || network.playerRole === 'host';
    const canInteract = isSolo() || network.playerRole === 'guest';

    // Generate sequence (only host sees order)
    this.trapSequence = [];
    for (let i = 0; i < numTraps; i++) {
      this.trapSequence.push(trapTypes[Math.floor(Math.random() * trapTypes.length)]);
    }
    this.playerSequence = [];

    this.roomContainer.add(
      this.add.text(cx, 60, isHost
        ? 'Tell Yossi the trap order!'
        : 'Place traps in the order Ante tells you!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: LEGO_COLORS.WHITE
      }).setOrigin(0.5)
    );

    // Show sequence to host
    if (isHost) {
      this.roomContainer.add(
        this.add.text(cx, 90, 'ORDER:', {
          fontFamily: '"Press Start 2P"',
          fontSize: '8px',
          color: LEGO_COLORS.GREY
        }).setOrigin(0.5)
      );

      this.trapSequence.forEach((trap, i) => {
        this.roomContainer.add(
          this.add.text(cx, 110 + i * 20, `${i + 1}. ${trap}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '7px',
            color: LEGO_COLORS.YELLOW
          }).setOrigin(0.5)
        );
      });
    }

    // Trap buttons for guest
    this.sequenceDisplay = this.add.text(cx, GAME_HEIGHT / 2 - 20, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: LEGO_COLORS.GREEN,
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);
    this.roomContainer.add(this.sequenceDisplay);

    const btnY = GAME_HEIGHT / 2 + 40;
    trapTypes.forEach((trap, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const bx = cx - 130 + col * 130;
      const by = btnY + row * 45;

      const btn = this.add.container(bx, by);
      const bg = this.add.graphics();
      bg.fillStyle(hexToInt(LEGO_COLORS.ORANGE), 1);
      bg.fillRoundedRect(-55, -15, 110, 30, 4);
      const lbl = this.add.text(0, -2, trap, {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: LEGO_COLORS.WHITE
      }).setOrigin(0.5);
      btn.add([bg, lbl]);
      btn.setSize(110, 30);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.playerSequence.push(trap);
        this.sequenceDisplay.setText(this.playerSequence.map((t, j) => `${j + 1}. ${t}`).join('\n'));
        network.sendPuzzleAction('trap_seq', { trap, index: this.playerSequence.length - 1 });

        if (this.playerSequence.length === this.trapSequence.length) {
          this.checkTrapSequence();
        }
      });
      this.roomContainer.add(btn);
    });
  }

  checkTrapSequence() {
    const correct = this.trapSequence.every((t, i) => this.playerSequence[i] === t);
    const cx = GAME_WIDTH / 2;

    if (correct) {
      const text = this.add.text(cx, 140, 'PERFECT SETUP!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '16px',
        color: LEGO_COLORS.GREEN
      }).setOrigin(0.5);
      this.time.delayedCall(1000, () => { text.destroy(); this.nextRoom(); });
    } else {
      this.playerSequence = [];
      this.sequenceDisplay.setText('');
      const text = this.add.text(cx, 140, 'WRONG ORDER!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
        color: LEGO_COLORS.RED
      }).setOrigin(0.5);
      this.time.delayedCall(1000, () => text.destroy());
    }
  }

  // PUZZLE 4: Door maze - one player sees the path, other opens doors
  createDoorMazePuzzle() {
    const cx = GAME_WIDTH / 2;
    const isHost = isSolo() || network.playerRole === 'host';
    const canInteract = isSolo() || network.playerRole === 'guest';

    const gridSize = 4;
    const cellW = 60;
    const cellH = 50;
    const startX = cx - (gridSize * cellW) / 2;
    const startY = 100;

    // Generate path
    this.mazePath = [0]; // Start at top-left
    let current = 0;
    for (let step = 0; step < gridSize * 2; step++) {
      const row = Math.floor(current / gridSize);
      const col = current % gridSize;
      const options = [];
      if (col < gridSize - 1) options.push(current + 1);
      if (row < gridSize - 1) options.push(current + gridSize);
      if (options.length > 0) {
        current = options[Math.floor(Math.random() * options.length)];
        if (!this.mazePath.includes(current)) this.mazePath.push(current);
      }
    }

    this.doorsOpened = new Array(gridSize * gridSize).fill(false);

    this.roomContainer.add(
      this.add.text(cx, 55, isHost
        ? "You see Kevin's path! Tell Yossi which doors to open."
        : "Open doors so Kevin can escape! Ante sees the path.", {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: LEGO_COLORS.WHITE,
        align: 'center',
        lineSpacing: 5
      }).setOrigin(0.5)
    );

    this.mazeSlots = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      const col = i % gridSize;
      const row = Math.floor(i / gridSize);
      const x = startX + col * cellW;
      const y = startY + row * cellH;

      const cell = this.add.graphics();
      cell.fillStyle(0x3A2F28, 1);
      cell.fillRect(x, y, cellW - 4, cellH - 4);
      cell.lineStyle(1, 0x555555, 1);
      cell.strokeRect(x, y, cellW - 4, cellH - 4);
      this.roomContainer.add(cell);

      // Show path for host
      if (isHost && this.mazePath.includes(i)) {
        const pathMarker = this.add.text(x + (cellW - 4) / 2, y + (cellH - 4) / 2,
          i === 0 ? 'START' : (i === this.mazePath[this.mazePath.length - 1] ? 'EXIT' : this.mazePath.indexOf(i).toString()), {
          fontFamily: '"Press Start 2P"',
          fontSize: '7px',
          color: LEGO_COLORS.GREEN
        }).setOrigin(0.5);
        this.roomContainer.add(pathMarker);
      }

      // Door label
      const doorLabel = this.add.text(x + (cellW - 4) / 2, y + (cellH - 4) / 2, 'DOOR', {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: LEGO_COLORS.GREY
      }).setOrigin(0.5);
      if (isHost) doorLabel.setAlpha(0.3);
      this.roomContainer.add(doorLabel);

      if (canInteract) {
        const hitArea = this.add.rectangle(x + (cellW - 4) / 2, y + (cellH - 4) / 2, cellW - 4, cellH - 4, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        const cellIndex = i;
        hitArea.on('pointerdown', () => {
          this.doorsOpened[cellIndex] = !this.doorsOpened[cellIndex];
          cell.clear();
          cell.fillStyle(this.doorsOpened[cellIndex] ? 0x2A4020 : 0x3A2F28, 1);
          cell.fillRect(x, y, cellW - 4, cellH - 4);
          cell.lineStyle(1, this.doorsOpened[cellIndex] ? 0x55AA33 : 0x555555, 1);
          cell.strokeRect(x, y, cellW - 4, cellH - 4);
          doorLabel.setText(this.doorsOpened[cellIndex] ? 'OPEN' : 'DOOR');
          doorLabel.setColor(this.doorsOpened[cellIndex] ? LEGO_COLORS.GREEN : LEGO_COLORS.GREY);
          network.sendPuzzleAction('door_toggle', { cell: cellIndex, open: this.doorsOpened[cellIndex] });
        });
        this.roomContainer.add(hitArea);
      }

      this.mazeSlots.push({ cell, doorLabel });
    }

    // Check button
    const checkBtn = this.add.container(cx, GAME_HEIGHT - 80);
    const bg = this.add.graphics();
    bg.fillStyle(hexToInt(LEGO_COLORS.GREEN), 1);
    bg.fillRoundedRect(-60, -15, 120, 30, 4);
    const lbl = this.add.text(0, -2, 'CHECK', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: LEGO_COLORS.WHITE
    }).setOrigin(0.5);
    checkBtn.add([bg, lbl]);
    checkBtn.setSize(120, 30);
    checkBtn.setInteractive({ useHandCursor: true });
    checkBtn.on('pointerdown', () => this.checkMaze());
    this.roomContainer.add(checkBtn);
  }

  checkMaze() {
    const pathCorrect = this.mazePath.every(i => this.doorsOpened[i]);
    const extraDoors = this.doorsOpened.filter((open, i) => open && !this.mazePath.includes(i)).length;
    const cx = GAME_WIDTH / 2;

    if (pathCorrect && extraDoors === 0) {
      const text = this.add.text(cx, GAME_HEIGHT / 2, 'KEVIN ESCAPED!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '16px',
        color: LEGO_COLORS.GREEN,
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      this.time.delayedCall(1000, () => { text.destroy(); this.nextRoom(); });
    } else {
      const msg = pathCorrect ? 'Too many doors open!' : 'Path blocked!';
      const text = this.add.text(cx, GAME_HEIGHT / 2, msg, {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: LEGO_COLORS.RED
      }).setOrigin(0.5);
      this.time.delayedCall(1500, () => text.destroy());
    }
  }

  // PUZZLE 5: Burglar pattern - identify which burglar comes next
  createBurglarPatternPuzzle() {
    const cx = GAME_WIDTH / 2;
    const burglarTypes = [
      { name: 'Harry', color: LEGO_COLORS.DARK_RED },
      { name: 'Marv', color: LEGO_COLORS.BLUE },
      { name: 'Snakes', color: LEGO_COLORS.GREEN },
      { name: 'Fingers', color: LEGO_COLORS.ORANGE }
    ];

    // Generate pattern
    const patternLen = 3 + Math.floor(this.currentRoom / 3);
    this.pattern = [];
    for (let i = 0; i < patternLen; i++) {
      this.pattern.push(Math.floor(Math.random() * burglarTypes.length));
    }
    // The answer is the next in the pattern (simple repeat)
    this.correctAnswer = this.pattern[this.pattern.length % patternLen];

    this.roomContainer.add(
      this.add.text(cx, 60, "Who's coming next?\nStudy the pattern!", {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: LEGO_COLORS.WHITE,
        align: 'center',
        lineSpacing: 6
      }).setOrigin(0.5)
    );

    // Show pattern
    this.pattern.forEach((bIdx, i) => {
      const b = burglarTypes[bIdx];
      const bx = cx - ((this.pattern.length - 1) * 40) / 2 + i * 40;
      const gfx = this.add.graphics();
      gfx.fillStyle(Phaser.Display.Color.HexStringToColor(b.color).color, 1);
      gfx.fillRect(bx - 15, 100, 30, 40);
      gfx.fillStyle(0x1B2A34, 1);
      gfx.fillRect(bx - 12, 92, 24, 10);
      this.roomContainer.add(gfx);

      this.roomContainer.add(
        this.add.text(bx, 150, b.name, {
          fontFamily: '"Press Start 2P"',
          fontSize: '5px',
          color: LEGO_COLORS.GREY
        }).setOrigin(0.5)
      );
    });

    // Question mark
    const qx = cx + ((this.pattern.length) * 40) / 2;
    this.roomContainer.add(
      this.add.text(qx, 120, '?', {
        fontFamily: '"Press Start 2P"',
        fontSize: '24px',
        color: LEGO_COLORS.YELLOW
      }).setOrigin(0.5)
    );

    // Answer buttons
    burglarTypes.forEach((b, i) => {
      const bx = cx - 130 + i * 90;
      const by = GAME_HEIGHT / 2 + 50;

      const btn = this.add.container(bx, by);
      const bg = this.add.graphics();
      bg.fillStyle(Phaser.Display.Color.HexStringToColor(b.color).color, 1);
      bg.fillRoundedRect(-35, -20, 70, 40, 4);
      const lbl = this.add.text(0, -2, b.name, {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: LEGO_COLORS.WHITE
      }).setOrigin(0.5);
      btn.add([bg, lbl]);
      btn.setSize(70, 40);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        if (i === this.correctAnswer) {
          const text = this.add.text(cx, by + 60, 'CORRECT!', {
            fontFamily: '"Press Start 2P"', fontSize: '14px',
            color: LEGO_COLORS.GREEN
          }).setOrigin(0.5);
          this.time.delayedCall(1000, () => { text.destroy(); this.nextRoom(); });
        } else {
          const text = this.add.text(cx, by + 60, 'WRONG!', {
            fontFamily: '"Press Start 2P"', fontSize: '10px',
            color: LEGO_COLORS.RED
          }).setOrigin(0.5);
          this.time.delayedCall(800, () => text.destroy());
        }
      });
      this.roomContainer.add(btn);
    });
  }

  drawHouse() {
    const gfx = this.add.graphics();
    // Simple house outline
    gfx.lineStyle(2, 0x8B7355, 0.3);
    gfx.strokeRect(50, 85, GAME_WIDTH - 100, GAME_HEIGHT - 170);
    // Floor lines
    const floorH = (GAME_HEIGHT - 170) / 3;
    gfx.strokeRect(50, 85 + floorH, GAME_WIDTH - 100, 0);
    gfx.strokeRect(50, 85 + floorH * 2, GAME_WIDTH - 100, 0);
    this.roomContainer.add(gfx);
  }

  checkTraps() {
    if (!this.trapPositions) return;
    const correct = this.trapPositions.every(pos => this.playerTraps[pos]);
    const extras = this.playerTraps.filter((t, i) => t && !this.trapPositions.includes(i)).length;
    const cx = GAME_WIDTH / 2;

    if (correct && extras === 0) {
      const text = this.add.text(cx, GAME_HEIGHT / 2, 'ALL TRAPPED!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '20px',
        color: LEGO_COLORS.GREEN,
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      this.time.delayedCall(1000, () => { text.destroy(); this.nextRoom(); });
    } else {
      let correctCount = this.trapPositions.filter(pos => this.playerTraps[pos]).length;
      const text = this.add.text(cx, GAME_HEIGHT / 2 + 100, `${correctCount}/${this.trapPositions.length} traps correct. Try again!`, {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: LEGO_COLORS.RED
      }).setOrigin(0.5);
      this.time.delayedCall(2000, () => text.destroy());
    }
  }

  onPuzzleUpdate(data) {
    if (data.action === 'trap_toggle' && this.roomSlots) {
      const { room, trapped } = data.payload;
      this.playerTraps[room] = trapped;
      if (this.roomSlots[room]) {
        this.roomSlots[room].trapLabel.setText(trapped ? 'TRAP!' : '');
      }
    }
    if (data.action === 'door_toggle' && this.mazeSlots) {
      const { cell, open } = data.payload;
      this.doorsOpened[cell] = open;
      if (this.mazeSlots[cell]) {
        this.mazeSlots[cell].doorLabel.setText(open ? 'OPEN' : 'DOOR');
        this.mazeSlots[cell].doorLabel.setColor(open ? LEGO_COLORS.GREEN : LEGO_COLORS.GREY);
      }
    }
  }

  nextRoom() {
    if (this.currentRoom >= this.totalRooms - 1) {
      const chapterAchievements = CHAPTER_ACHIEVEMENTS[this.chapter] || [];
      const firstAchievement = chapterAchievements[0];
      if (firstAchievement) {
        network.sendChapterComplete(firstAchievement, this.chapter + 1);
      }
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
