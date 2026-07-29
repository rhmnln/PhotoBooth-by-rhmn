/**
 * session.js — sesi capture bersama, disinkronkan lewat Firestore.
 * Setiap client menghitung mundur ke satu titik waktu absolut yang sama
 * (countdownStartAt dari server + 3 detik), lalu ambil foto dari kameranya
 * sendiri persis di titik itu. Hasilnya dikirim ke Firestore per ronde.
 */
import {
  TOTAL_ROUNDS,
  getSessionInfo,
  listenRoom,
  listenPreviews,
  publishPreview,
  publishCapture,
  listenCaptures,
  advanceRound,
} from './room.js';

const { participantId, roomCode, isHost } = getSessionInfo();
if (!roomCode) window.location.href = 'index.html';

const videoEl = document.getElementById('videoEl');
const countdownOverlay = document.getElementById('countdownOverlay');
const flashOverlay = document.getElementById('flashOverlay');
const progressDots = document.getElementById('progressDots');
const othersStrip = document.getElementById('othersStrip');
const statusText = document.getElementById('statusText');
const skipBtn = document.getElementById('skipBtn');
const roundLabel = document.getElementById('roundLabel');
const templateLabel = document.getElementById('templateLabel');

let latestRoomData = null;
let previewsById = {};
let capturesById = {};
let processedKey = null;
let advancedForRound = 0;

startCamera(videoEl)
  .then((stream) => {
    setInterval(async () => {
      const shot = await downscaleDataUrl(captureFrame(videoEl, 0.7));
      publishPreview(roomCode, participantId, shot).catch(() => {});
    }, 2000);
  })
  .catch(() => {
    statusText.textContent = 'Kamera tidak bisa diakses. Refresh halaman & izinkan akses kamera.';
    statusText.classList.add('is-error');
  });

function runSyncedCountdown(el, targetMillis) {
  return new Promise((resolve) => {
    el.classList.remove('is-hidden');
    function tick() {
      const remain = targetMillis - Date.now();
      if (remain <= 0) {
        el.classList.add('is-hidden');
        resolve();
        return;
      }
      el.textContent = Math.max(1, Math.ceil(remain / 1000));
      requestAnimationFrame(tick);
    }
    tick();
  });
}

function renderProgressDots(round) {
  progressDots.innerHTML = '';
  for (let i = 1; i <= TOTAL_ROUNDS; i++) {
    const dot = document.createElement('span');
    if (i < round) dot.classList.add('is-done');
    else if (i === round) dot.classList.add('is-active');
    progressDots.appendChild(dot);
  }
}

function renderOthersStrip() {
  if (!latestRoomData) return;
  const round = latestRoomData.currentRound || 1;
  const participants = latestRoomData.participants || {};
  othersStrip.innerHTML = '';
  Object.entries(participants).forEach(([pid, p]) => {
    if (pid === participantId) return;
    const captured = !!capturesById[`${pid}_${round}`];
    const item = document.createElement('div');
    item.className = 'others-strip__item' + (captured ? ' has-captured' : '');
    const preview = previewsById[pid];
    if (preview && preview.dataUrl) {
      const img = document.createElement('img');
      img.src = preview.dataUrl;
      item.appendChild(img);
    }
    const label = document.createElement('span');
    label.className = 'others-strip__label';
    label.textContent = captured ? `${p.name} ✓` : p.name;
    item.appendChild(label);
    othersStrip.appendChild(item);
  });
}

async function handleRound(round, startMillis) {
  renderProgressDots(round);
  roundLabel.textContent = `Foto ${round}/${TOTAL_ROUNDS}`;
  skipBtn.classList.add('is-hidden');
  statusText.textContent = 'Bersiap...';
  statusText.classList.remove('is-error');

  const targetMillis = startMillis + 5000;
  await runSyncedCountdown(countdownOverlay, targetMillis);

  flashOverlay.classList.remove('is-flashing');
  void flashOverlay.offsetWidth;
  flashOverlay.classList.add('is-flashing');

  const dataUrl = captureFrame(videoEl, 0.9);
  statusText.textContent = 'Menunggu peserta lain selesai...';

  try {
    await publishCapture(roomCode, participantId, round, dataUrl);
  } catch (err) {
    console.error(err);
    statusText.textContent = 'Gagal mengirim fotomu. Coba refresh kalau macet.';
    statusText.classList.add('is-error');
  }

  if (isHost) {
    setTimeout(() => {
      if (advancedForRound < round) skipBtn.classList.remove('is-hidden');
    }, 4500);
  }
}

function checkAutoAdvance() {
  if (!isHost || !latestRoomData || latestRoomData.status !== 'countdown') return;
  const round = latestRoomData.currentRound;
  if (advancedForRound >= round) return;

  const participantIds = Object.keys(latestRoomData.participants || {});
  const capturedCount = participantIds.filter((pid) => capturesById[`${pid}_${round}`]).length;

  if (participantIds.length > 0 && capturedCount >= participantIds.length) {
    advancedForRound = round;
    setTimeout(() => {
      advanceRound(roomCode, round + 1).catch(console.error);
    }, 900);
  }
}

listenRoom(roomCode, (data) => {
  if (!data) {
    statusText.textContent = 'Room ini sudah tidak ada.';
    return;
  }
  latestRoomData = data;
  templateLabel.textContent = getTemplateById(data.templateId).name;
  renderOthersStrip();

  if (data.status === 'lobby') {
    window.location.href = 'lobby.html';
    return;
  }
  if (data.status === 'done') {
    window.location.href = 'result.html';
    return;
  }
  if (data.status === 'countdown' && data.countdownStartAt) {
    const key = `${data.currentRound}-${data.countdownStartAt.toMillis()}`;
    if (key !== processedKey) {
      processedKey = key;
      handleRound(data.currentRound, data.countdownStartAt.toMillis());
    }
  }

  checkAutoAdvance();
});

listenPreviews(roomCode, (previews) => {
  previewsById = previews;
  renderOthersStrip();
});

listenCaptures(roomCode, (captures) => {
  capturesById = captures;
  renderOthersStrip();
  checkAutoAdvance();
});

skipBtn.addEventListener('click', () => {
  if (!latestRoomData) return;
  advancedForRound = latestRoomData.currentRound;
  advanceRound(roomCode, latestRoomData.currentRound + 1).catch(console.error);
  skipBtn.classList.add('is-hidden');
});
