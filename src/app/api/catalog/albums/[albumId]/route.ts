import { getAlbumCatalog } from '@/server/catalog/detail-service';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = await params;
  const album = await getAlbumCatalog(decodeURIComponent(albumId));
  if (!album) return Response.json({ error: 'Album not found' }, { status: 404 });
  return Response.json({ kind: 'album', album });
}
