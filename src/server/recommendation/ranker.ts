import type { Track } from '@/domain/music';
import { trackRelationshipScore, type ArtistRelationship } from './relationship-graph';

type Event = {
  track_id: string;
  event_type: string;
  completion_percent: number | null;
  position_seconds: number | null;
  occurred_at: Date;
};

function daysSince(date: Date) {
  return Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
}

function eventSignal(event: Event) {
  const completion = event.completion_percent ?? 0;
  if (event.event_type === 'like') return 0.95;
  if (event.event_type === 'unlike') return -0.16;
  if (event.event_type === 'playlist_add') return 0.86;
  if (event.event_type === 'playlist_remove') return -0.2;
  if (event.event_type === 'replay') return 0.48;
  if (event.event_type === 'complete') return 0.34;
  if (event.event_type === 'play') return 0.08;
  if (event.event_type === 'skip') {
    if (completion < 10) return -0.8;
    if (completion < 35) return -0.52;
    if (completion < 70) return -0.24;
    return -0.05;
  }
  return 0;
}

export function rankRecommendations(candidates: Track[], seed: Track | undefined, relationships: ArtistRelationship[], events: Event[], limit = 12) {
  const tasteByTrack = new Map<string, number>();
  const exposureByTrack = new Map<string, number>();
  const candidateById = new Map(candidates.map((track) => [track.id, track]));
  const exposureByArtist = new Map<string, number>();
  const exposureByAlbum = new Map<string, number>();

  for (const event of events) {
    const recency = Math.exp(-daysSince(event.occurred_at) / 21);
    const signal = eventSignal(event) * recency;
    tasteByTrack.set(event.track_id, (tasteByTrack.get(event.track_id) ?? 0) + signal);
    if (event.event_type === 'play' || event.event_type === 'complete' || event.event_type === 'replay') {
      exposureByTrack.set(event.track_id, (exposureByTrack.get(event.track_id) ?? 0) + recency);
      const playedTrack = candidateById.get(event.track_id);
      if (playedTrack) {
        exposureByArtist.set(playedTrack.artistId, (exposureByArtist.get(playedTrack.artistId) ?? 0) + recency);
        if (playedTrack.albumId) exposureByAlbum.set(playedTrack.albumId, (exposureByAlbum.get(playedTrack.albumId) ?? 0) + recency);
      }
    }
  }

  const scored = candidates.map((track) => {
    const base = trackRelationshipScore(seed, track, relationships);
    const favoriteBoost = track.isLiked ? 0.34 : track.isSaved ? 0.24 : 0;
    const tasteBoost = Math.max(-0.7, Math.min(0.9, tasteByTrack.get(track.id) ?? 0));
    const recentPenalty = Math.min(0.48, (exposureByTrack.get(track.id) ?? 0) * 0.22);
    const artistPenalty = Math.min(0.28, (exposureByArtist.get(track.artistId) ?? 0) * 0.11);
    const albumPenalty = track.albumId ? Math.min(0.18, (exposureByAlbum.get(track.albumId) ?? 0) * 0.08) : 0;
    const exploration = track.playCount === 0 ? 0.08 : 0;
    return { track, score: base + favoriteBoost + tasteBoost + exploration - recentPenalty - artistPenalty - albumPenalty };
  });

  const selected: Track[] = [];
  const selectedArtists = new Map<string, number>();
  const selectedAlbums = new Map<string, number>();
  while (selected.length < limit && scored.length) {
    scored.sort((left, right) => {
      const leftRepeat = (selectedArtists.get(left.track.artistId) ?? 0) * 0.16 + (left.track.albumId ? (selectedAlbums.get(left.track.albumId) ?? 0) * 0.1 : 0);
      const rightRepeat = (selectedArtists.get(right.track.artistId) ?? 0) * 0.16 + (right.track.albumId ? (selectedAlbums.get(right.track.albumId) ?? 0) * 0.1 : 0);
      return right.score - rightRepeat - (left.score - leftRepeat);
    });
    const next = scored.shift();
    if (!next) break;
    selected.push(next.track);
    selectedArtists.set(next.track.artistId, (selectedArtists.get(next.track.artistId) ?? 0) + 1);
    if (next.track.albumId) selectedAlbums.set(next.track.albumId, (selectedAlbums.get(next.track.albumId) ?? 0) + 1);
  }
  return selected;
}
