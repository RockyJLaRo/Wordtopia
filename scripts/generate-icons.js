import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

const iconSvg = fs.readFileSync(path.resolve(publicDir, 'icon.svg'), 'utf8');
const maskableSvg = fs.readFileSync(path.resolve(publicDir, 'icon-maskable.svg'), 'utf8');

function renderSvg(svgString, width, height, outputPath) {
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`Generated ${outputPath} (${width}x${height}, ${pngBuffer.length} bytes)`);
}

renderSvg(iconSvg, 192, 192, path.resolve(publicDir, 'pwa-192x192.png'));
renderSvg(iconSvg, 512, 512, path.resolve(publicDir, 'pwa-512x512.png'));
renderSvg(iconSvg, 180, 180, path.resolve(publicDir, 'apple-touch-icon.png'));
renderSvg(maskableSvg, 512, 512, path.resolve(publicDir, 'pwa-maskable-512x512.png'));
renderSvg(iconSvg, 64, 64, path.resolve(publicDir, 'favicon.ico'));

console.log('All PWA icons generated successfully!');
