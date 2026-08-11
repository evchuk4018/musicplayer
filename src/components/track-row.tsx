import { Bookmark, Heart, ListPlus, Play } from 'lucide-react';
import type { Track } from '@/domain/music';
import { Artwork } from './artwork';

type TrackRowProps = {
  track: Track;
  onPlay: (track: Track) => void;
  onLike: (track: Track) => void;
  onAdd: (track: Track) => void;
  onSave?: (track: Track) => void;
  compact?: boolean;
  showPlay?: boolean;
  status?: 'ready' | 'preparing' | 'failed';
};

export function TrackRow({ track, onPlay, onLike, onAdd, onSave, compact = false, showPlay = true, status }: TrackRowProps) {
  return (
    <div className={`track-row ${compact ? 'track-row-compact' : ''}`}>
      <button className="track-main" onClick={() => onPlay(track)} aria-label={`Play ${track.title} by ${track.artistName}`}>
        <Artwork src={track.artworkUrl} alt="" size={compact ? 'sm' : 'md'} />
        <span className="track-copy">
          <strong>{track.title}</strong>
          <span>{track.artistName}{track.albumName ? ` · ${track.albumName}` : ''}</span>
          {status === 'preparing' && <em className="track-status">Preparing in background</em>}
          {status === 'failed' && <em className="track-status track-status-error">Couldn’t prepare this one</em>}
        </span>
        {showPlay && <span className="row-play"><Play size={17} fill="currentColor" /></span>}
      </button>
      <button className={`icon-button row-action ${track.isLiked ? 'is-liked' : ''}`} onClick={() => onLike(track)} aria-label={track.isLiked ? `Unlike ${track.title}` : `Like ${track.title}`}>
        <Heart size={18} fill={track.isLiked ? 'currentColor' : 'none'} />
      </button>
      <button className="icon-button row-action" onClick={() => onAdd(track)} aria-label={`Add ${track.title} to a playlist`}>
        <ListPlus size={18} />
      </button>
      {onSave && <button className={`icon-button row-action ${track.isSaved ? 'is-saved' : ''}`} onClick={() => onSave(track)} aria-label={track.isSaved ? `Unsave ${track.title}` : `Save ${track.title}`}><Bookmark size={18} fill={track.isSaved ? 'currentColor' : 'none'} /></button>}
    </div>
  );
}
