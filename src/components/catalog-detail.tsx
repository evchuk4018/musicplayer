import { ArrowLeft, Disc3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Album, Artist, Track } from '@/domain/music';
import { appPath } from '@/lib/api-path';
import { Artwork } from './artwork';
import { TrackRow } from './track-row';

type CatalogDetailResponse = { kind: 'artist'; artist: Artist; tracks: Track[]; albums: Album[] } | { kind: 'album'; album: Album };

type CatalogDetailProps = {
  detail: { kind: 'artist'; id: string } | { kind: 'album'; id: string };
  onBack: () => void;
  onPlay: (track: Track) => void;
  onLike: (track: Track) => void;
  onAdd: (track: Track) => void;
  onOpenAlbum: (albumId: string) => void;
};

export function CatalogDetail({ detail, onBack, onPlay, onLike, onAdd, onOpenAlbum }: CatalogDetailProps) {
  const [payload, setPayload] = useState<CatalogDetailResponse>();
  useEffect(() => {
    let active = true;
    const endpoint = detail.kind === 'artist' ? `/api/catalog/artists/${encodeURIComponent(detail.id)}` : `/api/catalog/albums/${encodeURIComponent(detail.id)}`;
    void fetch(appPath(endpoint)).then((response) => response.ok ? response.json() as Promise<CatalogDetailResponse> : undefined).then((result) => { if (active && result) setPayload(result); }).catch(() => undefined);
    return () => { active = false; };
  }, [detail]);
  if (!payload) return <div className="catalog-detail view"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to search</button><div className="loading-line">Loading the catalog…</div></div>;
  if (payload.kind === 'album') return <div className="catalog-detail view"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to search</button><div className="catalog-detail-hero"><Artwork src={payload.album.artworkUrl} alt="" size="hero" /><span className="eyebrow">ALBUM · {payload.album.releaseYear ?? 'NEW'}</span><h1>{payload.album.title}</h1><p>{payload.album.artistName}</p></div><div className="track-list">{payload.album.tracks.map((track) => <TrackRow key={track.id} track={track} onPlay={onPlay} onLike={onLike} onAdd={onAdd} status={track.isLocal ? 'ready' : 'preparing'} />)}</div></div>;
  return <div className="catalog-detail view"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to search</button><div className="artist-detail-hero"><Artwork src={payload.artist.imageUrl} alt="" size="hero" rounded="circle" /><span className="eyebrow">ARTIST</span><h1>{payload.artist.name}</h1><p>{payload.tracks.length} catalog tracks · {payload.albums.length} albums</p></div><section className="result-group"><div className="section-heading"><h2>Popular songs</h2><Disc3 size={18} /></div><div className="track-list">{payload.tracks.map((track) => <TrackRow key={track.id} track={track} onPlay={onPlay} onLike={onLike} onAdd={onAdd} status={track.isLocal ? 'ready' : 'preparing'} />)}</div></section><section className="result-group"><div className="section-heading"><h2>Albums</h2></div><div className="artwork-scroll">{payload.albums.map((album) => <button className="artwork-card" key={album.id} onClick={() => onOpenAlbum(album.id)}><Artwork src={album.artworkUrl} alt="" size="md" /><strong>{album.title}</strong><span>{album.releaseYear ?? 'Album'}</span></button>)}</div></section></div>;
}
