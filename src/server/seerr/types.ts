export type SeerrMediaType = 'movie' | 'tv';

export type JellyfinUser = {
    Id: string;
    Name?: string;
};

export type SeerrUser = {
    id: number;
    jellyfinUserId?: string | null;
};

export type SeerrMediaInfo = {
    status?: number;
    seasons?: Array<{
        seasonNumber?: number;
        status?: number;
    }>;
    requests?: Array<{
        requestedBy?: {
            id?: number;
        };
        status?: number;
        seasons?: Array<{
            seasonNumber?: number;
            status?: number;
        }>;
    }>;
};

export type SeerrSearchResult = {
    id: number;
    mediaType?: string;
    title?: string;
    name?: string;
    originalTitle?: string;
    originalName?: string;
    overview?: string;
    posterPath?: string | null;
    backdropPath?: string | null;
    releaseDate?: string;
    firstAirDate?: string;
    mediaInfo?: SeerrMediaInfo | null;
};

export type SeerrRequest = {
    id: number;
    status?: number;
    type?: SeerrMediaType;
    mediaType?: SeerrMediaType;
    media?: {
        tmdbId?: number;
        tvdbId?: number;
        mediaType?: SeerrMediaType;
        status?: number;
    } | null;
    createdAt?: string;
    updatedAt?: string;
};

export type SeerrDetail = {
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    posterPath?: string | null;
    backdropPath?: string | null;
    releaseDate?: string;
    firstAirDate?: string;
    tagline?: string;
    genres?: Array<{
        id?: number;
        name?: string;
    }>;
    seasons?: Array<{
        id?: number;
        airDate?: string | null;
        episodeCount?: number;
        name?: string;
        overview?: string;
        posterPath?: string | null;
        seasonNumber?: number;
    }>;
    mediaInfo?: SeerrMediaInfo | null;
};

export type SeerrMedia = {
    id: number;
    mediaType: SeerrMediaType;
    title: string;
    overview: string;
    posterUrl?: string;
    releaseDate?: string;
    available: boolean;
    requestStatus?: number;
};

export type SeerrSeasonView = {
    seasonNumber: number;
    name: string;
    episodeCount: number;
    overview: string;
    posterUrl?: string;
    airDate?: string;
    available: boolean;
    partiallyAvailable: boolean;
    requestStatus?: number;
};

export type SeerrMediaDetailView = SeerrMedia & {
    backdropUrl?: string;
    tagline?: string;
    genres: string[];
    seasons?: SeerrSeasonView[];
};

export type SeerrRequestView = {
    id: number;
    mediaId: number;
    mediaType: SeerrMediaType;
    title: string;
    overview: string;
    posterUrl?: string;
    status?: number;
    createdAt?: string;
    updatedAt?: string;
};

export type SeerrPage<T> = {
    pageInfo?: {
        page?: number;
        pages?: number;
        results?: number;
        pageSize?: number;
    };
    results: T[];
};

export type SeerrSearchResponse = {
    page?: number;
    totalPages?: number;
    totalResults?: number;
    results: SeerrSearchResult[];
};
