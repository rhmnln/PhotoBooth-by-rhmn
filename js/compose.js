/**
 * compose.js
 * Menggabungkan 4 foto (dataURL) menjadi satu strip PNG final
 * sesuai template yang dipilih, digambar lewat Canvas 2D.
 */

const STRIP_WIDTH = 640;
const PHOTO_HEIGHT = 460;
const PADDING = 28;
const GAP = 18;
const FOOTER_HEIGHT = 110;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
  ctx.bezierCurveTo(x - size / 2, y + size / 1.6, x, y + size, x, y + size + size / 4);
  ctx.bezierCurveTo(x, y + size, x + size / 2, y + size / 1.6, x + size / 2, y + size / 4);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
  ctx.fill();
  ctx.restore();
}

function drawSprockets(ctx, canvasHeight, color) {
  const holeSize = 10;
  const gapY = 26;
  ctx.save();
  ctx.fillStyle = color;
  for (let y = 14; y < canvasHeight - 14; y += gapY) {
    ctx.beginPath();
    ctx.roundRect(10, y, holeSize, holeSize, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(STRIP_WIDTH - 10 - holeSize, y, holeSize, holeSize, 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGrain(ctx, canvasHeight, opacity = 0.05) {
  ctx.save();
  ctx.globalAlpha = opacity;
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * STRIP_WIDTH;
    const y = Math.random() * canvasHeight;
    ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#ffffff';
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  ctx.restore();
}

function formatFilmDate(date) {
  const yy = String(date.getFullYear()).slice(-2);
  return `'${yy} ${date.getMonth() + 1} ${date.getDate()}`;
}

function drawDateStamp(ctx, x, y, text, color) {
  ctx.save();
  ctx.font = '700 15px "Space Mono", monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 3;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawRoundedPhoto(ctx, img, x, y, w, h, radius, filter, rotationDeg) {
  ctx.save();
  if (rotationDeg) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();
  ctx.filter = filter || 'none';

  // Cover-fit gambar ke area foto
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let drawW, drawH, offX, offY;
  if (imgRatio > boxRatio) {
    drawH = h;
    drawW = h * imgRatio;
    offX = x - (drawW - w) / 2;
    offY = y;
  } else {
    drawW = w;
    drawH = w / imgRatio;
    offX = x;
    offY = y - (drawH - h) / 2;
  }
  ctx.drawImage(img, offX, offY, drawW, drawH);
  ctx.restore();
}

/**
 * @param {string[]} photoDataUrls - 4 dataURL hasil jepretan
 * @param {object} template - salah satu dari TEMPLATES
 * @param {{roomCode: string, dateLabel: string}} meta
 * @returns {Promise<HTMLCanvasElement>}
 */
async function composeStrip(photoDataUrls, template, meta) {
  const images = await Promise.all(photoDataUrls.map(loadImage));
  const isPolaroid = template.decoration === 'polaroid-tilt';
  const photoBoxH = isPolaroid ? PHOTO_HEIGHT - 20 : PHOTO_HEIGHT;
  const totalHeight =
    PADDING * 2 + photoBoxH * 4 + GAP * 3 + FOOTER_HEIGHT;

  const canvas = document.createElement('canvas');
  canvas.width = STRIP_WIDTH;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');

  // Kertas dasar
  ctx.fillStyle = template.paperColor;
  ctx.fillRect(0, 0, STRIP_WIDTH, totalHeight);

  let cursorY = PADDING;
  const photoW = STRIP_WIDTH - PADDING * 2;
  const filmDateText = formatFilmDate(new Date());

  for (let i = 0; i < 4; i++) {
    const img = images[i];
    const rot = template.photoRotationDeg
      ? (i % 2 === 0 ? 1 : -1) * template.photoRotationDeg
      : 0;

    if (isPolaroid) {
      // Kartu polaroid putih dengan sedikit rotasi
      ctx.save();
      ctx.translate(STRIP_WIDTH / 2, cursorY + photoBoxH / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.translate(-STRIP_WIDTH / 2, -(cursorY + photoBoxH / 2));
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      ctx.beginPath();
      ctx.roundRect(PADDING - 8, cursorY - 8, photoW + 16, photoBoxH + 16, 10);
      ctx.fill();
      ctx.restore();
    }

    drawRoundedPhoto(
      ctx,
      img,
      PADDING,
      cursorY,
      photoW,
      photoBoxH,
      isPolaroid ? 4 : 14,
      template.photoFilter,
      isPolaroid ? rot : 0
    );

    if (template.decoration === 'datestamp') {
      drawDateStamp(ctx, PADDING + photoW - 12, cursorY + photoBoxH - 12, filmDateText, template.accentColor);
    }

    cursorY += photoBoxH + GAP;
  }

  // Dekorasi khusus per template
  if (template.decoration === 'hearts') {
    const spots = [
      [40, 30], [STRIP_WIDTH - 50, 60], [50, totalHeight - FOOTER_HEIGHT - 30],
      [STRIP_WIDTH - 40, totalHeight - FOOTER_HEIGHT - 50],
    ];
    spots.forEach(([x, y]) => drawHeart(ctx, x, y, 14, template.accentColor));
  } else if (template.decoration === 'sprockets') {
    drawSprockets(ctx, totalHeight, template.frameColor);
  } else if (template.decoration === 'grain') {
    drawGrain(ctx, totalHeight, 0.06);
  }

  // Footer: nama brand + stempel room/tanggal
  const footerTop = totalHeight - FOOTER_HEIGHT;
  ctx.fillStyle = template.inkColor;
  ctx.textAlign = 'center';
  ctx.font = '700 26px "Baloo 2", sans-serif';
  ctx.fillText('PHOTOBOX', STRIP_WIDTH / 2, footerTop + 44);

  ctx.font = '400 15px "Space Mono", monospace';
  ctx.globalAlpha = 0.75;
  const stampLine = `${meta.roomCode || 'SOLO'} · ${meta.dateLabel}`;
  ctx.fillText(stampLine, STRIP_WIDTH / 2, footerTop + 72);
  ctx.globalAlpha = 1;

  return canvas;
}

/**
 * Versi grup: tiap baris/ronde berisi foto SEMUA peserta berdampingan
 * (bukan cuma satu orang), supaya hasil akhirnya benar-benar terasa
 * "bareng-bareng" walau tiap orang motret dari device masing-masing.
 *
 * @param {Array<Object>} roundsData - roundsData[i] = { participantId: dataUrl, ... } untuk ronde ke-(i+1)
 * @param {string[]} participantOrder - urutan tampil peserta (konsisten tiap baris)
 * @param {object} template
 * @param {{roomCode: string, dateLabel: string}} meta
 * @returns {Promise<HTMLCanvasElement>}
 */
async function composeGroupStrip(roundsData, participantOrder, template, meta) {
  const totalHeight = PADDING * 2 + PHOTO_HEIGHT * 4 + GAP * 3 + FOOTER_HEIGHT;
  const canvas = document.createElement('canvas');
  canvas.width = STRIP_WIDTH;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = template.paperColor;
  ctx.fillRect(0, 0, STRIP_WIDTH, totalHeight);

  const photoW = STRIP_WIDTH - PADDING * 2;
  const colGap = 6;
  const n = Math.max(1, participantOrder.length);
  const colW = (photoW - colGap * (n - 1)) / n;

  let cursorY = PADDING;
  const filmDateText = formatFilmDate(new Date());
  for (let round = 0; round < 4; round++) {
    const frames = roundsData[round] || {};
    for (let i = 0; i < n; i++) {
      const pid = participantOrder[i];
      const src = frames[pid];
      const x = PADDING + i * (colW + colGap);
      if (src) {
        const img = await loadImage(src);
        drawRoundedPhoto(ctx, img, x, cursorY, colW, PHOTO_HEIGHT, 10, template.photoFilter, 0);
        if (template.decoration === 'datestamp') {
          drawDateStamp(ctx, x + colW - 10, cursorY + PHOTO_HEIGHT - 10, filmDateText, template.accentColor);
        }
      } else {
        ctx.save();
        ctx.fillStyle = 'rgba(120,120,120,0.15)';
        ctx.beginPath();
        ctx.roundRect(x, cursorY, colW, PHOTO_HEIGHT, 10);
        ctx.fill();
        ctx.restore();
      }
    }
    cursorY += PHOTO_HEIGHT + GAP;
  }

  if (template.decoration === 'hearts') {
    const spots = [
      [40, 30], [STRIP_WIDTH - 50, 60], [50, totalHeight - FOOTER_HEIGHT - 30],
      [STRIP_WIDTH - 40, totalHeight - FOOTER_HEIGHT - 50],
    ];
    spots.forEach(([x, y]) => drawHeart(ctx, x, y, 14, template.accentColor));
  } else if (template.decoration === 'sprockets') {
    drawSprockets(ctx, totalHeight, template.frameColor);
  } else if (template.decoration === 'grain') {
    drawGrain(ctx, totalHeight, 0.06);
  }

  const footerTop = totalHeight - FOOTER_HEIGHT;
  ctx.fillStyle = template.inkColor;
  ctx.textAlign = 'center';
  ctx.font = '700 26px "Baloo 2", sans-serif';
  ctx.fillText('PHOTOBOX', STRIP_WIDTH / 2, footerTop + 44);

  ctx.font = '400 15px "Space Mono", monospace';
  ctx.globalAlpha = 0.75;
  ctx.fillText(`${meta.roomCode} · ${meta.dateLabel}`, STRIP_WIDTH / 2, footerTop + 72);
  ctx.globalAlpha = 1;

  return canvas;
}

/**
 * Preview mini per template — dipakai di grid pilihan template supaya
 * user tahu kira-kira hasilnya sebelum motret beneran. Pakai foto contoh
 * (placeholder) karena foto asli user belum ada di tahap pilih template.
 * Hasilnya di-cache supaya nggak digambar ulang tiap kali grid re-render.
 */
const templatePreviewCache = {};

function createPlaceholderPhotoDataUrl() {
  const c = document.createElement('canvas');
  c.width = 300;
  c.height = 300;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 300, 300);
  grad.addColorStop(0, '#d9d5cd');
  grad.addColorStop(1, '#b7b2a8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 300, 300);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(150, 120, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(150, 250, 85, 70, 0, Math.PI, 0);
  ctx.fill();
  return c.toDataURL('image/jpeg', 0.85);
}

async function getTemplatePreview(template) {
  if (templatePreviewCache[template.id]) return templatePreviewCache[template.id];

  const W = 260;
  const H = 200;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = template.paperColor;
  ctx.fillRect(0, 0, W, H);

  const pad = 12;
  const photoW = W - pad * 2;
  const photoH = H - pad * 2;
  const isPolaroid = template.decoration === 'polaroid-tilt';
  const rot = isPolaroid ? 2.5 : 0;
  const img = await loadImage(createPlaceholderPhotoDataUrl());

  if (isPolaroid) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.translate(-W / 2, -H / 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(pad - 6, pad - 6, photoW + 12, photoH + 12, 8);
    ctx.fill();
    ctx.restore();
  }

  drawRoundedPhoto(ctx, img, pad, pad, photoW, photoH, isPolaroid ? 4 : 12, template.photoFilter, rot);

  if (template.decoration === 'datestamp') {
    drawDateStamp(ctx, pad + photoW - 8, pad + photoH - 8, formatFilmDate(new Date()), template.accentColor);
  } else if (template.decoration === 'sprockets') {
    ctx.save();
    ctx.fillStyle = template.frameColor;
    for (let y = 8; y < H - 8; y += 16) {
      ctx.beginPath();
      ctx.roundRect(3, y, 6, 6, 1);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(W - 9, y, 6, 6, 1);
      ctx.fill();
    }
    ctx.restore();
  } else if (template.decoration === 'grain') {
    ctx.save();
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#ffffff';
      ctx.fillRect(x, y, 1.2, 1.2);
    }
    ctx.restore();
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  templatePreviewCache[template.id] = dataUrl;
  return dataUrl;
}
