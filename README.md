# PhotoBox 📸

Website photobooth 4-cut ala Korea (Life4Cuts/Photoism style). Bisa dipakai sendiri
(mode solo) atau bareng teman secara real-time walau beda tempat (mode room).
100% jalan sebagai static site di **GitHub Pages** — mode room memakai **Firebase
Firestore** (gratis) sebagai jembatan sinkronisasi antar device.

## Struktur folder

```
photobox/
├── index.html          # Halaman utama: buat room / gabung room / mode solo
├── solo.html            # Mode solo — jepret 4 foto sendiri, tanpa Firebase
├── lobby.html            # Lobby room — daftar peserta live, pilih template
├── session.html           # Sesi capture bersama, countdown tersinkron
├── result.html             # Hasil strip gabungan, download & print
│
├── css/
│   ├── tokens.css          # Warna, font, spacing (design tokens)
│   ├── base.css              # Reset & style dasar
│   ├── components.css         # Tombol, kartu, kiosk shell, dll (dipakai bersama)
│   ├── index.css / solo.css / lobby.css / session.css   # style per halaman
│
├── js/
│   ├── templates.js          # 5 definisi gaya strip foto
│   ├── camera.js               # Akses webcam, countdown, ambil frame
│   ├── compose.js               # Gambar strip final di Canvas
│   ├── firebase-config.js        # ⚠️ WAJIB kamu isi sendiri (lihat di bawah)
│   ├── firebase-init.js            # Inisialisasi koneksi Firebase
│   ├── room.js                       # Semua fungsi Firestore (buat/gabung room, sync)
│   ├── index.js / solo.js / lobby.js / session.js / result.js  # logic per halaman
│
└── assets/                # (kosong, disiapkan kalau nanti mau nambah ikon/aset)
```

Setiap halaman = 1 file HTML + CSS + JS sendiri. Tidak ada yang digabung jadi satu
file raksasa, supaya gampang dicari dan diedit di VS Code.

## Coba dulu sebelum setup Firebase

**Mode Solo** (`solo.html`) tidak butuh Firebase sama sekali — langsung bisa dites
begitu file dibuka lewat local server (lihat langkah "Jalankan di VS Code" di bawah).
Coba ini dulu untuk mastiin alur pilih template → jepret 4 foto → download/print
sudah sesuai yang kamu mau, sebelum lanjut setup mode room.

## Jalankan di VS Code (wajib pakai local server, bukan buka file langsung)

Browser **tidak akan kasih izin akses kamera** kalau file dibuka langsung lewat
`file://` (klik dua kali index.html). Harus lewat server, walau cuma di komputer sendiri.

1. Buka folder `photobox` ini di VS Code.
2. Install extension **"Live Server"** (by Ritwick Dey) dari tab Extensions.
3. Klik kanan `index.html` → **"Open with Live Server"**.
4. Browser otomatis kebuka di `http://127.0.0.1:5500` — kamera akan bisa diakses.

## Setup Firebase (untuk mode Room — real-time bareng teman)

Gratis, tidak perlu kartu kredit. Kira-kira 5 menit.

