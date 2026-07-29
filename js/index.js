/**
 * index.js — logic halaman utama
 */
import { isFirebaseConfigured } from './firebase-init.js';
import { createRoom, joinRoom } from './room.js';

const nameInput = document.getElementById('nameInput');
const createBtn = document.getElementById('createBtn');
const showJoinBtn = document.getElementById('showJoinBtn');
const joinForm = document.getElementById('joinForm');
const roomCodeInput = document.getElementById('roomCodeInput');
const soloBtn = document.getElementById('soloBtn');
const statusText = document.getElementById('statusText');
const configWarning = document.getElementById('configWarning');

if (!isFirebaseConfigured) {
  configWarning.classList.remove('is-hidden');
}

// Kalau dibuka lewat link undangan (?room=KODE), langsung siapkan form gabung
const invitedRoom = new URLSearchParams(window.location.search).get('room');
if (invitedRoom) {
  roomCodeInput.value = invitedRoom.toUpperCase();
  joinForm.classList.remove('is-hidden');
  nameInput.focus();
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle('is-error', isError);
}

function requireName() {
  const name = nameInput.value.trim();
  if (!name) {
    setStatus('Isi nama kamu dulu, ya.', true);
    nameInput.focus();
    return null;
  }
  return name;
}

function requireFirebase() {
  if (!isFirebaseConfigured) {
    setStatus('Mode Room belum aktif. Setup Firebase dulu — lihat README.md.', true);
    return false;
  }
  return true;
}

createBtn.addEventListener('click', async () => {
  if (!requireFirebase()) return;
  const name = requireName();
  if (!name) return;

  createBtn.disabled = true;
  setStatus('Membuat room...');
  try {
    await createRoom(name);
    window.location.href = 'lobby.html';
  } catch (err) {
    console.error(err);
    setStatus('Gagal membuat room. Coba lagi sebentar.', true);
    createBtn.disabled = false;
  }
});

showJoinBtn.addEventListener('click', () => {
  joinForm.classList.toggle('is-hidden');
  if (!joinForm.classList.contains('is-hidden')) roomCodeInput.focus();
});

joinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!requireFirebase()) return;
  const name = requireName();
  if (!name) return;
  const code = roomCodeInput.value.trim();
  if (!code) {
    setStatus('Masukkan kode room dulu.', true);
    return;
  }

  setStatus('Menghubungkan ke room...');
  try {
    await joinRoom(code, name);
    window.location.href = 'lobby.html';
  } catch (err) {
    setStatus(err.message || 'Gagal gabung room.', true);
  }
});

soloBtn.addEventListener('click', () => {
  window.location.href = 'solo.html';
});
