import { DEMO_APP_STATE } from '@/lib/demo-data';
import { databaseConfigured } from '@/server/db/client';
import { createPlaylist, listPlaylists } from '@/server/library/playlist-repository';
import { readJson, badRequest, serverError } from '@/server/protocol/http';
import { playlistCreateSchema } from '@/server/protocol/schemas';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!databaseConfigured()) return Response.json({ playlists: [DEMO_APP_STATE.library.likedPlaylist, ...DEMO_APP_STATE.library.playlists] });
  try {
    return Response.json({ playlists: await listPlaylists(true) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const parsed = playlistCreateSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest('A playlist name is required');
  try {
    if (!databaseConfigured()) {
      return Response.json({ playlist: { id: `playlist:${crypto.randomUUID()}`, name: parsed.data.name, description: parsed.data.description, artworkUrl: parsed.data.artworkUrl ?? DEMO_APP_STATE.library.playlists[0]?.artworkUrl ?? '', isSystem: false, isProtected: false, position: 99, trackCount: 0, tracks: [] } }, { status: 201 });
    }
    return Response.json({ playlist: await createPlaylist(parsed.data.name, parsed.data.description, parsed.data.artworkUrl) }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
