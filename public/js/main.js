// The 40th Brick - Main Game Entry
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0A0E17',
  dom: {
    createContainer: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 480, height: 270 },
    max: { width: 1920, height: 1080 }
  },
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    roundPixels: false
  },
  input: {
    activePointers: 2,
    touch: {
      capture: true
    },
    gamepad: true
  },
  scene: [
    BootScene,
    TitleScene,
    LobbyScene,
    WorldMapScene,
    AchievementScene,
    Chapter1Scene,
    Chapter2Scene,
    Chapter3Scene,
    FinaleScene
  ]
};

const game = new Phaser.Game(config);

// Handle orientation changes and DPI
window.addEventListener('resize', () => {
  game.scale.refresh();
});
