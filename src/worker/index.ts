import { claimNextJob, blockJob, completeJob, failJob, updateJobProgress } from '@/server/acquisition/acquisition-repository';
import { unlink } from 'node:fs/promises';
import { SpotDlAdapter } from '@/server/acquisition/spotdl-adapter';
import { getStoredTrackById } from '@/server/catalog/catalog-repository';
import { databaseConfigured, closeDatabase } from '@/server/db/client';
import { navidrome } from '@/server/navidrome/navidrome-adapter';
import { pruneDisposableCache } from '@/server/retention/retention-service';

const acquisition = new SpotDlAdapter();
const pollMs = Number(process.env.WORKER_POLL_MS ?? 5000);
let stopping = false;

async function processOne() {
  const job = await claimNextJob();
  if (!job) return false;
  const track = await getStoredTrackById(job.trackId);
  if (!track) {
    await failJob(job.id, 'Track metadata is no longer available', false);
    return true;
  }
  if (process.env.ACQUISITION_ENABLED !== 'true' || process.env.AUTHORIZED_ACQUISITION !== 'true') {
    await blockJob(job.id, 'Authorized acquisition is disabled by configuration');
    return true;
  }
  try {
    const result = await acquisition.acquire(track, (progress) => updateJobProgress(job.id, progress));
    await completeJob(job.id, track.id, result.localPath);
    await navidrome.scan().catch(() => undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Acquisition failed';
    await failJob(job.id, message, job.attempts < 3);
  }
  return true;
}

async function run() {
  if (!databaseConfigured()) {
    console.error('Worker cannot start without DATABASE_URL');
    process.exitCode = 1;
    return;
  }
  let lastPrune = 0;
  while (!stopping) {
    try {
      const processed = await processOne();
      if (Date.now() - lastPrune > 6 * 60 * 60 * 1000) {
        const result = await pruneDisposableCache().catch((error) => { console.error('Retention pass failed', error); return undefined; });
        if (result) await Promise.all(result.removed.filter((item) => item.local_path).map((item) => unlink(item.local_path!).catch(() => undefined)));
        lastPrune = Date.now();
      }
      if (!processed) await new Promise((resolve) => setTimeout(resolve, pollMs));
    } catch (error) {
      console.error('Worker loop failed', error);
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
  }
}

process.on('SIGTERM', () => { stopping = true; });
process.on('SIGINT', () => { stopping = true; });

run().finally(() => closeDatabase());
