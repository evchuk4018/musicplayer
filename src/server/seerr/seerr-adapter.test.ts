import assert from 'node:assert/strict';
import test from 'node:test';

import { mapSeerrDetail } from './seerr-adapter';

test('maps personalized TV season availability and request state', () => {
    const detail = mapSeerrDetail({
        id: 42,
        name: 'Example Show',
        overview: 'Overview',
        backdropPath: '/backdrop.jpg',
        genres: [ { id: 1, name: 'Comedy' } ],
        seasons: [
            { seasonNumber: 0, name: 'Specials', episodeCount: 2 },
            { seasonNumber: 1, name: 'Season 1', episodeCount: 8 }
        ],
        mediaInfo: {
            status: 4,
            seasons: [ { seasonNumber: 1, status: 4 } ],
            requests: [ {
                requestedBy: { id: 7 },
                status: 2,
                seasons: [ { seasonNumber: 1, status: 2 } ]
            } ]
        }
    }, 'tv', 7);

    assert.equal(detail.title, 'Example Show');
    assert.equal(detail.backdropUrl, 'https://image.tmdb.org/t/p/w500/backdrop.jpg');
    assert.deepEqual(detail.genres, [ 'Comedy' ]);
    assert.equal(detail.available, false);
    assert.equal(detail.seasons?.[1]?.partiallyAvailable, true);
    assert.equal(detail.seasons?.[1]?.requestStatus, 2);
});

test('does not expose seasons for movie details', () => {
    const detail = mapSeerrDetail({
        id: 99,
        title: 'Example Movie',
        seasons: [ { seasonNumber: 1, episodeCount: 10 } ]
    }, 'movie', 7);

    assert.equal(detail.title, 'Example Movie');
    assert.equal(detail.seasons, undefined);
});
