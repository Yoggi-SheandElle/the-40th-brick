// Chapter 3: "The Dark Tower" - Barad-dur themed puzzles
// Tower climbing, Eye of Sauron dodging, Sauron's library deduction
class Chapter3Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Chapter3Scene' });
  }

  init(data) {
    this.chapter = 3;
    this.players = data?.players || [];
    this.currentRoom = 0;
    this.totalRooms = 10;
  }

  create() {
    SceneUI.initPremiumUI(this, LEGO_COLORS.ORANGE);

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
    InputSystem.clearFocusables();
    if (this.roomContainer) this.roomContainer.destroy();
    this.roomContainer = this.add.container(0, 0);

    const titles = [
      'The Gate', 'The Staircase', 'Orc Barracks',
      "Sauron's Library", 'The Forge', 'The Prison',
      'The Armory', 'The Throne', 'The Eye Chamber',
      'The Summit'
    ];
    SceneUI.createRoomHeader(this, 3, 'THE DARK TOWER', titles[roomIndex] || 'Room ' + (roomIndex + 1), roomIndex + 1, this.totalRooms);

    // Dark tower atmosphere
    this.drawTowerBg();

    const puzzleType = roomIndex % 5;
    switch (puzzleType) {
      case 0: this.createRunePuzzle(); break;
      case 1: this.createEyeDodgePuzzle(); break;
      case 2: this.createLibraryPuzzle(); break;
      case 3: this.createTowerRotatePuzzle(); break;
      case 4: this.createRingPuzzle(); break;
    }
  }

  drawTowerBg() {
    const gfx = this.add.graphics();
    // Dark stone walls
    for (let y = 40; y < GAME_HEIGHT; y += 30) {
      for (let x = 0; x < GAME_WIDTH; x += 50) {
        const offset = (Math.floor(y / 30) % 2) * 25;
        gfx.fillStyle(0x1A0F0A, 0.5 + Math.random() * 0.3);
        gfx.fillRect(x + offset, y, 48, 28);
        gfx.lineStyle(1, 0x0F0A08, 0.4);
        gfx.strokeRect(x + offset, y, 48, 28);
      }
    }
    // Lava glow at bottom
    gfx.fillStyle(0x4A1500, 0.3);
    gfx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);
    this.roomContainer.add(gfx);
  }

  // PUZZLE 1: Rune matching - match dark tongue runes (symbol pairs)
  createRunePuzzle() {
    const cx = GAME_WIDTH / 2;
    const isHost = isSolo() || network.playerRole === 'host';
    const canInteract = isSolo() || network.playerRole === 'guest';
    const runes = ['\u16A0', '\u16A2', '\u16A6', '\u16B1', '\u16B7', '\u16C1', '\u16C7', '\u16D2', '\u16DA', '\u16DE', '\u16E3', '\u16E7'];
    const numPairs = 5 + Math.floor(this.currentRoom / 3);
    const selected = runes.slice(0, numPairs);

    // Generate matching pairs but shuffled separately for each player
    const leftRunes = [...selected].sort(() => Math.random() - 0.5);
    const rightRunes = [...selected].sort(() => Math.random() - 0.5);

    this.runeAnswer = new Array(numPairs).fill(-1);

    this.roomContainer.add(
      this.add.text(cx, 55, isSolo()
        ? 'Match the runes! Click right side\nto cycle numbers until pairs match.'
        : isHost
          ? 'You see the LEFT runes. Tell your partner\nwhich right rune matches each!'
          : 'Match the runes! Your partner sees the left side.', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.ORANGE,
        align: 'center',
        lineSpacing: 5
      }).setOrigin(0.5)
    );

    // Left runes (host sees with labels)
    leftRunes.forEach((rune, i) => {
      const y = 100 + i * 50;
      const runeText = this.add.text(120, y, rune, {
        fontSize: '28px',
        color: isHost ? LEGO_COLORS.ORANGE : LEGO_COLORS.DARK_GREY
      }).setOrigin(0.5);
      this.roomContainer.add(runeText);

      if (isHost) {
        this.roomContainer.add(
          this.add.text(170, y, `= ${selected.indexOf(leftRunes[i]) + 1}`, {
            fontFamily: '"Rajdhani"',
            fontSize: '22px',
            color: LEGO_COLORS.GREY
          }).setOrigin(0, 0.5)
        );
      }
    });

    // Right runes (guest can click to assign)
    this.rightRuneSlots = [];
    rightRunes.forEach((rune, i) => {
      const y = 100 + i * 50;
      const runeText = this.add.text(GAME_WIDTH - 120, y, rune, {
        fontSize: '28px',
        color: LEGO_COLORS.ORANGE
      }).setOrigin(0.5);
      this.roomContainer.add(runeText);

      const numLabel = this.add.text(GAME_WIDTH - 170, y, '-', {
        fontFamily: '"Rajdhani"',
        fontSize: '28px',
        color: LEGO_COLORS.GREY
      }).setOrigin(0.5);
      this.roomContainer.add(numLabel);

      if (canInteract) {
        const hitArea = this.add.rectangle(GAME_WIDTH - 120, y, 80, 40, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        const idx = i;
        hitArea.on('pointerdown', () => {
          this.runeAnswer[idx] = (this.runeAnswer[idx] + 1) % (numPairs + 1);
          const val = this.runeAnswer[idx] === 0 ? '-' : this.runeAnswer[idx].toString();
          numLabel.setText(val);
          network.sendPuzzleAction('rune_set', { slot: idx, value: this.runeAnswer[idx] });
        });
        this.roomContainer.add(hitArea);
      }

      this.rightRuneSlots.push({ numLabel });
    });

    // Check
    const checkBtn = this.createButton(cx, GAME_HEIGHT - 70, 'VERIFY', () => {
      // Check if the assignments create correct pairs
      const correct = rightRunes.every((rune, i) => {
        const assignedNum = this.runeAnswer[i];
        return assignedNum > 0 && leftRunes[assignedNum - 1] === rune;
      });

      if (correct) {
        this.showSuccess('RUNES ALIGNED!');
      } else {
        this.showError('The dark tongue rejects you!');
      }
    });
    this.roomContainer.add(checkBtn);

    // Register focusables for controller navigation
    const runeFocusables = rightRunes.map((rune, i) => ({
      element: null, x: GAME_WIDTH - 120, y: 100 + i * 50, callback: () => {
        this.runeAnswer[i] = (this.runeAnswer[i] + 1) % (numPairs + 1);
        const val = this.runeAnswer[i] === 0 ? '-' : this.runeAnswer[i].toString();
        this.rightRuneSlots[i].numLabel.setText(val);
        network.sendPuzzleAction('rune_set', { slot: i, value: this.runeAnswer[i] });
      }
    }));
    runeFocusables.push({ element: checkBtn, x: cx, y: GAME_HEIGHT - 70, callback: () => checkBtn.emit('pointerdown') });
    InputSystem.setFocusables(runeFocusables);
  }

  // PUZZLE 2: Eye of Sauron - dodge the sweeping eye beam
  createEyeDodgePuzzle() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.roomContainer.add(
      this.add.text(cx, 55, 'Avoid the Eye! Click safe zones\nbefore the beam reaches them.', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.ORANGE,
        align: 'center',
        lineSpacing: 5
      }).setOrigin(0.5)
    );

    // Draw the Eye of Sauron
    const eye = this.add.graphics();
    eye.fillStyle(0xFF4400, 1);
    eye.beginPath();
    eye.arc(cx, 100, 30, 0, Math.PI * 2);
    eye.closePath();
    eye.fillPath();
    eye.fillStyle(0x1B2A34, 1);
    eye.beginPath();
    eye.arc(cx, 100, 12, 0, Math.PI * 2);
    eye.closePath();
    eye.fillPath();
    this.roomContainer.add(eye);

    // Beam that sweeps
    const beam = this.add.graphics();
    beam.fillStyle(0xFF4400, 0.15);
    this.roomContainer.add(beam);

    // Safe zones (5 spots)
    this.safeZones = [];
    this.clickedZones = 0;
    const totalZones = 8;

    for (let i = 0; i < totalZones; i++) {
      const zx = 100 + (GAME_WIDTH - 200) * (i / (totalZones - 1));
      const zy = cy + 80 + Math.sin(i * 1.5) * 40;

      const zone = this.add.graphics();
      zone.fillStyle(0x333333, 1);
      zone.fillCircle(zx, zy, 25);
      zone.lineStyle(2, 0x666666, 1);
      zone.strokeCircle(zx, zy, 25);
      this.roomContainer.add(zone);

      const label = this.add.text(zx, zy, (i + 1).toString(), {
        fontFamily: '"Rajdhani"',
        fontSize: '28px',
        color: LEGO_COLORS.GREY
      }).setOrigin(0.5);
      this.roomContainer.add(label);

      const hitArea = this.add.circle(zx, zy, 25, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      const zoneIdx = i;
      hitArea.on('pointerdown', () => {
        if (this.safeZones[zoneIdx]) return;
        this.safeZones[zoneIdx] = true;
        zone.clear();
        zone.fillStyle(hexToInt(LEGO_COLORS.GREEN), 0.6);
        zone.fillCircle(zx, zy, 25);
        label.setColor(LEGO_COLORS.WHITE);
        label.setText('OK');
        this.clickedZones++;
        network.sendPuzzleAction('zone_click', { zone: zoneIdx });

        if (this.clickedZones >= totalZones) {
          this.showSuccess('You evaded the Eye!');
        }
      });
      this.roomContainer.add(hitArea);
    }

    // Register focusables for controller navigation
    const eyeFocusables = [];
    for (let i = 0; i < totalZones; i++) {
      const zx = 100 + (GAME_WIDTH - 200) * (i / (totalZones - 1));
      const zy = cy + 80 + Math.sin(i * 1.5) * 40;
      eyeFocusables.push({ element: null, x: zx, y: zy, callback: () => {
        if (this.safeZones[i]) return;
        this.safeZones[i] = true;
        this.clickedZones++;
        network.sendPuzzleAction('zone_click', { zone: i });
        if (this.clickedZones >= totalZones) {
          this.showSuccess('You evaded the Eye!');
        }
      }});
    }
    InputSystem.setFocusables(eyeFocusables);

    // Beam sweep animation
    let beamAngle = 0;
    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        beamAngle += 0.06;
        beam.clear();
        beam.fillStyle(0xFF4400, 0.12);
        const bx = cx + Math.sin(beamAngle) * 350;
        beam.fillTriangle(cx, 115, bx - 40, GAME_HEIGHT, bx + 40, GAME_HEIGHT);
      }
    });
  }

  // PUZZLE 3: Library - find the right book (deduction puzzle)
  createLibraryPuzzle() {
    const cx = GAME_WIDTH / 2;
    const isHost = isSolo() || network.playerRole === 'host';
    const canInteract = isSolo() || network.playerRole === 'guest';

    const books = [
      { title: 'Dark Spells', color: LEGO_COLORS.DARK_RED },
      { title: 'Ring Lore', color: LEGO_COLORS.YELLOW },
      { title: 'Orc Tactics', color: LEGO_COLORS.GREEN },
      { title: 'Shadow Maps', color: LEGO_COLORS.BLUE },
      { title: 'Eye Manual', color: LEGO_COLORS.ORANGE },
      { title: 'Mordor Law', color: LEGO_COLORS.GREY },
      { title: 'Fell Beast', color: LEGO_COLORS.DARK_RED },
      { title: 'Palantir', color: LEGO_COLORS.BLUE }
    ];

    const correctBook = Math.floor(Math.random() * books.length);

    // Generate clues (host sees them) - more ambiguous
    const clues = [
      `The book is NOT ${books[(correctBook + 1) % books.length].title} or ${books[(correctBook + 3) % books.length].title}`,
      `The spine color is ${books[correctBook].color === LEGO_COLORS.YELLOW || books[correctBook].color === LEGO_COLORS.ORANGE ? 'warm-toned' : books[correctBook].color === LEGO_COLORS.BLUE || books[correctBook].color === LEGO_COLORS.GREEN ? 'cool-toned' : 'dark or neutral'}`,
      `It's ${correctBook < 4 ? 'on the upper shelves' : 'on the lower shelves'}`,
      `The title has ${books[correctBook].title.length > 8 ? 'more than 8' : '8 or fewer'} letters`
    ];

    this.roomContainer.add(
      this.add.text(cx, 55, isSolo()
        ? 'Use the clues to find the right book!\nClick a book to pick it.'
        : isHost
          ? 'You found clues! Tell your partner which book to grab.'
          : 'Pick the right book based on your partner\'s clues!', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.ORANGE,
        align: 'center',
        lineSpacing: 5
      }).setOrigin(0.5)
    );

    // Show clues to host
    if (isHost) {
      clues.forEach((clue, i) => {
        this.roomContainer.add(
          this.add.text(cx, 90 + i * 20, clue, {
            fontFamily: '"Rajdhani"',
            fontSize: '22px',
            color: LEGO_COLORS.YELLOW
          }).setOrigin(0.5)
        );
      });
    }

    // Book shelf
    const shelfY1 = 170;
    const shelfY2 = 280;
    const shelfGfx = this.add.graphics();
    shelfGfx.fillStyle(0x4A3520, 1);
    shelfGfx.fillRect(80, shelfY1 + 70, GAME_WIDTH - 160, 8);
    shelfGfx.fillRect(80, shelfY2 + 70, GAME_WIDTH - 160, 8);
    this.roomContainer.add(shelfGfx);

    books.forEach((book, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const bx = 110 + col * 110;
      const by = (row === 0 ? shelfY1 : shelfY2);

      const bookGfx = this.add.graphics();
      bookGfx.fillStyle(Phaser.Display.Color.HexStringToColor(book.color).color, 1);
      bookGfx.fillRect(bx - 20, by, 40, 70);
      // Spine detail
      bookGfx.lineStyle(1, 0xFFFFFF, 0.3);
      bookGfx.moveTo(bx - 18, by + 10);
      bookGfx.lineTo(bx + 18, by + 10);
      bookGfx.strokePath();
      this.roomContainer.add(bookGfx);

      const titleText = this.add.text(bx, by + 40, book.title, {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.WHITE
      }).setOrigin(0.5);
      this.roomContainer.add(titleText);

      const hitArea = this.add.rectangle(bx, by + 35, 44, 74, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        network.sendPuzzleAction('book_pick', { book: i });
        if (i === correctBook) {
          this.showSuccess('The ancient text reveals secrets!');
        } else {
          this.showError('That book crumbles to dust!');
        }
      });
      this.roomContainer.add(hitArea);
    });

    // Register focusables for controller navigation
    const bookFocusables = books.map((book, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const bx = 110 + col * 110;
      const by = (row === 0 ? shelfY1 : shelfY2) + 35;
      return { element: null, x: bx, y: by, callback: () => {
        network.sendPuzzleAction('book_pick', { book: i });
        if (i === correctBook) {
          this.showSuccess('The ancient text reveals secrets!');
        } else {
          this.showError('That book crumbles to dust!');
        }
      }};
    });
    InputSystem.setFocusables(bookFocusables);

    // Antica's quote about Sauron's library
    this.roomContainer.add(
      this.add.text(cx, GAME_HEIGHT - 35,
        '"We thought Sauron has been around for thousands of years,\nso he has books containing all his knowledge and magic."', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.GREY,
        align: 'center',
        lineSpacing: 4
      }).setOrigin(0.5)
    );
  }

  // PUZZLE 4: Tower rotate - align tower sections
  createTowerRotatePuzzle() {
    const cx = GAME_WIDTH / 2;
    const isHost = isSolo() || network.playerRole === 'host';
    const canInteract = isSolo() || network.playerRole === 'guest';

    const sections = 5;
    const targetPositions = [];
    for (let i = 0; i < sections; i++) {
      targetPositions.push(Math.floor(Math.random() * 6)); // 0-5 rotation states
    }
    this.towerPositions = new Array(sections).fill(0);

    this.roomContainer.add(
      this.add.text(cx, 55, isSolo()
        ? 'Align all tower sections to match!\nClick sections to rotate them.'
        : isHost
          ? 'You see the correct alignment!\nTell your partner how to rotate each section.'
          : 'Rotate tower sections to align them!\nYour partner knows the correct positions.', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.ORANGE,
        align: 'center',
        lineSpacing: 5
      }).setOrigin(0.5)
    );

    const symbols = ['\u25B2', '\u25B6', '\u25BC', '\u25C0', '\u25C6', '\u2726']; // arrows + diamond + star
    this.towerSections = [];

    for (let i = 0; i < sections; i++) {
      const y = 95 + i * 72;

      // Target (host only)
      if (isHost) {
        this.roomContainer.add(
          this.add.text(cx - 150, y + 15, `Section ${i + 1}: ${symbols[targetPositions[i]]}`, {
            fontFamily: '"Rajdhani"',
            fontSize: '22px',
            color: LEGO_COLORS.YELLOW
          }).setOrigin(0.5)
        );
      }

      // Tower section (rotatable)
      const sectionGfx = this.add.graphics();
      sectionGfx.fillStyle(0x2A1A1A, 1);
      sectionGfx.fillRect(cx - 60, y, 120, 55);
      sectionGfx.lineStyle(2, 0x4A2A2A, 1);
      sectionGfx.strokeRect(cx - 60, y, 120, 55);
      this.roomContainer.add(sectionGfx);

      const arrow = this.add.text(cx, y + 28, symbols[0], {
        fontSize: '20px',
        color: LEGO_COLORS.ORANGE
      }).setOrigin(0.5);
      this.roomContainer.add(arrow);

      const label = this.add.text(cx + 90, y + 28, `Section ${i + 1}`, {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.GREY
      }).setOrigin(0, 0.5);
      this.roomContainer.add(label);

      // Rotate button
      if (canInteract) {
        const hitArea = this.add.rectangle(cx, y + 28, 120, 55, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        const secIdx = i;
        hitArea.on('pointerdown', () => {
          this.towerPositions[secIdx] = (this.towerPositions[secIdx] + 1) % 6;
          arrow.setText(symbols[this.towerPositions[secIdx]]);
          network.sendPuzzleAction('tower_rotate', {
            section: secIdx,
            position: this.towerPositions[secIdx]
          });
        });
        this.roomContainer.add(hitArea);
      }

      this.towerSections.push({ arrow, target: targetPositions[i] });
    }

    // Check button
    const checkBtn = this.createButton(cx, GAME_HEIGHT - 60, 'ALIGN', () => {
      const correct = this.towerSections.every((sec, i) =>
        this.towerPositions[i] === sec.target
      );
      if (correct) {
        this.showSuccess('Tower aligned!');
      } else {
        this.showError('Sections misaligned!');
      }
    });
    this.roomContainer.add(checkBtn);

    // Register focusables for controller navigation
    const towerFocusables = [];
    for (let i = 0; i < sections; i++) {
      const y = 95 + i * 72 + 28;
      towerFocusables.push({ element: null, x: cx, y, callback: () => {
        this.towerPositions[i] = (this.towerPositions[i] + 1) % 6;
        const symbols = ['\u25B2', '\u25B6', '\u25BC', '\u25C0', '\u25C6', '\u2726'];
        this.towerSections[i].arrow.setText(symbols[this.towerPositions[i]]);
        network.sendPuzzleAction('tower_rotate', { section: i, position: this.towerPositions[i] });
      }});
    }
    towerFocusables.push({ element: checkBtn, x: cx, y: GAME_HEIGHT - 60, callback: () => checkBtn.emit('pointerdown') });
    InputSystem.setFocusables(towerFocusables);
  }

  // PUZZLE 5: Ring puzzle - pass the ring through a sequence of holders
  createRingPuzzle() {
    const cx = GAME_WIDTH / 2;
    const characters = ['Frodo', 'Sam', 'Gollum', 'Gandalf', 'Aragorn', 'Legolas', 'Gimli'];
    const correctOrder = ['Gandalf', 'Frodo', 'Aragorn', 'Sam', 'Gollum'];
    const isHost = isSolo() || network.playerRole === 'host';
    const canInteract = isSolo() || network.playerRole === 'guest';

    this.ringOrder = [];

    this.roomContainer.add(
      this.add.text(cx, 55, isSolo()
        ? 'Pass the Ring in the correct order!\nClick characters in sequence.'
        : isHost
          ? 'You know the order the Ring must pass!\nTell your partner who gets it next.'
          : 'Pass the Ring in the correct order!\nYour partner knows the sequence.', {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.ORANGE,
        align: 'center',
        lineSpacing: 5
      }).setOrigin(0.5)
    );

    // Show order to host
    if (isHost) {
      correctOrder.forEach((name, i) => {
        this.roomContainer.add(
          this.add.text(cx, 95 + i * 18, `${i + 1}. ${name}`, {
            fontFamily: '"Rajdhani"',
            fontSize: '22px',
            color: LEGO_COLORS.YELLOW
          }).setOrigin(0.5)
        );
      });
    }

    // The Ring
    const ringGfx = this.add.graphics();
    ringGfx.lineStyle(3, hexToInt(LEGO_COLORS.YELLOW), 1);
    ringGfx.strokeCircle(cx, GAME_HEIGHT / 2 - 20, 18);
    ringGfx.fillStyle(hexToInt(LEGO_COLORS.YELLOW), 0.2);
    ringGfx.fillCircle(cx, GAME_HEIGHT / 2 - 20, 18);
    this.roomContainer.add(ringGfx);

    // Sequence display
    this.ringDisplay = this.add.text(cx, GAME_HEIGHT / 2 + 10, '', {
      fontFamily: '"Rajdhani"',
      fontSize: '22px',
      color: LEGO_COLORS.GREEN,
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);
    this.roomContainer.add(this.ringDisplay);

    // Character buttons
    characters.forEach((name, i) => {
      const bx = 80 + (i % 3) * 140;
      const by = GAME_HEIGHT / 2 + 70 + Math.floor(i / 3) * 50;

      const btn = this.add.container(bx, by);
      const bg = this.add.graphics();
      bg.fillStyle(0x3A2A1A, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, 4);
      bg.lineStyle(1, hexToInt(LEGO_COLORS.ORANGE), 0.5);
      bg.strokeRoundedRect(-50, -18, 100, 36, 4);
      const lbl = this.add.text(0, -2, name, {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        color: LEGO_COLORS.WHITE
      }).setOrigin(0.5);
      btn.add([bg, lbl]);
      btn.setSize(100, 36);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.ringOrder.push(name);
        this.ringDisplay.setText(this.ringOrder.map((n, j) => `${j + 1}. ${n}`).join('\n'));
        network.sendPuzzleAction('ring_pass', { to: name });

        if (this.ringOrder.length === correctOrder.length) {
          const correct = correctOrder.every((n, j) => this.ringOrder[j] === n);
          if (correct) {
            this.showSuccess('The Ring reaches Mount Doom!');
          } else {
            this.ringOrder = [];
            this.ringDisplay.setText('');
            this.showError('The Ring rejects this path!');
          }
        }
      });
      this.roomContainer.add(btn);
    });

    // Register focusables for controller navigation
    const ringFocusables = characters.map((name, i) => {
      const bx = 80 + (i % 3) * 140;
      const by = GAME_HEIGHT / 2 + 70 + Math.floor(i / 3) * 50;
      return { element: null, x: bx, y: by, callback: () => {
        this.ringOrder.push(name);
        this.ringDisplay.setText(this.ringOrder.map((n, j) => `${j + 1}. ${n}`).join('\n'));
        network.sendPuzzleAction('ring_pass', { to: name });
        if (this.ringOrder.length === correctOrder.length) {
          const correct = correctOrder.every((n, j) => this.ringOrder[j] === n);
          if (correct) {
            this.showSuccess('The Ring reaches Mount Doom!');
          } else {
            this.ringOrder = [];
            this.ringDisplay.setText('');
            this.showError('The Ring rejects this path!');
          }
        }
      }};
    });
    InputSystem.setFocusables(ringFocusables);
  }

  onPuzzleUpdate(data) {
    if (data.action === 'rune_set' && this.rightRuneSlots) {
      const { slot, value } = data.payload;
      if (this.rightRuneSlots[slot]) {
        this.rightRuneSlots[slot].numLabel.setText(value === 0 ? '-' : value.toString());
      }
    }
    if (data.action === 'tower_rotate' && this.towerSections) {
      const { section, position } = data.payload;
      const symbols = ['\u25B2', '\u25B6', '\u25BC', '\u25C0', '\u25C6', '\u2726'];
      if (this.towerSections[section]) {
        this.towerPositions[section] = position;
        this.towerSections[section].arrow.setText(symbols[position]);
      }
    }
  }

  showSuccess(msg) {
    const cx = GAME_WIDTH / 2;
    const text = this.add.text(cx, GAME_HEIGHT / 2, msg, {
      fontFamily: '"Rajdhani"',
      fontSize: '22px',
      color: LEGO_COLORS.GREEN,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(100);

    this.time.delayedCall(1200, () => {
      text.destroy();
      this.nextRoom();
    });
  }

  showError(msg) {
    const cx = GAME_WIDTH / 2;
    const text = this.add.text(cx, GAME_HEIGHT / 2, msg, {
      fontFamily: '"Rajdhani"',
      fontSize: '22px',
      color: LEGO_COLORS.RED
    }).setOrigin(0.5).setDepth(100);

    this.time.delayedCall(1500, () => text.destroy());
  }

  createButton(x, y, text, callback) {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(hexToInt(LEGO_COLORS.DARK_RED), 1);
    bg.fillRoundedRect(-60, -15, 120, 30, 4);
    const lbl = this.add.text(0, -2, text, {
      fontFamily: '"Rajdhani"',
      fontSize: '28px',
      color: LEGO_COLORS.WHITE
    }).setOrigin(0.5);
    btn.add([bg, lbl]);
    btn.setSize(120, 30);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', callback);
    return btn;
  }

  nextRoom() {
    SaveManager.solveRoom(this.chapter || 3, (this.currentRoom || 0) + 1);
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
