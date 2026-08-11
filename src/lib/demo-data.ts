import type { AppState, Artist, Album, Playlist, SpeedDialItem, Track } from '@/domain/music';

const audio = 'https://storage.googleapis.com/coverr-main/mp3/Mt_Baker.mp3';

const art = {
  violet: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=85',
  orange: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=85',
  blue: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85',
  green: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85',
  pink: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=900&q=85',
  red: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=85',
  night: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85',
  mono: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=85',
  sky: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=85'
};

const artists: Artist[] = [
  { id: 'demo:cloudyfield', name: 'cloudyfield', imageUrl: art.blue, genres: ['alt pop', 'dream pop'], similarArtistIds: ['demo:midnight', 'demo:river'], source: 'demo' },
  { id: 'demo:midnight', name: 'Midnight Radio', imageUrl: art.night, genres: ['indie electronic', 'downtempo'], similarArtistIds: ['demo:cloudyfield', 'demo:golden'], source: 'demo' },
  { id: 'demo:golden', name: 'Golden Hour', imageUrl: art.orange, genres: ['neo soul', 'r&b'], similarArtistIds: ['demo:river', 'demo:midnight'], source: 'demo' },
  { id: 'demo:river', name: 'River Saint', imageUrl: art.green, genres: ['indie', 'alternative'], similarArtistIds: ['demo:cloudyfield', 'demo:golden'], source: 'demo' },
  { id: 'demo:velvet', name: 'Velvet Weekend', imageUrl: art.pink, genres: ['house', 'r&b'], similarArtistIds: ['demo:golden', 'demo:midnight'], source: 'demo' },
  { id: 'demo:neon', name: 'Neon Atlas', imageUrl: art.violet, genres: ['hip-hop', 'electronic'], similarArtistIds: ['demo:midnight', 'demo:velvet'], source: 'demo' }
];

const album = (id: string, title: string, artistId: string, artistName: string, artworkUrl: string, releaseYear: number): Album => ({
  id,
  title,
  artistId,
  artistName,
  artworkUrl,
  releaseYear,
  tracks: [],
  source: 'demo'
});

const albums: Album[] = [
  album('demo:album:afterglow', 'Afterglow FM', 'demo:midnight', 'Midnight Radio', art.night, 2025),
  album('demo:album:soft-focus', 'Soft Focus', 'demo:cloudyfield', 'cloudyfield', art.blue, 2024),
  album('demo:album:rooms', 'Rooms With The Lights Low', 'demo:golden', 'Golden Hour', art.orange, 2025),
  album('demo:album:motion', 'Motion Studies', 'demo:neon', 'Neon Atlas', art.violet, 2024),
  album('demo:album:weekend', 'Velvet Weekend', 'demo:velvet', 'Velvet Weekend', art.pink, 2023),
  album('demo:album:weather', 'Weather Report', 'demo:river', 'River Saint', art.green, 2022)
];

const track = (input: Omit<Track, 'isLiked' | 'isSaved' | 'isProtected' | 'playCount' | 'source' | 'isLocal' | 'canonicalKey'> & Partial<Pick<Track, 'isLocal' | 'isLiked' | 'isSaved' | 'isProtected' | 'playCount' | 'source'>>): Track => ({
  ...input,
  canonicalKey: `${input.artistName.toLowerCase()}::${input.title.toLowerCase()}`,
  isLocal: input.isLocal ?? false,
  isLiked: input.isLiked ?? false,
  isSaved: input.isSaved ?? false,
  isProtected: input.isProtected ?? false,
  playCount: input.playCount ?? 0,
  source: input.source ?? 'demo'
});

