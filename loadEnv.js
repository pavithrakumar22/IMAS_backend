import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadEnv() {
<<<<<<< HEAD
  config({ path: path.resolve(__dirname, 'D:\\3-1\\IMAS\\IMAS_backend\\.env') });
=======
  config({ path: path.resolve(__dirname, '.env') });
>>>>>>> 1ab8d55a48ef5d3655c581bd94bc9f79d9c84ccd
}

