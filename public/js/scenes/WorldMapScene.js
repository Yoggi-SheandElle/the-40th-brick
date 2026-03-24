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
    this.cameras.main.setBackgroundColor('#2C2C2C');

    // Title
    this.add.text(cx, 25, "ANTE'S JOURNEY", {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(cx, 48, '40 Rooms \u00B7 40 Bricks \u00B7 40 Years', {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: LEGO_COLORS.GREY
    }).setOrigin(0.5);

    // Timeline path
    const chapters = [
      {
        num: 1,
        title: 'THE FIRST BRICK',
        subtitle: 'Croatia & Heartlake City',
        years: '2009-2021',
        color: LEGO_COLORS.BRIGHT_PINK,
        rooms: '10 Rooms',
        unlocked: true
      },
      {
        num: 2,
        title: 'HOME ALONE',
        subtitle: "Kevin's House",
        years: '2021',
        color: LEGO_COLORS.RED,
        rooms: '10 Rooms',
        unlocked: this.isChapterUnlocked(2)
      },
      {
        num: 3,
        title: 'THE DARK TOWER',
        subtitle: 'Barad-d\u00FBr',
        years: '2024',
        color: LEGO_COLORS.DARK_RED,
        rooms: '10 Rooms',
        unlocked: this.isChapterUnlocked(3)
      },
      {
        num: 4,
        title: 'ROOM 40',
        subtitle: 'The Birthday',
        years: '2026',
        color: LEGO_COLORS.YELLOW,
        rooms: '10 Rooms',
        unlocked: this.isChapterUnlocked(4)
      }
    ];

    // Draw timeline line
    const lineY = 280;
    const gfx = this.add.graphics();
    gfx.lineStyle(3, hexToInt(LEGO_COLORS.GREY), 0.4);
    gfx.moveTo(80, lineY);
    gfx.lineTo(GAME_WIDTH - 80, lineY);
    gfx.strokePath();

    // Draw chapter nodes
    const spacing = (GAME_WIDTH - 160) / (chapters.length - 1);
    chapters.forEach((ch, i) => {
      const x = 80 + i * spacing;
      this.drawChapterNode(x, lineY, ch);
    });

    // Room counter
    const completedRooms = (this.unlockedAchievements || []).length;
    this.add.text(cx, GAME_HEIGHT - 60, `${completedRooms}/40 Bricks Collected`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '9px',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);

    // Progress bar
    const barW = 400;
    gfx.fillStyle(0x333333, 1);
    gfx.fillRoundedRect(cx - barW / 2, GAME_HEIGHT - 40, barW, 12, 3);
    gfx.fillStyle(hexToInt(LEGO_COLORS.GREEN), 1);
    gfx.fillRoundedRect(cx - barW / 2, GAME_HEIGHT - 40, barW * (completedRooms / 40), 12, 3);

    // Listen for chapter start from server
    network.on('chapter_started', (data) => {
      this.launchChapter(data.chapter);
    });
  }

  isChapterUnlocked(num) {
    // Chapter N is unlocked if chapter N-1 achievements exist
    const prevAchievements = CHAPTER_ACHIEVEMENTS[num - 1] || [];
    return prevAchievements.every(a => (this.unlockedAchievements || []).includes(a));
  }

  drawChapterNode(x, y, chapter) {
    const gfx = this.add.graphics();
    const c = Phaser.Display.Color.HexStringToColor(chapter.color);
    const alpha = chapter.unlocked ? 1 : 0.3;

    // Circle node
    gfx.fillStyle(c.color, alpha);
    gfx.fillCircle(x, y, 28);
    gfx.lineStyle(3, 0xFFFFFF, alpha * 0.5);
    gfx.strokeCircle(x, y, 28);

    // Chapter number
    this.add.text(x, y, chapter.num.toString(), {
      fontFamily: '"Press Start 2P"',
      fontSize: '18px',
      color: LEGO_COLORS.WHITE
    }).setOrigin(0.5).setAlpha(alpha);

    // Title
    this.add.text(x, y - 55, chapter.title, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: chapter.color,
      align: 'center',
      wordWrap: { width: 160 }
    }).setOrigin(0.5).setAlpha(alpha);

    // Subtitle
    this.add.text(x, y - 42, chapter.subtitle, {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      color: LEGO_COLORS.GREY
    }).setOrigin(0.5).setAlpha(alpha);

    // Years
    this.add.text(x, y + 40, chapter.years, {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: LEGO_COLORS.WHITE
    }).setOrigin(0.5).setAlpha(alpha);

    // Rooms count
    this.add.text(x, y + 55, chapter.rooms, {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      color: LEGO_COLORS.GREY
    }).setOrigin(0.5).setAlpha(alpha);

    // Lock icon if locked
    if (!chapter.unlocked) {
      this.add.text(x, y + 70, 'LOCKED', {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: LEGO_COLORS.RED
      }).setOrigin(0.5);
    } else {
      // Make clickable
      const hitArea = this.add.rectangle(x, y, 56, 56, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        network.startChapter(chapter.num);
      });
      hitArea.on('pointerover', () => {
        gfx.clear();
        gfx.fillStyle(c.lighten(20).color, 1);
        gfx.fillCircle(x, y, 30);
        gfx.lineStyle(3, 0xFFFFFF, 0.8);
        gfx.strokeCircle(x, y, 30);
      });
      hitArea.on('pointerout', () => {
        gfx.clear();
        gfx.fillStyle(c.color, 1);
        gfx.fillCircle(x, y, 28);
        gfx.lineStyle(3, 0xFFFFFF, 0.5);
        gfx.strokeCircle(x, y, 28);
      });

      // PLAY label
      this.add.text(x, y + 70, 'PLAY', {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: LEGO_COLORS.GREEN
      }).setOrigin(0.5);
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
