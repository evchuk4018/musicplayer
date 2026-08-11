import type { Track } from '@/domain/music';
import { mapTrackRow, trackColumns, type TrackRow } from '@/server/catalog/catalog-repository';
import { query, withTransaction } from '@/server/db/client';

export const MAX_SPEED_DIAL_ITEMS = 9;

export type SpeedDialKind = 'track' | 'playlist';

export type SpeedDialPin = {
  kind: SpeedDialKind;
  id: string;
  position: number;
};

export class SpeedDialCapacityError extends Error {
  constructor() {
    super(`Speed Dial is full. Remove a pinned item before adding another.`);
    this.name = 'SpeedDialCapacityError';
  }
}

function itemKey(kind: SpeedDialKind, id: string) {
  return `${kind}:${id}`;
}

export async function getSpeedDialPins() {
  const result = await query<{ item_type: SpeedDialKind; track_id: string | null; playlist_id: string | null; position: number }>(
    `SELECT item_type, track_id, playlist_id, position
     FROM speed_dial_items
     WHERE user_id = 'default'
     ORDER BY position, created_at`
  );
  return result.rows.flatMap((row) => {
    const id = row.item_type === 'track' ? row.track_id : row.playlist_id;
    return id ? [{ kind: row.item_type, id, position: row.position }] : [];
  });
}

export async function getFrequentSpeedDialTracks(limit = 500): Promise<Track[]> {
  const result = await query<TrackRow>(
    `SELECT ${trackColumns}
     FROM tracks
     WHERE play_count > 0
     ORDER BY play_count DESC, last_played_at DESC NULLS LAST, title
     LIMIT $1`,
    [limit]
  );
  return result.rows.map(mapTrackRow);
}

export async function toggleSpeedDialPin(kind: SpeedDialKind, id: string, enabled: boolean) {
  const key = itemKey(kind, id);
  if (!enabled) {
    await query(`DELETE FROM speed_dial_items WHERE user_id = 'default' AND item_key = $1`, [key]);
    return;
  }

  const existing = await query(`SELECT 1 FROM speed_dial_items WHERE user_id = 'default' AND item_key = $1`, [key]);
  if (existing.rowCount) return;

  const count = await query<{ count: string }>(`SELECT count(*)::text AS count FROM speed_dial_items WHERE user_id = 'default'`);
  if (Number(count.rows[0]?.count ?? 0) >= MAX_SPEED_DIAL_ITEMS) throw new SpeedDialCapacityError();

  await query(
    `INSERT INTO speed_dial_items (user_id, item_key, item_type, track_id, playlist_id, position)
     VALUES ('default', $1, $2, $3, $4, (SELECT coalesce(max(position), -1) + 1 FROM speed_dial_items WHERE user_id = 'default'))
     ON CONFLICT (user_id, item_key) DO NOTHING`,
    [key, kind, kind === 'track' ? id : null, kind === 'playlist' ? id : null]
  );
}

export async function reorderSpeedDial(items: Array<{ kind: SpeedDialKind; id: string }>) {
  await withTransaction(async (client) => {
    for (const [position, item] of items.slice(0, MAX_SPEED_DIAL_ITEMS).entries()) {
      await client.query(
        `UPDATE speed_dial_items SET position = $2, updated_at = now()
         WHERE user_id = 'default' AND item_key = $1`,
        [itemKey(item.kind, item.id), position]
      );
    }
  });
}
