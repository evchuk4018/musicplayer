import { ArrowLeft, Clock3, Mic2, Search as SearchIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Album, Artist, SearchResults, Track } from '@/domain/music';
import { appPath } from '@/lib/api-path';
import { Artwork } from './artwork';
import { CatalogDetail } from './catalog-detail';
import { TrackRow } from './track-row';

type SearchViewProps = {
  recentSearches: string[];
  onPlay: (track: Track) => void;
  onLike: (track: Track) => void;
  onAdd: (track: Track) => void;
};

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="result-group"><div className="section-heading"><h2>{title}</h2></div>{children}</section>;
}

export function SearchView({ recentSearches, onPlay, onLike, onAdd }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<{ kind: 'artist'; id: string } | { kind: 'album'; id: string }>();

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(appPath(`/api/search?q=${encodeURIComponent(trimmed)}`), { signal: controller.signal });
        if (response.ok) setResults(await response.json() as SearchResults);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') console.error(error);
      } finally {
        setLoading(false);
      }
    }, 260);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query]);

  const submitRecent = (value: string) => setQuery(value);
  if (detail) return <CatalogDetail detail={detail} onBack={() => setDetail(undefined)} onPlay={onPlay} onLike={onLike} onAdd={onAdd} onOpenAlbum={(albumId) => setDetail({ kind: 'album', id: albumId })} />;
  return (
    <div className="view search-view">
      <header className="search-header"><button className="icon-button" aria-label="Back"><ArrowLeft size={25} /></button><label className="search-field"><SearchIcon size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type to search" aria-label="Search music" />{query && <button className="icon-button" onClick={() => setQuery('')} aria-label="Clear search"><X size={17} /></button>}<button className="voice-button" aria-label="Voice search"><Mic2 size={20} /></button></label></header>
      {!query && <><section className="recent-search-section"><div className="section-heading"><h2>Recent searches</h2><button className="text-button">Clear</button></div><div className="recent-artwork-row">{recentSearches.slice(0, 4).map((search, index) => <button className="recent-artwork" key={search} onClick={() => submitRecent(search)}><Artwork src={["https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=85", "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=85", "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=800&q=85", "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=85"][index]} alt="" size="lg" /><strong>{search}</strong></button>)}</div>{recentSearches.map((search) => <button className="recent-line" key={search} onClick={() => submitRecent(search)}><Clock3 size={22} /><span>{search}</span><ArrowLeft size={19} className="recent-arrow" /></button>)}</section><div className="search-discovery-grid"><button><span>✦</span>New releases</button><button><span>↗</span>Charts</button><button><span>◌</span>Made for you</button><button><span>⌁</span>Genres & moods</button></div></>}
      {query && <div className="search-results"><div className="catalog-note">Global catalog · local availability shown on play</div>{loading && <div className="loading-line">Searching the world of music…</div>}{!loading && results && <><ResultGroup title="Songs">{results.tracks.length ? <div className="track-list">{results.tracks.map((track) => <TrackRow key={track.id} track={track} onPlay={onPlay} onLike={onLike} onAdd={onAdd} status={track.isLocal ? 'ready' : 'preparing'} />)}</div> : <div className="empty-state">No songs found yet.</div>}</ResultGroup><SearchPeople title="Artists" items={results.artists} onOpen={(artistId) => setDetail({ kind: 'artist', id: artistId })} /><SearchAlbums title="Albums" items={results.albums} onOpen={(albumId) => setDetail({ kind: 'album', id: albumId })} /></>}</div>}
    </div>
  );
}

function SearchPeople({ title, items, onOpen }: { title: string; items: Artist[]; onOpen: (artistId: string) => void }) {
  if (!items.length) return null;
  return <ResultGroup title={title}><div className="artist-scroll">{items.map((artist) => <button className="artist-card" key={artist.id} onClick={() => onOpen(artist.id)}><Artwork src={artist.imageUrl} alt="" size="md" rounded="circle" /><strong>{artist.name}</strong><span>Artist</span></button>)}</div></ResultGroup>;
}

function SearchAlbums({ title, items, onOpen }: { title: string; items: Album[]; onOpen: (albumId: string) => void }) {
  if (!items.length) return null;
  return <ResultGroup title={title}><div className="artwork-scroll">{items.map((album) => <button className="artwork-card" key={album.id} onClick={() => onOpen(album.id)}><Artwork src={album.artworkUrl} alt="" size="md" /><strong>{album.title}</strong><span>{album.artistName}</span></button>)}</div></ResultGroup>;
}
