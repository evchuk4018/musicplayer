import { deletePlaylist, updatePlaylist } from '@/server/library/playlist-repository';
import { databaseConfigured } from '@/server/db/client';
import { readJson, badRequest, serverError } from '@/server/protocol/http';
import { playlistUpdateSchema } from '@/server/protocol/schemas';

export async function PATCH(request: Request, { params }: { params: Promise<{ playlistId: string }> }) {
  const { playlistId } = await params;
  const parsed = playlistUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest('Invalid playlist update');
  try {
    const playlist = databaseConfigured() ? await updatePlaylist(decodeURIComponent(playlistId), parsed.data) : undefined;
    return Response.json({ playlistId: decodeURIComponent(playlistId), ...parsed.data, playlist });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ playlistId: string }> }) {
  const { playlistId } = await params;
  try {
    if (databaseConfigured()) await deletePlaylist(decodeURIComponent(playlistId));
    return Response.json({ deleted: decodeURIComponent(playlistId) });
  } catch (error) {
    return serverError(error);
  }
}
