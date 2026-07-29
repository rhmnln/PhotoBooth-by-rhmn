/**
 * templates.js
 * Definisi template strip foto ala Korean 4-cut photobooth.
 * Setiap template murni digambar lewat Canvas (tanpa file gambar eksternal)
 * supaya ringan dan tidak ada aset yang bisa "putus" di GitHub Pages.
 */

const TEMPLATES = [
  {
    id: 'pink-flash',
    name: 'Pink Flash',
    tagline: 'Manis, playful, penuh flash pink',
    paperColor: '#fffdf9',
    frameColor: '#ff5c93',
    inkColor: '#2a2730',
    accentColor: '#ff5c93',
    photoFilter: 'saturate(1.1) contrast(1.03)',
    swatch: ['#fffdf9', '#ff5c93', '#ffd1e3'],
    decoration: 'hearts',
    photoRotationDeg: 0,
  },
  {
    id: 'mono-film',
    name: 'Mono Film',
    tagline: 'Hitam putih, klasik reel film',
    paperColor: '#141414',
    frameColor: '#f4f4f4',
    inkColor: '#f4f4f4',
    accentColor: '#f4f4f4',
    photoFilter: 'grayscale(1) contrast(1.15)',
    swatch: ['#141414', '#f4f4f4', '#8a8a8a'],
    decoration: 'sprockets',
    photoRotationDeg: 0,
  },
  {
    id: 'mint-pop',
    name: 'Mint Pop',
    tagline: 'Segar, polaroid miring playful',
    paperColor: '#eafff6',
    frameColor: '#ffffff',
    inkColor: '#0f4d3a',
    accentColor: '#2fbf8f',
    photoFilter: 'saturate(1.15) brightness(1.03)',
    swatch: ['#eafff6', '#7fe7c4', '#0f4d3a'],
    decoration: 'polaroid-tilt',
    photoRotationDeg: 2.5,
  },
  {
    id: 'butter-retro',
    name: 'Butter Retro',
    tagline: 'Hangat, grain vintage tahun 90an',
    paperColor: '#fff3d6',
    frameColor: '#7a4b23',
    inkColor: '#5c3a1e',
    accentColor: '#e0a530',
    photoFilter: 'sepia(0.35) contrast(1.05) saturate(1.1)',
    swatch: ['#fff3d6', '#e0a530', '#7a4b23'],
    decoration: 'grain',
    photoRotationDeg: 0,
  },
  {
    id: 'minimal-mono',
    name: 'Minimal Mono',
    tagline: 'Bersih, garis tipis, tanpa gangguan',
    paperColor: '#ffffff',
    frameColor: '#101010',
    inkColor: '#101010',
    accentColor: '#101010',
    photoFilter: 'contrast(1.05)',
    swatch: ['#ffffff', '#101010', '#dedede'],
    decoration: 'none',
    photoRotationDeg: 0,
  },
];

function getTemplateById(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}