export const DEMO_TRACKS: Track[] = [
  track({ id: 'demo:track:after-hours', title: 'After Hours', artistId: 'demo:midnight', artistName: 'Midnight Radio', albumId: 'demo:album:afterglow', albumName: 'Afterglow FM', artworkUrl: art.night, previewUrl: audio, durationSeconds: 214, genre: 'indie electronic', year: 2025, tempo: 112, mood: 'late night', energy: 0.54 }),
  track({ id: 'demo:track:low-light', title: 'Low Light', artistId: 'demo:midnight', artistName: 'Midnight Radio', albumId: 'demo:album:afterglow', albumName: 'Afterglow FM', artworkUrl: art.night, previewUrl: audio, durationSeconds: 198, genre: 'downtempo', year: 2025, tempo: 98, mood: 'late night', energy: 0.35, isLocal: true, isLiked: true, isSaved: true, isProtected: true, playCount: 7 }),
  track({ id: 'demo:track:soft-focus', title: 'Soft Focus', artistId: 'demo:cloudyfield', artistName: 'cloudyfield', albumId: 'demo:album:soft-focus', albumName: 'Soft Focus', artworkUrl: art.blue, previewUrl: audio, durationSeconds: 187, genre: 'dream pop', year: 2024, tempo: 106, mood: 'weightless', energy: 0.42 }),
  track({ id: 'demo:track:blue-hour', title: 'Blue Hour', artistId: 'demo:cloudyfield', artistName: 'cloudyfield', albumId: 'demo:album:soft-focus', albumName: 'Soft Focus', artworkUrl: art.sky, previewUrl: audio, durationSeconds: 226, genre: 'alt pop', year: 2024, tempo: 118, mood: 'reflective', energy: 0.48, isLocal: true, playCount: 3 }),
  track({ id: 'demo:track:somewhere-warm', title: 'Somewhere Warm', artistId: 'demo:golden', artistName: 'Golden Hour', albumId: 'demo:album:rooms', albumName: 'Rooms With The Lights Low', artworkUrl: art.orange, previewUrl: audio, durationSeconds: 203, genre: 'neo soul', year: 2025, tempo: 94, mood: 'warm', energy: 0.49, isLiked: true, isSaved: true, isProtected: true, playCount: 12 }),
  track({ id: 'demo:track:open-window', title: 'Open Window', artistId: 'demo:golden', artistName: 'Golden Hour', albumId: 'demo:album:rooms', albumName: 'Rooms With The Lights Low', artworkUrl: art.orange, previewUrl: audio, durationSeconds: 239, genre: 'r&b', year: 2025, tempo: 88, mood: 'sunlit', energy: 0.57 }),
  track({ id: 'demo:track:run-it-back', title: 'Run It Back', artistId: 'demo:neon', artistName: 'Neon Atlas', albumId: 'demo:album:motion', albumName: 'Motion Studies', artworkUrl: art.violet, previewUrl: audio, durationSeconds: 192, genre: 'hip-hop', year: 2024, tempo: 128, mood: 'focused', energy: 0.79, isLocal: true, playCount: 4 }),
  track({ id: 'demo:track:still-moving', title: 'Still Moving', artistId: 'demo:neon', artistName: 'Neon Atlas', albumId: 'demo:album:motion', albumName: 'Motion Studies', artworkUrl: art.red, previewUrl: audio, durationSeconds: 211, genre: 'electronic', year: 2024, tempo: 124, mood: 'energized', energy: 0.84 }),
  track({ id: 'demo:track:slow-bloom', title: 'Slow Bloom', artistId: 'demo:river', artistName: 'River Saint', albumId: 'demo:album:weather', albumName: 'Weather Report', artworkUrl: art.green, previewUrl: audio, durationSeconds: 244, genre: 'alternative', year: 2022, tempo: 82, mood: 'tender', energy: 0.3 }),
  track({ id: 'demo:track:weather-report', title: 'Weather Report', artistId: 'demo:river', artistName: 'River Saint', albumId: 'demo:album:weather', albumName: 'Weather Report', artworkUrl: art.green, previewUrl: audio, durationSeconds: 231, genre: 'indie', year: 2022, tempo: 102, mood: 'open road', energy: 0.6 }),
  track({ id: 'demo:track:velvet-rope', title: 'Velvet Rope', artistId: 'demo:velvet', artistName: 'Velvet Weekend', albumId: 'demo:album:weekend', albumName: 'Velvet Weekend', artworkUrl: art.pink, previewUrl: audio, durationSeconds: 206, genre: 'house', year: 2023, tempo: 121, mood: 'night out', energy: 0.73 }),
  track({ id: 'demo:track:all-night', title: 'All Night / No Rush', artistId: 'demo:velvet', artistName: 'Velvet Weekend', albumId: 'demo:album:weekend', albumName: 'Velvet Weekend', artworkUrl: art.pink, previewUrl: audio, durationSeconds: 259, genre: 'r&b', year: 2023, tempo: 108, mood: 'night out', energy: 0.63 }),
  track({ id: 'demo:track:orbit', title: 'Orbit', artistId: 'demo:neon', artistName: 'Neon Atlas', albumId: 'demo:album:motion', albumName: 'Motion Studies', artworkUrl: art.sky, previewUrl: audio, durationSeconds: 216, genre: 'electronic', year: 2024, tempo: 118, mood: 'discovery', energy: 0.67 }),
  track({ id: 'demo:track:golden', title: 'Golden', artistId: 'demo:golden', artistName: 'Golden Hour', albumId: 'demo:album:rooms', albumName: 'Rooms With The Lights Low', artworkUrl: art.orange, previewUrl: audio, durationSeconds: 182, genre: 'neo soul', year: 2025, tempo: 90, mood: 'warm', energy: 0.44 }),
  track({ id: 'demo:track:airplane-mode', title: 'Airplane Mode', artistId: 'demo:cloudyfield', artistName: 'cloudyfield', albumId: 'demo:album:soft-focus', albumName: 'Soft Focus', artworkUrl: art.blue, previewUrl: audio, durationSeconds: 201, genre: 'dream pop', year: 2024, tempo: 110, mood: 'weightless', energy: 0.46 }),
  track({ id: 'demo:track:night-drive', title: 'Night Drive', artistId: 'demo:midnight', artistName: 'Midnight Radio', albumId: 'demo:album:afterglow', albumName: 'Afterglow FM', artworkUrl: art.night, previewUrl: audio, durationSeconds: 230, genre: 'indie electronic', year: 2025, tempo: 116, mood: 'late night', energy: 0.61 })
];

