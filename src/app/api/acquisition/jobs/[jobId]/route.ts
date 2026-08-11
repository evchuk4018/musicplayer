import { cancelJob } from '@/server/acquisition/acquisition-repository';
import { databaseConfigured } from '@/server/db/client';

export async function DELETE(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  if (databaseConfigured()) await cancelJob(decodeURIComponent(jobId));
  return Response.json({ cancelled: decodeURIComponent(jobId) });
}
