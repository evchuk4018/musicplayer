import { z } from 'zod';

export const trackSchema = z.object({
  id: z.string().min(1),
  canonicalKey: z.string().min(1),
  title: z.string().min(1),
  artistId: z.string().min(1),
  artistName: z.string().min(1),
  albumId: z.string().optional(),
  albumName: z.string().optional(),
  artworkUrl: z.string().url(),
  previewUrl: z.string().url().optional(),
  streamUrl: z.string().url().optional(),
  sourceUrl: z.string().url().optional(),
  durationSeconds: z.number().nonnegative(),
  genre: z.string().optional(),
  year: z.number().optional(),
  tempo: z.number().optional(),
  mood: z.string().optional(),
  energy: z.number().optional(),
  isLocal: z.boolean(),
  localPath: z.string().optional(),
  isLiked: z.boolean(),
  isSaved: z.boolean(),
  isProtected: z.boolean(),
  acquiredAt: z.string().optional(),
  lastPlayedAt: z.string().optional(),
  playCount: z.number().nonnegative(),
  source: z.enum(['local', 'deezer', 'demo', 'navidrome'])
});

export const playlistCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).optional(),
  artworkUrl: z.string().url().optional()
});

export const playlistUpdateSchema = playlistCreateSchema.partial();

export const trackMutationSchema = z.object({ trackId: z.string().min(1) });

export const eventSchema = z.object({
  trackId: z.string().min(1),
  eventType: z.enum(['play', 'pause', 'complete', 'skip', 'replay', 'like', 'unlike', 'playlist_add', 'playlist_remove']),
  positionSeconds: z.number().nonnegative().optional(),
  completionPercent: z.number().min(0).max(100).optional(),
  context: z.string().max(80).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const speedDialPinSchema = z.object({
  kind: z.enum(['track', 'playlist']),
  itemId: z.string().min(1),
  enabled: z.boolean()
});

export const speedDialOrderSchema = z.object({
  items: z.array(z.object({ kind: z.enum(['track', 'playlist']), itemId: z.string().min(1) })).max(9)
});
