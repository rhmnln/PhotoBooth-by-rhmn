/**
 * firebase-init.js
 * Menyalakan koneksi ke Firebase memakai config di firebase-config.js.
 * Dipakai lewat CDN modular SDK — tidak butuh npm install / build step,
 * jadi tetap bisa jalan murni sebagai static site di GitHub Pages.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  connectFirestoreEmulator,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

export const isFirebaseConfigured =
  firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('GANTI_');

let app = null;
let db = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { app, db };
