import type {
    SeerrDetail,
    SeerrMedia,
    SeerrMediaInfo,
    SeerrMediaType,
    SeerrPage,
    SeerrRequest,
    SeerrRequestView,
    SeerrSearchResponse,
    SeerrSearchResult,
    SeerrUser
} from './types';

export class SeerrConfigurationError extends Error {
    constructor() {
        super('Seerr integration is not configured');
        this.name = 'SeerrConfigurationError';
    }
}

export class SeerrApiError extends Error {
    readonly status: number;

    constructor(status: number) {
        super(`Seerr API request failed with status ${status}`);
        this.name = 'SeerrApiError';
        this.status = status;
    }
}

const getSeerrConfig = () => {
    const baseUrl = process.env.SEERR_URL?.trim().replace(/\/$/, '');
    const apiKey = process.env.SEERR_API_KEY?.trim();

    if (!baseUrl || !apiKey) throw new SeerrConfigurationError();

    return { baseUrl, apiKey };
};

const requestJson = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const { baseUrl, apiKey } = getSeerrConfig();
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('X-Api-Key', apiKey);
    if (init.body) headers.set('Content-Type', 'application/json');

    const response = await fetch(`${baseUrl}/api/v1${path}`, {
        ...init,
        headers,
        cache: 'no-store'
    });

    if (!response.ok) throw new SeerrApiError(response.status);
    if (response.status === 204) return undefined as T;
    return await response.json() as T;
};

const imageUrl = (path?: string | null) => {
    if (!path) return undefined;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `https://image.tmdb.org/t/p/w500${path}`;
};

const getMediaType = (result: SeerrSearchResult): SeerrMediaType | undefined => {
    if (result.mediaType === 'movie' || result.mediaType === 'tv') return result.mediaType;
    return undefined;
};

const getMediaStatus = (mediaInfo?: SeerrMediaInfo | null) => mediaInfo?.status === 5;

const getRequestStatus = (mediaInfo: SeerrMediaInfo | null | undefined, userId: number) => (
    mediaInfo?.requests?.find(request => request.requestedBy?.id === userId)?.status
);

const toMedia = (result: SeerrSearchResult, userId: number): SeerrMedia | undefined => {
    const mediaType = getMediaType(result);
    if (!mediaType || !Number.isInteger(result.id)) return undefined;

    return {
        id: result.id,
        mediaType,
        title: result.title || result.name || result.originalTitle || result.originalName || 'Untitled',
        overview: result.overview || '',
        posterUrl: imageUrl(result.posterPath),
        releaseDate: result.releaseDate || result.firstAirDate,
        available: getMediaStatus(result.mediaInfo),
        requestStatus: getRequestStatus(result.mediaInfo, userId)
    };
};

const toRequestMediaType = (request: SeerrRequest): SeerrMediaType | undefined => {
    if (request.type === 'movie' || request.type === 'tv') return request.type;
    if (request.mediaType === 'movie' || request.mediaType === 'tv') return request.mediaType;
    if (request.media?.mediaType === 'movie' || request.media?.mediaType === 'tv') return request.media.mediaType;
    return undefined;
};

export class SeerrAdapter {
    private async findUser(jellyfinUserId: string): Promise<SeerrUser | undefined> {
        const response = await requestJson<{ results?: SeerrUser[] }>('/user?take=1000&skip=0');
        return response.results?.find(user => user.jellyfinUserId === jellyfinUserId);
    }

    async resolveUser(jellyfinUserId: string): Promise<number> {
        let user = await this.findUser(jellyfinUserId);
        if (!user) {
            await requestJson('/user/import-from-jellyfin', {
                method: 'POST',
                body: JSON.stringify({ jellyfinUserIds: [jellyfinUserId] })
            });
            user = await this.findUser(jellyfinUserId);
        }

        if (!user || !Number.isInteger(user.id)) {
            throw new Error('The Jellyfin user is not available in Seerr');
        }

        return user.id;
    }

    async search(query: string, page: number, userId: number): Promise<{
        page: number;
        totalPages: number;
        results: SeerrMedia[];
    }> {
        const path = query
            ? `/search?query=${encodeURIComponent(query)}&page=${page}`
            : `/discover/trending?page=${page}`;
        const response = await requestJson<SeerrSearchResponse>(path);
        const results = response.results
            .map(result => toMedia(result, userId))
            .filter((result): result is SeerrMedia => Boolean(result));

        return {
            page: response.page || page,
            totalPages: response.totalPages || 1,
            results
        };
    }

    async getRequests(userId: number): Promise<SeerrRequestView[]> {
        const response = await requestJson<SeerrPage<SeerrRequest>>(`/user/${userId}/requests?take=100&skip=0`);

        return Promise.all(response.results.map(async request => {
            const mediaType = toRequestMediaType(request);
            const mediaId = request.media?.tmdbId;
            if (!mediaType || typeof mediaId !== 'number' || !Number.isInteger(mediaId)) return undefined;

            const detail = await requestJson<SeerrDetail>(
                `/${mediaType === 'movie' ? 'movie' : 'tv'}/${mediaId}`
            ).catch(() => undefined);

            const result: SeerrRequestView = {
                id: request.id,
                mediaId,
                mediaType,
                title: detail?.title || detail?.name || 'Untitled',
                overview: detail?.overview || '',
                posterUrl: imageUrl(detail?.posterPath),
                status: request.status,
                createdAt: request.createdAt,
                updatedAt: request.updatedAt
            };

            return result;
        })).then(results => results.filter((result): result is SeerrRequestView => Boolean(result)));
    }

    async createRequest(input: {
        mediaType: SeerrMediaType;
        mediaId: number;
        tvdbId?: number;
        userId: number;
    }) {
        const request = await requestJson<SeerrRequest>('/request', {
            method: 'POST',
            body: JSON.stringify({
                mediaType: input.mediaType,
                mediaId: input.mediaId,
                tvdbId: input.tvdbId,
                seasons: input.mediaType === 'tv' ? 'all' : undefined,
                is4k: false,
                userId: input.userId
            })
        });

        return {
            id: request.id,
            mediaType: input.mediaType,
            mediaId: input.mediaId,
            status: request.status
        };
    }
}
