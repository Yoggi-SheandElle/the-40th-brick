const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game rooms storage
const rooms = new Map();

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create a new room
  socket.on('create_room', (playerName) => {
    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
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
      puzzleState: {}
    };

    rooms.set(code, room);
    socket.join(code);
    socket.roomCode = code;

    socket.emit('room_created', { code, player: room.players[0] });
    console.log(`Room ${code} created by ${playerName}`);
  });

  // Join an existing room
  socket.on('join_room', ({ code, playerName }) => {
    const room = rooms.get(code);

    if (!room) {
      socket.emit('join_error', 'Room not found. Check the code and try again.');
      return;
    }
    if (room.players.length >= 2) {
      socket.emit('join_error', 'Room is full.');
      return;
    }
    if (room.state !== 'lobby') {
      socket.emit('join_error', 'Game already in progress.');
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
    console.log(`${playerName} joined room ${code}`);
  });

  // Solo mode - start game alone
  socket.on('start_solo', (playerName) => {
    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

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
      puzzleState: {}
    };

    rooms.set(code, room);
    socket.join(code);
    socket.roomCode = code;

    socket.emit('game_start', {
      chapter: 1,
      players: room.players,
      solo: true
    });
    console.log(`Solo game started by ${playerName} in room ${code}`);
  });

  // Player ready toggle
  socket.on('player_ready', () => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = !player.ready;
      io.to(socket.roomCode).emit('ready_update', {
        playerId: socket.id,
        ready: player.ready
      });

      // Both ready? Start game
      if (room.players.length === 2 && room.players.every(p => p.ready)) {
        room.state = 'playing';
        room.chapter = 1;
        io.to(socket.roomCode).emit('game_start', {
          chapter: room.chapter,
          players: room.players
        });
        console.log(`Game started in room ${socket.roomCode}`);
      }
    }
  });

  // Player movement
  socket.on('player_move', (data) => {
    socket.to(socket.roomCode).emit('player_moved', {
      id: socket.id,
      x: data.x,
      y: data.y,
      anim: data.anim,
      flipX: data.flipX
    });
  });

  // Puzzle actions (chapter-specific)
  socket.on('puzzle_action', (data) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    // Merge puzzle state
    Object.assign(room.puzzleState, data.state || {});

    socket.to(socket.roomCode).emit('puzzle_update', {
      playerId: socket.id,
      action: data.action,
      payload: data.payload,
      state: room.puzzleState
    });
  });

  // Chapter complete
  socket.on('chapter_complete', (data) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    if (!room.achievements.includes(data.achievementId)) {
      room.achievements.push(data.achievementId);
    }

    room.chapter = data.nextChapter || room.chapter + 1;
    room.puzzleState = {};

    io.to(socket.roomCode).emit('achievement_unlocked', {
      achievementId: data.achievementId,
      nextChapter: room.chapter,
      achievements: room.achievements
    });
  });

  // Navigate to chapter (from world map)
  socket.on('start_chapter', (chapter) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    room.chapter = chapter;
    room.puzzleState = {};

    io.to(socket.roomCode).emit('chapter_started', {
      chapter,
      players: room.players
    });
  });

  // Chat messages (for co-op communication)
  socket.on('chat_message', (msg) => {
    socket.to(socket.roomCode).emit('chat_message', {
      from: socket.id,
      text: msg
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    const code = socket.roomCode;
    if (!code) return;

    const room = rooms.get(code);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);
    socket.to(code).emit('player_disconnected', socket.id);

    if (room.players.length === 0) {
      rooms.delete(code);
      console.log(`Room ${code} deleted (empty)`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n  🧱 The 46th Brick`);
  console.log(`  Server running on http://localhost:${PORT}\n`);
});
