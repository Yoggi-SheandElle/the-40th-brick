// The 40th Brick - Save/Load System
// Uses localStorage for persistence across sessions

const SaveManager = {
  SAVE_KEY: '40th_brick_save',

  _default: {
    currentChapter: 1,
    currentRoom: 1,
    roomsSolved: [],
    achievementsUnlocked: [],
    hintsUsed: 0,
    totalTime: 0,
    playerName: '',
    playerColor: '',
    lastSaved: null,
    version: 1
  },

  _data: null,

  load() {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY);
      if (raw) {
        this._data = JSON.parse(raw);
        console.log('[Save] Loaded:', this._data.roomsSolved.length, 'rooms solved');
      } else {
        this._data = { ...this._default };
        console.log('[Save] No save found, starting fresh');
      }
    } catch (e) {
      console.warn('[Save] Corrupted save, resetting');
      this._data = { ...this._default };
    }
    return this._data;
  },

  save() {
    if (!this._data) this._data = { ...this._default };
    this._data.lastSaved = new Date().toISOString();
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(this._data));
      console.log('[Save] Saved at', this._data.lastSaved);
    } catch (e) {
      console.error('[Save] Failed to save:', e);
    }
  },

  solveRoom(chapter, room) {
    if (!this._data) this.load();
    const key = chapter + '-' + room;
    if (!this._data.roomsSolved.includes(key)) {
      this._data.roomsSolved.push(key);
    }
    // Advance position
    if (room >= 10) {
      this._data.currentChapter = Math.min(chapter + 1, 4);
      this._data.currentRoom = 1;
    } else {
      this._data.currentRoom = room + 1;
    }
    this.save();
  },

  isRoomSolved(chapter, room) {
    if (!this._data) this.load();
    return this._data.roomsSolved.includes(chapter + '-' + room);
  },

  unlockAchievement(id) {
    if (!this._data) this.load();
    if (!this._data.achievementsUnlocked.includes(id)) {
      this._data.achievementsUnlocked.push(id);
      this.save();
      return true; // newly unlocked
    }
    return false; // already had it
  },

  useHint() {
    if (!this._data) this.load();
    this._data.hintsUsed++;
    this.save();
  },

  setPlayer(name, color) {
    if (!this._data) this.load();
    this._data.playerName = name;
    this._data.playerColor = color;
    this.save();
  },

  getProgress() {
    if (!this._data) this.load();
    return {
      chapter: this._data.currentChapter,
      room: this._data.currentRoom,
      solved: this._data.roomsSolved.length,
      total: 40,
      percent: Math.round((this._data.roomsSolved.length / 40) * 100)
    };
  },

  hasSave() {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  },

  reset() {
    this._data = { ...this._default };
    localStorage.removeItem(this.SAVE_KEY);
    console.log('[Save] Reset complete');
  },

  getData() {
    if (!this._data) this.load();
    return this._data;
  }
};

// Auto-load on script init
SaveManager.load();
