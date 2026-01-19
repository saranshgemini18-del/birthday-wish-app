import './style.css'
import confetti from 'canvas-confetti';
import { api } from './api';
import { Carousel } from './carousel';

// Configuration
const CONFIG = {
  balloonColors: ['#3b82f6', '#1e40af', '#60a5fa', '#93c5fd', '#bfdbfe'],
  popSound: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Pop sound effect
};

// UI Elements
const unlockBtn = document.getElementById('unlock-btn');
const introScreen = document.getElementById('intro');
const celebrationScreen = document.getElementById('celebration');
const mainCard = document.querySelector('.main-card');
const candles = document.querySelectorAll('.candle');
const hugBtn = document.getElementById('hug-btn');
const hi5Btn = document.getElementById('hi5-btn');
const timelineItems = document.querySelectorAll('.timeline-item');
const giftBox = document.getElementById('gift-box');
const giftContent = document.getElementById('gift-content');
const voiceAudio = document.getElementById('voice-note-audio');
const playVoiceBtn = document.getElementById('play-voice-btn');
const audioBar = document.getElementById('audio-bar');
const musicToggle = document.getElementById('music-toggle');
const bgMusic = document.getElementById('bg-music');
const scoreValue = document.getElementById('score-value');
const wishInput = document.getElementById('wish-input');
const addWishBtn = document.getElementById('add-wish-btn');
const wishBoard = document.getElementById('wish-board');
const wishLoader = document.getElementById('wish-loader');
const polaroids = document.querySelectorAll('.polaroid');
const jarOfJoy = document.getElementById('jar-of-joy');
const jarLabelsContainer = document.getElementById('jar-labels-container');
const scratchCanvas = document.getElementById('scratch-canvas');
const scratchContainer = document.querySelector('.scratch-container');
const secretBtn = document.getElementById('secret-btn');
const secretScreen = document.getElementById('secret-screen');
const backToCelebrationBtn = document.getElementById('back-to-celebration');

// Day Calculation Constants
const START_DATE = new Date('2025-06-30'); // Provided by user
const daysNumberElement = document.querySelector('.days-number');
const currentDayTag = document.getElementById('current-day-tag');

// State
let audioCtx;
let analyser;
let micStream;
let isMicActive = false;
let lastBlowTime = 0;
const BLOW_COOLDOWN = 1000; // 1 second between blows
let score = 0;
let isMusicPlaying = false;
let isScratching = false;
const COMPLIMENTS = [
  "You're a legend! 🏆",
  "Best gaming partner ever! 🔥",
  "Your laugh is contagious! 😂",
  "Always there when I need you! 🤝",
  "One in a billion! ✨",
  "The ultimate bestie! 💖",
  "Infinite IQ plays! 🧠",
  "Pure sunshine! ☀️",
  "Coolest person I know! 😎",
  "Always carrying the vibes! 👑"
];

// Initialize
function init() {
  unlockBtn.addEventListener('click', () => {
    startCelebration();
    setupMicrophone(); // Request mic on first interaction
  });

  // Interaction Buttons
  hugBtn.addEventListener('click', () => {
    triggerInteraction('🤗', 'animate-hug');
    fireConfetti('hug');
  });

  hi5Btn.addEventListener('click', () => {
    triggerInteraction('✋', 'animate-hi5');
    fireConfetti('hi5');
  });

  // Gift Box Logic
  giftBox.addEventListener('click', () => {
    if (!giftBox.classList.contains('open')) {
      giftBox.classList.add('open');
      setTimeout(() => {
        giftContent.classList.remove('hidden');
        fireConfetti('gift');
      }, 600);
    }
  });

  // Candle blowing logic (Click support)
  candles.forEach(candle => {
    candle.addEventListener('click', () => {
      blowCandle(candle);
    });
  });

  setup3DTilt();
  setupTimelineObserver();
  startBalloonGenerator();
  setupVoiceNotePlayer();
  updateTimelineDays();
  setupInteractivityListeners();
  initSecretGallery();
}

function setupInteractivityListeners() {
  // Music Toggle
  if (musicToggle && bgMusic) {
    musicToggle.addEventListener('click', () => {
      toggleMusic();
    });
  }

  // Wish Wall
  if (addWishBtn && wishInput) {
    addWishBtn.addEventListener('click', () => {
      addWish();
    });
    wishInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addWish();
    });
  }

  // Polaroid Flip
  polaroids.forEach(p => {
    p.addEventListener('click', () => {
      p.classList.toggle('flipped');
    });
  });

  // Load existing wishes from MySQL
  loadWishesFromApi();

  // Jar of Joy
  if (jarOfJoy) {
    jarOfJoy.addEventListener('click', () => {
      spawnJoyLabel();
    });
  }

  // Scratch Card
  if (scratchCanvas) {
    initScratchCard();
  }
}

