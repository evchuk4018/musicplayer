export const normalizeJellyfinUserId = (userId?: string | null) => (
    userId?.replace(/-/g, '').toLowerCase()
);
