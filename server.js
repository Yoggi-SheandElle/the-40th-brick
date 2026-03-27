const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Allowed origins
const ALLOWED_ORIGINS = NODE_ENV === 'production'
  ? ['https://the-40th-brick.onrender.com', 'https://elektraos.dev']
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 10000,
  maxHttpBufferSize: 1e5 // 100KB max message size
});

// ===== SECURITY MIDDLEWARE =====

// Security headers (inline helmet)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  // CSP for game assets
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' wss: ws:; " +
    "img-src 'self' data:; " +
    "frame-ancestors 'none';"
  );
  next();
});

// Rate limiting (simple in-memory, no dependency)
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 120; // 120 requests per minute

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const record = rateLimiter.get(ip);

  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    rateLimiter.set(ip, { start: now, count: 1 });
    return next();
  }

  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
});

// Clean rate limiter every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimiter) {
    if (now - record.start > RATE_LIMIT_WINDOW * 2) {
      rateLimiter.delete(ip);
    }
  }
}, 300000);

// Serve static files with caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, uptime: process.uptime() });
});

// ===== INPUT SANITIZATION =====

function sanitizeString(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&"']/g, '').trim().substring(0, maxLen || 50);
}

function sanitizeNumber(num, min, max) {
  const n = Number(num);
  if (isNaN(n)) return min || 0;
  return Math.max(min || 0, Math.min(max || 9999, n));
}

// ===== GAME ROOMS =====

const rooms = new Map();
const MAX_ROOMS = 100;
const ROOM_TIMEOUT = 3600000; // 1 hour auto-cleanup

function generateRoomCode() {
  return crypto.randomInt(1000, 9999).toString();
}

// Socket rate limiting
const socketRates = new Map();
const SOCKET_RATE_LIMIT = 60; // events per second
const SOCKET_RATE_WINDOW = 1000;

function checkSocketRate(socketId) {
  const now = Date.now();
  const record = socketRates.get(socketId);
  if (!record || now - record.start > SOCKET_RATE_WINDOW) {
    socketRates.set(socketId, { start: now, count: 1 });
    return true;
  }
  record.count++;
  return record.count <= SOCKET_RATE_LIMIT;
}

// ===== SOCKET.IO =====

