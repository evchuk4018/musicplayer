import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { getStoredTrackById } from '@/server/catalog/catalog-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  const track = process.env.DATABASE_URL ? await getStoredTrackById(decodeURIComponent(trackId)).catch(() => undefined) : undefined;
  if (!track?.localPath) return new Response('Track is not local', { status: 404 });
  const root = path.resolve(process.env.MUSIC_ROOT ?? './data/music');
  const target = path.resolve(track.localPath);
  if (path.relative(root, target).startsWith('..')) return new Response('Invalid media path', { status: 403 });
  const info = await stat(target).catch(() => undefined);
  if (!info?.isFile()) return new Response('Media file not found', { status: 404 });

  const range = request.headers.get('range');
  let start = 0;
  let end = info.size - 1;
  if (range?.startsWith('bytes=')) {
    const [requestedStart, requestedEnd] = range.slice(6).split('-');
    start = Number(requestedStart || 0);
    end = Number(requestedEnd || end);
    if (start > end || start >= info.size) return new Response('Invalid range', { status: 416 });
  }
  const stream = Readable.toWeb(createReadStream(target, { start, end })) as ReadableStream;
  return new Response(stream, {
    status: range ? 206 : 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Content-Length': String(end - start + 1),
      ...(range ? { 'Content-Range': `bytes ${start}-${end}/${info.size}` } : {})
    }
  });
}