function spawnJoyLabel() {
  const text = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
  const label = document.createElement('div');
  label.className = 'joy-label';
  label.textContent = text;

  // Random position near jar
  const startX = 60 + (Math.random() * 40 - 20);
  const startY = 80;

  label.style.left = `${startX}px`;
  label.style.top = `${startY}px`;
  jarOfJoy.appendChild(label);

  // Animation
  const destX = (Math.random() * 200 - 100);
  const destY = -150 - (Math.random() * 100);
  const rotate = (Math.random() * 40 - 20);

  label.animate([
    { transform: 'translate(0, 0) scale(0.5) rotate(0deg)', opacity: 0 },
    { transform: `translate(${destX}px, ${destY}px) scale(1) rotate(${rotate}deg)`, opacity: 1, offset: 0.2 },
    { transform: `translate(${destX}px, ${destY * 1.5}px) scale(1.1) rotate(${rotate * 1.5}deg)`, opacity: 0 }
  ], {
    duration: 2000,
    easing: 'ease-out',
    fill: 'forwards'
  }).onfinish = () => label.remove();
}

function initScratchCard() {
  const ctx = scratchCanvas.getContext('2d');
  const width = scratchCanvas.width;
  const height = scratchCanvas.height;

  // Fill with silver
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(0, 0, width, height);

  // Add some texture/shimmer
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  const scratch = (e) => {
    if (!isScratching) return;

    const rect = scratchCanvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    checkScratchCompletion();
  };

  scratchCanvas.addEventListener('mousedown', () => isScratching = true);
  scratchCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isScratching = true;
  }, { passive: false });

  window.addEventListener('mouseup', () => isScratching = false);
  window.addEventListener('touchend', () => isScratching = false);

  scratchCanvas.addEventListener('mousemove', scratch);
  scratchCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    scratch(e);
  }, { passive: false });
}

function checkScratchCompletion() {
  const ctx = scratchCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height);
  const pixels = imageData.data;
  let cleared = 0;

  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] === 0) cleared++;
  }

  const percentage = (cleared / (pixels.length / 4)) * 100;

  if (percentage > 70) {
    scratchCanvas.style.transition = 'opacity 1s ease';
    scratchCanvas.style.opacity = '0';
    setTimeout(() => {
      scratchCanvas.remove();
      fireConfetti('gift');
    }, 1000);
  }
}

async function addWish() {
  const text = wishInput.value.trim();
  if (text) {
    const data = await api.addWish(text);

    if (data) {
      createWishNote(data.id, text);
    } else {
      console.error("Error saving wish to MySQL");
    }

    wishInput.value = '';
    fireConfetti('wish');
  }
}

async function loadWishesFromApi() {
  if (wishLoader) wishLoader.classList.remove('hidden');

  const wishes = await api.getWishes();

  if (wishLoader) wishLoader.classList.add('hidden');

  if (wishes) {
    wishBoard.innerHTML = '';
    wishes.forEach(w => createWishNote(w.id, w.content));
  }
}

function createWishNote(id, text) {
  // Prevent duplicate visual notes
  const existingNotes = Array.from(wishBoard.querySelectorAll('.sticky-note'));
  if (existingNotes.find(n => n.dataset.id == id)) return;

  const note = document.createElement('div');
  note.className = 'sticky-note';
  note.dataset.id = id;

  const content = document.createElement('span');
  content.textContent = text;
  note.appendChild(content);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-wish-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.title = 'Delete Wish';
  deleteBtn.onclick = async (e) => {
    e.stopPropagation();
    if (confirm('Delete this wish?')) {
      const success = await api.deleteWish(id);
      if (success) {
        note.style.transform = 'scale(0) rotate(10deg)';
        note.style.opacity = '0';
        setTimeout(() => note.remove(), 300);
      }
    }
  };
  note.appendChild(deleteBtn);

  const rot = (Math.random() * 6 - 3).toFixed(1);
  note.style.setProperty('--r', `${rot}deg`);

  wishBoard.appendChild(note);
}

function toggleMusic() {
  if (isMusicPlaying) {
    bgMusic.pause();
    musicToggle.classList.add('muted');
    musicToggle.querySelector('.icon').textContent = '🔇';
  } else {
    bgMusic.play().catch(e => console.log("Audio play blocked", e));
    musicToggle.classList.remove('muted');
    musicToggle.querySelector('.icon').textContent = '🎵';
  }
  isMusicPlaying = !isMusicPlaying;
}

function loadWishes() {
  // Deprecated in favor of loadWishesFromSupabase
}

