import { errorResponse, json, options } from '@/server/seerr/http';
import { getStatus } from '@/server/seerr/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        return json(request, await getStatus(request));
    } catch (error) {
        return errorResponse(request, error);
    }
}

export async function OPTIONS(request: Request) {
    return options(request);
}