for (const currentAlbum of albums) {
  currentAlbum.tracks = DEMO_TRACKS.filter((candidate) => candidate.albumId === currentAlbum.id);
}

const playlist = (input: Omit<Playlist, 'trackCount'>): Playlist => ({ ...input, trackCount: input.tracks.length });

export const DEMO_PLAYLISTS: Playlist[] = [
  playlist({ id: 'liked', name: 'Liked Music', description: 'Your one-tap favorites', artworkUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=85', isSystem: true, isProtected: true, position: 0, tracks: DEMO_TRACKS.filter((candidate) => candidate.isLiked) }),
  playlist({ id: 'playlist:late-night', name: 'Late Night', description: 'Soft lights, low volume', artworkUrl: art.night, isSystem: false, isProtected: false, position: 1, tracks: DEMO_TRACKS.filter((candidate) => ['demo:track:after-hours', 'demo:track:low-light', 'demo:track:night-drive', 'demo:track:slow-bloom'].includes(candidate.id)) }),
  playlist({ id: 'playlist:focus', name: 'Deep Focus', description: 'A steady room to work in', artworkUrl: art.blue, isSystem: false, isProtected: false, position: 2, tracks: DEMO_TRACKS.filter((candidate) => ['demo:track:soft-focus', 'demo:track:run-it-back', 'demo:track:orbit', 'demo:track:airplane-mode'].includes(candidate.id)) }),
  playlist({ id: 'playlist:weekend', name: 'Weekend Energy', description: 'Start somewhere warm', artworkUrl: art.pink, isSystem: false, isProtected: false, position: 3, tracks: DEMO_TRACKS.filter((candidate) => ['demo:track:somewhere-warm', 'demo:track:velvet-rope', 'demo:track:all-night', 'demo:track:open-window'].includes(candidate.id)) })
];

const pinnedSpeedDialPlaylist = (playlist: Playlist, position: number): SpeedDialItem => ({ kind: 'playlist', id: playlist.id, playlist, isPinned: true, source: 'pinned', position });
const frequentSpeedDialTrack = (track: Track, position: number): SpeedDialItem => ({ kind: 'track', id: track.id, track, isPinned: false, source: 'frequent', position });
const frequentSpeedDialPlaylist = (playlist: Playlist, position: number): SpeedDialItem => ({ kind: 'playlist', id: playlist.id, playlist, isPinned: false, source: 'frequent', position });

const DEMO_SPEED_DIAL: SpeedDialItem[] = [
  pinnedSpeedDialPlaylist(DEMO_PLAYLISTS[1], 0),
  pinnedSpeedDialPlaylist(DEMO_PLAYLISTS[2], 1),
  pinnedSpeedDialPlaylist(DEMO_PLAYLISTS[3], 2),
  frequentSpeedDialTrack(DEMO_TRACKS[4], 0),
  frequentSpeedDialTrack(DEMO_TRACKS[1], 1),
  frequentSpeedDialTrack(DEMO_TRACKS[6], 2),
  frequentSpeedDialTrack(DEMO_TRACKS[3], 3),
  frequentSpeedDialPlaylist(DEMO_PLAYLISTS[0], 4)
];

export const DEMO_ARTISTS = artists;
export const DEMO_ALBUMS = albums;

export const DEMO_APP_STATE: AppState = {
  user: { id: 'default', displayName: 'Evan Holovachuk', avatarUrl: art.blue },
  library: {
    playlists: DEMO_PLAYLISTS.filter((item) => item.id !== 'liked'),
    likedPlaylist: DEMO_PLAYLISTS[0],
    recentlyPlayed: [DEMO_TRACKS[1], DEMO_TRACKS[4], DEMO_TRACKS[6], DEMO_TRACKS[2]],
    savedTracks: DEMO_TRACKS.filter((item) => item.isSaved),
    recentSearches: ['dirty diana', 'lemonade', 'legendary lovers', 'yesterday is gone'],
    speedDial: DEMO_SPEED_DIAL
  },
  homeRecommendations: [DEMO_TRACKS[4], DEMO_TRACKS[6], DEMO_TRACKS[2], DEMO_TRACKS[10], DEMO_TRACKS[8], DEMO_TRACKS[13]],
  acquisitionJobs: []
};

export function findDemoTrack(trackId: string) {
  return DEMO_TRACKS.find((item) => item.id === trackId);
}

export function findDemoPlaylist(playlistId: string) {
  return DEMO_PLAYLISTS.find((item) => item.id === playlistId);
}
