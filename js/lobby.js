/**
 * lobby.js — logic halaman lobby room
 */
import {
  getSessionInfo,
  listenRoom,
  listenPreviews,
  publishPreview,
  setTemplate,
  startSession,
  leaveRoom,
  MAX_PARTICIPANTS,
} from './room.js';

const { participantId, roomCode, isHost } = getSessionInfo();

if (!roomCode) {
  window.location.href = 'index.html';
}

const roomCodeStamp = document.getElementById('roomCodeStamp');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const videoEl = document.getElementById('videoEl');
const participantGrid = document.getElementById('participantGrid');
const participantTitle = document.getElementById('participantTitle');
const templateGrid = document.getElementById('templateGrid');
const templateHint = document.getElementById('templateHint');
const startBtn = document.getElementById('startBtn');
const waitingText = document.getElementById('waitingText');
const statusText = document.getElementById('statusText');
const leaveBtn = document.getElementById('leaveBtn');

roomCodeStamp.textContent = roomCode;
let latestRoomData = null;
let previewsById = {};
let cameraStream = null;
let hasRedirected = false;

// --- Kamera tersembunyi, dipakai untuk kirim snapshot preview berkala ---
startCamera(videoEl)
  .then((stream) => {
    cameraStream = stream;
    setInterval(async () => {
      const shot = await downscaleDataUrl(captureFrame(videoEl, 0.7));
      publishPreview(roomCode, participantId, shot).catch(() => {});
    }, 2000);
  })
  .catch(() => {
    statusText.textContent = 'Kamera tidak bisa diakses — teman lain tetap bisa lihat kamu lewat inisial nama.';
  });

function renderParticipants() {
  if (!latestRoomData) return;
  const participants = latestRoomData.participants || {};
  participantTitle.textContent = `Yang sudah gabung (${Object.keys(participants).length}/${MAX_PARTICIPANTS})`;
  participantGrid.innerHTML = '';
  Object.entries(participants).forEach(([pid, p]) => {
    const wrap = document.createElement('div');
    wrap.className = 'participant';
    const thumb = document.createElement('div');
    thumb.className = 'participant__thumb' + (p.isHost ? ' is-host' : '');
    const preview = previewsById[pid];
    if (preview && preview.dataUrl) {
      const img = document.createElement('img');
      img.src = preview.dataUrl;
      thumb.appendChild(img);
    } else {
      thumb.classList.add('participant__thumb--empty');
      thumb.textContent = (p.name || '?').charAt(0).toUpperCase();
    }
    const name = document.createElement('span');
    name.className = 'participant__name';
    name.textContent = p.name + (pid === participantId ? ' (kamu)' : '');
    wrap.appendChild(thumb);
    wrap.appendChild(name);
    participantGrid.appendChild(wrap);
  });
}

function renderTemplates() {
  if (!latestRoomData) return;
  templateGrid.innerHTML = '';
  TEMPLATES.forEach((tpl) => {
    const card = document.createElement('button');
    card.type = 'button';
    const selected = tpl.id === latestRoomData.templateId;
    card.className =
      'template-card' + (selected ? ' is-selected' : '') + (!isHost ? ' is-locked' : '');
    card.innerHTML = `
      <div class="template-card__swatch">${tpl.swatch
        .map((c) => `<span style="background:${c}"></span>`)
        .join('')}</div>
      <span class="template-card__name">${tpl.name}</span>
    `;
    if (isHost) {
      card.addEventListener('click', () => setTemplate(roomCode, tpl.id));
    }
    templateGrid.appendChild(card);
  });
  templateHint.textContent = isHost
    ? 'Kamu host — pilih gaya strip buat semua peserta.'
    : 'Host yang menentukan gaya strip.';
}

function renderControls() {
  if (isHost) {
    startBtn.classList.remove('is-hidden');
    waitingText.classList.add('is-hidden');
  } else {
    startBtn.classList.add('is-hidden');
    waitingText.classList.remove('is-hidden');
  }
}

renderControls();

listenRoom(roomCode, (data) => {
  if (!data) {
    statusText.textContent = 'Room ini sudah tidak ada.';
    return;
  }
  latestRoomData = data;
  renderParticipants();
  renderTemplates();

  if (data.status !== 'lobby' && !hasRedirected) {
    hasRedirected = true;
    window.location.href = 'session.html';
  }
});

listenPreviews(roomCode, (previews) => {
  previewsById = previews;
  renderParticipants();
});

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  try {
    await startSession(roomCode);
  } catch (err) {
    console.error(err);
    statusText.textContent = 'Gagal memulai sesi. Coba lagi.';
    startBtn.disabled = false;
  }
});

copyLinkBtn.addEventListener('click', async () => {
  const url = `${window.location.origin}${window.location.pathname.replace(
    'lobby.html',
    'index.html'
  )}?room=${roomCode}`;
  try {
    await navigator.clipboard.writeText(url);
    copyLinkBtn.textContent = 'Tersalin! ✓';
    setTimeout(() => (copyLinkBtn.textContent = 'Salin link undangan'), 1800);
  } catch {
    statusText.textContent = `Link: ${url}`;
  }
});

leaveBtn.addEventListener('click', async () => {
  stopCamera(cameraStream);
  try {
    await leaveRoom(roomCode, participantId);
  } catch (err) {
    console.error(err);
  }
  window.location.href = 'index.html';
});
