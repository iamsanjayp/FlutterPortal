import fs from "fs";
import sharp from "sharp";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

export async function compareImages(referencePath, candidatePath) {
  if (!fs.existsSync(referencePath) || !fs.existsSync(candidatePath)) {
    return { matchPercent: 0, mismatchPixels: null, totalPixels: null };
  }

  const reference = sharp(referencePath).ensureAlpha();
  const candidate = sharp(candidatePath).ensureAlpha();

  const refMeta = await reference.metadata();
  const width = refMeta.width || 0;
  const height = refMeta.height || 0;

  if (!width || !height) {
    return { matchPercent: 0, mismatchPixels: null, totalPixels: null };
  }

  const refPng = PNG.sync.read(await reference.png().toBuffer());
  const candPng = PNG.sync.read(
    await candidate
      .resize(width, height, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toBuffer()
  );

  const diff = new PNG({ width, height });
  const mismatch = pixelmatch(
    refPng.data,
    candPng.data,
    diff.data,
    width,
    height,
    { threshold: 0 }
  );

  const total = width * height;
  const matchPercent = Math.max(0, Math.min(1, 1 - mismatch / total)) * 100;

  return {
    matchPercent: Math.round(matchPercent * 100) / 100,
    mismatchPixels: mismatch,
    totalPixels: total,
  };
}
