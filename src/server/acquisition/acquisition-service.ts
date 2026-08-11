import type { Track } from '@/domain/music';
import { databaseConfigured } from '@/server/db/client';
import { persistTrackIfConfigured } from '@/server/catalog/catalog-service';
import { ensureAcquisitionJob, getJobForTrack } from './acquisition-repository';
import { SpotDlAdapter } from './spotdl-adapter';

const provider = new SpotDlAdapter();

export async function ensureTrackReady(track: Track) {
  if (track.isLocal) return { status: 'ready' as const, track, job: undefined };
  if (!databaseConfigured()) {
    return { status: 'preparing' as const, track, job: { id: `demo-job:${track.id}`, trackId: track.id, status: 'queued' as const, progress: 12, attempts: 0 } };
  }

  await persistTrackIfConfigured(track);
  const job = await ensureAcquisitionJob(track);
  if (process.env.ACQUISITION_ENABLED !== 'true' || process.env.AUTHORIZED_ACQUISITION !== 'true') {
    return { status: 'preview' as const, track, job: { ...job, status: 'blocked' as const }, detail: 'A preview is available. Enable authorized acquisition on homelab for full playback.' };
  }
  return { status: job.status === 'ready' ? 'ready' as const : 'preparing' as const, track, job };
}

export async function acquisitionHealth() {
  if (process.env.WORKER_URL) {
    try {
      const response = await fetch(`${process.env.WORKER_URL}/health`, { cache: 'no-store' });
      if (!response.ok) return { status: 'down' as const, detail: `worker HTTP ${response.status}` };
      return await response.json() as { status: 'up' | 'down' | 'disabled'; detail?: string };
    } catch (error) {
      return { status: 'down' as const, detail: error instanceof Error ? error.message : 'worker unreachable' };
    }
  }
  return provider.health();
}

export async function jobForTrack(trackId: string) {
  if (!databaseConfigured()) return undefined;
  try {
    return await getJobForTrack(trackId);
  } catch {
    return undefined;
  }
}
