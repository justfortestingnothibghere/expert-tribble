// Music Player
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPause');
const seekBar = document.getElementById('seekBar');
const volumeControl = document.getElementById('volumeControl');
const currentSong = document.getElementById('currentSong');
const currentTime = document.getElementById('currentTime');
const songList = document.getElementById('songList');
const downloadBtn = document.getElementById('downloadBtn');

let isPlaying = false;

// Fetch songs from backend
async function fetchSongs() {
  const response = await fetch('/api/songs');
  const songs = await response.json();
  songList.innerHTML = '';
  songs.forEach(song => {
    const li = document.createElement('li');
    li.className = 'bg-gray-700 p-2 rounded cursor-pointer hover:bg-gray-600';
    li.textContent = song.name;
    li.onclick = () => playSong(song);
    songList.appendChild(li);
  });
}

// Play a song
async function playSong(song) {
  const user = await fetch('/api/user').then(res => res.json());
  if (!user.isPremium && user.points <= 0) {
    alert('No points left! Upgrade to premium or wait for daily points.');
    return;
  }
  audioPlayer.src = `/uploads/${song.filename}`;
  currentSong.textContent = song.name;
  audioPlayer.play();
  isPlaying = true;
  playPauseBtn.textContent = 'Pause';
  downloadBtn.disabled = !user.isPremium;
  if (!user.isPremium) {
    user.points--;
    updatePoints(user.points);
    fetch('/api/user/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: user.points })
    });
  }
  // Log to history
  fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songId: song._id })
  });
}

// Music Player Controls
playPauseBtn.onclick = () => {
  if (isPlaying) {
    audioPlayer.pause();
    playPauseBtn.textContent = 'Play';
  } else {
    audioPlayer.play();
    playPauseBtn.textContent = 'Pause';
  }
  isPlaying = !isPlaying;
};

audioPlayer.ontimeupdate = () => {
  const current = audioPlayer.currentTime;
  const duration = audioPlayer.duration;
  seekBar.value = (current / duration) * 100;
  currentTime.textContent = formatTime(current);
};

seekBar.oninput = () => {
  audioPlayer.currentTime = (seekBar.value / 100) * audioPlayer.duration;
};

volumeControl.oninput = () => {
  audioPlayer.volume = volumeControl.value;
};

downloadBtn.onclick = () => {
  if (audioPlayer.src) {
    const a = document.createElement('a');
    a.href = audioPlayer.src;
    a.download = currentSong.textContent;
    a.click();
  }
};

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Admin Song Upload
const uploadSongForm = document.getElementById('uploadSongForm');
if (uploadSongForm) {
  uploadSongForm.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('song', document.getElementById('songFile').files[0]);
    formData.append('name', document.getElementById('songName').value);
    await fetch('/api/songs', {
      method: 'POST',
      body: formData
    });
    alert('Song uploaded!');
    fetchSongs();
  };
}

// Profile Management
const profileForm = document.getElementById('profileForm');
if (profileForm) {
  profileForm.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('photo', document.getElementById('profilePhotoInput').files[0]);
    formData.append('username', document.getElementById('username').value);
    formData.append('firstName', document.getElementById('firstName').value);
    formData.append('lastName', document.getElementById('lastName').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('phone', document.getElementById('phone').value);
    formData.append('password', document.getElementById('password').value);
    await fetch('/api/profile', {
      method: 'POST',
      body: formData
    });
    alert('Profile updated!');
  };
}

// Search Functionality
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
if (searchInput) {
  searchInput.oninput = async () => {
    const query = searchInput.value;
    const response = await fetch(`/api/songs/search?q=${query}`);
    const songs = await response.json();
    searchResults.innerHTML = '';
    songs.forEach(song => {
      const li = document.createElement('li');
      li.className = 'bg-gray-700 p-2 rounded cursor-pointer hover:bg-gray-600';
      li.textContent = song.name;
      li.onclick = () => playSong(song);
      searchResults.appendChild(li);
    });
  };
}

// Fetch User Points
async function updatePoints(points) {
  const userPoints = document.getElementById('userPoints');
  if (userPoints) userPoints.textContent = points;
}

// Initialize
fetchSongs();