function updateTimelineDays() {
  const today = new Date();
  const diffTime = Math.abs(today - START_DATE);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysNumberElement) {
    // Animate the number counting up
    let current = 0;
    const duration = 2000; // 2 seconds
    const stepTime = Math.abs(Math.floor(duration / diffDays));

    const timer = setInterval(() => {
      current += 1;
      daysNumberElement.textContent = current;
      if (current >= diffDays) {
        clearInterval(timer);
      }
    }, stepTime);
  }

  if (currentDayTag) {
    currentDayTag.textContent = `Day ${diffDays}`;
  }
}

function setupVoiceNotePlayer() {
  if (!playVoiceBtn || !voiceAudio) return;

  playVoiceBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Don't trigger gift box clicks
    if (voiceAudio.paused) {
      voiceAudio.play();
      playVoiceBtn.innerHTML = '<span class="icon">⏸️</span>';
    } else {
      voiceAudio.pause();
      playVoiceBtn.innerHTML = '<span class="icon">▶️</span>';
    }
  });

  voiceAudio.addEventListener('timeupdate', () => {
    const progress = (voiceAudio.currentTime / voiceAudio.duration) * 100;
    audioBar.style.width = `${progress}%`;
  });

  voiceAudio.addEventListener('ended', () => {
    playVoiceBtn.innerHTML = '<span class="icon">▶️</span>';
    audioBar.style.width = '0%';
  });
}

// Microphone System for Blowing
async function setupMicrophone() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(micStream);
    source.connect(analyser);
    analyser.fftSize = 256;

    isMicActive = true;
    monitorVolume();
  } catch (err) {
    console.log("Mic access denied or not available", err);
  }
}

function monitorVolume() {
  if (!isMicActive) return;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const checkVolume = () => {
    analyser.getByteFrequencyData(dataArray);
    let values = 0;
    for (let i = 0; i < bufferLength; i++) {
      values += dataArray[i];
    }
    const average = values / bufferLength;

    // Threshold for "blowing" - adjust if too sensitive or not sensitive enough
    if (average > 80 && Date.now() - lastBlowTime > BLOW_COOLDOWN) {
      extinguishNextCandle();
      lastBlowTime = Date.now();
    }

    requestAnimationFrame(checkVolume);
  };

  checkVolume();
}

function extinguishNextCandle() {
  const unblownCandle = Array.from(candles).find(c => !c.classList.contains('blown'));
  if (unblownCandle) {
    blowCandle(unblownCandle);
  }
}

function blowCandle(candle) {
  if (!candle.classList.contains('blown')) {
    candle.classList.add('blown');
    // Add smoke effect or sound here if desired
    checkAllCandlesBlown();
  }
}

// Confetti System
function fireConfetti(type) {
  if (type === 'start') {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00d2ff', '#3a7bd5', '#ffffff']
    });
  } else if (type === 'all-blown') {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  } else if (type === 'wish') {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#00d2ff', '#ffffff', '#ffeb3b']
    });
  } else {
    confetti({
      particleCount: 40,
      scalar: 1.2,
      spread: 100,
      origin: { y: 0.8 },
      colors: ['#00d2ff', '#3a7bd5']
    });
  }
}

// Balloon System
function startBalloonGenerator() {
  setInterval(() => {
    if (celebrationScreen.classList.contains('active')) {
      createBalloon();
      // Occasionally spawn a jasmine flower (30% chance)
      if (Math.random() < 0.3) {
        createFloatingJasmine();
      }
    }
  }, 3000); // New balloon every 3 seconds
}

function createFloatingJasmine() {
  const container = document.querySelector('.decorations');
  const jasmine = document.createElement('div');
  jasmine.className = 'floating-jasmine';

  const left = Math.random() * 90;
  const size = 50 + Math.random() * 30;
  const duration = 12 + Math.random() * 8;
  const rotation = Math.random() * 360;

  jasmine.innerHTML = `🌼`;
  jasmine.style.fontSize = `${size}px`;
  jasmine.style.left = `${left}%`;
  jasmine.style.width = `${size}px`;
  jasmine.style.height = `${size}px`;
  jasmine.style.position = 'fixed';
  jasmine.style.bottom = '-100px';
  jasmine.style.zIndex = '5';
  jasmine.style.pointerEvents = 'none';
  jasmine.style.animation = `floatUp ${duration}s linear forwards, rotateFlower ${duration}s linear infinite`;

  container.appendChild(jasmine);

  setTimeout(() => {
    if (jasmine.parentNode) jasmine.remove();
  }, duration * 1000);
}

