class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0A0E17');

    // Loading bar background
    const barBg = this.add.graphics();
    barBg.fillStyle(0x1A2030, 1);
    barBg.fillRoundedRect(width / 2 - 150, height / 2 + 30, 300, 16, 4);
    barBg.lineStyle(1, 0x00D4FF, 0.15);
    barBg.strokeRoundedRect(width / 2 - 150, height / 2 + 30, 300, 16, 4);

    const bar = this.add.rectangle(width / 2 - 148, height / 2 + 38, 296, 12, hexToInt(LEGO_COLORS.YELLOW));
    bar.setOrigin(0, 0.5);

    this.add.text(width / 2, height / 2 - 10, 'Building bricks...', {
      fontFamily: FONT_TITLE,
      fontSize: '14px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 60, 'THE 40TH BRICK', {
      fontFamily: FONT_MONO,
      fontSize: '8px',
      color: '#3A4A5A',
      letterSpacing: 4
    }).setOrigin(0.5);
  }

  create() {
    network.connect();
    this.scene.start('TitleScene');
  }
}
