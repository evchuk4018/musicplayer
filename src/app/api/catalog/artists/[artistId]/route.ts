import { getArtistCatalog } from '@/server/catalog/detail-service';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ artistId: string }> }) {
  const { artistId } = await params;
  const catalog = await getArtistCatalog(decodeURIComponent(artistId));
  if (!catalog) return Response.json({ error: 'Artist not found' }, { status: 404 });
  return Response.json({ kind: 'artist', ...catalog });
}
