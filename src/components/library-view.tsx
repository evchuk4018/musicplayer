import { ChevronDown, Grid2X2, ListMusic, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { LibrarySnapshot, Playlist, Track } from '@/domain/music';
import { Artwork } from './artwork';
import { TrackRow } from './track-row';

type LibraryViewProps = {
  library: LibrarySnapshot;
  onPlay: (track: Track) => void;
  onPlayAll: (tracks: Track[]) => void;
  onLike: (track: Track) => void;
  onAdd: (track: Track) => void;
  onSave: (track: Track) => void;
  onCreatePlaylist: () => void;
  onRenamePlaylist: (playlist: Playlist) => void;
  onDeletePlaylist: (playlist: Playlist) => void;
  onChangeArtwork: (playlist: Playlist) => void;
  onRemoveTrack: (playlist: Playlist, track: Track) => void;
  selectedPlaylist?: Playlist;
  onSelectPlaylist: (playlist: Playlist) => void;
  onClosePlaylist: () => void;
};

export function LibraryView({ library, onPlay, onPlayAll, onLike, onAdd, onSave, onCreatePlaylist, onRenamePlaylist, onDeletePlaylist, onChangeArtwork, onRemoveTrack, selectedPlaylist, onSelectPlaylist, onClosePlaylist }: LibraryViewProps) {
  const [filter, setFilter] = useState<'all' | 'playlists' | 'songs'>('all');
  if (selectedPlaylist) {
    return <PlaylistDetail playlist={selectedPlaylist} onBack={onClosePlaylist} onPlay={onPlay} onPlayAll={onPlayAll} onLike={onLike} onAdd={onAdd} onSave={onSave} onRename={() => onRenamePlaylist(selectedPlaylist)} onChangeArtwork={() => onChangeArtwork(selectedPlaylist)} onDelete={() => { onDeletePlaylist(selectedPlaylist); onClosePlaylist(); }} onRemoveTrack={onRemoveTrack} />;
  }
  return (
    <div className="view library-view">
      <header className="library-header"><div><h1>Library</h1><span className="library-subtitle">Your music, close at hand</span></div><div className="header-actions"><button className="icon-button" aria-label="Recently played"><ListMusic size={23} /></button><Artwork src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=300&q=80" alt="Profile" size="sm" rounded="circle" /></div></header>
      <div className="library-tabs"><button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>Downloads</button><button className={filter === 'playlists' ? 'is-active' : ''} onClick={() => setFilter('playlists')}>Playlists</button><button className={filter === 'songs' ? 'is-active' : ''} onClick={() => setFilter('songs')}>Songs</button></div>
      <div className="library-section-header"><div><span className="eyebrow">YOUR COLLECTION</span><h2>Recent activity <ChevronDown size={20} /></h2></div><div className="library-section-actions"><button className="icon-button"><Grid2X2 size={20} /></button><button className="icon-button library-new" onClick={onCreatePlaylist} aria-label="Create playlist"><Plus size={20} /></button></div></div>
      {filter !== 'songs' && <div className="playlist-list"><PlaylistListItem playlist={library.likedPlaylist} onOpen={onSelectPlaylist} /><button className="new-playlist-row" onClick={onCreatePlaylist}><span><Plus size={22} /></span><strong>New playlist</strong><small>Make a place for your next favorite</small></button>{library.playlists.map((playlist) => <PlaylistListItem key={playlist.id} playlist={playlist} onOpen={onSelectPlaylist} />)}</div>}
      {filter !== 'playlists' && <section className="saved-section"><div className="section-heading"><h2>Saved songs</h2><span className="section-note">{library.savedTracks.length} tracks</span></div>{library.savedTracks.length ? <div className="track-list">{library.savedTracks.map((track) => <TrackRow key={track.id} track={track} onPlay={onPlay} onLike={onLike} onAdd={onAdd} onSave={onSave} />)}</div> : <div className="empty-state">Save songs to keep them here.</div>}</section>}
    </div>
  );
}

function PlaylistListItem({ playlist, onOpen }: { playlist: Playlist; onOpen: (playlist: Playlist) => void }) {
  return <button className="playlist-list-item" onClick={() => onOpen(playlist)}><Artwork src={playlist.artworkUrl} alt="" size="md" /><span><strong>{playlist.name}</strong><small>{playlist.isSystem ? 'Auto playlist' : `Playlist · ${playlist.trackCount} tracks`}</small></span><MoreVertical size={20} /></button>;
}

function PlaylistDetail({ playlist, onBack, onPlay, onPlayAll, onLike, onAdd, onSave, onRename, onChangeArtwork, onDelete, onRemoveTrack }: { playlist: Playlist; onBack: () => void; onPlay: (track: Track) => void; onPlayAll: (tracks: Track[]) => void; onLike: (track: Track) => void; onAdd: (track: Track) => void; onSave: (track: Track) => void; onRename: () => void; onChangeArtwork: () => void; onDelete: () => void; onRemoveTrack: (playlist: Playlist, track: Track) => void }) {
  return <div className="view playlist-detail"><button className="back-link" onClick={onBack}>‹ Library</button><div className="playlist-hero"><Artwork src={playlist.artworkUrl} alt="" size="hero" /><span className="eyebrow">{playlist.isSystem ? 'AUTO PLAYLIST' : 'PLAYLIST'}</span><h1>{playlist.name}</h1><p>{playlist.description ?? `${playlist.trackCount} tracks`}</p><div className="playlist-detail-actions"><button className="primary-button" onClick={() => onPlayAll(playlist.tracks)}><ListMusic size={18} /> Play all</button>{!playlist.isSystem && <><button className="icon-button action-on-surface" onClick={onRename} aria-label="Rename playlist"><Pencil size={18} /></button><button className="icon-button action-on-surface" onClick={onChangeArtwork} aria-label="Change playlist artwork"><Pencil size={18} /></button><button className="icon-button action-on-surface" onClick={onDelete} aria-label="Delete playlist"><Trash2 size={18} /></button></>}</div></div><div className="track-list">{playlist.tracks.length ? playlist.tracks.map((track) => <div className="detail-track-wrap" key={track.id}><TrackRow track={track} onPlay={onPlay} onLike={onLike} onAdd={onAdd} onSave={onSave} /><button className="remove-track" onClick={() => onRemoveTrack(playlist, track)}>Remove</button></div>) : <div className="empty-state">This playlist is ready for a new favorite.</div>}</div></div>;
}
