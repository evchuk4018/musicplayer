import { validateJellyfinToken } from './jellyfin-adapter';
import { SeerrAdapter } from './seerr-adapter';
import type { SeerrMediaType } from './types';

const adapter = new SeerrAdapter();

export class SeerrRequestError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'SeerrRequestError';
        this.status = status;
    }
}

export const getBearerToken = (request: Request) => {
    const value = request.headers.get('authorization');
    if (!value?.startsWith('Bearer ')) return undefined;
    const token = value.slice('Bearer '.length).trim();
    return token || undefined;
};

const getAuthenticatedSeerrUser = async (request: Request) => {
    const token = getBearerToken(request);
    if (!token) throw new SeerrRequestError('A Jellyfin authentication token is required', 401);

    const jellyfinUser = await validateJellyfinToken(token);
    const seerrUserId = await adapter.resolveUser(jellyfinUser.Id);
    return { seerrUserId };
};

export async function search(request: Request, query: string, page: number) {
    const { seerrUserId } = await getAuthenticatedSeerrUser(request);
    return adapter.search(query, page, seerrUserId);
}

export async function getRequests(request: Request) {
    const { seerrUserId } = await getAuthenticatedSeerrUser(request);
    return adapter.getRequests(seerrUserId);
}

export async function getStatus(request: Request) {
    await getAuthenticatedSeerrUser(request);
    return { enabled: true };
}

export async function createRequest(
    request: Request,
    input: { mediaType: SeerrMediaType; mediaId: number; tvdbId?: number }
) {
    const { seerrUserId } = await getAuthenticatedSeerrUser(request);
    return adapter.createRequest({ ...input, userId: seerrUserId });
}
