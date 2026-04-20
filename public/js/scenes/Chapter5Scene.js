// Chapter 5: "The Designer's Desk" - bonus chapter unlocked after the birthday reveal.
// Three new puzzle types that don't repeat anything in chapters 1-4:
//  - Designer's Sketch  : 5x5 Picross of a LEGO stud
//  - Year Match         : pair Ante's iconic sets with their release years
//  - Real Quote Hunt    : pick the 3 real Ante quotes from a mix of 6
class Chapter5Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Chapter5Scene' });
  }

  init(data) {
    this.chapter = 5;
    this.players = data?.players || [];
    this.currentRoom = 0;
    this.totalRooms = 3;
  }

  create() {
    SceneUI.initPremiumUI(this, LEGO_COLORS.CYAN);
    this.startRoom(0);
  }

  startRoom(roomIndex) {
    this.currentRoom = roomIndex;
    InputSystem.clearFocusables();
    if (this.roomContainer) this.roomContainer.destroy();
    this.roomContainer = this.add.container(0, 0);

    if (roomIndex >= this.totalRooms) {
      this.showFinaleCard();
      return;
    }

    const titles = ["The Designer's Sketch", 'The Years That Built You', 'In Her Own Words'];
    SceneUI.createRoomHeader(this, 5, "DESIGNER'S DESK", titles[roomIndex], roomIndex + 1, this.totalRooms);

    switch (roomIndex) {
      case 0: this.createPicrossPuzzle(); break;
      case 1: this.createYearMatchPuzzle(); break;
      case 2: this.createRealQuoteHuntPuzzle(); break;
    }
  }

  // ============================================================
  // PUZZLE 1: Designer's Sketch - 5x5 Picross of a LEGO stud
  // ============================================================
  createPicrossPuzzle() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Solution: a stylised round LEGO stud
    const solution = [
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0]
    ];
    const rowClues = solution.map(r => r.reduce((a, b) => a + b, 0));
    const colClues = solution[0].map((_, c) => solution.reduce((sum, r) => sum + r[c], 0));

    this.picrossState = solution.map(r => r.map(() => 0));
    this.picrossSolution = solution;

    this.roomContainer.add(
      this.add.text(cx, 78, "Sketch the brick! Click cells to fill.\nNumbers show how many filled per row/column.", {
        fontFamily: '"Rajdhani"',
        fontSize: '24px',
        fontStyle: 'bold',
        color: LEGO_COLORS.CYAN,
        align: 'center',
        lineSpacing: 6
      }).setOrigin(0.5)
    );

    const cellSize = 70;
    const gridSize = 5;
    const gridW = cellSize * gridSize;
    const gridLeft = cx - gridW / 2 + 30;
    const gridTop = 180;

    // Column clues
    for (let c = 0; c < gridSize; c++) {
      this.roomContainer.add(
        this.add.text(gridLeft + c * cellSize + cellSize / 2, gridTop - 30, colClues[c].toString(), {
          fontFamily: '"Rajdhani"',
          fontSize: '32px',
          fontStyle: 'bold',
          color: LEGO_COLORS.YELLOW
        }).setOrigin(0.5)
      );
    }

    // Row clues
    for (let r = 0; r < gridSize; r++) {
      this.roomContainer.add(
        this.add.text(gridLeft - 30, gridTop + r * cellSize + cellSize / 2, rowClues[r].toString(), {
          fontFamily: '"Rajdhani"',
          fontSize: '32px',
          fontStyle: 'bold',
          color: LEGO_COLORS.YELLOW
        }).setOrigin(0.5)
      );
    }

    // Grid cells
    this.picrossCells = [];
    for (let r = 0; r < gridSize; r++) {
      const row = [];
      for (let c = 0; c < gridSize; c++) {
        const x = gridLeft + c * cellSize + cellSize / 2;
        const y = gridTop + r * cellSize + cellSize / 2;

        const bg = this.add.graphics();
        this.drawPicrossCell(bg, x, y, cellSize - 6, 0);
        this.roomContainer.add(bg);

        const hit = this.add.rectangle(x, y, cellSize - 4, cellSize - 4, 0x000000, 0);
        hit.setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          this.picrossState[r][c] = this.picrossState[r][c] === 1 ? 0 : 1;
          this.drawPicrossCell(bg, x, y, cellSize - 6, this.picrossState[r][c]);
        });
        this.roomContainer.add(hit);

        row.push({ bg, hit, x, y });
      }
      this.picrossCells.push(row);
    }

    // Submit button
    const checkBtn = this.makeButton(cx, GAME_HEIGHT - 60, 240, 70, 'CHECK', LEGO_COLORS.GREEN, () => {
      let correct = true;
      for (let r = 0; r < gridSize && correct; r++) {
        for (let c = 0; c < gridSize && correct; c++) {
          if (this.picrossState[r][c] !== solution[r][c]) correct = false;
        }
      }
      if (correct) {
        this.showFeedback('PERFECT STUD!', LEGO_COLORS.GREEN, () => this.nextRoom());
      } else {
        this.showFeedback('Not quite. Try again!', LEGO_COLORS.RED);
      }
    });
    this.roomContainer.add(checkBtn);

    // Controller focusables: include all cells + check button
    const focusables = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        focusables.push({
          element: null, x: this.picrossCells[r][c].x, y: this.picrossCells[r][c].y,
          callback: () => this.picrossCells[r][c].hit.emit('pointerdown')
        });
      }
    }
    focusables.push({ element: checkBtn, x: cx, y: GAME_HEIGHT - 60, callback: () => checkBtn.emit('pointerdown') });
    InputSystem.setFocusables(focusables);
  }

  drawPicrossCell(gfx, x, y, size, filled) {
    gfx.clear();
    if (filled) {
      gfx.fillStyle(hexToInt(LEGO_COLORS.CYAN), 0.95);
      gfx.fillRoundedRect(x - size / 2, y - size / 2, size, size, 8);
      gfx.lineStyle(3, 0xffffff, 0.5);
      gfx.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 8);
      // Stud highlight
      gfx.fillStyle(0xffffff, 0.25);
      gfx.fillCircle(x, y - 4, 6);
    } else {
      gfx.fillStyle(0x1A2030, 1);
      gfx.fillRoundedRect(x - size / 2, y - size / 2, size, size, 8);
      gfx.lineStyle(2, 0x00D4FF, 0.4);
      gfx.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 8);
    }
  }

  // ============================================================
  // PUZZLE 2: Year Match - pair Ante's sets with release years
  // ============================================================
  createYearMatchPuzzle() {
    const cx = GAME_WIDTH / 2;

    const sets = [
      { name: "Emma's Fashion Shop", year: 2018 },
      { name: 'Home Alone',          year: 2021 },
      { name: 'Table Football',      year: 2022 },
      { name: 'Alpine Lodge',        year: 2024 },
      { name: "Da Vinci's Flying Machine", year: 2025 },
      { name: 'Sherlock Holmes Book Nook', year: 2025 }
    ];
    const years = [2018, 2021, 2022, 2024, 2025];

    this.yearMatched = sets.map(() => false);
    this.yearSelectedSet = null;

    this.roomContainer.add(
      this.add.text(cx, 78, "Match each set to its release year.\nOne year has two sets. Years can be reused.", {
        fontFamily: '"Rajdhani"',
        fontSize: scaledFont(24),
        fontStyle: 'bold',
        color: LEGO_COLORS.CYAN,
        align: 'center',
        lineSpacing: 6
      }).setOrigin(0.5)
    );

    // Set buttons (left side, vertical stack)
    const setBtnW = 460;
    const setBtnH = 64;
    const setX = cx - 260;
    const setStartY = 170;
    const setSpacing = 78;

    this.yearSetButtons = [];
    sets.forEach((s, i) => {
      const y = setStartY + i * setSpacing;
      const btn = this.makeButton(setX, y, setBtnW, setBtnH, s.name, LEGO_COLORS.BLUE, () => {
        if (this.yearMatched[i]) return;
        this.yearSelectedSet = i;
        this.yearSetButtons.forEach((b, idx) => {
          if (this.yearMatched[idx]) return;
          this.colorButton(b, idx === i ? LEGO_COLORS.YELLOW : LEGO_COLORS.BLUE);
        });
      });
      this.roomContainer.add(btn);
      this.yearSetButtons.push(btn);
    });

    // Year buttons (right side, vertical stack)
    const yearBtnW = 200;
    const yearBtnH = 64;
    const yearX = cx + 290;
    const yearStartY = 200;
    const yearSpacing = 92;

    const yearBtns = [];
    years.forEach((yr, i) => {
      const y = yearStartY + i * yearSpacing;
      const btn = this.makeButton(yearX, y, yearBtnW, yearBtnH, yr.toString(), LEGO_COLORS.ORANGE, () => {
        if (this.yearSelectedSet === null) return;
        const setIdx = this.yearSelectedSet;
        if (sets[setIdx].year === yr) {
          this.yearMatched[setIdx] = true;
          this.colorButton(this.yearSetButtons[setIdx], LEGO_COLORS.GREEN, true);
          this.yearSelectedSet = null;
          if (this.yearMatched.every(Boolean)) {
            this.showFeedback('ALL MATCHED!', LEGO_COLORS.GREEN, () => this.nextRoom());
          }
        } else {
          this.colorButton(this.yearSetButtons[setIdx], LEGO_COLORS.RED);
          this.time.delayedCall(500, () => {
            if (!this.yearMatched[setIdx]) {
              this.colorButton(this.yearSetButtons[setIdx], LEGO_COLORS.BLUE);
            }
            this.yearSelectedSet = null;
          });
        }
      });
      this.roomContainer.add(btn);
      yearBtns.push(btn);
    });

    // Focusables: sets + years
    const focusables = [];
    this.yearSetButtons.forEach((b, i) => focusables.push({
      element: b, x: setX, y: setStartY + i * setSpacing,
      callback: () => b.emit('pointerdown')
    }));
    yearBtns.forEach((b, i) => focusables.push({
      element: b, x: yearX, y: yearStartY + i * yearSpacing,
      callback: () => b.emit('pointerdown')
    }));
    InputSystem.setFocusables(focusables);
  }

  // ============================================================
  // PUZZLE 3: Real Quote Hunt - select all 3 real Ante quotes from 6
  // ============================================================
  createRealQuoteHuntPuzzle() {
    const cx = GAME_WIDTH / 2;

    // Pick 3 real quotes from QUOTES (random) and 3 fakes
    const realPool = [...QUOTES].sort(() => Math.random() - 0.5).slice(0, 3);
    const fakes = [
      "The most important part of any LEGO set is the box art.",
      "I always sketch ten versions before settling on a final design.",
      "I prefer Technic over System bricks for everything I build."
    ];

    const items = [
      ...realPool.map(q => ({ text: q.text, real: true, source: q.source })),
      ...fakes.map(t => ({ text: t, real: false }))
    ].sort(() => Math.random() - 0.5);

    this.quoteSelected = items.map(() => false);

    this.roomContainer.add(
      this.add.text(cx, 70, "Pick the 3 REAL Ante quotes.", {
        fontFamily: '"Rajdhani"',
        fontSize: '26px',
        fontStyle: 'bold',
        color: LEGO_COLORS.CYAN
      }).setOrigin(0.5)
    );
    this.roomContainer.add(
      this.add.text(cx, 100, "Click to select. Submit when you have 3.", {
        fontFamily: '"Rajdhani"',
        fontSize: '20px',
        color: LEGO_COLORS.YELLOW
      }).setOrigin(0.5)
    );

    // 6 quote boxes in a 2x3 grid
    const cols = 2;
    const rows = 3;
    const boxW = 580;
    const boxH = 130;
    const gapX = 20;
    const gapY = 16;
    const gridW = cols * boxW + (cols - 1) * gapX;
    const gridLeft = cx - gridW / 2;
    const gridTop = 130;

    const quoteBoxes = [];
    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gridLeft + col * (boxW + gapX);
      const y = gridTop + row * (boxH + gapY);

      const bg = this.add.graphics();
      this.drawQuoteBoxBg(bg, x, y, boxW, boxH, false);
      this.roomContainer.add(bg);

      const text = this.add.text(x + boxW / 2, y + boxH / 2, '"' + item.text + '"', {
        fontFamily: '"Rajdhani"',
        fontSize: scaledFont(24),
        fontStyle: 'bold',
        color: LEGO_COLORS.WHITE,
        align: 'center',
        wordWrap: { width: boxW - 30 },
        lineSpacing: 4
      }).setOrigin(0.5);
      this.roomContainer.add(text);

      const hit = this.add.rectangle(x + boxW / 2, y + boxH / 2, boxW, boxH, 0x000000, 0);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.quoteSelected[i] = !this.quoteSelected[i];
        this.drawQuoteBoxBg(bg, x, y, boxW, boxH, this.quoteSelected[i]);
      });
      this.roomContainer.add(hit);

      quoteBoxes.push({ bg, text, hit, x, y, item });
    });

    // Submit
    const submitBtn = this.makeButton(cx, GAME_HEIGHT - 50, 260, 64, 'SUBMIT', LEGO_COLORS.GREEN, () => {
      const picked = this.quoteSelected.filter(Boolean).length;
      if (picked !== 3) {
        this.showFeedback(`Pick exactly 3 (you picked ${picked})`, LEGO_COLORS.RED);
        return;
      }
      const allCorrect = items.every((it, i) => this.quoteSelected[i] === it.real);
      if (allCorrect) {
        this.showFeedback('YOU KNOW HER!', LEGO_COLORS.GREEN, () => this.nextRoom());
      } else {
        const missed = items.filter((it, i) => it.real && !this.quoteSelected[i]).length;
        const wrong = items.filter((it, i) => !it.real && this.quoteSelected[i]).length;
        this.showFeedback(`Off by ${missed + wrong}. Try again!`, LEGO_COLORS.RED);
      }
    });
    this.roomContainer.add(submitBtn);

    // Focusables: 6 boxes + submit
    const focusables = quoteBoxes.map(qb => ({
      element: null, x: qb.x + boxW / 2, y: qb.y + boxH / 2,
      callback: () => qb.hit.emit('pointerdown')
    }));
    focusables.push({ element: submitBtn, x: cx, y: GAME_HEIGHT - 50, callback: () => submitBtn.emit('pointerdown') });
    InputSystem.setFocusables(focusables);
  }

  drawQuoteBoxBg(gfx, x, y, w, h, selected) {
    gfx.clear();
    if (selected) {
      gfx.fillStyle(hexToInt(LEGO_COLORS.CYAN), 0.18);
      gfx.fillRoundedRect(x, y, w, h, 12);
      gfx.lineStyle(4, hexToInt(LEGO_COLORS.CYAN), 1);
      gfx.strokeRoundedRect(x, y, w, h, 12);
    } else {
      gfx.fillStyle(0x1A2030, 0.95);
      gfx.fillRoundedRect(x, y, w, h, 12);
      gfx.lineStyle(2, 0x00D4FF, 0.4);
      gfx.strokeRoundedRect(x, y, w, h, 12);
    }
  }

  // ============================================================
  // Helpers
  // ============================================================
  makeButton(x, y, w, h, label, color, callback) {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    btn._bg = bg;
    btn._color = color;
    btn._w = w;
    btn._h = h;
    this.colorButton(btn, color);
    const lbl = this.add.text(0, 0, label, {
      fontFamily: '"Rajdhani"',
      fontSize: '26px',
      fontStyle: 'bold',
      color: LEGO_COLORS.WHITE,
      stroke: '#000000',
      strokeThickness: 3,
      wordWrap: { width: w - 24 },
      align: 'center'
    }).setOrigin(0.5);
    btn._lbl = lbl;
    btn.add([bg, lbl]);
    btn.setSize(w, h);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', callback);
    return btn;
  }

  colorButton(btn, color, locked) {
    const bg = btn._bg;
    const w = btn._w;
    const h = btn._h;
    if (!bg) return;
    bg.clear();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, locked ? 0.5 : 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(3, 0xffffff, locked ? 0.2 : 0.4);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    btn._color = color;
  }

  showFeedback(msg, color, onComplete) {
    const cx = GAME_WIDTH / 2;
    const bg = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, 180, 0x000000, 0.78).setDepth(99);
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

  nextRoom() {
    if (this.currentRoom + 1 >= this.totalRooms) {
      this.showFinaleCard();
      return;
    }
    this.startRoom(this.currentRoom + 1);
  }

  showFinaleCard() {
    InputSystem.clearFocusables();
    if (this.roomContainer) this.roomContainer.destroy();
    this.roomContainer = this.add.container(0, 0);
    this.cameras.main.setBackgroundColor('#0A0A1A');

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const title = this.add.text(cx, cy - 220, 'THE DESIGNER\'S DESK', {
      fontFamily: '"Rajdhani"',
      fontSize: '46px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setAlpha(0);
    this.roomContainer.add(title);
    this.tweens.add({ targets: title, alpha: 1, duration: 800 });

    const subtitle = this.add.text(cx, cy - 160, 'BONUS COMPLETE', {
      fontFamily: '"Rajdhani"',
      fontSize: '30px',
      fontStyle: 'bold',
      color: LEGO_COLORS.CYAN
    }).setOrigin(0.5).setAlpha(0);
    this.roomContainer.add(subtitle);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 800, delay: 400 });

    const message = this.add.text(cx, cy + 30,
      "57 sets. Croatia to Billund.\n" +
      "Friends. Home Alone. Table Football.\n" +
      "Alpine Lodge. Barad-dur. Da Vinci.\n" +
      "Sherlock's Book Nook. And the next 40 to come.\n\n" +
      "You don't just design bricks.\n" +
      "You design the moments people share with them.", {
      fontFamily: '"Rajdhani"',
      fontSize: '24px',
      fontStyle: 'bold',
      color: LEGO_COLORS.WHITE,
      align: 'center',
      lineSpacing: 8,
      wordWrap: { width: 900 }
    }).setOrigin(0.5).setAlpha(0);
    this.roomContainer.add(message);
    this.tweens.add({ targets: message, alpha: 1, duration: 1000, delay: 1000 });

    const sig = this.add.text(cx, GAME_HEIGHT - 60, '- Yossi, with all the love in 40 years of bricks',
      {
        fontFamily: '"Rajdhani"',
        fontSize: '22px',
        fontStyle: 'italic',
        color: LEGO_COLORS.YELLOW
      }).setOrigin(0.5).setAlpha(0);
    this.roomContainer.add(sig);
    this.tweens.add({ targets: sig, alpha: 1, duration: 800, delay: 2200 });

    // Confetti for the finale
    this.time.delayedCall(1500, () => {
      for (let i = 0; i < 80; i++) {
        const colors = [0xB40000, 0x0055BF, 0xF2CD37, 0x237841, 0xA83D15, 0xE4ADC8, 0xAC78BA, 0x00D4FF];
        const x = Math.random() * GAME_WIDTH;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 4 + Math.random() * 6;
        const confetti = this.add.graphics();
        confetti.fillStyle(color, 1);
        confetti.fillRect(-size / 2, -size / 2, size, size);
        confetti.setPosition(x, -20);
        this.roomContainer.add(confetti);
        this.tweens.add({
          targets: confetti,
          y: GAME_HEIGHT + 40,
          x: x + (Math.random() - 0.5) * 200,
          angle: Math.random() * 720,
          alpha: 0,
          delay: Math.random() * 2000,
          duration: 2500 + Math.random() * 2000,
          ease: 'Quad.easeIn'
        });
      }
    });
  }
}
