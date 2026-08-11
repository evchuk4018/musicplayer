import { ChevronDown, ChevronRight, ChevronUp, ListMusic, Pencil, Pin, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { LibrarySnapshot, Playlist, SpeedDialTarget, Track } from '@/domain/music';
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
  onMoveTrack: (playlist: Playlist, track: Track, direction: -1 | 1) => void;
  onToggleSpeedDial: (target: SpeedDialTarget, enabled: boolean) => void;
  selectedPlaylist?: Playlist;
  onSelectPlaylist: (playlist: Playlist) => void;
  onClosePlaylist: () => void;
};

export function LibraryView({ library, onPlay, onPlayAll, onLike, onAdd, onSave, onCreatePlaylist, onRenamePlaylist, onDeletePlaylist, onChangeArtwork, onRemoveTrack, onMoveTrack, onToggleSpeedDial, selectedPlaylist, onSelectPlaylist, onClosePlaylist }: LibraryViewProps) {
  const [filter, setFilter] = useState<'all' | 'playlists' | 'songs'>('all');
  const isPinned = (kind: SpeedDialTarget['kind'], id: string) => library.speedDial.some((item) => item.isPinned && item.kind === kind && item.id === id);
  if (selectedPlaylist) {
    return <PlaylistDetail playlist={selectedPlaylist} isPinned={isPinned('playlist', selectedPlaylist.id)} onToggleSpeedDial={onToggleSpeedDial} onBack={onClosePlaylist} onPlay={onPlay} onPlayAll={onPlayAll} onLike={onLike} onAdd={onAdd} onSave={onSave} onRename={() => onRenamePlaylist(selectedPlaylist)} onChangeArtwork={() => onChangeArtwork(selectedPlaylist)} onDelete={() => { onDeletePlaylist(selectedPlaylist); onClosePlaylist(); }} onRemoveTrack={onRemoveTrack} onMoveTrack={onMoveTrack} isTrackPinned={(track) => isPinned('track', track.id)} />;
  }
  return (
    <div className="view library-view">
      <header className="library-header"><div><h1>Library</h1><span className="library-subtitle">Your music, close at hand</span></div></header>
      <div className="library-tabs"><button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>Downloads</button><button className={filter === 'playlists' ? 'is-active' : ''} onClick={() => setFilter('playlists')}>Playlists</button><button className={filter === 'songs' ? 'is-active' : ''} onClick={() => setFilter('songs')}>Songs</button></div>
      <div className="library-section-header"><div><span className="eyebrow">YOUR COLLECTION</span><h2>Recent activity <ChevronDown size={20} /></h2></div><div className="library-section-actions"><button className="icon-button library-new" onClick={onCreatePlaylist} aria-label="Create playlist"><Plus size={20} /></button></div></div>
      {filter !== 'songs' && <div className="playlist-list"><PlaylistListItem playlist={library.likedPlaylist} pinned={isPinned('playlist', library.likedPlaylist.id)} onToggleSpeedDial={onToggleSpeedDial} onOpen={onSelectPlaylist} /><button className="new-playlist-row" onClick={onCreatePlaylist}><span><Plus size={22} /></span><strong>New playlist</strong><small>Make a place for your next favorite</small></button>{library.playlists.map((playlist) => <PlaylistListItem key={playlist.id} playlist={playlist} pinned={isPinned('playlist', playlist.id)} onToggleSpeedDial={onToggleSpeedDial} onOpen={onSelectPlaylist} />)}</div>}
      {filter !== 'playlists' && <section className="saved-section"><div className="section-heading"><h2>Saved songs</h2><span className="section-note">{library.savedTracks.length} tracks</span></div>{library.savedTracks.length ? <div className="track-list">{library.savedTracks.map((track) => <TrackRow key={track.id} track={track} onPlay={onPlay} onLike={onLike} onAdd={onAdd} onSave={onSave} onTogglePin={(target, enabled) => onToggleSpeedDial({ kind: 'track', id: target.id, track: target }, enabled)} isPinned={isPinned('track', track.id)} />)}</div> : <div className="empty-state">Save songs to keep them here.</div>}</section>}
    </div>
  );
}

