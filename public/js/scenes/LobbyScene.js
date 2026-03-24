class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
  }

  init(data) {
    this.gameMode = data?.mode || 'multi'; // 'solo' or 'multi'
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.cameras.main.setBackgroundColor('#1B2A34');

    this.myReady = false;
    this.otherReady = false;

    if (this.gameMode === 'solo') {
      this.showSoloSetup();
    } else {
      this.showMultiSetup();
    }

    // Network listeners
    this._listeners = {
      room_created: (data) => this.onRoomCreated(data),
      room_joined: (data) => this.onRoomJoined(data),
      join_error: (msg) => this.onJoinError(msg),
      player_joined: (player) => this.onPlayerJoined(player),
      ready_update: (data) => this.onReadyUpdate(data),
      game_start: (data) => this.onGameStart(data),
      player_disconnected: () => this.onPlayerDisconnected()
    };
    Object.entries(this._listeners).forEach(([e, fn]) => network.on(e, fn));
    this.events.on('shutdown', () => {
      Object.entries(this._listeners).forEach(([e, fn]) => network.off(e, fn));
    });
  }

  // SOLO MODE
  showSoloSetup() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, 60, 'SOLO ADVENTURE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(cx, 100, "Ante's journey through 40 rooms of puzzles", {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: LEGO_COLORS.WHITE,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Name input
    this.add.text(cx, cy - 40, 'Your name:', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: LEGO_COLORS.WHITE,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.nameInput = this.add.dom(cx, cy).createFromHTML(
      `<input type="text" id="nameInput" value="Ante" maxlength="12"
       style="font-family: 'Press Start 2P'; font-size: 16px; padding: 10px 20px;
       background: #2C2C2C; color: #F2CD37; border: 3px solid #F2CD37;
       text-align: center; outline: none; width: 220px; border-radius: 6px;" />`
    );

    // Draw Ante's minifig
    this.drawLobbyPlayer(cx, cy + 100, 'Ante', LEGO_COLORS.BRIGHT_PINK);

    // Start button
    this.createButton(cx, cy + 180, 'START ADVENTURE', () => {
      const name = document.getElementById('nameInput')?.value || 'Ante';
      network.startSolo(name);
    }, LEGO_COLORS.GREEN, 280);

    // Back
    this.createButton(cx, GAME_HEIGHT - 40, 'BACK', () => {
      this.scene.start('TitleScene');
    }, LEGO_COLORS.GREY, 140);
  }

  // MULTIPLAYER MODE
  showMultiSetup() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, 50, 'CO-OP LOBBY', {
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Name input
    this.add.text(cx, cy - 70, 'Enter your name:', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: LEGO_COLORS.WHITE,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.nameInput = this.add.dom(cx, cy - 35).createFromHTML(
      `<input type="text" id="nameInput" value="Yossi" maxlength="12"
       style="font-family: 'Press Start 2P'; font-size: 16px; padding: 10px 20px;
       background: #2C2C2C; color: #F2CD37; border: 3px solid #F2CD37;
       text-align: center; outline: none; width: 220px; border-radius: 6px;" />`
    );

    // Buttons
    this.createBtn = this.createButton(cx - 130, cy + 30, 'CREATE ROOM', () => {
      const name = document.getElementById('nameInput')?.value || 'Player';
      network.createRoom(name);
    }, LEGO_COLORS.RED, 220);

    this.joinBtn = this.createButton(cx + 130, cy + 30, 'JOIN ROOM', () => {
      this.showJoinInput();
    }, LEGO_COLORS.BLUE, 220);

    // Back
    this.createButton(cx, GAME_HEIGHT - 40, 'BACK', () => {
      this.scene.start('TitleScene');
    }, LEGO_COLORS.GREY, 140);
  }

  showJoinInput() {
    if (this.createBtn) this.createBtn.destroy();
    if (this.joinBtn) this.joinBtn.destroy();

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, cy + 10, 'Enter room code:', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: LEGO_COLORS.WHITE,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.codeInput = this.add.dom(cx, cy + 50).createFromHTML(
      `<input type="text" id="codeInput" maxlength="4" placeholder="0000"
       style="font-family: 'Press Start 2P'; font-size: 28px; padding: 10px 20px;
       background: #2C2C2C; color: #F2CD37; border: 3px solid #F2CD37;
       text-align: center; outline: none; width: 180px; letter-spacing: 10px;
       border-radius: 6px;" />`
    );

    this.createButton(cx, cy + 110, 'JOIN', () => {
      const code = document.getElementById('codeInput')?.value;
      const name = document.getElementById('nameInput')?.value || 'Player';
      if (code && code.length === 4) {
        network.joinRoom(code, name);
      }
    }, LEGO_COLORS.GREEN, 160);
  }

  onRoomCreated(data) {
    this.clearScene();
    const cx = GAME_WIDTH / 2;

    this.add.text(cx, 50, 'WAITING FOR PLAYER 2', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Code display with background
    const codeBg = this.add.graphics();
    codeBg.fillStyle(0x000000, 0.5);
    codeBg.fillRoundedRect(cx - 140, 100, 280, 90, 12);

    this.add.text(cx, 120, 'Room Code', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: LEGO_COLORS.WHITE,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(cx, 155, data.code, {
      fontFamily: '"Press Start 2P"',
      fontSize: '40px',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(cx, 210, 'Share this code with your partner', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: LEGO_COLORS.GREY,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Player minifig
    this.drawLobbyPlayer(cx, 310, data.player.name, LEGO_COLORS.RED);

    // Waiting animation
    const dots = this.add.text(cx, 400, '. . .', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: LEGO_COLORS.ORANGE
    }).setOrigin(0.5);
    this.tweens.add({ targets: dots, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
  }

  onRoomJoined(data) {
    this.showReadyScreen(data.player, data.otherPlayer);
  }

  onPlayerJoined(player) {
    this.clearScene();
    const myName = document.getElementById('nameInput')?.value || 'Player';
    this.showReadyScreen({ name: myName, role: 'host' }, player);
  }

  showReadyScreen(myPlayer, otherPlayer) {
    this.clearScene();
    const cx = GAME_WIDTH / 2;

    this.add.text(cx, 40, 'BOTH PLAYERS CONNECTED!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: LEGO_COLORS.GREEN,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Players
    this.drawLobbyPlayer(cx - 120, 180, myPlayer.name, LEGO_COLORS.RED);
    this.drawLobbyPlayer(cx + 120, 180, otherPlayer.name, LEGO_COLORS.BLUE);

    this.add.text(cx, 160, '+', {
      fontFamily: '"Press Start 2P"',
      fontSize: '28px',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Ready labels
    this.myReadyText = this.add.text(cx - 120, 280, 'NOT READY', {
      fontFamily: '"Press Start 2P"',
      fontSize: '9px',
      color: LEGO_COLORS.RED,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.otherReadyText = this.add.text(cx + 120, 280, 'NOT READY', {
      fontFamily: '"Press Start 2P"',
      fontSize: '9px',
      color: LEGO_COLORS.RED,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.createButton(cx, 340, 'READY!', () => {
      network.setReady();
      this.myReady = !this.myReady;
      this.myReadyText.setText(this.myReady ? 'READY!' : 'NOT READY');
      this.myReadyText.setColor(this.myReady ? LEGO_COLORS.GREEN : LEGO_COLORS.RED);
    }, LEGO_COLORS.GREEN, 200);

    // Flavor text
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(cx - 250, 390, 500, 40, 6);
    this.add.text(cx, 410, '40 rooms. 40 bricks. 40 years of awesome.', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: LEGO_COLORS.YELLOW,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
  }

  onReadyUpdate(data) {
    if (data.playerId !== network.playerId && this.otherReadyText) {
      this.otherReady = data.ready;
      this.otherReadyText.setText(data.ready ? 'READY!' : 'NOT READY');
      this.otherReadyText.setColor(data.ready ? LEGO_COLORS.GREEN : LEGO_COLORS.RED);
    }
  }

  onGameStart(data) {
    this.scene.start('WorldMapScene', {
      players: data.players,
      solo: data.solo || false
    });
  }

  onJoinError(msg) {
    const cx = GAME_WIDTH / 2;
    const errorText = this.add.text(cx, GAME_HEIGHT - 80, msg, {
      fontFamily: '"Press Start 2P"',
      fontSize: '9px',
      color: LEGO_COLORS.RED,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.time.delayedCall(3000, () => errorText.destroy());
  }

  onPlayerDisconnected() {
    this.clearScene();
    const cx = GAME_WIDTH / 2;
    this.add.text(cx, GAME_HEIGHT / 2, 'Partner disconnected!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: LEGO_COLORS.RED,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.time.delayedCall(2000, () => this.scene.start('TitleScene'));
  }

  drawLobbyPlayer(x, y, name, color) {
    const gfx = this.add.graphics();
    const c = Phaser.Display.Color.HexStringToColor(color).color;
    const darkC = Phaser.Display.Color.HexStringToColor(color).darken(30).color;
    const skinColor = 0xF2CD37;
    const s = 3;

    gfx.setPosition(x, y);
    // Legs
    gfx.fillStyle(0x0055BF, 1);
    gfx.fillRect(-7 * s, 8 * s, 6 * s, 12 * s);
    gfx.fillRect(1 * s, 8 * s, 6 * s, 12 * s);
    // Body
    gfx.fillStyle(c, 1);
    gfx.fillRect(-9 * s, -6 * s, 18 * s, 15 * s);
    // Arms
    gfx.fillRect(-13 * s, -5 * s, 5 * s, 11 * s);
    gfx.fillRect(8 * s, -5 * s, 5 * s, 11 * s);
    // Hands
    gfx.fillStyle(skinColor, 1);
    gfx.fillRect(-13 * s, 5 * s, 5 * s, 4 * s);
    gfx.fillRect(8 * s, 5 * s, 5 * s, 4 * s);
    // Head
    gfx.fillStyle(skinColor, 1);
    gfx.fillRect(-6 * s, -18 * s, 12 * s, 12 * s);
    // Eyes
    gfx.fillStyle(0x1B2A34, 1);
    gfx.fillRect(-4 * s, -14 * s, 2 * s, 2 * s);
    gfx.fillRect(2 * s, -14 * s, 2 * s, 2 * s);
    // Smile
    gfx.fillRect(-3 * s, -10 * s, 6 * s, 1 * s);
    // Hair
    gfx.fillStyle(darkC, 1);
    gfx.fillRect(-7 * s, -24 * s, 14 * s, 7 * s);
    gfx.fillRect(-5 * s, -26 * s, 10 * s, 3 * s);

    this.add.text(x, y + 25 * s, name, {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
  }

  clearScene() {
    if (this.nameInput) { this.nameInput.destroy(); this.nameInput = null; }
    if (this.codeInput) { this.codeInput.destroy(); this.codeInput = null; }
    this.children.removeAll(true);
  }

  createButton(x, y, text, callback, color, width) {
    color = color || LEGO_COLORS.RED;
    width = width || 200;
    const hw = width / 2;
    const btn = this.add.container(x, y);
    const c = Phaser.Display.Color.HexStringToColor(color);

    const bg = this.add.graphics();
    bg.fillStyle(c.color, 1);
    bg.fillRoundedRect(-hw, -20, width, 40, 6);

    const label = this.add.text(0, -3, text, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    btn.add([bg, label]);
    btn.setSize(width, 40);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(c.lighten(20).color, 1);
      bg.fillRoundedRect(-hw, -20, width, 40, 6);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(c.color, 1);
      bg.fillRoundedRect(-hw, -20, width, 40, 6);
    });
    btn.on('pointerdown', callback);
    return btn;
  }
}
