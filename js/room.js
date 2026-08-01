/**
 * room.js
 * Semua interaksi dengan Firestore untuk fitur "room bareng teman":
 * membuat room, gabung room, sinkronisasi status sesi, preview live,
 * dan penyimpanan hasil jepretan tiap peserta.
 */

import { db } from './firebase-init.js';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  deleteField,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa 0/O/1/I biar gak ambigu
const TOTAL_ROUNDS = 4;
const MAX_PARTICIPANTS = 4;

function generateRoomCode(length = 5) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

function generateParticipantId() {
  return 'p-' + Math.random().toString(36).slice(2, 10);
}

/** Ambil / buat identitas peserta yang tersimpan untuk tab browser ini. */
function getIdentity() {
  let id = sessionStorage.getItem('pb_participant_id');
  if (!id) {
    id = generateParticipantId();
    sessionStorage.setItem('pb_participant_id', id);
  }
  return id;
}

function setSessionInfo({ roomCode, name, isHost }) {
  if (roomCode) sessionStorage.setItem('pb_room_code', roomCode);
  if (name) sessionStorage.setItem('pb_name', name);
  if (isHost !== undefined) sessionStorage.setItem('pb_is_host', String(isHost));
}

function getSessionInfo() {
  return {
    participantId: getIdentity(),
    roomCode: sessionStorage.getItem('pb_room_code'),
    name: sessionStorage.getItem('pb_name'),
    isHost: sessionStorage.getItem('pb_is_host') === 'true',
  };
}

async function createRoom(hostName) {
  const roomCode = generateRoomCode();
  const participantId = getIdentity();
  const roomRef = doc(db, 'rooms', roomCode);

  await setDoc(roomRef, {
    createdAt: serverTimestamp(),
    hostId: participantId,
    templateId: 'pink-flash',
    status: 'lobby',
    currentRound: 0,
    totalRounds: TOTAL_ROUNDS,
    countdownStartAt: null,
    participants: {
      [participantId]: { name: hostName, isHost: true, joinedAt: Date.now() },
    },
  });

  setSessionInfo({ roomCode, name: hostName, isHost: true });
  return roomCode;
}

async function joinRoom(roomCode, name) {
  const code = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', code);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) {
    throw new Error('Room tidak ditemukan. Cek lagi kode roomnya, ya.');
  }
  const roomData = snap.data();
  if (roomData.status !== 'lobby') {
    throw new Error('Sesi di room ini sudah dimulai. Minta host buat room baru.');
  }
  const participantCount = Object.keys(roomData.participants || {}).length;
  if (participantCount >= MAX_PARTICIPANTS) {
    throw new Error(`Room ini sudah penuh (maksimal ${MAX_PARTICIPANTS} orang).`);
  }

  const participantId = getIdentity();
  await updateDoc(roomRef, {
    [`participants.${participantId}`]: { name, isHost: false, joinedAt: Date.now() },
  });

  setSessionInfo({ roomCode: code, name, isHost: false });
  return code;
}

function listenRoom(roomCode, onChange) {
  const roomRef = doc(db, 'rooms', roomCode);
  return onSnapshot(roomRef, (snap) => {
    if (snap.exists()) onChange(snap.data());
    else onChange(null);
  });
}

async function setTemplate(roomCode, templateId) {
  await updateDoc(doc(db, 'rooms', roomCode), { templateId });
}

async function startSession(roomCode) {
  await updateDoc(doc(db, 'rooms', roomCode), {
    status: 'countdown',
    currentRound: 1,
    countdownStartAt: serverTimestamp(),
  });
}

async function advanceRound(roomCode, nextRound) {
  if (nextRound > TOTAL_ROUNDS) {
    await updateDoc(doc(db, 'rooms', roomCode), { status: 'done' });
  } else {
    await updateDoc(doc(db, 'rooms', roomCode), {
      currentRound: nextRound,
      countdownStartAt: serverTimestamp(),
      status: 'countdown',
    });
  }
}

async function publishPreview(roomCode, participantId, dataUrl) {
  const ref = doc(db, 'rooms', roomCode, 'previews', participantId);
  await setDoc(ref, { dataUrl, updatedAt: Date.now() });
}

function listenPreviews(roomCode, onChange) {
  const ref = collection(db, 'rooms', roomCode, 'previews');
  return onSnapshot(ref, (snap) => {
    const previews = {};
    snap.forEach((d) => (previews[d.id] = d.data()));
    onChange(previews);
  });
}

async function publishCapture(roomCode, participantId, round, dataUrl) {
  const ref = doc(db, 'rooms', roomCode, 'captures', `${participantId}_${round}`);
  await setDoc(ref, { participantId, round, dataUrl, capturedAt: Date.now() });
}

function listenCaptures(roomCode, onChange) {
  const ref = collection(db, 'rooms', roomCode, 'captures');
  return onSnapshot(ref, (snap) => {
    const captures = {};
    snap.forEach((d) => (captures[d.id] = d.data()));
    onChange(captures);
  });
}

async function leaveRoom(roomCode, participantId) {
  const roomRef = doc(db, 'rooms', roomCode);
  await updateDoc(roomRef, {
    [`participants.${participantId}`]: deleteField(),
  });
}

export {
  TOTAL_ROUNDS,
  MAX_PARTICIPANTS,
  getIdentity,
  getSessionInfo,
  setSessionInfo,
  createRoom,
  joinRoom,
  listenRoom,
  setTemplate,
  startSession,
  advanceRound,
  publishPreview,
  listenPreviews,
  publishCapture,
  listenCaptures,
  leaveRoom,
};