1. Buka [console.firebase.google.com](https://console.firebase.google.com), login pakai akun Google.
2. **Add project** → kasih nama bebas (mis. `photobox-aku`) → lanjut sampai selesai (boleh matikan Google Analytics, tidak perlu).
3. Di sidebar kiri, klik **Build → Firestore Database** → **Create database** → pilih **Start in test mode** → pilih lokasi server terdekat (mis. `asia-southeast2`) → Enable.
4. Klik ikon gerigi (⚙️) di pojok kiri atas → **Project settings** → scroll ke bagian **Your apps** → klik ikon `</>` (Web) → kasih nama app → **Register app**.
5. Firebase akan menampilkan objek `firebaseConfig` seperti ini:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "photobox-aku.firebaseapp.com",
     projectId: "photobox-aku",
     storageBucket: "photobox-aku.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
6. Salin nilai-nilai itu ke file **`js/firebase-config.js`**, ganti semua yang bertuliskan `GANTI_DENGAN_...`.
7. Balik ke Firestore → tab **Rules** → ganti isinya dengan ini, lalu **Publish**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /rooms/{roomCode} {
         allow read, write: if true;
         match /{subcollection}/{docId} {
           allow read, write: if true;
         }
       }
     }
   }
   ```

   > ⚠️ Rules ini terbuka (siapa saja yang tahu URL Firestore-nya bisa baca/tulis).
   > Cukup aman untuk proyek main-main bareng teman, tapi **jangan** dipakai untuk
   > data sensitif. Kalau mau lebih aman, tambahkan Firebase Authentication —
   > di luar cakupan panduan ini.

Setelah langkah di atas, refresh halaman — banner peringatan kuning di `index.html`
akan hilang, tandanya mode Room sudah aktif.

## Deploy ke GitHub Pages

1. Buat repo baru di GitHub, push semua isi folder `photobox` ini ke repo tersebut (file `firebase-config.js` yang **sudah diisi** ikut di-push — ini aman, lihat catatan di dalam file itu).
2. Di repo GitHub → **Settings → Pages**.
3. Source: **Deploy from a branch** → Branch: `main` → folder `/ (root)` → **Save**.
4. Tunggu 1–2 menit, link website muncul di bagian atas halaman itu (format `https://username.github.io/nama-repo/`).

Selesai — link itu yang kamu share ke teman-teman.

## Cara pakai mode Room

1. Satu orang (host) klik **"Buat Room Baru"** → dapat kode room 5 karakter.
2. Host klik **"Salin link undangan"**, kirim ke teman lewat WhatsApp/apa saja.
3. Teman buka link → nama form otomatis terisi kode room → tinggal isi nama → **Gabung**.
4. Di lobby, host memilih gaya strip, lalu klik **"Mulai Sesi Foto"** begitu semua sudah siap.
5. Semua orang akan lihat hitung mundur 3-2-1 di device masing-masing secara bersamaan, otomatis kejepret 4 kali.
6. Halaman hasil menampilkan strip gabungan — tiap baris berisi foto semua orang berdampingan. Bisa **download** atau **cetak langsung**.

**Rekomendasi:** paling nyaman untuk 2–4 orang per room. Lebih dari itu, foto tiap
orang di strip akan makin kecil.

## Catatan & batasan yang perlu kamu tahu

- **Kuota gratis Firebase (Spark plan):** 50rb baca & 20rb tulis per hari — lebih
  dari cukup untuk pemakaian santai bareng teman, tapi kalau nanti dipakai ratusan
  orang sekaligus, ini bisa kena limit.
- **Data room tidak otomatis terhapus.** Tiap room yang dibuat akan tetap tersimpan
  di Firestore. Untuk proyek pribadi ini tidak masalah; kalau mau bersih-bersih
  otomatis, itu butuh Cloud Function berbayar (di luar cakupan versi ini).
- **Koneksi lambat/HP jadul** bisa bikin sinkronisasi countdown sedikit meleset
  (biasanya di bawah 1 detik). Sudah ada tombol fallback "Lanjut ke foto berikutnya"
  di sisi host kalau ada peserta yang macet.
- Karena ini pakai Firestore biasa (bukan WebRTC), yang "live" di lobby & sesi
  adalah **snapshot foto yang di-refresh tiap ±2 detik**, bukan video streaming
  penuh — ini pilihan sengaja supaya setup tetap simpel dan gratis, tanpa perlu
  server tambahan untuk video call.

## Menambah/mengubah template

Semua gaya strip ada di satu tempat: `js/templates.js`. Tiap template cukup
berupa objek warna + jenis dekorasi (`hearts`, `sprockets`, `polaroid-tilt`,
`grain`, atau `none`) — tidak butuh file gambar terpisah, semua digambar lewat
Canvas di `js/compose.js`. Tinggal duplikasi salah satu objek lalu ubah warnanya.
