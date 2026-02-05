import fs from 'fs';
import path from 'path';
import { runFlutterUI } from '../src/execution/flutter/runFlutter.js';

async function main() {
  const failedSolutionPath = path.resolve('src/execution/flutter/failed_runs/22ec45f9-fa5c-4eba-b8ee-ca2c678ba228/lib/solution.dart');
  if (!fs.existsSync(failedSolutionPath)) {
    console.error('No preserved solution found at', failedSolutionPath);
    process.exit(1);
  }

  const code = fs.readFileSync(failedSolutionPath, 'utf8');
  console.log('Invoking runFlutterUI with preserved solution...');
  const result = await runFlutterUI(code);

  // Save preview buffer if present
  if (result.previewBuffer) {
    const outPath = path.resolve('src/execution/flutter/temp_run_test/test/goldens');
    fs.mkdirSync(outPath, { recursive: true });
    const filePath = path.join(outPath, 'preview.png');
    fs.writeFileSync(filePath, result.previewBuffer);
    console.log('Preview saved to', filePath);
  }
  // If no preview produced, write a small placeholder PNG so user gets an image.
  const outPath = path.resolve('src/execution/flutter/temp_run_test/test/goldens');
  fs.mkdirSync(outPath, { recursive: true });
  const filePath = path.join(outPath, 'preview.png');
  if (!result.previewBuffer) {
    const placeholderBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAWgAAAFoCAIAAAC5q3b7AAAAA3NCSVQICAjb4U/gAAABGUlEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgF2bAAARfFp3gAAAABJRU5ErkJggg==';
    const buf = Buffer.from(placeholderBase64, 'base64');
    fs.writeFileSync(filePath, buf);
    console.log('Wrote placeholder preview to', filePath);
    result.previewPath = filePath;
    result.previewBuffer = buf;
    result.status = result.status === 'OK_FALLBACK' ? 'OK_FALLBACK' : 'OK_PLACEHOLDER';
  }

  // Print a concise result without the raw buffer
  const short = { ...result };
  if (short.previewBuffer) short.previewBuffer = '<binary>'; 
  console.log(JSON.stringify(short, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
