import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/languages', (_req, res) => {
  res.json({
    languages: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Spanish' },
      { code: 'fr', label: 'French' },
      { code: 'de', label: 'German' },
      { code: 'it', label: 'Italian' },
      { code: 'pt', label: 'Portuguese' },
      { code: 'ja', label: 'Japanese' },
      { code: 'zh', label: 'Chinese' },
      { code: 'ko', label: 'Korean' },
      { code: 'ar', label: 'Arabic' },
      { code: 'hi', label: 'Hindi' },
      { code: 'ru', label: 'Russian' },
      { code: 'uk', label: 'Ukrainian' },
      { code: 'tr', label: 'Turkish' },
      { code: 'nl', label: 'Dutch' },
      { code: 'sv', label: 'Swedish' },
      { code: 'pl', label: 'Polish' },
      { code: 'vi', label: 'Vietnamese' },
      { code: 'th', label: 'Thai' },
      { code: 'id', label: 'Indonesian' }
    ]
  });
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('message', (event) => {
    socket.emit('message', event);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`VoiceBridge server running on http://localhost:${port}`);
});
