// The 40th Brick - Main Game Entry
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1B2A34',
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
  input: {
    activePointers: 2,
    touch: {
      capture: true
    }
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

// Handle orientation changes
window.addEventListener('resize', () => {
  game.scale.refresh();
});
