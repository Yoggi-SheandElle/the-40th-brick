// The 40th Brick - Gamepad + Input Abstraction Layer
// Supports: Steam Deck, Xbox, PlayStation, keyboard, touch
// W3C Standard Gamepad API mapping

const GamepadManager = {
  // Button indices (W3C Standard)
  BUTTONS: {
    A: 0,        // Confirm / Select
    B: 1,        // Back / Cancel
    X: 2,        // Hint / Special
    Y: 3,        // Inventory / Info
    LB: 4,       // Previous room
    RB: 5,       // Next room
    LT: 6,       // Zoom out
    RT: 7,       // Zoom in
    SELECT: 8,   // Map / Overview
    START: 9,    // Pause menu
    L3: 10,      // Left stick press
    R3: 11,      // Right stick press
    DPAD_UP: 12,
    DPAD_DOWN: 13,
    DPAD_LEFT: 14,
    DPAD_RIGHT: 15
  },

  // State
  _connected: false,
  _gamepad: null,
  _prevButtons: new Array(16).fill(false),
  _currButtons: new Array(16).fill(false),
  _axes: [0, 0, 0, 0],
  _deadzone: 0.15,
  _callbacks: {},
  _focusIndex: 0,
  _focusables: [],
  _vibrationSupported: false,

  init() {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('[Gamepad] Connected:', e.gamepad.id);
      this._connected = true;
      this._gamepad = e.gamepad;
      this._vibrationSupported = !!(e.gamepad.vibrationActuator);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('[Gamepad] Disconnected:', e.gamepad.id);
      this._connected = false;
      this._gamepad = null;
    });

    // Start polling
    this._poll();
  },

  _poll() {
    requestAnimationFrame(() => this._poll());

    if (!this._connected) return;

    // Refresh gamepad state (required in Chrome)
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    let gp = null;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        gp = gamepads[i];
        break;
      }
    }
    if (!gp) return;

    // Save previous state
    for (let i = 0; i < 16; i++) {
      this._prevButtons[i] = this._currButtons[i];
    }

    // Read current buttons
    for (let i = 0; i < Math.min(gp.buttons.length, 16); i++) {
      this._currButtons[i] = gp.buttons[i].pressed;
    }

    // Read axes with deadzone
    for (let i = 0; i < Math.min(gp.axes.length, 4); i++) {
      this._axes[i] = Math.abs(gp.axes[i]) > this._deadzone ? gp.axes[i] : 0;
    }

    // Fire callbacks for just-pressed buttons
    for (let i = 0; i < 16; i++) {
      if (this._currButtons[i] && !this._prevButtons[i]) {
        this._fire('button_' + i);
        this._fire('any_button', i);
      }
    }

    // D-pad / stick navigation for focus system
    if (this.justPressed(this.BUTTONS.DPAD_DOWN) || (this._axes[1] > 0.5 && Math.abs(this._prevAxes1 || 0) < 0.5)) {
      this._moveFocus(1);
    }
    if (this.justPressed(this.BUTTONS.DPAD_UP) || (this._axes[1] < -0.5 && Math.abs(this._prevAxes1 || 0) < 0.5)) {
      this._moveFocus(-1);
    }
    this._prevAxes1 = this._axes[1];

    // A button confirms focused item
    if (this.justPressed(this.BUTTONS.A)) {
      this._confirmFocus();
    }
  },

  // Check if button was just pressed this frame
  justPressed(buttonIndex) {
    return this._currButtons[buttonIndex] && !this._prevButtons[buttonIndex];
  },

  // Check if button is currently held
  isDown(buttonIndex) {
    return this._currButtons[buttonIndex];
  },

  // Get left stick movement normalized (-1 to 1)
  getMovement() {
    let x = 0, y = 0;

    if (this._connected) {
      x = this._axes[0] || 0;
      y = this._axes[1] || 0;

      // Also check D-pad
      if (this._currButtons[this.BUTTONS.DPAD_LEFT]) x = -1;
      if (this._currButtons[this.BUTTONS.DPAD_RIGHT]) x = 1;
      if (this._currButtons[this.BUTTONS.DPAD_UP]) y = -1;
      if (this._currButtons[this.BUTTONS.DPAD_DOWN]) y = 1;
    }

    return { x, y };
  },

  // Get right stick (camera/pan)
  getRightStick() {
    return {
      x: this._axes[2] || 0,
      y: this._axes[3] || 0
    };
  },

  // Vibrate (Steam Deck supports this)
  vibrate(duration, weakMagnitude, strongMagnitude) {
    if (!this._vibrationSupported || !this._connected) return;
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].vibrationActuator) {
        gamepads[i].vibrationActuator.playEffect('dual-rumble', {
          duration: duration || 100,
          weakMagnitude: weakMagnitude || 0.3,
          strongMagnitude: strongMagnitude || 0.5
        }).catch(() => {});
        break;
      }
    }
  },

  // Focus system for UI navigation
  setFocusables(items) {
    // items = array of { element, callback, x, y }
    this._focusables = items;
    this._focusIndex = 0;
    if (items.length > 0) this._highlightFocus();
  },

  clearFocusables() {
    this._focusables = [];
    this._focusIndex = 0;
  },

  _moveFocus(dir) {
    if (this._focusables.length === 0) return;
    // Remove old highlight
    this._unhighlightFocus();
    this._focusIndex = (this._focusIndex + dir + this._focusables.length) % this._focusables.length;
    this._highlightFocus();
    this.vibrate(30, 0.1, 0.1);
  },

  _highlightFocus() {
    const item = this._focusables[this._focusIndex];
    if (!item) return;
    if (item.element && item.element.emit) {
      item.element.emit('pointerover');
    }
    this._fire('focus_change', this._focusIndex);
  },

  _unhighlightFocus() {
    const item = this._focusables[this._focusIndex];
    if (!item) return;
    if (item.element && item.element.emit) {
      item.element.emit('pointerout');
    }
  },

  _confirmFocus() {
    const item = this._focusables[this._focusIndex];
    if (!item) return;
    if (item.callback) {
      item.callback();
    } else if (item.element && item.element.emit) {
      item.element.emit('pointerdown');
    }
    this.vibrate(60, 0.3, 0.5);
  },

  // Event system
  on(event, callback) {
    if (!this._callbacks[event]) this._callbacks[event] = [];
    this._callbacks[event].push(callback);
  },

  off(event, callback) {
    if (!this._callbacks[event]) return;
    this._callbacks[event] = this._callbacks[event].filter(cb => cb !== callback);
  },

  _fire(event, data) {
    if (!this._callbacks[event]) return;
    this._callbacks[event].forEach(cb => cb(data));
  },

  // Check if any gamepad is connected
  isConnected() {
    return this._connected;
  }
};

// Auto-init
GamepadManager.init();
