import { Bell, ChevronRight, Play, Sparkles } from 'lucide-react';
import type { AppState, Playlist, Track } from '@/domain/music';
import { Artwork } from './artwork';
import { QuickDial } from './quick-dial';
import { TrackRow } from './track-row';

type HomeViewProps = {
  state: AppState;
  recommendations: Track[];
  onPlay: (track: Track) => void;
  onPlayAll: (tracks: Track[]) => void;
  onLike: (track: Track) => void;
  onAdd: (track: Track) => void;
  onOpenPlaylist: (playlist: Playlist) => void;
  onToggleQuickDial: (playlist: Playlist, enabled: boolean) => void;
  onMoveQuickDial: (playlist: Playlist, direction: -1 | 1) => void;
};

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className="section-heading"><h2>{title}</h2>{action && <button className="text-button" onClick={onAction}>{action}<ChevronRight size={16} /></button>}</div>;
}

export function HomeView({ state, recommendations, onPlay, onPlayAll, onLike, onAdd, onOpenPlaylist, onToggleQuickDial, onMoveQuickDial }: HomeViewProps) {
  const quickPicks = recommendations.slice(0, 6);
  return (
    <div className="view home-view">
      <header className="home-header"><div className="brand-mark"><span className="brand-dot"><Play size={15} fill="currentColor" /></span><span>pulse</span></div><div className="header-actions"><button className="icon-button notification-button" aria-label="Notifications"><Bell size={22} /><span>9+</span></button><Artwork src={state.user.avatarUrl} alt={state.user.displayName} size="sm" rounded="circle" /></div></header>
      <div className="mood-pills"><button className="mood-pill is-active">Quick Dial</button><button className="mood-pill">Energize</button><button className="mood-pill">Feel good</button><button className="mood-pill">Relax</button><button className="mood-pill">Work mode</button></div>
      <QuickDial items={state.library.quickDial} allPlaylists={[state.library.likedPlaylist, ...state.library.playlists]} onOpen={onOpenPlaylist} onToggle={onToggleQuickDial} onMove={onMoveQuickDial} />
      <section className="music-section"><SectionTitle title="Quick picks" action="Play all" onAction={() => onPlayAll(quickPicks)} /><div className="track-list">{quickPicks.map((track) => <TrackRow key={track.id} track={track} onPlay={onPlay} onLike={onLike} onAdd={onAdd} status={track.isLocal ? 'ready' : 'preparing'} />)}</div></section>
      <section className="music-section"><SectionTitle title="Recently played" action="See all" /><div className="artwork-scroll">{state.library.recentlyPlayed.map((track) => <button className="artwork-card" key={track.id} onClick={() => onPlay(track)}><Artwork src={track.artworkUrl} alt="" size="lg" /><strong>{track.title}</strong><span>{track.artistName}</span></button>)}</div></section>
      <section className="music-section"><SectionTitle title="Made for this moment" /><div className="feature-grid">{recommendations.slice(0, 3).map((track, index) => <button className={`feature-card feature-card-${index}`} key={track.id} onClick={() => onPlay(track)}><Artwork src={track.artworkUrl} alt="" size="lg" /><span className="feature-kicker"><Sparkles size={13} /> {index === 0 ? 'For you' : 'Recommended'}</span><strong>{track.artistName}</strong><small>{track.title}</small></button>)}</div></section>
    </div>
  );
}
