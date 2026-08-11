import { ChevronRight, Sparkles } from 'lucide-react';
import type { AppState, Playlist, SpeedDialItem, SpeedDialTarget, Track } from '@/domain/music';
import { Artwork } from './artwork';
import { SpeedDial } from './speed-dial';
import { TrackRow } from './track-row';

type HomeViewProps = {
  state: AppState;
  recommendations: Track[];
  onPlay: (track: Track) => void;
  onPlayAll: (tracks: Track[]) => void;
  onLike: (track: Track) => void;
  onAdd: (track: Track) => void;
  onSave: (track: Track) => void;
  onOpenPlaylist: (playlist: Playlist) => void;
  onToggleSpeedDial: (target: SpeedDialTarget, enabled: boolean) => void;
  onMoveSpeedDial: (item: SpeedDialItem, direction: -1 | 1) => void;
};

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className="section-heading"><h2>{title}</h2>{action && onAction && <button className="text-button" onClick={onAction}>{action}<ChevronRight size={16} /></button>}</div>;
}

export function HomeView({ state, recommendations, onPlay, onPlayAll, onLike, onAdd, onSave, onOpenPlaylist, onToggleSpeedDial, onMoveSpeedDial }: HomeViewProps) {
  const quickPicks = recommendations.slice(0, 6);
  return (
    <div className="view home-view">
      <SpeedDial items={state.library.speedDial} onPlayTrack={onPlay} onOpenPlaylist={onOpenPlaylist} onTogglePin={onToggleSpeedDial} onMove={onMoveSpeedDial} />
      <section className="music-section"><SectionTitle title="Quick picks" action="Play all" onAction={() => onPlayAll(quickPicks)} /><div className="track-list">{quickPicks.map((track) => <TrackRow key={track.id} track={track} onPlay={onPlay} onLike={onLike} onAdd={onAdd} onSave={onSave} status={track.isLocal ? 'ready' : 'preparing'} />)}</div></section>
      <section className="music-section"><SectionTitle title="Recently played" /><div className="artwork-scroll">{state.library.recentlyPlayed.map((track) => <button className="artwork-card" key={track.id} onClick={() => onPlay(track)}><Artwork src={track.artworkUrl} alt="" size="lg" /><strong>{track.title}</strong><span>{track.artistName}</span></button>)}</div></section>
      <section className="music-section"><SectionTitle title="Made for this moment" /><div className="feature-grid">{recommendations.slice(0, 3).map((track, index) => <button className={`feature-card feature-card-${index}`} key={track.id} onClick={() => onPlay(track)}><Artwork src={track.artworkUrl} alt="" size="lg" /><span className="feature-kicker"><Sparkles size={13} /> {index === 0 ? 'For you' : 'Recommended'}</span><strong>{track.artistName}</strong><small>{track.title}</small></button>)}</div></section>
    </div>
  );
}