io.on('connection', (socket) => {
  console.log('[+] Player connected:', socket.id);

  // Rate check wrapper
  const rateLimited = (handler) => {
    return (...args) => {
      if (!checkSocketRate(socket.id)) {
        socket.emit('join_error', 'Too many actions. Slow down.');
        return;
      }
      handler(...args);
    };
  };

  // Create room
  socket.on('create_room', rateLimited((playerName) => {
    playerName = sanitizeString(playerName, 12) || 'Player';

    if (rooms.size >= MAX_ROOMS) {
      socket.emit('join_error', 'Server is full. Try again later.');
      return;
    }

    let code = generateRoomCode();
    let attempts = 0;
    while (rooms.has(code) && attempts < 50) {
      code = generateRoomCode();
      attempts++;
    }

    const room = {
      code,
      players: [{
        id: socket.id,
        name: playerName,
        role: 'host',
        ready: false,
        x: 200,
        y: 300
      }],
      state: 'lobby',
      chapter: 0,
      achievements: [],
      puzzleState: {},
      createdAt: Date.now()
    };

    rooms.set(code, room);
    socket.join(code);
    socket.roomCode = code;
    socket.emit('room_created', { code, player: room.players[0] });
  }));

  // Join room
  socket.on('join_room', rateLimited(({ code, playerName }) => {
    code = sanitizeString(code, 4);
    playerName = sanitizeString(playerName, 12) || 'Player';

    const room = rooms.get(code);
    if (!room) {
      socket.emit('join_error', 'Room not found.');
      return;
    }
    if (room.players.length >= 2) {
      socket.emit('join_error', 'Room is full.');
      return;
    }
    if (room.state !== 'lobby') {
      socket.emit('join_error', 'Game in progress.');
      return;
    }

    const player = {
      id: socket.id,
      name: playerName,
      role: 'guest',
      ready: false,
      x: 600,
      y: 300
    };

    room.players.push(player);
    socket.join(code);
    socket.roomCode = code;

    socket.emit('room_joined', {
      code,
      player,
      otherPlayer: room.players[0]
    });
    socket.to(code).emit('player_joined', player);
  }));

  // Solo mode
  socket.on('start_solo', rateLimited((playerName) => {
    playerName = sanitizeString(playerName, 12) || 'Ante';

    if (rooms.size >= MAX_ROOMS) {
      socket.emit('join_error', 'Server is full.');
      return;
    }

    let code = generateRoomCode();
    while (rooms.has(code)) code = generateRoomCode();

    const room = {
      code,
      players: [{
        id: socket.id,
        name: playerName,
        role: 'host',
        ready: true,
        x: 200,
        y: 300
      }],
      state: 'playing',
      solo: true,
      chapter: 1,
      achievements: [],
      puzzleState: {},
      createdAt: Date.now()
    };

    rooms.set(code, room);
    socket.join(code);
    socket.roomCode = code;

    socket.emit('game_start', {
      chapter: 1,
      players: room.players,
      solo: true
    });
  }));

  // Player ready
  socket.on('player_ready', rateLimited(() => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    player.ready = !player.ready;
    io.to(socket.roomCode).emit('ready_update', {
      playerId: socket.id,
      ready: player.ready
    });

    if (room.players.length === 2 && room.players.every(p => p.ready)) {
      room.state = 'playing';
      room.chapter = 1;
      io.to(socket.roomCode).emit('game_start', {
        chapter: room.chapter,
        players: room.players
      });
    }
  }));

  // Player movement
  socket.on('player_move', rateLimited((data) => {
    if (!socket.roomCode) return;
    socket.to(socket.roomCode).emit('player_moved', {
      id: socket.id,
      x: sanitizeNumber(data.x, 0, GAME_WIDTH_MAX),
      y: sanitizeNumber(data.y, 0, GAME_HEIGHT_MAX),
      anim: sanitizeString(data.anim, 10),
      flipX: !!data.flipX
    });
  }));

  // Puzzle actions
  socket.on('puzzle_action', rateLimited((data) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    const action = sanitizeString(data.action, 30);
    const payload = data.payload || {};

    // Sanitize payload values
    const cleanPayload = {};
    for (const [key, val] of Object.entries(payload)) {
      if (typeof val === 'string') cleanPayload[key] = sanitizeString(val, 100);
      else if (typeof val === 'number') cleanPayload[key] = sanitizeNumber(val, -9999, 9999);
      else if (typeof val === 'boolean') cleanPayload[key] = !!val;
    }

    socket.to(socket.roomCode).emit('puzzle_update', {
      playerId: socket.id,
      action,
      payload: cleanPayload,
      state: room.puzzleState
    });
  }));

  // Chapter complete
  socket.on('chapter_complete', rateLimited((data) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    const achievementId = sanitizeString(data.achievementId, 50);
    const nextChapter = sanitizeNumber(data.nextChapter, 1, 5);

    if (achievementId && !room.achievements.includes(achievementId)) {
      room.achievements.push(achievementId);
    }

    room.chapter = nextChapter;
    room.puzzleState = {};

    io.to(socket.roomCode).emit('achievement_unlocked', {
      achievementId,
      nextChapter: room.chapter,
      achievements: room.achievements
    });
  }));

  // Start chapter
  socket.on('start_chapter', rateLimited((chapter) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    room.chapter = sanitizeNumber(chapter, 1, 4);
    room.puzzleState = {};

    io.to(socket.roomCode).emit('chapter_started', {
      chapter: room.chapter,
      players: room.players
    });
  }));

  // Chat messages
  socket.on('chat_message', rateLimited((msg) => {
    if (!socket.roomCode) return;
    const cleanMsg = sanitizeString(msg, 200);
    if (!cleanMsg) return;

    socket.to(socket.roomCode).emit('chat_message', {
      from: socket.id,
      text: cleanMsg
    });
  }));

  // Disconnect
  socket.on('disconnect', () => {
    console.log('[-] Player disconnected:', socket.id);
    socketRates.delete(socket.id);

    const code = socket.roomCode;
    if (!code) return;

    const room = rooms.get(code);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);
    socket.to(code).emit('player_disconnected', socket.id);

    if (room.players.length === 0) {
      rooms.delete(code);
    }
  });
});

// Game bounds for position sanitization
const GAME_WIDTH_MAX = 960;
const GAME_HEIGHT_MAX = 540;

// Stale room cleanup every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > ROOM_TIMEOUT) {
      rooms.delete(code);
      console.log('[cleanup] Stale room removed:', code);
    }
  }
}, 1800000);

server.listen(PORT, () => {
  console.log('');
  console.log('  The 40th Brick');
  console.log('  Server running on http://localhost:' + PORT);
  console.log('  Environment: ' + NODE_ENV);
  console.log('');
});
