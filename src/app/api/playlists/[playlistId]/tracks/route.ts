import { addTrackToPlaylist, removeTrackFromPlaylist, reorderPlaylistTracks } from '@/server/library/playlist-repository';
import { databaseConfigured } from '@/server/db/client';
import { readJson, badRequest, serverError } from '@/server/protocol/http';
import { trackSchema } from '@/server/protocol/schemas';
import { upsertCatalogTrack } from '@/server/catalog/catalog-repository';

export async function POST(request: Request, { params }: { params: Promise<{ playlistId: string }> }) {
  const { playlistId } = await params;
  const body = await readJson(request) as { track?: unknown } | undefined;
  const parsed = trackSchema.safeParse(body?.track);
  if (!parsed.success) return badRequest('A complete track is required');
  try {
    if (databaseConfigured()) {
      await upsertCatalogTrack(parsed.data);
      await addTrackToPlaylist(decodeURIComponent(playlistId), parsed.data.id);
    }
    return Response.json({ playlistId: decodeURIComponent(playlistId), track: parsed.data }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ playlistId: string }> }) {
  const { playlistId } = await params;
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get('trackId');
  if (!trackId) return badRequest('trackId is required');
  try {
    if (databaseConfigured()) await removeTrackFromPlaylist(decodeURIComponent(playlistId), trackId);
    return Response.json({ playlistId: decodeURIComponent(playlistId), trackId });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ playlistId: string }> }) {
  const { playlistId } = await params;
  const body = await readJson(request) as { trackIds?: unknown } | undefined;
  if (!Array.isArray(body?.trackIds) || !body.trackIds.every((item) => typeof item === 'string')) return badRequest('trackIds is required');
  try {
    if (databaseConfigured()) await reorderPlaylistTracks(decodeURIComponent(playlistId), body.trackIds);
    return Response.json({ playlistId: decodeURIComponent(playlistId), trackIds: body.trackIds });
  } catch (error) {
    return serverError(error);
  }
}
