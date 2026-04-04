// Network manager - wraps Socket.io for game communication
class NetworkManager {
  constructor() {
    this.socket = null;
    this.roomCode = null;
    this.playerId = null;
    this.playerRole = null; // 'host' or 'guest'
    this.connected = false;
    this.listeners = {};
  }

  connect() {
    if (this.socket) return;
    this.socket = io();

    this.socket.on('connect', () => {
      this.connected = true;
      this.playerId = this.socket.id;
      this._emit('connected');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this._emit('disconnected');
    });

    // Room events
    this.socket.on('room_created', (data) => {
      this.roomCode = data.code;
      this.playerRole = 'host';
      this._emit('room_created', data);
    });

    this.socket.on('room_joined', (data) => {
      this.roomCode = data.code;
      this.playerRole = 'guest';
      this._emit('room_joined', data);
    });

    this.socket.on('join_error', (msg) => {
      this._emit('join_error', msg);
    });

    this.socket.on('player_joined', (player) => {
      this._emit('player_joined', player);
    });

    this.socket.on('player_disconnected', (id) => {
      this._emit('player_disconnected', id);
    });

    this.socket.on('ready_update', (data) => {
      this._emit('ready_update', data);
    });

    this.socket.on('game_start', (data) => {
      this._emit('game_start', data);
    });

    // Gameplay events
    this.socket.on('player_moved', (data) => {
      this._emit('player_moved', data);
    });

    this.socket.on('puzzle_update', (data) => {
      this._emit('puzzle_update', data);
    });

    this.socket.on('achievement_unlocked', (data) => {
      this._emit('achievement_unlocked', data);
    });

    this.socket.on('chapter_started', (data) => {
      this._emit('chapter_started', data);
    });

    this.socket.on('chat_message', (data) => {
      this._emit('chat_message', data);
    });
  }

  _send(event, data) {
    if (this.socket) this.socket.emit(event, data);
  }

  createRoom(playerName) {
    this._send('create_room', playerName);
  }

  startSolo(playerName) {
    this.solo = true;
    this.playerRole = 'host';
    this._send('start_solo', playerName);
  }

  joinRoom(code, playerName) {
    this._send('join_room', { code, playerName });
  }

  setReady() {
    this._send('player_ready');
  }

  sendMove(x, y, anim, flipX) {
    this._send('player_move', { x, y, anim, flipX });
  }

  sendPuzzleAction(action, payload, state) {
    this._send('puzzle_action', { action, payload, state });
  }

  sendChapterComplete(achievementId, nextChapter) {
    this._send('chapter_complete', { achievementId, nextChapter });
  }

  startChapter(chapter) {
    this._send('start_chapter', chapter);
  }

  sendChat(text) {
    this._send('chat_message', text);
  }

  // Event listener system
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  _emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(data));
  }
}

// Global singleton
const network = new NetworkManager();
