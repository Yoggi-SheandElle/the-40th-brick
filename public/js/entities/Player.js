// LEGO Minifig-style player drawn with Phaser graphics
class PlayerEntity {
  constructor(scene, x, y, name, color, isLocal) {
    this.scene = scene;
    this.name = name;
    this.isLocal = isLocal;
    this.color = color;
    this.targetX = x;
    this.targetY = y;
    this.facing = 'right';

    // Create sprite container
    this.container = scene.add.container(x, y);

    // Draw LEGO minifig
    this.bodyGfx = scene.add.graphics();
    this.drawMinifig();
    this.container.add(this.bodyGfx);

    // Name tag
    this.nameText = scene.add.text(0, -32, name, {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.container.add(this.nameText);

    // Physics body (if local)
    if (isLocal) {
      scene.physics.world.enable(this.container);
      this.container.body.setSize(PLAYER_WIDTH, PLAYER_HEIGHT);
      this.container.body.setOffset(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT / 2);
      this.container.body.setCollideWorldBounds(true);
    }

    this.container.setDepth(10);
  }

  drawMinifig() {
    const g = this.bodyGfx;
    g.clear();

    const isAnte = this.name && this.name.toLowerCase().includes('ante');
    const c = Phaser.Display.Color.HexStringToColor(this.color).color;
    const skinColor = 0xF2CD37; // LEGO yellow skin
    const darkColor = Phaser.Display.Color.HexStringToColor(this.color).darken(30).color;
    const hairColor = isAnte ? 0x352100 : darkColor; // Dark brown for Ante
    const pantsColor = isAnte ? 0x1B2A34 : 0x0055BF; // Dark pants for Ante

    // Legs
    g.fillStyle(pantsColor, 1);
    g.fillRect(-7, 8, 6, 12);
    g.fillRect(1, 8, 6, 12);

    // Feet
    g.fillStyle(isAnte ? 0x352100 : 0x1B2A34, 1);
    g.fillRect(-8, 18, 7, 3);
    g.fillRect(1, 18, 7, 3);

    // Body (torso)
    g.fillStyle(c, 1);
    g.fillRect(-9, -6, 18, 15);

    // Torso detail - LEGO designer badge for Ante
    if (isAnte) {
      g.fillStyle(0xF2CD37, 0.8);
      g.fillRect(-3, -2, 6, 5); // Small LEGO logo area
      g.fillStyle(0xB40000, 1);
      g.fillRect(-1, -1, 2, 3); // Tiny red brick on chest
    }

    // Arms
    g.fillStyle(c, 1);
    g.fillRect(-13, -5, 5, 11);
    g.fillRect(8, -5, 5, 11);

    // Hands
    g.fillStyle(skinColor, 1);
    g.fillRect(-13, 5, 5, 4);
    g.fillRect(8, 5, 5, 4);

    // Head
    g.fillStyle(skinColor, 1);
    g.fillRect(-6, -18, 12, 12);

    // Eyes
    g.fillStyle(0x1B2A34, 1);
    g.fillRect(-4, -14, 2, 2);
    g.fillRect(2, -14, 2, 2);

    if (isAnte) {
      // Eyelashes for Ante
      g.fillRect(-4, -15, 1, 1);
      g.fillRect(3, -15, 1, 1);
      // Friendly smile
      g.fillRect(-2, -10, 4, 1);
      g.fillRect(-3, -11, 1, 1);
      g.fillRect(2, -11, 1, 1);

      // Shoulder-length dark brown hair (LEGO style)
      g.fillStyle(hairColor, 1);
      // Top of hair
      g.fillRect(-7, -23, 14, 6);
      g.fillRect(-8, -21, 16, 4);
      // Side hair to shoulders
      g.fillRect(-9, -17, 3, 12); // Left side hair
      g.fillRect(6, -17, 3, 12);  // Right side hair
      // Rounded tips
      g.fillRect(-8, -6, 2, 2);
      g.fillRect(6, -6, 2, 2);
      // Bangs
      g.fillRect(-5, -18, 10, 2);
    } else {
      // Default smile
      g.fillRect(-3, -10, 6, 1);
      g.fillRect(-4, -11, 1, 1);
      g.fillRect(3, -11, 1, 1);

      // Hair/hat - simple brick-like hat
      g.fillStyle(hairColor, 1);
      g.fillRect(-7, -24, 14, 7);
      g.fillRect(-5, -26, 10, 3);
      // Stud on head
      g.fillRect(-2, -27, 4, 2);
    }
  }

  update(cursors, wasd) {
    if (!this.isLocal) {
      // Interpolate remote player
      const dx = this.targetX - this.container.x;
      const dy = this.targetY - this.container.y;
      this.container.x += dx * 0.2;
      this.container.y += dy * 0.2;
      return;
    }

    const body = this.container.body;
    body.setVelocity(0);

    let moving = false;

    // Gamepad input (left stick + D-pad)
    const gp = GamepadManager.getMovement();

    if (cursors.left.isDown || wasd.left.isDown || gp.x < -0.3) {
      body.setVelocityX(-PLAYER_SPEED);
      this.facing = 'left';
      moving = true;
    } else if (cursors.right.isDown || wasd.right.isDown || gp.x > 0.3) {
      body.setVelocityX(PLAYER_SPEED);
      this.facing = 'right';
      moving = true;
    }

    if (cursors.up.isDown || wasd.up.isDown || gp.y < -0.3) {
      body.setVelocityY(-PLAYER_SPEED);
      moving = true;
    } else if (cursors.down.isDown || wasd.down.isDown || gp.y > 0.3) {
      body.setVelocityY(PLAYER_SPEED);
      moving = true;
    }

    // Flip based on direction
    this.container.setScale(this.facing === 'left' ? -1 : 1, 1);
    // Keep name unflipped
    this.nameText.setScale(this.facing === 'left' ? -1 : 1, 1);

    // Simple bob animation when moving
    if (moving) {
      this.container.y += Math.sin(this.scene.time.now * 0.01) * 0.5;
    }

    // Send position to network
    if (moving || this._wasmMoving) {
      network.sendMove(
        this.container.x,
        this.container.y,
        moving ? 'walk' : 'idle',
        this.facing === 'left'
      );
    }
    this._wasmMoving = moving;
  }

  setPosition(x, y) {
    if (this.isLocal) {
      this.container.setPosition(x, y);
    } else {
      this.targetX = x;
      this.targetY = y;
    }
  }

  destroy() {
    this.container.destroy();
  }
}
