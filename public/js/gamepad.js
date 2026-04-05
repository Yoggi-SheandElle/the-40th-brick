// The 40th Brick - Unified Input System
// Supports: PS4 DualShock 4, Xbox, Steam Deck, Keyboard, Touch
// Provides spatial navigation for cursor-free puzzle play from the couch

const InputSystem = {
  // State
  gamepad: null,
  controllerType: 'generic', // 'ps4', 'xbox', 'generic'
  connected: false,
  listeners: {},
  focusables: [],
  focusIndex: -1,
  prevButtons: {},
  holdTimers: {},
  deadzone: 0.25,
  repeatDelay: 400,
  repeatRate: 120,

  // Button mapping (W3C standard)
  BUTTONS: {
    CONFIRM: 0,    // Cross / A
    CANCEL: 1,     // Circle / B
    ACTION: 2,     // Square / X
    MENU: 3,       // Triangle / Y
    L1: 4, R1: 5,
    L2: 6, R2: 7,
    SELECT: 8,     // Share / Back
    START: 9,      // Options / Start
    L3: 10, R3: 11,
    UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15
  },

  // PS4 button display (Unicode)
  PS4_ICONS: {
    0: '\u2715',   // Cross
    1: '\u25CB',   // Circle
    2: '\u25A0',   // Square
    3: '\u25B2',   // Triangle
    4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2',
    12: '\u25B2', 13: '\u25BC', 14: '\u25C0', 15: '\u25B6'
  },

  XBOX_ICONS: {
    0: 'A', 1: 'B', 2: 'X', 3: 'Y',
    4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT',
    12: '\u25B2', 13: '\u25BC', 14: '\u25C0', 15: '\u25B6'
  },

  init() {
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepad = e.gamepad;
      this.connected = true;
      this.detectControllerType(e.gamepad);
      this._emit('connected', { type: this.controllerType, gamepad: e.gamepad });
      console.log('[Input] Controller connected:', this.controllerType, e.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepad = null;
      this.connected = false;
      this.controllerType = 'generic';
      this._emit('disconnected');
      console.log('[Input] Controller disconnected');
    });

    // Start polling
    this._poll();
  },

  detectControllerType(gp) {
    const id = (gp.id || '').toLowerCase();
    if (id.includes('dualshock') || id.includes('054c') || id.includes('playstation') || id.includes('dualsense')) {
      this.controllerType = 'ps4';
    } else if (id.includes('xbox') || id.includes('045e') || id.includes('xinput') || id.includes('x-box')) {
      this.controllerType = 'xbox';
    } else {
      // Steam Deck remaps to Xbox via Steam Input
      this.controllerType = 'xbox';
    }
  },

  // Get button icon for current controller
  getButtonIcon(buttonIndex) {
    if (this.controllerType === 'ps4') {
      return this.PS4_ICONS[buttonIndex] || '?';
    }
    return this.XBOX_ICONS[buttonIndex] || '?';
  },

  getConfirmLabel() {
    return this.controllerType === 'ps4' ? '\u2715 Confirm' : 'A Confirm';
  },

  getCancelLabel() {
    return this.controllerType === 'ps4' ? '\u25CB Back' : 'B Back';
  },

  // Polling loop
  _poll() {
    requestAnimationFrame(() => this._poll());

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        gp = gamepads[i];
        break;
      }
    }

    if (!gp) {
      this.gamepad = null;
      return;
    }
    this.gamepad = gp;
    if (!this.connected) {
      this.connected = true;
      this.detectControllerType(gp);
    }

    // Process buttons
    for (let i = 0; i < gp.buttons.length; i++) {
      const pressed = gp.buttons[i].pressed;
      const wasPressed = this.prevButtons[i] || false;

      if (pressed && !wasPressed) {
        this._emit('button_down', i);
        this._handleNavigation(i);
      }
      if (!pressed && wasPressed) {
        this._emit('button_up', i);
        this.holdTimers[i] = 0;
      }

      // Hold repeat for navigation
      if (pressed && wasPressed && (i >= 12 && i <= 15)) {
        this.holdTimers[i] = (this.holdTimers[i] || 0) + 16.67;
        if (this.holdTimers[i] > this.repeatDelay) {
          this.holdTimers[i] -= this.repeatRate;
          this._handleNavigation(i);
        }
      }

      this.prevButtons[i] = pressed;
    }

    // Left stick as digital input
    const lx = gp.axes[0] || 0;
    const ly = gp.axes[1] || 0;
    const stickLeft = lx < -this.deadzone;
    const stickRight = lx > this.deadzone;
    const stickUp = ly < -this.deadzone;
    const stickDown = ly > this.deadzone;

    this._processStickDirection('stick_left', stickLeft, 14);
    this._processStickDirection('stick_right', stickRight, 15);
    this._processStickDirection('stick_up', stickUp, 12);
    this._processStickDirection('stick_down', stickDown, 13);
  },

  _processStickDirection(key, active, navButton) {
    const was = this.prevButtons[key] || false;
    if (active && !was) {
      this._handleNavigation(navButton);
    }
    if (active && was) {
      this.holdTimers[key] = (this.holdTimers[key] || 0) + 16.67;
      if (this.holdTimers[key] > this.repeatDelay) {
        this.holdTimers[key] -= this.repeatRate;
        this._handleNavigation(navButton);
      }
    }
    if (!active) {
      this.holdTimers[key] = 0;
    }
    this.prevButtons[key] = active;
  },

  // Spatial navigation
  _handleNavigation(buttonIndex) {
    if (this.focusables.length === 0) return;

    switch (buttonIndex) {
      case 12: this._navigateSpatial('up'); break;
      case 13: this._navigateSpatial('down'); break;
      case 14: this._navigateSpatial('left'); break;
      case 15: this._navigateSpatial('right'); break;
      case 0:  this._activateFocused(); break;
      case 1:  this._emit('cancel'); break;
    }
  },

  _navigateSpatial(direction) {
    if (this.focusables.length === 0) return;

    // First focus
    if (this.focusIndex < 0 || this.focusIndex >= this.focusables.length) {
      this.focusIndex = 0;
      this._updateFocusVisual();
      this._emit('focus_change', this.focusIndex);
      return;
    }

    const current = this.focusables[this.focusIndex];
    if (!current) return;

    const cx = current.x || 0;
    const cy = current.y || 0;

    let bestIndex = -1;
    let bestDist = Infinity;

    for (let i = 0; i < this.focusables.length; i++) {
      if (i === this.focusIndex) continue;
      const item = this.focusables[i];
      if (!item) continue;

      const ix = item.x || 0;
      const iy = item.y || 0;
      const dx = ix - cx;
      const dy = iy - cy;

      // Filter by direction
      let valid = false;
      if (direction === 'up' && dy < -5) valid = true;
      if (direction === 'down' && dy > 5) valid = true;
      if (direction === 'left' && dx < -5) valid = true;
      if (direction === 'right' && dx > 5) valid = true;
      if (!valid) continue;

      // Weighted distance: primary axis * 1, secondary * 3
      let dist;
      if (direction === 'left' || direction === 'right') {
        dist = Math.abs(dx) + Math.abs(dy) * 3;
      } else {
        dist = Math.abs(dy) + Math.abs(dx) * 3;
      }

      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }

    if (bestIndex >= 0) {
      this.focusIndex = bestIndex;
      this._updateFocusVisual();
      this._emit('focus_change', this.focusIndex);
      this.vibrate(30, 0.1, 0.1);
    }
  },

  _activateFocused() {
    if (this.focusIndex < 0 || this.focusIndex >= this.focusables.length) return;
    const item = this.focusables[this.focusIndex];
    if (item && item.callback) {
      item.callback();
      this.vibrate(80, 0.2, 0.4);
    }
    this._emit('confirm', this.focusIndex);
  },

  _updateFocusVisual() {
    for (let i = 0; i < this.focusables.length; i++) {
      const item = this.focusables[i];
      if (!item || !item.element) continue;

      if (i === this.focusIndex) {
        if (item.element.setTint) item.element.setTint(0x44AAFF);
        if (item.element.setScale && item.originalScale) {
          item.element.setScale(item.originalScale * 1.08);
        }
      } else {
        if (item.element.clearTint) item.element.clearTint();
        if (item.element.setScale && item.originalScale) {
          item.element.setScale(item.originalScale);
        }
      }
    }
  },

  // Set focusable items for current scene
  setFocusables(items) {
    this.focusables = items.map(item => ({
      element: item.element || null,
      x: item.x || (item.element ? item.element.x : 0),
      y: item.y || (item.element ? item.element.y : 0),
      callback: item.callback || null,
      originalScale: item.originalScale || (item.element ? (item.element.scaleX || 1) : 1)
    }));
    this.focusIndex = -1;
  },

  clearFocusables() {
    for (let i = 0; i < this.focusables.length; i++) {
      const item = this.focusables[i];
      if (item && item.element) {
        if (item.element.clearTint) item.element.clearTint();
        if (item.element.setScale && item.originalScale) {
          item.element.setScale(item.originalScale);
        }
      }
    }
    this.focusables = [];
    this.focusIndex = -1;
  },

  // Haptic feedback
  vibrate(duration, weak, strong) {
    if (!this.gamepad) return;
    duration = duration || 100;
    weak = weak || 0.3;
    strong = strong || 0.5;

    if (this.gamepad.vibrationActuator) {
      this.gamepad.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0, duration: duration,
        weakMagnitude: weak, strongMagnitude: strong
      }).catch(() => {});
    } else if (this.gamepad.hapticActuators && this.gamepad.hapticActuators[0]) {
      this.gamepad.hapticActuators[0].pulse(Math.max(weak, strong), duration).catch(() => {});
    }
  },

  // Check if button is currently held
  isDown(buttonIndex) {
    if (!this.gamepad) return false;
    return this.gamepad.buttons[buttonIndex] && this.gamepad.buttons[buttonIndex].pressed;
  },

  // Get stick values with deadzone
  getLeftStick() {
    if (!this.gamepad) return { x: 0, y: 0 };
    const x = Math.abs(this.gamepad.axes[0]) > this.deadzone ? this.gamepad.axes[0] : 0;
    const y = Math.abs(this.gamepad.axes[1]) > this.deadzone ? this.gamepad.axes[1] : 0;
    return { x, y };
  },

  getRightStick() {
    if (!this.gamepad) return { x: 0, y: 0 };
    const x = Math.abs(this.gamepad.axes[2]) > this.deadzone ? this.gamepad.axes[2] : 0;
    const y = Math.abs(this.gamepad.axes[3]) > this.deadzone ? this.gamepad.axes[3] : 0;
    return { x, y };
  },

  // Event system
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  },

  _emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(data));
  }
};

// Backward compatibility alias
const GamepadManager = InputSystem;

// Helper: detect if we're in solo mode
function isSolo() {
  return network && network.solo;
}

// Helper: check if touch device
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Helper: detect platform
function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('steamdeck') || (ua.includes('linux') && ua.includes('valve'))) return 'steamdeck';
  if (ua.includes('playstation')) return 'playstation';
  if (/android|iphone|ipad|ipod/i.test(ua)) return 'mobile';
  if (ua.includes('smart-tv') || ua.includes('smarttv') || ua.includes('tizen') ||
      ua.includes('webos') || ua.includes('crkey') || ua.includes('firetv') ||
      (window.screen.width >= 2560 && !isTouchDevice())) return 'tv';
  return 'desktop';
}

// Initialize
InputSystem.init();
