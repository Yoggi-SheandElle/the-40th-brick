class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  init(data) {
    this.players = data?.players || [];
    this.unlockedAchievements = data?.achievements || [];
  }

  create() {
    const cx = GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor('#0A0E17');
    drawGridBg(this);

    // Title
    this.add.text(cx, 28, "ANTICA'S JOURNEY", {
      fontFamily: FONT_TITLE,
      fontSize: '22px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);

    this.add.text(cx, 52, '40 Rooms \u00B7 40 Bricks \u00B7 40 Years', {
      fontFamily: FONT_MONO,
      fontSize: '8px',
      color: '#6A7A8A',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Decorative line
    const decor = this.add.graphics();
    decor.lineStyle(1, 0x00D4FF, 0.15);
    decor.lineBetween(cx - 140, 68, cx + 140, 68);

    const chapters = [
      {
        num: 1, title: 'THE FIRST BRICK',
        subtitle: 'Croatia & Heartlake City',
        years: '2009-2021', color: LEGO_COLORS.BRIGHT_PINK,
        rooms: '10 Rooms', unlocked: true
      },
      {
        num: 2, title: 'HOME ALONE',
        subtitle: "Kevin's House",
        years: '2021', color: LEGO_COLORS.RED,
        rooms: '10 Rooms', unlocked: this.isChapterUnlocked(2)
      },
      {
        num: 3, title: 'THE DARK TOWER',
        subtitle: 'Barad-d\u00FBr',
        years: '2024', color: LEGO_COLORS.DARK_RED,
        rooms: '10 Rooms', unlocked: this.isChapterUnlocked(3)
      },
      {
        num: 4, title: 'ROOM 40',
        subtitle: 'The Birthday',
        years: '2026', color: LEGO_COLORS.YELLOW,
        rooms: '10 Rooms', unlocked: this.isChapterUnlocked(4)
      }
    ];

    // Timeline
    const lineY = 280;
    const gfx = this.add.graphics();

    // Glowing timeline line
    gfx.lineStyle(2, 0x00D4FF, 0.12);
    gfx.moveTo(80, lineY);
    gfx.lineTo(GAME_WIDTH - 80, lineY);
    gfx.strokePath();
    gfx.lineStyle(1, 0x00D4FF, 0.06);
    gfx.moveTo(80, lineY - 2);
    gfx.lineTo(GAME_WIDTH - 80, lineY - 2);
    gfx.strokePath();

    const spacing = (GAME_WIDTH - 160) / (chapters.length - 1);
    const focusables = [];

    chapters.forEach((ch, i) => {
      const x = 80 + i * spacing;
      const node = this.drawChapterNode(x, lineY, ch);
      if (ch.unlocked && node) {
        focusables.push({
          element: node.hitArea,
          callback: () => {
            this.cameras.main.fadeOut(400, 10, 14, 23);
            this.time.delayedCall(400, () => network.startChapter(ch.num));
          }
        });
      }
    });

    // Gamepad focus
    if (focusables.length > 0) {
      GamepadManager.setFocusables(focusables);
    }

    // Progress section
    const completedRooms = SaveManager.getProgress().solved;
    const pct = Math.round((completedRooms / 40) * 100);

    this.add.text(cx, GAME_HEIGHT - 75, completedRooms + '/40 Bricks Collected', {
      fontFamily: FONT_TITLE,
      fontSize: '13px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);

    // Progress bar
    const barW = 400;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x1A2030, 1);
    barBg.fillRoundedRect(cx - barW / 2, GAME_HEIGHT - 50, barW, 14, 4);
    barBg.lineStyle(1, 0x00D4FF, 0.1);
    barBg.strokeRoundedRect(cx - barW / 2, GAME_HEIGHT - 50, barW, 14, 4);

    if (completedRooms > 0) {
      const fillW = barW * (completedRooms / 40);
      barBg.fillStyle(hexToInt(LEGO_COLORS.GREEN), 0.8);
      barBg.fillRoundedRect(cx - barW / 2 + 1, GAME_HEIGHT - 49, fillW - 2, 12, 3);
    }

    this.add.text(cx, GAME_HEIGHT - 27, pct + '% Complete', {
      fontFamily: FONT_MONO,
      fontSize: '8px',
      color: '#5A6A7A',
      letterSpacing: 1
    }).setOrigin(0.5);

    // Listen for chapter start
    network.on('chapter_started', (data) => {
      this.launchChapter(data.chapter);
    });

    this.cameras.main.fadeIn(400, 10, 14, 23);
  }

  isChapterUnlocked(num) {
    // Use SaveManager as source of truth (persists in localStorage)
    const progress = SaveManager.getProgress();
    const roomsPerChapter = 10;
    const requiredRooms = (num - 1) * roomsPerChapter;
    return progress.solved >= requiredRooms;
  }

  drawChapterNode(x, y, chapter) {
    const gfx = this.add.graphics();
    const c = Phaser.Display.Color.HexStringToColor(chapter.color);
    const alpha = chapter.unlocked ? 1 : 0.25;

    // Outer glow ring
    if (chapter.unlocked) {
      gfx.lineStyle(1, c.color, 0.15);
      gfx.strokeCircle(x, y, 36);
    }

    // Main circle - LEGO brick style
    gfx.fillStyle(c.color, alpha * 0.85);
    gfx.fillCircle(x, y, 28);
    // 3D bottom shadow
    gfx.fillStyle(c.darken(30).color, alpha * 0.6);
    gfx.fillRect(x - 27, y + 10, 54, 8);
    // Top highlight
    gfx.lineStyle(2, c.lighten(20).color, alpha * 0.4);
    gfx.beginPath();
    gfx.arc(x, y, 28, -2.5, -0.6);
    gfx.strokePath();

    // Stud on top
    gfx.fillStyle(c.lighten(10).color, alpha);
    gfx.fillCircle(x, y - 18, 6);
    gfx.fillStyle(0xFFFFFF, alpha * 0.1);
    gfx.fillCircle(x - 1, y - 19, 2);

    // Number
    this.add.text(x, y + 2, chapter.num.toString(), {
      fontFamily: FONT_TITLE,
      fontSize: '20px',
      fontStyle: 'bold',
      color: LEGO_COLORS.WHITE
    }).setOrigin(0.5).setAlpha(alpha);

    // Title
    this.add.text(x, y - 60, chapter.title, {
      fontFamily: FONT_TITLE,
      fontSize: '9px',
      fontStyle: 'bold',
      color: chapter.color,
      align: 'center',
      wordWrap: { width: 160 }
    }).setOrigin(0.5).setAlpha(alpha);

    // Subtitle
    this.add.text(x, y - 45, chapter.subtitle, {
      fontFamily: FONT_BODY,
      fontSize: '11px',
      color: '#7A8A9A'
    }).setOrigin(0.5).setAlpha(alpha);

    // Years
    this.add.text(x, y + 45, chapter.years, {
      fontFamily: FONT_MONO,
      fontSize: '9px',
      color: LEGO_COLORS.WHITE
    }).setOrigin(0.5).setAlpha(alpha);

    // Rooms
    this.add.text(x, y + 60, chapter.rooms, {
      fontFamily: FONT_MONO,
      fontSize: '7px',
      color: '#5A6A7A',
      letterSpacing: 1
    }).setOrigin(0.5).setAlpha(alpha);

    if (!chapter.unlocked) {
      this.add.text(x, y + 78, 'LOCKED', {
        fontFamily: FONT_MONO,
        fontSize: '8px',
        color: LEGO_COLORS.RED
      }).setOrigin(0.5);
      return null;
    } else {
      const hitArea = this.add.rectangle(x, y, 60, 60, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        this.cameras.main.fadeOut(400, 10, 14, 23);
        this.time.delayedCall(400, () => network.startChapter(chapter.num));
      });
      hitArea.on('pointerover', () => {
        gfx.clear();
        gfx.fillStyle(c.lighten(15).color, 1);
        gfx.fillCircle(x, y, 30);
        gfx.lineStyle(2, c.lighten(30).color, 0.6);
        gfx.strokeCircle(x, y, 30);
        gfx.fillStyle(c.lighten(20).color, 1);
        gfx.fillCircle(x, y - 18, 6);
      });
      hitArea.on('pointerout', () => {
        gfx.clear();
        gfx.fillStyle(c.color, 0.85);
        gfx.fillCircle(x, y, 28);
        gfx.fillStyle(c.darken(30).color, 0.6);
        gfx.fillRect(x - 27, y + 10, 54, 8);
        gfx.lineStyle(2, c.lighten(20).color, 0.4);
        gfx.beginPath(); gfx.arc(x, y, 28, -2.5, -0.6); gfx.strokePath();
        gfx.fillStyle(c.lighten(10).color, 1);
        gfx.fillCircle(x, y - 18, 6);
      });

      this.add.text(x, y + 78, 'PLAY', {
        fontFamily: FONT_MONO,
        fontSize: '9px',
        fontStyle: 'bold',
        color: LEGO_COLORS.GREEN
      }).setOrigin(0.5);

      return { hitArea };
    }
  }

  launchChapter(num) {
    const sceneMap = {
      1: 'Chapter1Scene',
      2: 'Chapter2Scene',
      3: 'Chapter3Scene',
      4: 'FinaleScene'
    };
    this.scene.start(sceneMap[num] || 'Chapter1Scene', {
      chapter: num,
      players: this.players,
      achievements: this.unlockedAchievements
    });
  }
}
