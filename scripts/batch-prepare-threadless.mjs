import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';

const tempDir = path.join(os.tmpdir(), 'threadless-masters');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

export async function prepareMaster(flowNum) {
  const padNum = String(flowNum).padStart(4, '0');
  const input = `public/lookbook/flow-gen-${padNum}.png`;
  const outPath = path.join(tempDir, `flow-gen-${padNum}.png`);

  if (fs.existsSync(outPath)) {
    return outPath;
  }

  if (!fs.existsSync(input)) {
    console.warn(`Input not found: ${input}`);
    return null;
  }

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 30 && data[i+1] < 30 && data[i+2] < 30) {
      data[i+3] = 0;
    }
  }

  const cleanArt = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize({ width: 3600, height: 3600, fit: 'inside' })
    .png()
    .toBuffer();

  const artMeta = await sharp(cleanArt).metadata();
  const left = Math.round((4200 - artMeta.width) / 2);
  const top = Math.round((4800 - artMeta.height) / 2) - 200;

  await sharp({
    create: {
      width: 4200,
      height: 4800,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{ input: cleanArt, left, top }])
  .withMetadata({ density: 300 })
  .png({ compressionLevel: 6 })
  .toFile(outPath);

  console.log(`Ready: flow-gen-${padNum} -> ${outPath}`);
  return outPath;
}

async function run() {
  console.log('=== PREPARING THREADLESS PRINT MASTERS (0604 - 0620) ===');
  for (let i = 604; i <= 620; i++) {
    await prepareMaster(i);
  }
  console.log('=== BATCH PREPARATION COMPLETE ===');
}

if (process.argv[1] && process.argv[1].endsWith('batch-prepare-threadless.mjs')) {
  run();
}
