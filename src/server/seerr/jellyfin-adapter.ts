import type { JellyfinUser } from './types';

export class JellyfinAuthenticationError extends Error {
    constructor() {
        super('Jellyfin authentication failed');
        this.name = 'JellyfinAuthenticationError';
    }
}

export class JellyfinConfigurationError extends Error {
    constructor() {
        super('Jellyfin integration is not configured');
        this.name = 'JellyfinConfigurationError';
    }
}

const getJellyfinUrl = () => {
    const url = process.env.JELLYFIN_URL?.trim().replace(/\/$/, '');
    if (!url) throw new JellyfinConfigurationError();
    return url;
};

export async function validateJellyfinToken(token: string): Promise<JellyfinUser> {
    const response = await fetch(`${getJellyfinUrl()}/Users/Me`, {
        headers: {
            Accept: 'application/json',
            'X-Emby-Token': token,
            Authorization: `MediaBrowser Token="${token}"`
        },
        cache: 'no-store'
    });

    if (response.status === 401 || response.status === 403) {
        throw new JellyfinAuthenticationError();
    }

    if (!response.ok) {
        throw new Error(`Jellyfin user validation failed with status ${response.status}`);
    }

    const user = await response.json() as Partial<JellyfinUser>;
    if (!user.Id || typeof user.Id !== 'string') {
        throw new JellyfinAuthenticationError();
    }

    return {
        Id: user.Id,
        Name: typeof user.Name === 'string' ? user.Name : undefined
    };
}
