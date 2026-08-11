import { ChevronDown, Heart, ListMusic, Pause, Play, Repeat2, Shuffle, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import type { QueueItem, Track } from '@/domain/music';
import { Artwork } from './artwork';

type NowPlayingProps = {
  track: Track;
  queue: QueueItem[];
  isPlaying: boolean;
  progressSeconds: number;
  durationSeconds: number;
  isLiked: boolean;
  shuffle: boolean;
  repeat: boolean;
  onClose: () => void;
  onToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (value: number) => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onLike: () => void;
  onAdd: () => void;
  volume: number;
  onVolume: (value: number) => void;
  autoplayEnabled: boolean;
  onAutoplay: () => void;
  onQueueTrack: (track: Track) => void;
};

function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00';
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
}

export function NowPlaying({ track, queue, isPlaying, progressSeconds, durationSeconds, isLiked, shuffle, repeat, onClose, onToggle, onPrevious, onNext, onSeek, onShuffle, onRepeat, onLike, onAdd, volume, onVolume, autoplayEnabled, onAutoplay, onQueueTrack }: NowPlayingProps) {
  return (
    <div className="now-playing-screen">
      <header className="now-playing-header">
        <button className="icon-button" onClick={onClose} aria-label="Close Now Playing"><ChevronDown size={28} /></button>
        <span>NOW PLAYING</span>
        <button className="icon-button" aria-label="Open queue"><ListMusic size={23} /></button>
      </header>
      <main className="now-playing-content">
        <Artwork src={track.artworkUrl} alt={`${track.title} artwork`} size="hero" priority />
        <div className="now-playing-meta"><div><h1>{track.title}</h1><p>{track.artistName}</p></div><button className={`icon-button now-like ${isLiked ? 'is-liked' : ''}`} onClick={onLike} aria-label={isLiked ? 'Unlike song' : 'Like song'}><Heart size={26} fill={isLiked ? 'currentColor' : 'none'} /></button></div>
        <input className="seek-bar" type="range" min="0" max={Math.max(durationSeconds, 1)} step="1" value={Math.min(progressSeconds, durationSeconds || 1)} onChange={(event) => onSeek(Number(event.target.value))} aria-label="Seek" />
        <div className="time-row"><span>{formatTime(progressSeconds)}</span><span>{formatTime(durationSeconds)}</span></div>
        <div className="player-controls"><button className={`icon-button control-secondary ${shuffle ? 'is-active' : ''}`} onClick={onShuffle} aria-label="Toggle shuffle"><Shuffle size={20} /></button><button className="icon-button control-skip" onClick={onPrevious} aria-label="Previous track"><SkipBack size={25} fill="currentColor" /></button><button className="main-play" onClick={onToggle} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={29} fill="currentColor" /> : <Play size={29} fill="currentColor" />}</button><button className="icon-button control-skip" onClick={onNext} aria-label="Next track"><SkipForward size={25} fill="currentColor" /></button><button className={`icon-button control-secondary ${repeat ? 'is-active' : ''}`} onClick={onRepeat} aria-label="Toggle repeat"><Repeat2 size={20} /></button></div>
        <div className="now-actions"><button className="secondary-action" onClick={onAdd}><ListMusic size={18} /> Add to playlist</button><button className={`secondary-action autoplay-action ${autoplayEnabled ? 'is-active' : ''}`} onClick={onAutoplay}>Autoplay {autoplayEnabled ? 'on' : 'off'}</button><label className="volume-control"><Volume2 size={18} /><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => onVolume(Number(event.target.value))} aria-label="Volume" /></label></div>
        <section className="up-next"><div className="section-heading"><div><span className="eyebrow">UP NEXT</span><h2>Ready for you</h2></div><span className="queue-count">{queue.length} queued</span></div>{queue.slice(0, 5).map((item) => <button className="up-next-row" key={item.id} onClick={() => onQueueTrack(item)}><Artwork src={item.artworkUrl} alt="" size="sm" /><span><strong>{item.title}</strong><small>{item.artistName}</small></span><span className={`queue-state queue-state-${item.queueState ?? 'ready'}`}>{item.queueState === 'preparing' ? 'preparing' : 'ready'}</span></button>)}</section>
      </main>
    </div>
  );
}
