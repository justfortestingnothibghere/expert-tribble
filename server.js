const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('.'));

// MongoDB Connection
mongoose.connect('mongodb://localhost/musicvibe', { useNewUrlParser: true, useUnifiedTopology: true });

// Schemas
const UserSchema = new mongoose.Schema({
  username: String,
  userid: String,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  password: String,
  photo: String,
  isPremium: { type: Boolean, default: false },
  points: { type: Number, default: 10 },
  lastPointReset: Date
});

const SongSchema = new mongoose.Schema({
  name: String,
  filename: String,
  uploadedBy: String
});

const HistorySchema = new mongoose.Schema({
  userId: String,
  songId: String,
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Song = mongoose.model('Song', SongSchema);
const History = mongoose.model('History', HistorySchema);

// Multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// APIs
app.get('/api/songs', async (req, res) => {
  const songs = await Song.find();
  res.json(songs);
});

app.post('/api/songs', upload.single('song'), async (req, res) => {
  const song = new Song({
    name: req.body.name,
    filename: req.file.filename,
    uploadedBy: 'admin' // Replace with actual user ID
  });
  await song.save();
  res.json({ success: true });
});

app.get('/api/user', async (req, res) => {
  // Mock user for demo
  let user = await User.findOne({ userid: 'demo' });
  if (!user) {
    user = new User({
      userid: 'demo',
      username: 'Demo User',
      points: 10,
      isPremium: false
    });
    await user.save();
  }
  // Reset points daily
  const now = new Date();
  if (!user.lastPointReset || now - user.lastPointReset > 24 * 60 * 60 * 1000) {
    user.points = 10;
    user.lastPointReset = now;
    await user.save();
  }
  res.json(user);
});

app.post('/api/user/points', async (req, res) => {
  const user = await User.findOne({ userid: 'demo' });
  user.points = req.body.points;
  await user.save();
  res.json({ success: true });
});

app.post('/api/profile', upload.single('photo'), async (req, res) => {
  const user = await User.findOne({ userid: 'demo' });
  user.username = req.body.username;
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.email = req.body.email;
  user.phone = req.body.phone;
  if (req.body.password) user.password = req.body.password;
  if (req.file) user.photo = req.file.filename;
  await user.save();
  res.json({ success: true });
});

app.get('/api/songs/search', async (req, res) => {
  const songs = await Song.find({ name: new RegExp(req.query.q, 'i') });
  res.json(songs);
});

app.post('/api/history', async (req, res) => {
  const history = new History({
    userId: 'demo',
    songId: req.body.songId
  });
  await history.save();
  res.json({ success: true });
});

app.listen(3000, () => console.log('Server running on port 3000'));