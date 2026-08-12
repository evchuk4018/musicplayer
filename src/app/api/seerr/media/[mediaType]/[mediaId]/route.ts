import { z } from 'zod';

import { errorResponse, json, options } from '@/server/seerr/http';
import { getMediaDetail } from '@/server/seerr/service';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
    mediaType: z.enum(['movie', 'tv']),
    mediaId: z.coerce.number().int().positive()
});

type RouteContext = {
    params: Promise<{
        mediaType: string;
        mediaId: string;
    }>;
};

export async function GET(request: Request, context: RouteContext) {
    const parsed = paramsSchema.safeParse(await context.params);
    if (!parsed.success) return json(request, { error: 'A valid movie or TV media ID is required' }, 400);

    try {
        return json(
            request,
            await getMediaDetail(request, parsed.data.mediaType, parsed.data.mediaId)
        );
    } catch (error) {
        return errorResponse(request, error);
    }
}

export async function OPTIONS(request: Request) {
    return options(request);
}
