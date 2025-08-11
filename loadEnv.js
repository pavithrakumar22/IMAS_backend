import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadEnv() {
  config({ path: path.resolve(__dirname, 'D:\\3-1\\IMAS\\IMAS_backend\\.env') });
}

