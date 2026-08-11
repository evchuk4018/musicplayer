import type { Playlist, SpeedDialItem, Track } from '@/domain/music';
import { getFrequentSpeedDialTracks, getSpeedDialPins } from './speed-dial-repository';

const MAX_SPEED_DIAL_ITEMS = 9;

function daysSince(date: string | undefined) {
  if (!date) return Number.POSITIVE_INFINITY;
  return Math.max(0, (Date.now() - new Date(date).getTime()) / 86_400_000);
}

function trackFrequencyScore(track: Track) {
  if (track.playCount <= 0) return 0;
  const days = daysSince(track.lastPlayedAt);
  const recencyWeight = Number.isFinite(days) ? Math.exp(-days / 30) : 1;
  return track.playCount * recencyWeight;
}

export async function getSpeedDialSnapshot(playlists: Playlist[], libraryTracks: Track[]) {
  const [pins, frequentTracks] = await Promise.all([getSpeedDialPins(), getFrequentSpeedDialTracks()]);
  const tracks = Array.from(new Map([...libraryTracks, ...frequentTracks].map((track) => [track.id, track])).values());
  const tracksById = new Map(tracks.map((track) => [track.id, track]));
  const playlistsById = new Map(playlists.map((playlist) => [playlist.id, playlist]));

  const pinned: SpeedDialItem[] = [];
  for (const pin of pins) {
    if (pin.kind === 'track') {
      const track = tracksById.get(pin.id);
      if (track) pinned.push({ kind: 'track', id: track.id, track, isPinned: true, source: 'pinned', position: pin.position });
      continue;
    }
    const playlist = playlistsById.get(pin.id);
    if (playlist) pinned.push({ kind: 'playlist', id: playlist.id, playlist, isPinned: true, source: 'pinned', position: pin.position });
  }

  const pinnedKeys = new Set(pinned.map((item) => `${item.kind}:${item.id}`));
  const trackScores = new Map(frequentTracks.map((track) => [track.id, trackFrequencyScore(track)]));
  const frequentTrackItems: SpeedDialItem[] = frequentTracks
    .map((track) => ({ track, score: trackScores.get(track.id) ?? 0 }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ track }, position) => ({ kind: 'track' as const, id: track.id, track, isPinned: false, source: 'frequent' as const, position }));

  const frequentPlaylistItems: Array<{ item: SpeedDialItem; score: number }> = playlists
    .map((playlist) => {
      const score = playlist.tracks.reduce((total, track) => total + (trackScores.get(track.id) ?? trackFrequencyScore(track)), 0);
      return {
        score,
        item: { kind: 'playlist' as const, id: playlist.id, playlist, isPinned: false, source: 'frequent' as const, position: 0 }
      };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ item, score }, position) => ({ item: { ...item, position }, score }));

  const automatic = [...frequentTrackItems.map((item) => ({ item, score: trackScores.get(item.id) ?? 0 })), ...frequentPlaylistItems]
    .filter(({ item }) => !pinnedKeys.has(`${item.kind}:${item.id}`))
    .sort((left, right) => right.score - left.score)
    .map(({ item }, position) => ({ ...item, position }));

  return [...pinned.sort((left, right) => left.position - right.position), ...automatic].slice(0, MAX_SPEED_DIAL_ITEMS);
}
