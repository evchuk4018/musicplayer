import type { AcquisitionJob, Track } from '@/domain/music';
import { databaseConfigured } from '@/server/db/client';
import { persistTrackIfConfigured } from '@/server/catalog/catalog-service';
import { listLikedTracks } from '@/server/library/playlist-repository';
import { ensureAcquisitionJob } from './acquisition-repository';

export async function queueTrackForAcquisition(track: Track): Promise<AcquisitionJob | undefined> {
  if (track.isLocal || !databaseConfigured()) return undefined;
  await persistTrackIfConfigured(track);
  return ensureAcquisitionJob(track);
}

export async function queueLikedPlaylistTracks() {
  if (!databaseConfigured()) return [];

  const tracks = await listLikedTracks();
  const jobs = await Promise.all(tracks.filter((track) => !track.isLocal).map(async (track) => {
    try {
      return await queueTrackForAcquisition(track);
    } catch {
      return undefined;
    }
  }));
  return jobs.filter((job): job is AcquisitionJob => Boolean(job));
}
