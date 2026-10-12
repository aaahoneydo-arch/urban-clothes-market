import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const TEMPLATES = {
  'tshirt-white': {
    template: 'assets/mockup-templates/tshirt-white.jpg',
    width: 290,
    height: 310,
    left: 367,
    top: 280,
    blend: 'over'
  },
  'tshirt-black': {
    template: 'assets/mockup-templates/tshirt-black.jpg',
    width: 290,
    height: 310,
    left: 367,
    top: 280,
    blend: 'over'
  },
  'hoodie-black': {
    template: 'assets/mockup-templates/hoodie-black.jpg',
    width: 260,
    height: 270,
    left: 382,
    top: 340,
    blend: 'over'
  },
  'mug-white': {
    template: 'assets/mockup-templates/mug-white.jpg',
    width: 230,
    height: 240,
    left: 340,
    top: 410,
    blend: 'over'
  },
  'tote-natural': {
    template: 'assets/mockup-templates/tote-natural.jpg',
    width: 320,
    height: 330,
    left: 352,
    top: 480,
    blend: 'over'
  },
  'poster-framed': {
    template: 'assets/mockup-templates/poster-framed.jpg',
    width: 290,
    height: 440,
    left: 445,
    top: 275,
    blend: 'over'
  },
  'sticker-diecut': {
    template: 'assets/mockup-templates/sticker-diecut.jpg',
    width: 360,
    height: 220,
    left: 250,
    top: 380,
    blend: 'over'
  },
  'pillow-linen': {
    template: 'assets/mockup-templates/pillow-linen.jpg',
    width: 340,
    height: 340,
    left: 342,
    top: 370,
    blend: 'over'
  },
  'phonecase-white': {
    template: 'assets/mockup-templates/phonecase-white.jpg',
    width: 180,
    height: 290,
    left: 395,
    top: 420,
    blend: 'over'
  }
};

async function testComposite() {
  const transparentPath = 'public/lookbook/flow-gen-0603-mockup-transparent.png';
  const outDir = 'public/test-mockups';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const [key, cfg] of Object.entries(TEMPLATES)) {
    // Trim transparent borders and resize
    const resizedArtwork = await sharp(transparentPath)
      .trim()
      .resize({
        width: cfg.width,
        height: cfg.height,
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();

    const artworkMeta = await sharp(resizedArtwork).metadata();
    const actualLeft = Math.round(cfg.left + (cfg.width - artworkMeta.width) / 2);
    const actualTop = Math.round(cfg.top + (cfg.height - artworkMeta.height) / 2);

    const outPath = path.join(outDir, `test2-flow-gen-0603-${key}.webp`);
    await sharp(cfg.template)
      .composite([{
        input: resizedArtwork,
        top: actualTop,
        left: actualLeft,
        blend: cfg.blend || 'over'
      }])
      .webp({ quality: 85 })
      .toFile(outPath);

    console.log(`Generated: ${outPath} (${artworkMeta.width}x${artworkMeta.height} at ${actualLeft},${actualTop})`);
  }
}

testComposite().catch(console.error);
