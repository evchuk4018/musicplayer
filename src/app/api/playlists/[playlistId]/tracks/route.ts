import { addTrackToPlaylist, removeTrackFromPlaylist, reorderPlaylistTracks } from '@/server/library/playlist-repository';
import { databaseConfigured } from '@/server/db/client';
import { readJson, badRequest, serverError } from '@/server/protocol/http';
import { trackSchema } from '@/server/protocol/schemas';
import { setTrackLike, upsertCatalogTrack } from '@/server/catalog/catalog-repository';
import { queueTrackForAcquisition } from '@/server/acquisition/liked-playlist-acquisition-service';

export async function POST(request: Request, { params }: { params: Promise<{ playlistId: string }> }) {
  const { playlistId } = await params;
  const body = await readJson(request) as { track?: unknown } | undefined;
  const parsed = trackSchema.safeParse(body?.track);
  if (!parsed.success) return badRequest('A complete track is required');
  try {
    const resolvedPlaylistId = decodeURIComponent(playlistId);
    let job;
    if (databaseConfigured()) {
      await upsertCatalogTrack(parsed.data);
      if (resolvedPlaylistId === 'liked') {
        const likedTrack = await setTrackLike(parsed.data.id, true);
        if (likedTrack) job = await queueTrackForAcquisition(likedTrack);
      } else {
        await addTrackToPlaylist(resolvedPlaylistId, parsed.data.id);
      }
    }
    return Response.json({ playlistId: resolvedPlaylistId, track: parsed.data, job }, { status: 201 });
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
    const resolvedPlaylistId = decodeURIComponent(playlistId);
    if (databaseConfigured()) {
      if (resolvedPlaylistId === 'liked') await setTrackLike(trackId, false);
      else await removeTrackFromPlaylist(resolvedPlaylistId, trackId);
    }
    return Response.json({ playlistId: resolvedPlaylistId, trackId });
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
