import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 4000;
const SECRET = 'supersecretkey';

app.use(cors());
app.use(bodyParser.json());

const USERS_FILE = './users.json';
const EVENTS_FILE = './events.json';

function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Middleware to check JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Login endpoint
app.post('/api/login', (req, res) => {
  console.log('Login attempt:', req.body);
  const { username, password } = req.body;
  const users = readJSON(USERS_FILE);
  console.log('Users loaded:', users);
  const user = users.find(u => u.username === username && u.password === password);
  console.log('User found:', user);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ username: user.username }, SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// Get all events (public)
app.get('/api/events', (req, res) => {
  const events = readJSON(EVENTS_FILE);
  res.json(events);
});

// Add event (protected)
app.post('/api/events', authenticateToken, (req, res) => {
  const events = readJSON(EVENTS_FILE);
  const event = { 
    id: Date.now(), 
    title: req.body.title,
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    description: req.body.description,
    sponsors: req.body.sponsors || '',
    image: req.body.image || '',
    room: req.body.room || '',
    createdBy: req.user.username,
    createdAt: new Date().toISOString()
  };
  events.push(event);
  writeJSON(EVENTS_FILE, events);
  res.status(201).json(event);
});

// Edit event (protected)
app.put('/api/events/:id', authenticateToken, (req, res) => {
  const events = readJSON(EVENTS_FILE);
  const idx = events.findIndex(e => e.id == req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Event not found' });
  
  // Only allow editing if user created the event or is admin
  if (events[idx].createdBy !== req.user.username && req.user.username !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to edit this event' });
  }
  
  events[idx] = { 
    ...events[idx], 
    title: req.body.title,
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    description: req.body.description,
    sponsors: req.body.sponsors || '',
    image: req.body.image || '',
    room: req.body.room || '',
    updatedAt: new Date().toISOString()
  };
  writeJSON(EVENTS_FILE, events);
  res.json(events[idx]);
});

// Delete event (protected)
app.delete('/api/events/:id', authenticateToken, (req, res) => {
  let events = readJSON(EVENTS_FILE);
  const idx = events.findIndex(e => e.id == req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Event not found' });
  const deleted = events[idx];
  events = events.filter(e => e.id != req.params.id);
  writeJSON(EVENTS_FILE, events);
  res.json(deleted);
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
}); 