function PlaylistListItem({ playlist, pinned, onToggleSpeedDial, onOpen }: { playlist: Playlist; pinned: boolean; onToggleSpeedDial: (target: SpeedDialTarget, enabled: boolean) => void; onOpen: (playlist: Playlist) => void }) {
  return <div className="playlist-list-item"><button className="playlist-list-main" onClick={() => onOpen(playlist)}><Artwork src={playlist.artworkUrl} alt="" size="md" /><span><strong>{playlist.name}</strong><small>{playlist.isSystem ? 'Auto playlist' : `Playlist · ${playlist.trackCount} tracks`}</small></span><ChevronRight size={20} /></button><button className={`icon-button row-action ${pinned ? 'is-pinned' : ''}`} onClick={() => onToggleSpeedDial({ kind: 'playlist', id: playlist.id, playlist }, !pinned)} aria-label={pinned ? `Unpin ${playlist.name} from Speed Dial` : `Pin ${playlist.name} to Speed Dial`}><Pin size={18} fill={pinned ? 'currentColor' : 'none'} /></button></div>;
}

function PlaylistDetail({ playlist, isPinned, isTrackPinned, onToggleSpeedDial, onBack, onPlay, onPlayAll, onLike, onAdd, onSave, onRename, onChangeArtwork, onDelete, onRemoveTrack, onMoveTrack }: { playlist: Playlist; isPinned: boolean; isTrackPinned: (track: Track) => boolean; onToggleSpeedDial: (target: SpeedDialTarget, enabled: boolean) => void; onBack: () => void; onPlay: (track: Track) => void; onPlayAll: (tracks: Track[]) => void; onLike: (track: Track) => void; onAdd: (track: Track) => void; onSave: (track: Track) => void; onRename: () => void; onChangeArtwork: () => void; onDelete: () => void; onRemoveTrack: (playlist: Playlist, track: Track) => void; onMoveTrack: (playlist: Playlist, track: Track, direction: -1 | 1) => void }) {
  return <div className="view playlist-detail"><button className="back-link" onClick={onBack}>‹ Library</button><div className="playlist-hero"><Artwork src={playlist.artworkUrl} alt="" size="hero" /><span className="eyebrow">{playlist.isSystem ? 'AUTO PLAYLIST' : 'PLAYLIST'}</span><h1>{playlist.name}</h1><p>{playlist.description ?? `${playlist.trackCount} tracks`}</p><div className="playlist-detail-actions"><button className="primary-button" onClick={() => onPlayAll(playlist.tracks)}><ListMusic size={18} /> Play all</button><button className={`icon-button action-on-surface ${isPinned ? 'is-pinned' : ''}`} onClick={() => onToggleSpeedDial({ kind: 'playlist', id: playlist.id, playlist }, !isPinned)} aria-label={isPinned ? `Unpin ${playlist.name} from Speed Dial` : `Pin ${playlist.name} to Speed Dial`}><Pin size={18} fill={isPinned ? 'currentColor' : 'none'} /></button>{!playlist.isSystem && <><button className="icon-button action-on-surface" onClick={onRename} aria-label="Rename playlist"><Pencil size={18} /></button><button className="icon-button action-on-surface" onClick={onChangeArtwork} aria-label="Change playlist artwork"><Pencil size={18} /></button><button className="icon-button action-on-surface" onClick={onDelete} aria-label="Delete playlist"><Trash2 size={18} /></button></>}</div></div><div className="track-list">{playlist.tracks.length ? playlist.tracks.map((track, index) => <div className="detail-track-wrap" key={track.id}><TrackRow track={track} onPlay={onPlay} onLike={onLike} onAdd={onAdd} onSave={onSave} onTogglePin={(target, enabled) => onToggleSpeedDial({ kind: 'track', id: target.id, track: target }, enabled)} isPinned={isTrackPinned(track)} /><div className="track-order-actions"><button className="icon-button" onClick={() => onMoveTrack(playlist, track, -1)} disabled={index === 0} aria-label={`Move ${track.title} up`}><ChevronUp size={15} /></button><button className="icon-button" onClick={() => onMoveTrack(playlist, track, 1)} disabled={index === playlist.tracks.length - 1} aria-label={`Move ${track.title} down`}><ChevronDown size={15} /></button></div><button className="remove-track" onClick={() => onRemoveTrack(playlist, track)}>Remove</button></div>) : <div className="empty-state">This playlist is ready for a new favorite.</div>}</div></div>;
}
