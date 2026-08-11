import { errorResponse, json, options } from '@/server/seerr/http';
import { search } from '@/server/seerr/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim().slice(0, 100);
    const pageValue = Number(searchParams.get('page') || '1');
    const page = Number.isInteger(pageValue) ? Math.min(Math.max(pageValue, 1), 50) : 1;

    try {
        return json(request, await search(request, query, page));
    } catch (error) {
        return errorResponse(request, error);
    }
}

export async function OPTIONS(request: Request) {
    return options(request);
}
