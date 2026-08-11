import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import type { Playlist } from '@/domain/music';
import { Artwork } from './artwork';

type QuickDialProps = {
  items: Playlist[];
  allPlaylists: Playlist[];
  onOpen: (playlist: Playlist) => void;
  onToggle: (playlist: Playlist, enabled: boolean) => void;
  onMove: (playlist: Playlist, direction: -1 | 1) => void;
};

export function QuickDial({ items, allPlaylists, onOpen, onToggle, onMove }: QuickDialProps) {
  const available = allPlaylists.filter((playlist) => !items.some((item) => item.id === playlist.id));
  return (
    <section className="quick-dial-section">
      <div className="section-heading section-heading-tight"><div><span className="eyebrow">EVAN HOLOVACHUK</span><h2>Quick Dial</h2></div><span className="section-note">{items.length}/6 pinned</span></div>
      <div className="quick-dial-grid">
        {items.map((playlist, index) => <article className="quick-card" key={playlist.id}><button className="quick-card-main" onClick={() => onOpen(playlist)}><Artwork src={playlist.artworkUrl} alt="" size="lg" /><span>{playlist.name}</span></button><div className="quick-card-tools"><button className="icon-button" onClick={() => onMove(playlist, -1)} disabled={index === 0} aria-label={`Move ${playlist.name} left`}><ChevronLeft size={16} /></button><button className="icon-button" onClick={() => onMove(playlist, 1)} disabled={index === items.length - 1} aria-label={`Move ${playlist.name} right`}><ChevronRight size={16} /></button><button className="icon-button" onClick={() => onToggle(playlist, false)} aria-label={`Remove ${playlist.name} from Quick Dial`}><X size={15} /></button></div></article>)}
        {items.length < 6 && <details className="quick-add"><summary><Plus size={24} /><span>Add playlist</span></summary><div className="quick-add-menu">{available.length ? available.map((playlist) => <button key={playlist.id} onClick={() => onToggle(playlist, true)}>{playlist.name}<Plus size={16} /></button>) : <span>All playlists are pinned</span>}</div></details>}
      </div>
    </section>
  );
}
