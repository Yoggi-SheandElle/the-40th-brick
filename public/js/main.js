// The 40th Brick - Main Game Entry
// Optimized for: 75" 4K TV, Steam Deck (1280x800), Mobile, PS4 controller

const DPR = window.devicePixelRatio || 1;
const platform = detectPlatform();

const config = {
  type: Phaser.WEBGL,
  width: GAME_WIDTH * Math.min(DPR, 2),
  height: GAME_HEIGHT * Math.min(DPR, 2),
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
    roundPixels: true
  },
  fps: {
    target: platform === 'mobile' ? 50 : 60,
    forceSetTimeOut: false
  },
  input: {
    activePointers: 3,
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

// Scale cameras to DPR for crisp rendering on high-res displays
const zoomFactor = Math.min(DPR, 2);
if (zoomFactor > 1) {
  game.events.on('ready', () => {
    game.scene.scenes.forEach(scene => {
      scene.events.on('create', () => {
        scene.cameras.main.setZoom(zoomFactor);
      });
    });
  });
}

// Handle resize and orientation
window.addEventListener('resize', () => {
  game.scale.refresh();
});

// Pause when tab hidden (battery optimization)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.scene.scenes.forEach(s => {
      if (s.scene.isActive()) s.scene.pause();
    });
    if (game.sound) game.sound.pauseAll();
  } else {
    game.scene.scenes.forEach(s => {
      if (s.scene.isPaused()) s.scene.resume();
    });
    if (game.sound) game.sound.resumeAll();
  }
});

// Keyboard navigation support (for desktop without controller)
document.addEventListener('keydown', (e) => {
  const keyMap = {
    'ArrowUp': 12, 'ArrowDown': 13, 'ArrowLeft': 14, 'ArrowRight': 15,
    'w': 12, 's': 13, 'a': 14, 'd': 15,
    'Enter': 0, ' ': 0, 'Escape': 1, 'Backspace': 1
  };
  const btn = keyMap[e.key];
  if (btn !== undefined) {
    InputSystem._handleNavigation(btn);
    e.preventDefault();
  }
});
