import { z } from 'zod';

import { errorResponse, json, options } from '@/server/seerr/http';
import { createRequest, getRequests } from '@/server/seerr/service';
import type { SeerrMediaType } from '@/server/seerr/types';
import { readJson } from '@/server/protocol/http';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
    mediaType: z.enum(['movie', 'tv']),
    mediaId: z.number().int().positive(),
    tvdbId: z.number().int().positive().optional(),
    seasons: z.array(z.number().int().nonnegative()).length(1).optional()
});

export async function GET(request: Request) {
    try {
        return json(request, { results: await getRequests(request) });
    } catch (error) {
        return errorResponse(request, error);
    }
}

export async function POST(request: Request) {
    const parsed = requestSchema.safeParse(await readJson(request));
    if (!parsed.success) return json(request, { error: 'A valid movie or TV media ID is required' }, 400);

    try {
        return json(request, await createRequest(request, parsed.data as {
            mediaType: SeerrMediaType;
            mediaId: number;
            tvdbId?: number;
            seasons?: number[];
        }), 201);
    } catch (error) {
        return errorResponse(request, error);
    }
}

export async function OPTIONS(request: Request) {
    return options(request);
}
