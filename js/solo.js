/**
 * solo.js — alur lengkap mode solo (tanpa Firebase, 1 perangkat)
 */

const screenTemplate = document.getElementById('screenTemplate');
const screenCapture = document.getElementById('screenCapture');
const screenResult = document.getElementById('screenResult');

const templateGrid = document.getElementById('templateGrid');
const toCaptureBtn = document.getElementById('toCaptureBtn');
const videoEl = document.getElementById('videoEl');
const countdownOverlay = document.getElementById('countdownOverlay');
const flashOverlay = document.getElementById('flashOverlay');
const progressDots = document.getElementById('progressDots');
const captureStatus = document.getElementById('captureStatus');
const startCaptureBtn = document.getElementById('startCaptureBtn');
const resultWrap = document.getElementById('resultWrap');
const downloadBtn = document.getElementById('downloadBtn');
const printBtn = document.getElementById('printBtn');
const retryBtn = document.getElementById('retryBtn');
const printArea = document.getElementById('printArea');

let selectedTemplateId = TEMPLATES[0].id;
let cameraStream = null;
let capturedPhotos = [];
let finalCanvas = null;

function showScreen(el) {
  [screenTemplate, screenCapture, screenResult].forEach((s) => s.classList.add('is-hidden'));
  el.classList.remove('is-hidden');
}

function renderTemplateGrid() {
  templateGrid.innerHTML = '';
  TEMPLATES.forEach((tpl) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'template-card' + (tpl.id === selectedTemplateId ? ' is-selected' : '');
    card.innerHTML = `
      <div class="template-card__swatch">
        ${tpl.swatch.map((c) => `<span style="background:${c}"></span>`).join('')}
      </div>
      <span class="template-card__name">${tpl.name}</span>
      <span class="template-card__tagline">${tpl.tagline}</span>
    `;
    card.addEventListener('click', () => {
      selectedTemplateId = tpl.id;
      renderTemplateGrid();
    });
    templateGrid.appendChild(card);
  });
}

function renderProgressDots(activeIndex, doneCount) {
  progressDots.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement('span');
    if (i < doneCount) dot.classList.add('is-done');
    else if (i === activeIndex) dot.classList.add('is-active');
    progressDots.appendChild(dot);
  }
}

renderTemplateGrid();
renderProgressDots(-1, 0);

toCaptureBtn.addEventListener('click', async () => {
  showScreen(screenCapture);
  captureStatus.textContent = 'Meminta izin kamera...';
  try {
    cameraStream = await startCamera(videoEl);
    captureStatus.textContent = 'Kamera siap. Klik tombol di bawah kalau sudah pas posenya.';
  } catch (err) {
    console.error(err);
    captureStatus.textContent =
      'Gak bisa akses kamera. Pastikan izin kamera diaktifkan lalu refresh halaman.';
    captureStatus.classList.add('is-error');
  }
});

startCaptureBtn.addEventListener('click', async () => {
  startCaptureBtn.disabled = true;
  capturedPhotos = [];

  for (let round = 0; round < 4; round++) {
    renderProgressDots(round, round);
    captureStatus.textContent = `Foto ke-${round + 1} dari 4...`;
    await runCountdown(countdownOverlay, 3);

    flashOverlay.classList.remove('is-flashing');
    void flashOverlay.offsetWidth; // restart animasi
    flashOverlay.classList.add('is-flashing');

    const dataUrl = captureFrame(videoEl, 0.9);
    capturedPhotos.push(dataUrl);
    renderProgressDots(round, round + 1);

    await new Promise((r) => setTimeout(r, 500)); // jeda singkat antar jepretan
  }

  captureStatus.textContent = 'Selesai! Menyusun strip...';
  stopCamera(cameraStream);
  await buildResult();
  startCaptureBtn.disabled = false;
});

async function buildResult() {
  showScreen(screenResult);
  resultWrap.innerHTML = '<div class="spinner"></div>';

  const template = getTemplateById(selectedTemplateId);
  const dateLabel = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  finalCanvas = await composeStrip(capturedPhotos, template, {
    roomCode: null,
    dateLabel,
  });

  resultWrap.innerHTML = '';
  resultWrap.appendChild(finalCanvas);
}

downloadBtn.addEventListener('click', () => {
  if (!finalCanvas) return;
  const link = document.createElement('a');
  link.download = `photobox-${Date.now()}.png`;
  link.href = finalCanvas.toDataURL('image/png');
  link.click();
});

printBtn.addEventListener('click', () => {
  if (!finalCanvas) return;
  printArea.innerHTML = `<img src="${finalCanvas.toDataURL('image/png')}" alt="Hasil strip PhotoBox" />`;
  window.print();
});

retryBtn.addEventListener('click', () => {
  capturedPhotos = [];
  finalCanvas = null;
  renderProgressDots(-1, 0);
  showScreen(screenTemplate);
});
