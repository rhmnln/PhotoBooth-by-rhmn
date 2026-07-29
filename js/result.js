/**
 * result.js — susun strip akhir dari foto semua peserta, lalu unduh/cetak
 */
import { TOTAL_ROUNDS, getSessionInfo, listenRoom, listenCaptures } from './room.js';

const { roomCode } = getSessionInfo();
if (!roomCode) window.location.href = 'index.html';

const resultWrap = document.getElementById('resultWrap');
const participantSummary = document.getElementById('participantSummary');
const downloadBtn = document.getElementById('downloadBtn');
const printBtn = document.getElementById('printBtn');
const printArea = document.getElementById('printArea');

let finalCanvas = null;
let roomData = null;
let capturesById = {};
let built = false;

function tryBuild() {
  if (built || !roomData) return;
  const participantIds = Object.keys(roomData.participants || {});
  if (participantIds.length === 0) return;

  const totalExpected = participantIds.length * TOTAL_ROUNDS;
  const totalReceived = participantIds.reduce((sum, pid) => {
    let count = 0;
    for (let r = 1; r <= TOTAL_ROUNDS; r++) if (capturesById[`${pid}_${r}`]) count++;
    return sum + count;
  }, 0);

  // Susun begitu semua foto sudah masuk (atau ronde sudah lewat semua)
  if (totalReceived < totalExpected && roomData.status !== 'done') return;

  built = true;
  buildStrip(participantIds);
}

async function buildStrip(participantIds) {
  const template = getTemplateById(roomData.templateId);
  const dateLabel = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const names = participantIds.map((pid) => roomData.participants[pid].name).join(', ');
  participantSummary.textContent = `Bareng ${names}`;

  const roundsData = [];
  for (let r = 1; r <= TOTAL_ROUNDS; r++) {
    const frame = {};
    participantIds.forEach((pid) => {
      const cap = capturesById[`${pid}_${r}`];
      if (cap) frame[pid] = cap.dataUrl;
    });
    roundsData.push(frame);
  }

  finalCanvas = await composeGroupStrip(roundsData, participantIds, template, {
    roomCode,
    dateLabel,
  });

  resultWrap.innerHTML = '';
  resultWrap.appendChild(finalCanvas);
}

listenRoom(roomCode, (data) => {
  roomData = data;
  tryBuild();
});

listenCaptures(roomCode, (captures) => {
  capturesById = captures;
  tryBuild();
});

downloadBtn.addEventListener('click', () => {
  if (!finalCanvas) return;
  const link = document.createElement('a');
  link.download = `photobox-${roomCode}-${Date.now()}.png`;
  link.href = finalCanvas.toDataURL('image/png');
  link.click();
});

printBtn.addEventListener('click', () => {
  if (!finalCanvas) return;
  printArea.innerHTML = `<img src="${finalCanvas.toDataURL('image/png')}" alt="Hasil strip PhotoBox" />`;
  window.print();
});
