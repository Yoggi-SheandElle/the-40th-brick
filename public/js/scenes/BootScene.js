class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2 + 40, 300, 20, 0x333333);
    const bar = this.add.rectangle(width / 2 - 148, height / 2 + 40, 296, 16, hexToInt(LEGO_COLORS.YELLOW));
    bar.setOrigin(0, 0.5);

    this.add.text(width / 2, height / 2 - 20, 'Building bricks...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);
  }

  create() {
    // Connect to server
    network.connect();

    // Go to title immediately
    this.scene.start('TitleScene');
  }
}
