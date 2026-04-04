class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
  }

  init(data) {
    this.gameMode = data?.mode || 'multi';
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.cameras.main.setBackgroundColor('#0A0E17');
    drawGridBg(this);

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

    this.cameras.main.fadeIn(400, 10, 14, 23);
  }

  showSoloSetup() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, 55, 'SOLO ADVENTURE', {
      fontFamily: FONT_TITLE,
      fontSize: '24px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);

    this.add.text(cx, 85, "Antica's journey through 40 rooms of puzzles", {
      fontFamily: FONT_BODY,
      fontSize: '14px',
      color: '#8896AA'
    }).setOrigin(0.5);

    // Decorative line
    const line = this.add.graphics();
    line.lineStyle(1, 0x00D4FF, 0.2);
    line.lineBetween(cx - 120, 105, cx + 120, 105);

    // Left side: Ante's minifig (large)
    this.drawLobbyPlayer(cx - 180, cy + 30, 'Ante', LEGO_COLORS.BRIGHT_PINK);

    // Right side: Name input + buttons
    const savedName = SaveManager.getData().playerName || 'Ante';

    this.add.text(cx + 80, cy - 70, 'YOUR NAME', {
      fontFamily: FONT_MONO,
      fontSize: '13px',
      fontStyle: 'bold',
      color: LEGO_COLORS.CYAN,
      letterSpacing: 3
    }).setOrigin(0.5);

    this.add.text(cx + 80, cy - 52, 'Type any name you want!', {
      fontFamily: FONT_BODY,
      fontSize: '12px',
      color: '#6A7A8A'
    }).setOrigin(0.5);

    this.nameInput = this.add.dom(cx + 80, cy - 20).createFromHTML(
      '<input type="text" id="nameInput" value="' + savedName + '" maxlength="12" ' +
      'style="font-family: Orbitron, monospace; font-size: 20px; padding: 12px 24px; ' +
      'background: rgba(0,212,255,0.08); color: #F2CD37; border: 2px solid rgba(0,212,255,0.4); ' +
      'text-align: center; outline: none; width: 260px; border-radius: 10px; letter-spacing: 3px;" />'
    );

    // Brick button - START (right side, below input)
    this.createBrickButton(cx + 80, cy + 45, 'START ADVENTURE', () => {
      const name = document.getElementById('nameInput')?.value || 'Ante';
      SaveManager.setPlayer(name, '');
      this.cameras.main.fadeOut(400, 10, 14, 23);
      this.time.delayedCall(400, () => network.startSolo(name));
    }, LEGO_COLORS.GREEN, 260);

    // Back button (centered at bottom)
    const backBtn = this.createBrickButton(cx, GAME_HEIGHT - 30, 'BACK', () => {
      this.cameras.main.fadeOut(300, 10, 14, 23);
      this.time.delayedCall(300, () => this.scene.start('TitleScene'));
    }, LEGO_COLORS.DARK_GREY, 140);

    // Register focusables for controller navigation
    InputSystem.setFocusables([
      { element: null, x: cx + 80, y: cy + 40, callback: () => {
        const name = document.getElementById('nameInput')?.value || 'Ante';
        this.cameras.main.fadeOut(400, 10, 14, 23);
        this.time.delayedCall(400, () => network.startSolo(name));
      }},
      { element: backBtn, x: cx, y: GAME_HEIGHT - 30, callback: () => {
        this.cameras.main.fadeOut(300, 10, 14, 23);
        this.time.delayedCall(300, () => this.scene.start('TitleScene'));
      }}
    ]);
  }

  showMultiSetup() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, 50, 'CO-OP LOBBY', {
      fontFamily: FONT_TITLE,
      fontSize: '24px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);

    this.add.text(cx, cy - 80, 'ENTER YOUR NAME', {
      fontFamily: FONT_MONO,
      fontSize: '10px',
      color: LEGO_COLORS.CYAN,
      letterSpacing: 3
    }).setOrigin(0.5);

    this.nameInput = this.add.dom(cx, cy - 45).createFromHTML(
      '<input type="text" id="nameInput" value="Yossi" maxlength="12" ' +
      'style="font-family: Orbitron, monospace; font-size: 18px; padding: 10px 24px; ' +
      'background: rgba(0,212,255,0.06); color: #F2CD37; border: 2px solid rgba(0,212,255,0.3); ' +
      'text-align: center; outline: none; width: 240px; border-radius: 8px; letter-spacing: 2px;" />'
    );

    this.createBtn = this.createBrickButton(cx - 130, cy + 30, 'CREATE ROOM', () => {
      const name = document.getElementById('nameInput')?.value || 'Player';
      network.createRoom(name);
    }, LEGO_COLORS.RED, 220);

    this.joinBtn = this.createBrickButton(cx + 130, cy + 30, 'JOIN ROOM', () => {
      this.showJoinInput();
    }, LEGO_COLORS.BLUE, 220);

    const multiBackBtn = this.createBrickButton(cx, GAME_HEIGHT - 35, 'BACK', () => {
      this.cameras.main.fadeOut(300, 10, 14, 23);
      this.time.delayedCall(300, () => this.scene.start('TitleScene'));
    }, LEGO_COLORS.DARK_GREY, 140);

    // Register focusables for controller navigation
    InputSystem.setFocusables([
      { element: this.createBtn, x: cx - 130, y: cy + 30, callback: () => {
        const name = document.getElementById('nameInput')?.value || 'Player';
        network.createRoom(name);
      }},
      { element: this.joinBtn, x: cx + 130, y: cy + 30, callback: () => this.showJoinInput() },
      { element: multiBackBtn, x: cx, y: GAME_HEIGHT - 35, callback: () => {
        this.cameras.main.fadeOut(300, 10, 14, 23);
        this.time.delayedCall(300, () => this.scene.start('TitleScene'));
      }}
    ]);
  }

  showJoinInput() {
    if (this.createBtn) this.createBtn.destroy();
    if (this.joinBtn) this.joinBtn.destroy();

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, cy + 5, 'ROOM CODE', {
      fontFamily: FONT_MONO,
      fontSize: '10px',
      color: LEGO_COLORS.CYAN,
      letterSpacing: 3
    }).setOrigin(0.5);

    this.codeInput = this.add.dom(cx, cy + 45).createFromHTML(
      '<input type="text" id="codeInput" maxlength="4" placeholder="0000" ' +
      'style="font-family: Orbitron, monospace; font-size: 32px; padding: 10px 24px; ' +
      'background: rgba(0,212,255,0.06); color: #F2CD37; border: 2px solid rgba(0,212,255,0.3); ' +
      'text-align: center; outline: none; width: 200px; letter-spacing: 12px; border-radius: 8px;" />'
    );

    this.createBrickButton(cx, cy + 110, 'JOIN', () => {
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
    drawGridBg(this);

    this.add.text(cx, 50, 'WAITING FOR PLAYER 2', {
      fontFamily: FONT_TITLE,
      fontSize: '18px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);

    // Code display panel
    const codeBg = this.add.graphics();
    codeBg.fillStyle(0x131824, 0.8);
    codeBg.fillRoundedRect(cx - 150, 90, 300, 100, 12);
    codeBg.lineStyle(1, 0x00D4FF, 0.15);
    codeBg.strokeRoundedRect(cx - 150, 90, 300, 100, 12);

    this.add.text(cx, 115, 'ROOM CODE', {
      fontFamily: FONT_MONO,
      fontSize: '9px',
      color: LEGO_COLORS.CYAN,
      letterSpacing: 3
    }).setOrigin(0.5);

    this.add.text(cx, 155, data.code, {
      fontFamily: FONT_TITLE,
      fontSize: '42px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW,
      letterSpacing: 8
    }).setOrigin(0.5);

    this.add.text(cx, 210, 'Share this code with your partner', {
      fontFamily: FONT_BODY,
      fontSize: '13px',
      color: '#6A7A8A'
    }).setOrigin(0.5);

    this.drawLobbyPlayer(cx, 310, data.player.name, LEGO_COLORS.RED);

    // Waiting dots
    const dots = this.add.text(cx, 400, '. . .', {
      fontFamily: FONT_TITLE,
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
    drawGridBg(this);

    this.add.text(cx, 40, 'BOTH PLAYERS CONNECTED', {
      fontFamily: FONT_TITLE,
      fontSize: '16px',
      fontStyle: 'bold',
      color: LEGO_COLORS.GREEN
    }).setOrigin(0.5);

    this.drawLobbyPlayer(cx - 120, 180, myPlayer.name, LEGO_COLORS.RED);
    this.drawLobbyPlayer(cx + 120, 180, otherPlayer.name, LEGO_COLORS.BLUE);

    this.add.text(cx, 160, '+', {
      fontFamily: FONT_TITLE,
      fontSize: '32px',
      fontStyle: 'bold',
      color: LEGO_COLORS.YELLOW
    }).setOrigin(0.5);

    this.myReadyText = this.add.text(cx - 120, 280, 'NOT READY', {
      fontFamily: FONT_MONO,
      fontSize: '10px',
      color: LEGO_COLORS.RED
    }).setOrigin(0.5);

    this.otherReadyText = this.add.text(cx + 120, 280, 'NOT READY', {
      fontFamily: FONT_MONO,
      fontSize: '10px',
      color: LEGO_COLORS.RED
    }).setOrigin(0.5);

    const readyBtn = this.createBrickButton(cx, 340, 'READY!', () => {
      network.setReady();
      this.myReady = !this.myReady;
      this.myReadyText.setText(this.myReady ? 'READY!' : 'NOT READY');
      this.myReadyText.setColor(this.myReady ? LEGO_COLORS.GREEN : LEGO_COLORS.RED);
    }, LEGO_COLORS.GREEN, 200);

    // Register focusables for controller navigation
    InputSystem.setFocusables([
      { element: readyBtn, x: cx, y: 340, callback: () => {
        network.setReady();
        this.myReady = !this.myReady;
        this.myReadyText.setText(this.myReady ? 'READY!' : 'NOT READY');
        this.myReadyText.setColor(this.myReady ? LEGO_COLORS.GREEN : LEGO_COLORS.RED);
      }}
    ]);

    const bg = this.add.graphics();
    bg.fillStyle(0x131824, 0.5);
    bg.fillRoundedRect(cx - 250, 390, 500, 40, 6);
    this.add.text(cx, 410, '40 rooms. 40 bricks. 40 years of amazing.', {
      fontFamily: FONT_BODY,
      fontSize: '13px',
      color: LEGO_COLORS.YELLOW
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
    this.cameras.main.fadeOut(400, 10, 14, 23);
    this.time.delayedCall(400, () => {
      this.scene.start('WorldMapScene', {
        players: data.players,
        solo: data.solo || false
      });
    });
  }

  onJoinError(msg) {
    const cx = GAME_WIDTH / 2;
    const errorText = this.add.text(cx, GAME_HEIGHT - 80, msg, {
      fontFamily: FONT_BODY,
      fontSize: '14px',
      color: LEGO_COLORS.RED
    }).setOrigin(0.5);
    this.time.delayedCall(3000, () => errorText.destroy());
  }

  onPlayerDisconnected() {
    this.clearScene();
    const cx = GAME_WIDTH / 2;
    this.add.text(cx, GAME_HEIGHT / 2, 'Partner disconnected!', {
      fontFamily: FONT_TITLE,
      fontSize: '18px',
      fontStyle: 'bold',
      color: LEGO_COLORS.RED
    }).setOrigin(0.5);
    this.time.delayedCall(2000, () => this.scene.start('TitleScene'));
  }

  drawLobbyPlayer(x, y, name, color) {
    const gfx = this.add.graphics();
    const c = Phaser.Display.Color.HexStringToColor(color).color;
    const skinColor = 0xF2CD37;
    const isAnte = name && name.toLowerCase().includes('ante');
    const hairColor = isAnte ? 0x352100 : Phaser.Display.Color.HexStringToColor(color).darken(30).color;
    const pantsColor = isAnte ? 0x1B2A34 : 0x0055BF;
    const s = 3;

    gfx.setPosition(x, y);

    // Legs
    gfx.fillStyle(pantsColor, 1);
    gfx.fillRect(-7 * s, 8 * s, 6 * s, 12 * s);
    gfx.fillRect(1 * s, 8 * s, 6 * s, 12 * s);

    // Feet
    gfx.fillStyle(isAnte ? 0x352100 : 0x1B2A34, 1);
    gfx.fillRect(-8 * s, 18 * s, 7 * s, 3 * s);
    gfx.fillRect(1 * s, 18 * s, 7 * s, 3 * s);

    // Body
    gfx.fillStyle(c, 1);
    gfx.fillRect(-9 * s, -6 * s, 18 * s, 15 * s);

    // Designer badge for Ante
    if (isAnte) {
      gfx.fillStyle(0xF2CD37, 0.8);
      gfx.fillRect(-3 * s, -2 * s, 6 * s, 5 * s);
      gfx.fillStyle(0xB40000, 1);
      gfx.fillRect(-1 * s, -1 * s, 2 * s, 3 * s);
    }

    // Arms
    gfx.fillStyle(c, 1);
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
    gfx.fillStyle(0x0A0E17, 1);
    gfx.fillRect(-4 * s, -14 * s, 2 * s, 2 * s);
    gfx.fillRect(2 * s, -14 * s, 2 * s, 2 * s);

    if (isAnte) {
      // Eyelashes
      gfx.fillRect(-4 * s, -15 * s, 1 * s, 1 * s);
      gfx.fillRect(3 * s, -15 * s, 1 * s, 1 * s);
      // Smile
      gfx.fillRect(-2 * s, -10 * s, 4 * s, 1 * s);
      gfx.fillRect(-3 * s, -11 * s, 1 * s, 1 * s);
      gfx.fillRect(2 * s, -11 * s, 1 * s, 1 * s);
      // Shoulder-length dark hair
      gfx.fillStyle(hairColor, 1);
      gfx.fillRect(-7 * s, -23 * s, 14 * s, 6 * s);
      gfx.fillRect(-8 * s, -21 * s, 16 * s, 4 * s);
      gfx.fillRect(-9 * s, -17 * s, 3 * s, 12 * s);
      gfx.fillRect(6 * s, -17 * s, 3 * s, 12 * s);
      gfx.fillRect(-8 * s, -6 * s, 2 * s, 2 * s);
      gfx.fillRect(6 * s, -6 * s, 2 * s, 2 * s);
      gfx.fillRect(-5 * s, -18 * s, 10 * s, 2 * s);
    } else {
      // Default smile
      gfx.fillRect(-3 * s, -10 * s, 6 * s, 1 * s);
      // Default hat
      gfx.fillStyle(hairColor, 1);
      gfx.fillRect(-7 * s, -24 * s, 14 * s, 7 * s);
      gfx.fillRect(-5 * s, -26 * s, 10 * s, 3 * s);
    }

    // Name label
    this.add.text(x, y + 25 * s, name, {
      fontFamily: FONT_TITLE,
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);
  }

  clearScene() {
    if (this.nameInput) { this.nameInput.destroy(); this.nameInput = null; }
    if (this.codeInput) { this.codeInput.destroy(); this.codeInput = null; }
    this.children.removeAll(true);
  }

  createBrickButton(x, y, text, callback, color, width) {
    color = color || LEGO_COLORS.GREEN;
    width = width || 240;
    const hw = width / 2;
    const h = 42;
    const btn = this.add.container(x, y);
    const c = Phaser.Display.Color.HexStringToColor(color);

    const bg = this.add.graphics();
    const drawBtn = (fillAlpha, borderAlpha, darken) => {
      bg.clear();
      bg.fillStyle(c.color, fillAlpha);
      bg.fillRoundedRect(-hw, -h / 2, width, h, 6);
      bg.fillStyle(c.darken(darken).color, fillAlpha + 0.1);
      bg.fillRoundedRect(-hw, h / 2 - 6, width, 6, { bl: 6, br: 6 });
      bg.lineStyle(1, c.lighten(15).color, borderAlpha);
      bg.strokeRoundedRect(-hw, -h / 2, width, h, 6);
    };
    drawBtn(0.8, 0.25, 25);

    const label = this.add.text(0, 0, text, {
      fontFamily: FONT_TITLE,
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      letterSpacing: 1
    }).setOrigin(0.5);

    btn.add([bg, label]);
    btn.setSize(width, h);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => { drawBtn(1, 0.5, 15); label.setColor(LEGO_COLORS.YELLOW); });
    btn.on('pointerout', () => { drawBtn(0.8, 0.25, 25); label.setColor('#FFFFFF'); });
    btn.on('pointerdown', callback);
    return btn;
  }
}
