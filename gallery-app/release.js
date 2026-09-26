import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM mein __dirname set karne ka tareeqa
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RELEASES_DIR = path.join(__dirname, 'releases');
const BUNDLE_DIR = path.join(__dirname, 'src-tauri', 'target', 'release', 'bundle');

if (!fs.existsSync(RELEASES_DIR)) {
  fs.mkdirSync(RELEASES_DIR, { recursive: true });
}

console.log('🚀 Starting AUVEM Build Pipeline...\n');

try {
  console.log('⏳ Building for current architecture...');
  execSync('npm run tauri build', { stdio: 'inherit' });
  console.log('\n✅ Build Completed Successfully!\n');
} catch (error) {
  console.error('\n❌ Build Failed!', error);
  process.exit(1);
}

console.log('📦 Searching for generated artifacts (MSI, EXE, DEB, APK, OBB)...\n');

function findArtifacts(dir, extensions, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findArtifacts(filePath, extensions, fileList);
    } else {
      if (extensions.some(ext => file.endsWith(ext))) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const allowedExtensions = ['.msi', '.exe', '.deb', '.AppImage', '.apk', '.obb'];
const artifacts = findArtifacts(BUNDLE_DIR, allowedExtensions);

if (artifacts.length === 0) {
  console.log('⚠️ No artifacts found. Tauri build output might be empty or in a different folder.');
} else {
  artifacts.forEach(filePath => {
    const fileName = path.basename(filePath);
    const destPath = path.join(RELEASES_DIR, fileName);
    
    fs.copyFileSync(filePath, destPath);
    console.log(`➡️  Copied: ${fileName} -> releases/`);
  });
  
  console.log('\n🎉 All distribution files are ready in the /releases folder!');
}