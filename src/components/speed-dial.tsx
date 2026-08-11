import { ChevronLeft, ChevronRight, Pin } from 'lucide-react';
import type { Playlist, SpeedDialItem, SpeedDialTarget, Track } from '@/domain/music';
import { Artwork } from './artwork';

type SpeedDialProps = {
  items: SpeedDialItem[];
  onPlayTrack: (track: Track) => void;
  onOpenPlaylist: (playlist: Playlist) => void;
  onTogglePin: (target: SpeedDialTarget, enabled: boolean) => void;
  onMove: (item: SpeedDialItem, direction: -1 | 1) => void;
};

function targetFor(item: SpeedDialItem): SpeedDialTarget {
  return item.kind === 'track' ? { kind: 'track', id: item.id, track: item.track } : { kind: 'playlist', id: item.id, playlist: item.playlist };
}

export function SpeedDial({ items, onPlayTrack, onOpenPlaylist, onTogglePin, onMove }: SpeedDialProps) {
  const pinnedItems = items.filter((item) => item.isPinned);
  return (
    <section className="speed-dial-section">
      <div className="section-heading section-heading-tight">
        <div><span className="eyebrow">EVAN HOLOVACHUK</span><h2>Speed Dial</h2></div>
        <span className="section-note">{pinnedItems.length} pinned · {items.length}/9</span>
      </div>
      {items.length ? <div className="speed-dial-grid">
        {items.map((item) => {
          const pinnedIndex = item.isPinned ? pinnedItems.findIndex((candidate) => candidate.id === item.id && candidate.kind === item.kind) : -1;
          const name = item.kind === 'track' ? item.track.title : item.playlist.name;
          const detail = item.kind === 'track' ? item.track.artistName : `${item.playlist.trackCount} tracks`;
          return <article className={`speed-card speed-card-${item.kind} ${item.isPinned ? 'is-pinned' : ''}`} key={`${item.kind}:${item.id}`}>
            <button className="speed-card-main" onClick={() => item.kind === 'track' ? onPlayTrack(item.track) : onOpenPlaylist(item.playlist)} aria-label={item.kind === 'track' ? `Play ${name} by ${detail}` : `Open ${name}`}>
              <Artwork src={item.kind === 'track' ? item.track.artworkUrl : item.playlist.artworkUrl} alt="" size="lg" />
              <span>{name}</span>
              <small>{detail}</small>
            </button>
            {item.isPinned ? <div className="speed-card-tools">
              <button className="icon-button" onClick={() => onMove(item, -1)} disabled={pinnedIndex === 0} aria-label={`Move ${name} left`}><ChevronLeft size={16} /></button>
              <button className="icon-button" onClick={() => onMove(item, 1)} disabled={pinnedIndex === pinnedItems.length - 1} aria-label={`Move ${name} right`}><ChevronRight size={16} /></button>
              <button className="icon-button is-pinned" onClick={() => onTogglePin(targetFor(item), false)} aria-label={`Unpin ${name} from Speed Dial`}><Pin size={15} fill="currentColor" /></button>
            </div> : <span className="speed-card-source">Often played</span>}
          </article>;
        })}
      </div> : <div className="empty-state speed-dial-empty">Pin songs or playlists in Library, or listen to a few favorites to fill Speed Dial.</div>}
    </section>
  );
}
