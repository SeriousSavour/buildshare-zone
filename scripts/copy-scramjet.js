import { copyFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

// Create directories
mkdirSync(join(root, 'public/scram'), { recursive: true });
mkdirSync(join(root, 'public/baremux'), { recursive: true });
mkdirSync(join(root, 'public/epoxy'), { recursive: true });

// Copy Scramjet files
const scramjetSrc = join(root, 'node_modules/@mercuryworkshop/scramjet/dist');
const scramjetDest = join(root, 'public/scram');
['scramjet.all.js', 'scramjet.wasm.wasm', 'scramjet.sync.js'].forEach(file => {
  try {
    copyFileSync(join(scramjetSrc, file), join(scramjetDest, file));
    console.log(`✓ Copied ${file}`);
  } catch (err) {
    console.error(`✗ Failed to copy ${file}:`, err.message);
  }
});

// Copy BareMux files
const baremuxSrc = join(root, 'node_modules/@mercuryworkshop/bare-mux/dist');
const baremuxDest = join(root, 'public/baremux');
['index.js', 'worker.js'].forEach(file => {
  try {
    copyFileSync(join(baremuxSrc, file), join(baremuxDest, file));
    console.log(`✓ Copied baremux/${file}`);
  } catch (err) {
    console.error(`✗ Failed to copy baremux/${file}:`, err.message);
  }
});

// Copy Epoxy files
const epoxySrc = join(root, 'node_modules/@mercuryworkshop/epoxy-transport/dist');
const epoxyDest = join(root, 'public/epoxy');
['index.js', 'index.mjs'].forEach(file => {
  try {
    copyFileSync(join(epoxySrc, file), join(epoxyDest, file));
    console.log(`✓ Copied epoxy/${file}`);
  } catch (err) {
    console.error(`✗ Failed to copy epoxy/${file}:`, err.message);
  }
});

console.log('✅ All files copied successfully!');
