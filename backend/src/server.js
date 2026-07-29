import 'dotenv/config';
import { createApp } from './app.js';
import { ensureFounderBucket } from './storage/founderPhotos.js';

const PORT = process.env.PORT || 4000;

async function main() {
  try {
    await ensureFounderBucket();
  } catch (err) {
    console.error('Could not set up the founder-photos storage bucket (founder photo upload will fail until this is fixed):', err.message);
  }

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

main();
