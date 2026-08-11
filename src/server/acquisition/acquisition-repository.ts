import type { QueryResultRow } from 'pg';
import type { AcquisitionJob, AcquisitionStatus, Track } from '@/domain/music';
import { query, withTransaction } from '@/server/db/client';

type JobRow = QueryResultRow & {
  id: string;
  track_id: string;
  status: AcquisitionStatus;
  progress: number;
  error: string | null;
  attempts: number;
};

function mapJob(row: JobRow): AcquisitionJob {
  return { id: row.id, trackId: row.track_id, status: row.status, progress: row.progress, error: row.error ?? undefined, attempts: row.attempts };
}

export async function getJobForTrack(trackId: string) {
  const result = await query<JobRow>(`SELECT id, track_id, status, progress, error, attempts FROM acquisition_jobs WHERE track_id = $1 ORDER BY queued_at DESC LIMIT 1`, [trackId]);
  return result.rows[0] ? mapJob(result.rows[0]) : undefined;
}

export async function listActiveJobs() {
  const result = await query<JobRow>(`SELECT id, track_id, status, progress, error, attempts FROM acquisition_jobs WHERE status IN ('queued', 'processing', 'failed', 'blocked') ORDER BY queued_at`, []);
  return result.rows.map(mapJob);
}

export async function ensureAcquisitionJob(track: Track) {
  const existing = await query<JobRow>(`SELECT id, track_id, status, progress, error, attempts FROM acquisition_jobs WHERE canonical_key = $1`, [track.canonicalKey]);
  if (existing.rows[0]) {
    const job = existing.rows[0];
    if (job.status === 'failed' && job.attempts < 3) {
      const retried = await query<JobRow>(`UPDATE acquisition_jobs SET status = 'queued', error = NULL, queued_at = now(), cancel_requested = false WHERE id = $1 RETURNING id, track_id, status, progress, error, attempts`, [job.id]);
      return mapJob(retried.rows[0]);
    }
    return mapJob(job);
  }
  const result = await query<JobRow>(
    `INSERT INTO acquisition_jobs (id, canonical_key, track_id, status, provider) VALUES ($1, $2, $3, 'queued', 'spotdl') RETURNING id, track_id, status, progress, error, attempts`,
    [`job:${crypto.randomUUID()}`, track.canonicalKey, track.id]
  );
  return mapJob(result.rows[0]);
}

export async function claimNextJob() {
  return withTransaction(async (client) => {
    const result = await client.query<JobRow>(`SELECT id, track_id, status, progress, error, attempts FROM acquisition_jobs WHERE status = 'queued' AND cancel_requested = false ORDER BY queued_at FOR UPDATE SKIP LOCKED LIMIT 1`);
    const row = result.rows[0];
    if (!row) return undefined;
    const claimed = await client.query<JobRow>(`UPDATE acquisition_jobs SET status = 'processing', attempts = attempts + 1, started_at = now(), last_attempt_at = now(), progress = 1 WHERE id = $1 RETURNING id, track_id, status, progress, error, attempts`, [row.id]);
    return claimed.rows[0] ? mapJob(claimed.rows[0]) : undefined;
  });
}

export async function updateJobProgress(jobId: string, progress: number) {
  await query(`UPDATE acquisition_jobs SET progress = greatest(0, least(100, $2)) WHERE id = $1`, [jobId, progress]);
}

export async function completeJob(jobId: string, trackId: string, localPath: string) {
  await withTransaction(async (client) => {
    await client.query(`UPDATE acquisition_jobs SET status = 'ready', progress = 100, completed_at = now(), error = NULL WHERE id = $1`, [jobId]);
    await client.query(`UPDATE tracks SET is_local = true, local_path = $2, acquired_at = coalesce(acquired_at, now()), updated_at = now() WHERE id = $1`, [trackId, localPath]);
  });
}

export async function failJob(jobId: string, error: string, retryable: boolean) {
  await query(`UPDATE acquisition_jobs SET status = $2, error = $3, progress = 0 WHERE id = $1`, [jobId, retryable ? 'queued' : 'failed', error.slice(0, 1000)]);
}

export async function blockJob(jobId: string, error: string) {
  await query(`UPDATE acquisition_jobs SET status = 'blocked', error = $2 WHERE id = $1`, [jobId, error.slice(0, 1000)]);
}

export async function cancelJob(jobId: string) {
  await query(`UPDATE acquisition_jobs SET cancel_requested = true, status = CASE WHEN status = 'queued' THEN 'cancelled' ELSE status END WHERE id = $1`, [jobId]);
}
