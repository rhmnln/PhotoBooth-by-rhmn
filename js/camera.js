/**
 * camera.js
 * Utilitas kamera yang dipakai di mode solo maupun mode room:
 * akses webcam, jalankan hitung mundur, dan ambil satu frame ke dataURL.
 */

/**
 * Minta akses webcam dan pasang stream ke elemen <video>.
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<MediaStream>}
 */
async function startCamera(videoEl) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
    audio: false,
  });
  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

function stopCamera(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Jalankan hitung mundur visual di dalam sebuah elemen.
 * @param {HTMLElement} targetEl - elemen yang menampilkan angka countdown
 * @param {number} seconds
 * @param {() => void} [onEachTick]
 * @returns {Promise<void>}
 */
function runCountdown(targetEl, seconds, onEachTick) {
  return new Promise((resolve) => {
    let remaining = seconds;
    targetEl.textContent = remaining;
    targetEl.classList.remove('is-hidden');
    const timer = setInterval(() => {
      remaining -= 1;
      if (onEachTick) onEachTick(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        targetEl.classList.add('is-hidden');
        resolve();
      } else {
        targetEl.textContent = remaining;
      }
    }, 1000);
  });
}

/**
 * Ambil satu frame dari elemen <video> yang sedang berjalan menjadi dataURL JPEG.
 * @param {HTMLVideoElement} videoEl
 * @param {number} quality 0..1
 * @returns {string} dataURL
 */
function captureFrame(videoEl, quality = 0.9) {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext('2d');
  // Mirror horizontal supaya sesuai apa yang dilihat user di layar (efek cermin)
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Kompres ulang dataURL ke ukuran lebih kecil (untuk snapshot preview live via Firestore).
 */
function downscaleDataUrl(dataUrl, maxWidth = 180) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = maxWidth / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.55));
    };
    img.src = dataUrl;
  });
}
