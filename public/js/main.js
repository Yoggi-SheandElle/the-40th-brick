// The 40th Brick - Main Game Entry
// Optimized for: 75" 4K TV, Steam Deck (1280x800), Mobile, PS4 controller

const platform = detectPlatform();

// Use higher internal resolution for crisp rendering on high-DPI screens
// 1920x1080 looks sharp on 4K TVs, Steam Deck, and retina displays
// Phaser Scale.FIT handles the CSS scaling to fit the actual viewport
const RENDER_WIDTH = 1920;
const RENDER_HEIGHT = 1080;
const RENDER_SCALE = RENDER_WIDTH / GAME_WIDTH; // 2x

const config = {
  type: Phaser.WEBGL,
  width: RENDER_WIDTH,
  height: RENDER_HEIGHT,
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

// Zoom camera 2x so game coordinates stay at 960x540 while canvas is 1920x1080
game.events.on('ready', () => {
  game.scene.scenes.forEach(scene => {
    scene.events.on('create', () => {
      scene.cameras.main.setZoom(RENDER_SCALE);
      scene.cameras.main.setScroll(0, 0);
    });
  });
});

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
