const allowedOrigins = () => (
    process.env.SEERR_ALLOWED_ORIGINS?.split(',')
        .map(origin => origin.trim())
        .filter(Boolean) || []
);

export const corsHeaders = (request: Request) => {
    const origin = request.headers.get('origin');
    const configuredOrigins = allowedOrigins();
    const allowOrigin = origin && (configuredOrigins.length === 0 || configuredOrigins.includes(origin))
        ? origin
        : configuredOrigins.length === 0 ? '*' : undefined;
    const headers = new Headers({
        'Cache-Control': 'no-store',
        Vary: 'Origin'
    });

    if (allowOrigin) {
        headers.set('Access-Control-Allow-Origin', allowOrigin);
        headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }

    return headers;
};

export const json = (request: Request, body: unknown, status = 200) => (
    Response.json(body, { status, headers: corsHeaders(request) })
);

export const options = (request: Request) => new Response(null, {
    status: 204,
    headers: corsHeaders(request)
});

export const errorResponse = (request: Request, error: unknown) => {
    const status = error instanceof Error && error.name === 'JellyfinAuthenticationError'
        ? 401
        : error instanceof Error && (
            error.name === 'SeerrConfigurationError' || error.name === 'JellyfinConfigurationError'
        ) ? 503
            : error instanceof Error && error.name === 'SeerrRequestError' && 'status' in error
                && typeof error.status === 'number' ? error.status : 502;

    if (status >= 500) console.error('[seerr-bridge]', error instanceof Error ? error.message : error);

    return json(request, {
        error: status === 401
            ? 'Jellyfin authentication is required'
            : status === 503
                ? 'The media request service is not configured'
                : 'The media request service is unavailable'
    }, status);
};
