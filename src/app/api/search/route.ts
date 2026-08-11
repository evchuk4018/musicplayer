import { searchCatalog } from '@/server/catalog/catalog-service';
import { clearRecentSearches, recordSearch } from '@/server/library/playlist-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  if (query) await recordSearch(query).catch(() => undefined);
  return Response.json(await searchCatalog(query));
}

export async function DELETE() {
  await clearRecentSearches().catch(() => undefined);
  return Response.json({ ok: true });
}
