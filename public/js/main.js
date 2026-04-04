// The 40th Brick - Main Game Entry
// Render at native screen resolution for crisp text on 4K TVs and high-DPI screens
// Game logic stays at 960x540, Phaser scales the canvas to fill the screen
const DPR = window.devicePixelRatio || 1;

const config = {
  type: Phaser.WEBGL,
  width: GAME_WIDTH * DPR,
  height: GAME_HEIGHT * DPR,
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
    autoCenter: Phaser.Scale.CENTER_BOTH
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

// Scale all cameras to match the DPR so game coordinates stay at 960x540
game.events.on('ready', () => {
  game.scale.refresh();
  if (DPR > 1) {
    game.scene.scenes.forEach(scene => {
      scene.events.on('create', () => {
        scene.cameras.main.setZoom(DPR);
      });
    });
  }
});

// Handle orientation changes
window.addEventListener('resize', () => {
  game.scale.refresh();
});