function createBalloon() {
  const container = document.querySelector('.decorations');
  const balloon = document.createElement('div');
  balloon.className = 'floating-balloon';

  const color = CONFIG.balloonColors[Math.floor(Math.random() * CONFIG.balloonColors.length)];
  const left = Math.random() * 90; // Random horizontal position
  const size = 60 + Math.random() * 40;
  const duration = 10 + Math.random() * 10; // 10-20s to float up

  balloon.style.left = `${left}%`;
  balloon.style.width = `${size}px`;
  balloon.style.height = `${size * 1.2}px`;
  balloon.style.backgroundColor = color;
  balloon.style.boxShadow = `inset -10px -10px 20px rgba(0,0,0,0.1), 0 10px 20px -5px ${color}88`;
  balloon.style.animation = `floatUp ${duration}s linear forwards`;

  // Balloon String
  const string = document.createElement('div');
  string.className = 'balloon-string';
  balloon.appendChild(string);

  // Pop interaction
  balloon.addEventListener('pointerdown', (e) => {
    e.preventDefault(); // Prevent ghost clicks
    popBalloon(balloon);
  });

  container.appendChild(balloon);

  // Remove from DOM when animation ends
  setTimeout(() => {
    if (balloon.parentNode) balloon.remove();
  }, duration * 1000);
}

function popBalloon(balloon) {
  // Visual pop
  balloon.style.transform = 'scale(1.5)';
  balloon.style.opacity = '0';
  balloon.style.pointerEvents = 'none';

  // Update Score
  score++;
  if (scoreValue) scoreValue.textContent = score;

  // Sound
  const audio = new Audio(CONFIG.popSound);
  audio.volume = 0.3;
  audio.play().catch(e => { }); // Ignore autoplay blocks

  // Confetti mini-burst at pop location
  const rect = balloon.getBoundingClientRect();
  confetti({
    particleCount: 15,
    origin: {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight
    },
    colors: [balloon.style.backgroundColor, '#ffffff']
  });

  setTimeout(() => balloon.remove(), 200);
}

// Utilities
function triggerInteraction(emoji, animationClass) {
  const overlay = document.createElement('div');
  overlay.className = `overlay-effect ${animationClass}`;
  overlay.innerHTML = emoji;
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.remove();
  }, 1500);
}

function checkAllCandlesBlown() {
  const allBlown = Array.from(candles).every(c => c.classList.contains('blown'));
  if (allBlown) {
    const wishText = document.querySelector('.wish-text');
    wishText.innerHTML = "✨ Make a wish! Your friendship is the best gift ever! ✨";
    wishText.style.color = "var(--primary)";
    fireConfetti('all-blown');
  }
}

function startCelebration() {
  introScreen.classList.remove('active');
  celebrationScreen.classList.add('active');

  fireConfetti('start');

  // Start background music automatically if allowed
  setTimeout(() => {
    if (!isMusicPlaying) toggleMusic();
  }, 1000);
}

function setup3DTilt() {
  const handleTilt = (x, y) => {
    if (!celebrationScreen.classList.contains('active')) return;
    const { innerWidth, innerHeight } = window;
    const rotateY = ((x / innerWidth) - 0.5) * 20;
    const rotateX = ((y / innerHeight) - 0.5) * -20;
    if (mainCard) {
      mainCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  };

  document.addEventListener('mousemove', (e) => handleTilt(e.clientX, e.clientY));
  document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    handleTilt(touch.clientX, touch.clientY);
  }, { passive: true });
}

function setupTimelineObserver() {
  const observerOptions = { threshold: 0.2 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);
  timelineItems.forEach(item => observer.observe(item));
}

function initSecretGallery() {
  if (!secretBtn) return;

  const secretCardsData = [
    {
      image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=320&h=450&auto=format&fit=crop',
      title: 'A Little Thought...',
      text: 'Sometimes I find myself smiling just thinking about our chats. You have that effect on people! ✨'
    },
    {
      image: 'https://images.unsplash.com/photo-1516589174184-c68d8eac3ccb?q=80&w=320&h=450&auto=format&fit=crop',
      title: 'The Best Vibes',
      text: 'There’s something about your energy that just makes every gaming night better. 🎮'
    },
    {
      image: 'https://images.unsplash.com/photo-1494972308805-463bc619d34e?q=80&w=320&h=450&auto=format&fit=crop',
      title: 'Pure Appreciation',
      text: 'Just wanted to say you’re truly one of a kind. Glad we met! 🤝'
    },
    {
      image: 'https://images.unsplash.com/photo-1518621736915-f3b1de3d646a?q=80&w=320&h=450&auto=format&fit=crop',
      title: 'Stay Awesome',
      text: 'Keep being you, because "you" is pretty much my favorite version of a bestie. 💅'
    }
  ];

  const carousel = new Carousel('secret-carousel', secretCardsData);

  secretBtn.addEventListener('click', () => {
    celebrationScreen.classList.remove('active');
    secretScreen.classList.add('active');
    fireConfetti('wish');
  });

  backToCelebrationBtn.addEventListener('click', () => {
    secretScreen.classList.remove('active');
    celebrationScreen.classList.add('active');
  });
}

init();
