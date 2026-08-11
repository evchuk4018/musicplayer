export type CatalogSource = 'local' | 'deezer' | 'demo' | 'navidrome';

export type Track = {
  id: string;
  canonicalKey: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId?: string;
  albumName?: string;
  artworkUrl: string;
  previewUrl?: string;
  streamUrl?: string;
  sourceUrl?: string;
  durationSeconds: number;
  genre?: string;
  year?: number;
  tempo?: number;
  mood?: string;
  energy?: number;
  isLocal: boolean;
  localPath?: string;
  isLiked: boolean;
  isSaved: boolean;
  isProtected: boolean;
  acquiredAt?: string;
  lastPlayedAt?: string;
  playCount: number;
  source: CatalogSource;
};

export type Artist = {
  id: string;
  name: string;
  imageUrl: string;
  genres: string[];
  similarArtistIds: string[];
  source: CatalogSource;
};

export type Album = {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  artworkUrl: string;
  releaseYear?: number;
  tracks: Track[];
  source: CatalogSource;
};

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  artworkUrl: string;
  isSystem: boolean;
  isProtected: boolean;
  position: number;
  trackCount: number;
  tracks: Track[];
};

export type SpeedDialTarget =
  | { kind: 'track'; id: string; track: Track }
  | { kind: 'playlist'; id: string; playlist: Playlist };

export type SpeedDialItem =
  | {
      kind: 'track';
      id: string;
      track: Track;
      isPinned: boolean;
      source: 'pinned' | 'frequent';
      position: number;
    }
  | {
      kind: 'playlist';
      id: string;
      playlist: Playlist;
      isPinned: boolean;
      source: 'pinned' | 'frequent';
      position: number;
    };

export type AcquisitionStatus = 'queued' | 'processing' | 'ready' | 'failed' | 'cancelled' | 'blocked';

export type AcquisitionJob = {
  id: string;
  trackId: string;
  status: AcquisitionStatus;
  progress: number;
  error?: string;
  attempts: number;
};

export type RecommendationContext = 'home' | 'track-radio' | 'artist-radio';

export type LibrarySnapshot = {
  playlists: Playlist[];
  likedPlaylist: Playlist;
  recentlyPlayed: Track[];
  savedTracks: Track[];
  recentSearches: string[];
  speedDial: SpeedDialItem[];
};

export type AppState = {
  user: { id: string; displayName: string; avatarUrl: string };
  library: LibrarySnapshot;
  homeRecommendations: Track[];
  acquisitionJobs: AcquisitionJob[];
};

export type SearchResults = {
  query: string;
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
};

export type QueueItem = Track & {
  queueSource?: string;
  queueState?: 'ready' | 'preparing' | 'failed';
};

export type ListeningEventType = 'play' | 'pause' | 'complete' | 'skip' | 'replay' | 'like' | 'unlike' | 'playlist_add' | 'playlist_remove';
