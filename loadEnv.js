// import { config } from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export function loadEnv() {
//   config({ path: path.resolve(__dirname, '.env') });
// }

import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findEnvPath(startDir) {
  let currentDir = startDir;

  while (true) {
    const envPath = path.join(currentDir, '.env');

    if (fs.existsSync(envPath)) {
      return envPath; // Found the .env file
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break; // Reached root
    currentDir = parentDir;
  }

  return null; // Not found
}

export function loadEnv() {
  const envFile = findEnvPath(__dirname);
  if (!envFile) {
    console.warn('.env file not found');
    return;
  }

  config({ path: envFile });
}
