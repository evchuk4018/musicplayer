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

export function rankRecommendations(candidates: Track[], seed: Track | undefined, relationships: ArtistRelationship[], events: Event[], limit = 12) {
  const recentTrackCount = new Map<string, number>();
  const recentArtistCount = new Map<string, number>();
  const skippedTracks = new Map<string, number>();
  for (const event of events) {
    const age = daysSince(event.occurred_at);
    const recency = Math.exp(-age / 21);
    if (event.event_type === 'play' || event.event_type === 'complete' || event.event_type === 'replay') {
      recentTrackCount.set(event.track_id, (recentTrackCount.get(event.track_id) ?? 0) + recency);
    }
    if (event.event_type === 'skip' && (event.completion_percent ?? 0) < 45) {
      skippedTracks.set(event.track_id, (skippedTracks.get(event.track_id) ?? 0) + recency * ((event.completion_percent ?? 0) < 10 ? 1.4 : 0.8));
    }
  }

  const artistHistory = new Map<string, number>();
  return candidates
    .map((track) => {
      const base = trackRelationshipScore(seed, track, relationships);
      const favoriteBoost = track.isLiked ? 0.34 : track.isSaved ? 0.24 : 0;
      const recentPenalty = Math.min(0.48, (recentTrackCount.get(track.id) ?? 0) * 0.22);
      const skipPenalty = Math.min(0.55, (skippedTracks.get(track.id) ?? 0) * 0.24);
      const artistPenalty = Math.min(0.22, (artistHistory.get(track.artistId) ?? 0) * 0.06);
      const exploration = track.playCount === 0 ? 0.08 : 0;
      const score = base + favoriteBoost + exploration - recentPenalty - skipPenalty - artistPenalty;
      artistHistory.set(track.artistId, (artistHistory.get(track.artistId) ?? 0) + 1);
      return { track, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ track }) => track);
}
