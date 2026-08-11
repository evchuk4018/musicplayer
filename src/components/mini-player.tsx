import { ChevronUp, Pause, Play } from 'lucide-react';
import type { Track } from '@/domain/music';
import { Artwork } from './artwork';

type MiniPlayerProps = {
  track?: Track;
  isPlaying: boolean;
  progress: number;
  onToggle: () => void;
  onExpand: () => void;
};

export function MiniPlayer({ track, isPlaying, progress, onToggle, onExpand }: MiniPlayerProps) {
  if (!track) return null;
  return (
    <section className="mini-player" aria-label="Mini player">
      <button className="mini-player-main" onClick={onExpand} aria-label="Open Now Playing">
        <Artwork src={track.artworkUrl} alt="" size="sm" />
        <span className="mini-copy"><strong>{track.title}</strong><span>{track.artistName}</span></span>
      </button>
      <div className="mini-actions">
        <button className="mini-play" onClick={onToggle} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
        <button className="icon-button" onClick={onExpand} aria-label="Expand player"><ChevronUp size={21} /></button>
      </div>
      <div className="mini-progress"><span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>
    </section>
  );
}
