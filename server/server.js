require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.set('trust proxy', 1); // needed behind Render's proxy for rate limiting

const io = new Server(server, { cors: { origin: clientUrl, credentials: true } });
app.set('io', io);

io.use((socket, next) => {
  try {
    const payload = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

// Presence + typing indicator
const online = new Map(); // userId -> number of open connections
io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);
  online.set(socket.userId, (online.get(socket.userId) || 0) + 1);
  io.emit('presence:update', { userId: socket.userId, online: true });

  socket.on('typing', ({ to, typing }) => io.to(`user:${to}`).emit('typing', { from: socket.userId, typing }));
  socket.on('presence:check', (userId, cb) => typeof cb === 'function' && cb(online.has(userId)));

  socket.on('disconnect', () => {
    const left = (online.get(socket.userId) || 1) - 1;
    if (left <= 0) {
      online.delete(socket.userId);
      io.emit('presence:update', { userId: socket.userId, online: false });
    } else {
      online.set(socket.userId, left);
    }
  });
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // allows images from /uploads on another origin
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/geo', require('./routes/geo'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => server.listen(PORT, () => console.log(`Server running on port ${PORT}`)));
