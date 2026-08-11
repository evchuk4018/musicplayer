'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppState, AcquisitionJob, LibrarySnapshot, Playlist, QueueItem, Track } from '@/domain/music';
import { appPath } from '@/lib/api-path';
import { BottomNav, type PageName } from './bottom-nav';
import { Artwork } from './artwork';
import { HomeView } from './home-view';
import { LibraryView } from './library-view';
import { MiniPlayer } from './mini-player';
import { NowPlaying } from './now-playing';
import { SearchView } from './search-view';

type MusicAppProps = { initialState: AppState };

function queueItem(track: Track, queueState: QueueItem['queueState'] = 'ready'): QueueItem {
  return { ...track, queueState };
}

function uniqueTracks(tracks: Track[]) {
  return Array.from(new Map(tracks.map((track) => [track.id, track])).values());
}

export function MusicApp({ initialState }: MusicAppProps) {
  const [page, setPage] = useState<PageName>('home');
  const [library, setLibrary] = useState<LibrarySnapshot>(initialState.library);
  const [recommendations, setRecommendations] = useState<Track[]>(initialState.homeRecommendations);
  const initialTrack = initialState.library.recentlyPlayed[0];
  const [current, setCurrent] = useState<QueueItem | undefined>(initialTrack ? queueItem(initialTrack) : undefined);
  const [queue, setQueue] = useState<QueueItem[]>(initialState.homeRecommendations.slice(0, 5).map((track) => queueItem(track, track.isLocal ? 'ready' : 'preparing')));
  const [audioUrl, setAudioUrl] = useState(initialTrack?.previewUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(initialTrack?.durationSeconds ?? 0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [volume, setVolume] = useState(0.88);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [notice, setNotice] = useState<string>();
  const [pickerTrack, setPickerTrack] = useState<Track>();
  const [openPlaylist, setOpenPlaylist] = useState<Playlist>();
  const [jobs, setJobs] = useState<AcquisitionJob[]>(initialState.acquisitionJobs);
  const [playerHydrated, setPlayerHydrated] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const activeJobCount = useMemo(() => jobs.filter((job) => job.status === 'queued' || job.status === 'processing').length, [jobs]);

  useEffect(() => {
    if ('serviceWorker' in navigator) void navigator.serviceWorker.register(appPath('/sw.js')).catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem('pulse-player-state');
        if (saved) {
          const state = JSON.parse(saved) as { current?: QueueItem; queue?: QueueItem[]; audioUrl?: string; volume?: number; shuffle?: boolean; repeat?: boolean; autoplayEnabled?: boolean };
          if (state.current?.id) {
            setCurrent(state.current);
            setAudioUrl(state.audioUrl ?? state.current.streamUrl ?? state.current.previewUrl);
          }
          if (Array.isArray(state.queue)) setQueue(state.queue.filter((item) => item && typeof item.id === 'string'));
          if (typeof state.volume === 'number') setVolume(Math.min(1, Math.max(0, state.volume)));
          if (typeof state.shuffle === 'boolean') setShuffle(state.shuffle);
          if (typeof state.repeat === 'boolean') setRepeat(state.repeat);
          if (typeof state.autoplayEnabled === 'boolean') setAutoplayEnabled(state.autoplayEnabled);
        }
      } catch {
        localStorage.removeItem('pulse-player-state');
      } finally {
        setPlayerHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!playerHydrated) return;
    localStorage.setItem('pulse-player-state', JSON.stringify({ current, queue, audioUrl, volume, shuffle, repeat, autoplayEnabled }));
  }, [audioUrl, autoplayEnabled, current, playerHydrated, queue, repeat, shuffle, volume]);

  const sendEvent = useCallback((track: Track, eventType: string, extra: Record<string, unknown> = {}) => {
    void fetch(appPath('/api/events'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ trackId: track.id, eventType, ...extra }) }).catch(() => undefined);
  }, []);

  const prefetchTrack = useCallback((track: Track) => {
    if (track.isLocal) return Promise.resolve();
    return fetch(appPath('/api/play'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ track, prefetch: true }) }).then(async (response) => {
      if (!response.ok) return;
      const result = await response.json() as { job?: AcquisitionJob };
      if (result.job) setJobs((previous) => [...previous.filter((job) => job.trackId !== track.id), result.job!]);
    }).catch(() => undefined);
  }, []);

  const cancelIrrelevantJobs = useCallback((keepTrackIds: string[]) => {
    const keep = new Set(keepTrackIds);
    const stale = jobs.filter((job) => (job.status === 'queued' || job.status === 'processing') && !keep.has(job.trackId));
    void Promise.all(stale.map((job) => fetch(appPath(`/api/acquisition/jobs/${encodeURIComponent(job.id)}`), { method: 'DELETE' }).catch(() => undefined)));
  }, [jobs]);

  const ensureLookahead = useCallback(async (seed: Track, providedQueue: QueueItem[]) => {
    let candidates = providedQueue.filter((item) => item.id !== seed.id);
    if (candidates.length < 5) {
      try {
        const response = await fetch(appPath(`/api/recommendations?context=${providedQueue.length ? 'home' : 'track-radio'}`));
        if (response.ok) {
          const payload = await response.json() as { tracks: Track[] };
          setRecommendations((previous) => uniqueTracks([...payload.tracks, ...previous]));
          candidates = [...candidates, ...payload.tracks.map((track) => queueItem(track, track.isLocal ? 'ready' : 'preparing'))];
        }
      } catch {
        candidates = [...candidates, ...recommendations.map((track) => queueItem(track, track.isLocal ? 'ready' : 'preparing'))];
      }
    }
    const next = uniqueTracks(candidates.map((item) => item)).filter((track) => track.id !== seed.id).slice(0, 5).map((track) => queueItem(track, track.isLocal ? 'ready' : 'preparing'));
    setQueue(next);
    await Promise.all(next.map((track) => prefetchTrack(track)));
  }, [prefetchTrack, recommendations]);

  const playTrack = useCallback(async (track: Track, providedQueue?: QueueItem[]) => {
    const upcoming = (providedQueue ?? []).filter((item) => item.id !== track.id);
    cancelIrrelevantJobs([track.id, ...upcoming.map((item) => item.id)]);
    setCurrent(queueItem(track, track.isLocal ? 'ready' : 'preparing'));
    setProgressSeconds(0);
    setDurationSeconds(track.durationSeconds);
    setNotice(undefined);
    try {
      const response = await fetch(appPath('/api/play'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ track }) });
      const result = await response.json() as { status?: string; audioUrl?: string; job?: AcquisitionJob; detail?: string };
      const url = result.audioUrl ?? track.previewUrl;
      const state = result.status === 'ready' ? 'ready' : result.status === 'preview' ? 'preparing' : 'preparing';
      const ready = queueItem({ ...track, isLocal: result.status === 'ready' || track.isLocal }, state);
      setCurrent(ready);
      setAudioUrl(url);
      if (result.job) setJobs((previous) => [...previous.filter((job) => job.trackId !== track.id), result.job!]);
      if (result.detail) setNotice(result.detail);
      if (!url) {
        setIsPlaying(false);
        setNotice('This song is being prepared. Playback will be ready when the file arrives.');
      } else {
        const audio = audioRef.current;
        if (audio) {
          audio.src = url;
          audio.load();
          await audio.play();
          setIsPlaying(true);
        }
      }
      void ensureLookahead(ready, upcoming);
    } catch {
      setIsPlaying(false);
      setNotice('Couldn’t start this track. Try another song.');
    }
  }, [cancelIrrelevantJobs, ensureLookahead]);

  const playAll = useCallback((tracks: Track[]) => {
    if (!tracks.length) return;
    void playTrack(tracks[0], tracks.slice(1).map((track) => queueItem(track, track.isLocal ? 'ready' : 'preparing')));
  }, [playTrack]);

  const startRadio = useCallback(async (seed: Track, context: 'track-radio' | 'artist-radio' = 'track-radio') => {
    try {
      const response = await fetch(appPath(`/api/recommendations?context=${context}&seed=${encodeURIComponent(seed.id)}`));
      const payload = response.ok ? await response.json() as { tracks: Track[] } : { tracks: [] };
      if (payload.tracks.length) {
        setRecommendations(payload.tracks);
        void playTrack(payload.tracks[0], payload.tracks.slice(1, 5).map((track) => queueItem(track, track.isLocal ? 'ready' : 'preparing')));
        setNotice(`${context === 'artist-radio' ? 'Artist' : 'Track'} radio is ready`);
      }
    } catch {
      setNotice('Radio could not start right now.');
    }
  }, [playTrack]);

  const advance = useCallback(async () => {
    if (repeat && current) {
      sendEvent(current, 'replay', { positionSeconds: progressSeconds, completionPercent: durationSeconds ? (progressSeconds / durationSeconds) * 100 : 0 });
      await playTrack(current, queue);
      return;
    }
    if (current) {
      const audio = audioRef.current;
      const positionSeconds = audio?.currentTime ?? progressSeconds;
      const completionPercent = durationSeconds ? (positionSeconds / durationSeconds) * 100 : 0;
      sendEvent(current, completionPercent >= 90 ? 'complete' : 'skip', { positionSeconds, completionPercent });
    }
    const failedIds = new Set(jobs.filter((job) => job.status === 'failed' || job.status === 'blocked' || job.status === 'cancelled').map((job) => job.trackId));
    const availableQueue = queue.filter((item) => !failedIds.has(item.id));
    let next: QueueItem | undefined = availableQueue[0];
    let remaining = availableQueue.slice(1);
    if (shuffle && availableQueue.length > 1) {
      const index = Math.floor(Math.random() * availableQueue.length);
      next = availableQueue[index];
      remaining = availableQueue.filter((_, itemIndex) => itemIndex !== index);
    }
    if (!next && autoplayEnabled && current) {
      try {
        const response = await fetch(appPath('/api/recommendations?context=track-radio'));
        if (response.ok) {
          const payload = await response.json() as { tracks: Track[] };
          next = payload.tracks[0] ? queueItem(payload.tracks[0], payload.tracks[0].isLocal ? 'ready' : 'preparing') : undefined;
          remaining = payload.tracks.slice(1, 5).map((track) => queueItem(track, track.isLocal ? 'ready' : 'preparing'));
        }
      } catch {
        next = undefined;
      }
    }
    if (next) {
      await playTrack(next, remaining);
    } else {
      setIsPlaying(false);
    }
  }, [autoplayEnabled, current, durationSeconds, jobs, playTrack, progressSeconds, queue, repeat, sendEvent, shuffle]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgressSeconds(audio.currentTime);
    const onMetadata = () => setDurationSeconds(Number.isFinite(audio.duration) ? audio.duration : current?.durationSeconds ?? 0);
    const onEnded = () => void advance();
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMetadata);
    audio.addEventListener('ended', onEnded);
    return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('loadedmetadata', onMetadata); audio.removeEventListener('ended', onEnded); };
  }, [advance, current?.durationSeconds]);

  useEffect(() => {
    const jobByTrack = new Map(jobs.map((job) => [job.trackId, job]));
    const timer = window.setTimeout(() => {
      setQueue((previous) => {
        let changed = false;
        const next = previous.map((item) => {
          const job = jobByTrack.get(item.id);
          if (!job) return item;
          const queueState = job.status === 'ready' ? 'ready' : job.status === 'failed' || job.status === 'blocked' || job.status === 'cancelled' ? 'failed' : 'preparing';
          const isLocal = job.status === 'ready' || item.isLocal;
          if (queueState === item.queueState && isLocal === item.isLocal) return item;
          changed = true;
          return queueItem({ ...item, isLocal }, queueState);
        });
        return changed ? next : previous;
      });
      if (current) {
        const currentJob = jobByTrack.get(current.id);
        if (currentJob && (currentJob.status === 'failed' || currentJob.status === 'blocked' || currentJob.status === 'cancelled') && current.queueState !== 'failed') {
          setCurrent(queueItem(current, 'failed'));
          setNotice(currentJob.error ?? 'This song could not be prepared.');
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [current, jobs]);

  useEffect(() => {
    if (!current || current.isLocal) return;
    const activeCurrent = current;
    const job = jobs.find((candidate) => candidate.trackId === activeCurrent.id);
    if (!job || job.status !== 'ready') return;
    let active = true;
    const audio = audioRef.current;
    const shouldResume = Boolean(audio && !audio.paused);
    void fetch(appPath('/api/play'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ track: { ...activeCurrent, isLocal: true }, prefetch: true })
    }).then(async (response) => {
      if (!active || !response.ok) return;
      const result = await response.json() as { audioUrl?: string };
      if (!result.audioUrl) return;
      const ready = queueItem({ ...activeCurrent, isLocal: true }, 'ready');
      setCurrent(ready);
      setQueue((previous) => previous.map((item) => item.id === ready.id ? ready : item));
      setAudioUrl(result.audioUrl);
      if (audio) {
        audio.src = result.audioUrl;
        audio.load();
        if (shouldResume) await audio.play().then(() => setIsPlaying(true)).catch(() => undefined);
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [current, jobs]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!current || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: current.title, artist: current.artistName, album: current.albumName, artwork: [{ src: current.artworkUrl, sizes: '512x512', type: 'image/jpeg' }] });
    navigator.mediaSession.setActionHandler('play', () => { void audioRef.current?.play(); setIsPlaying(true); });
    navigator.mediaSession.setActionHandler('pause', () => { audioRef.current?.pause(); setIsPlaying(false); });
    navigator.mediaSession.setActionHandler('previoustrack', () => { const previous = initialState.library.recentlyPlayed.find((track) => track.id !== current.id); if (previous) void playTrack(previous, queue); });
    navigator.mediaSession.setActionHandler('nexttrack', () => { void advance(); });
    navigator.mediaSession.setActionHandler('seekbackward', () => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); });
    navigator.mediaSession.setActionHandler('seekforward', () => { if (audioRef.current) audioRef.current.currentTime += 10; });
  }, [advance, current, initialState.library.recentlyPlayed, playTrack, queue]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void fetch(appPath('/api/acquisition/jobs')).then((response) => response.ok ? response.json() as Promise<{ jobs: AcquisitionJob[] }> : undefined).then((payload) => { if (payload?.jobs) setJobs(payload.jobs); }).catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  const updateTrackEverywhere = useCallback((target: Track, changes: Partial<Track>) => {
    const updated = { ...target, ...changes };
    const update = (track: Track) => track.id === target.id ? updated : track;
    setCurrent((previous) => previous?.id === target.id ? { ...previous, ...updated } : previous);
    setQueue((previous) => previous.map(update).map((track) => queueItem(track)));
    setRecommendations((previous) => previous.map(update));
    setLibrary((previous) => {
      const likedTracks = previous.likedPlaylist.tracks.filter((track) => track.id !== target.id);
      if (updated.isLiked) likedTracks.unshift(updated);
      const likedPlaylist = { ...previous.likedPlaylist, tracks: likedTracks, trackCount: likedTracks.length };
      return {
        ...previous,
        likedPlaylist,
        savedTracks: updated.isSaved ? uniqueTracks([updated, ...previous.savedTracks.filter((track) => track.id !== target.id)]) : previous.savedTracks.filter((track) => track.id !== target.id),
        recentlyPlayed: previous.recentlyPlayed.map(update),
        playlists: previous.playlists.map((playlist) => ({ ...playlist, tracks: playlist.tracks.map(update) }))
      };
    });
    return updated;
  }, []);

  const toggleLike = useCallback((track: Track) => {
    const liked = !track.isLiked;
    const updated = updateTrackEverywhere(track, { isLiked: liked, isProtected: liked || track.isProtected });
    sendEvent(updated, liked ? 'like' : 'unlike');
    void fetch(appPath(`/api/tracks/${encodeURIComponent(track.id)}/like`), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ liked, track: updated }) }).catch(() => undefined);
  }, [sendEvent, updateTrackEverywhere]);

  const toggleSave = useCallback((track: Track) => {
    const saved = !track.isSaved;
    const updated = updateTrackEverywhere(track, { isSaved: saved, isProtected: saved || track.isProtected });
    sendEvent(updated, saved ? 'playlist_add' : 'playlist_remove', { metadata: { destination: 'saved' } });
    void fetch(appPath(`/api/tracks/${encodeURIComponent(track.id)}/save`), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ saved, track: updated }) }).catch(() => undefined);
  }, [sendEvent, updateTrackEverywhere]);

  const addToPlaylist = useCallback((playlist: Playlist) => {
    if (!pickerTrack) return;
    setLibrary((previous) => {
      if (playlist.id === previous.likedPlaylist.id) {
        if (previous.likedPlaylist.tracks.some((track) => track.id === pickerTrack.id)) return previous;
        const liked = { ...pickerTrack, isLiked: true, isProtected: true };
        return { ...previous, likedPlaylist: { ...previous.likedPlaylist, tracks: [liked, ...previous.likedPlaylist.tracks], trackCount: previous.likedPlaylist.trackCount + 1 } };
      }
      return { ...previous, playlists: previous.playlists.map((item) => item.id === playlist.id && !item.tracks.some((track) => track.id === pickerTrack.id) ? { ...item, tracks: [...item.tracks, pickerTrack], trackCount: item.trackCount + 1 } : item) };
    });
    sendEvent(pickerTrack, 'playlist_add', { metadata: { playlistId: playlist.id } });
    void fetch(appPath(`/api/playlists/${encodeURIComponent(playlist.id)}/tracks`), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ track: pickerTrack }) }).catch(() => undefined);
    setPickerTrack(undefined);
  }, [pickerTrack, sendEvent]);

  const createPlaylist = useCallback(() => {
    const name = window.prompt('Name your playlist');
    if (!name?.trim()) return;
    void fetch(appPath('/api/playlists'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) }).then((response) => response.json()).then((payload: { playlist?: Playlist }) => { if (payload.playlist) setLibrary((previous) => ({ ...previous, playlists: [...previous.playlists, payload.playlist!] })); }).catch(() => setNotice('Couldn’t create that playlist.'));
  }, []);

  const renamePlaylist = useCallback((playlist: Playlist) => {
    const name = window.prompt('Rename playlist', playlist.name);
    if (!name?.trim()) return;
    setLibrary((previous) => ({ ...previous, playlists: previous.playlists.map((item) => item.id === playlist.id ? { ...item, name: name.trim() } : item) }));
    void fetch(appPath(`/api/playlists/${encodeURIComponent(playlist.id)}`), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) }).catch(() => undefined);
  }, []);

  const deletePlaylist = useCallback((playlist: Playlist) => {
    if (!window.confirm(`Delete ${playlist.name}?`)) return;
    setLibrary((previous) => ({ ...previous, playlists: previous.playlists.filter((item) => item.id !== playlist.id), quickDial: previous.quickDial.filter((item) => item.id !== playlist.id) }));
    void fetch(appPath(`/api/playlists/${encodeURIComponent(playlist.id)}`), { method: 'DELETE' }).catch(() => undefined);
  }, []);

  const changeArtwork = useCallback((playlist: Playlist) => {
    const artworkUrl = window.prompt('Paste an artwork URL', playlist.artworkUrl);
    if (!artworkUrl?.trim()) return;
    setLibrary((previous) => ({ ...previous, playlists: previous.playlists.map((item) => item.id === playlist.id ? { ...item, artworkUrl: artworkUrl.trim() } : item), quickDial: previous.quickDial.map((item) => item.id === playlist.id ? { ...item, artworkUrl: artworkUrl.trim() } : item) }));
    void fetch(appPath(`/api/playlists/${encodeURIComponent(playlist.id)}`), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ artworkUrl: artworkUrl.trim() }) }).catch(() => undefined);
  }, []);

  const removeTrack = useCallback((playlist: Playlist, track: Track) => {
    setLibrary((previous) => ({ ...previous, playlists: previous.playlists.map((item) => item.id === playlist.id ? { ...item, tracks: item.tracks.filter((candidate) => candidate.id !== track.id), trackCount: Math.max(0, item.trackCount - 1) } : item) }));
    void fetch(appPath(`/api/playlists/${encodeURIComponent(playlist.id)}/tracks?trackId=${encodeURIComponent(track.id)}`), { method: 'DELETE' }).catch(() => undefined);
  }, []);

  const movePlaylistTrack = useCallback((playlist: Playlist, track: Track, direction: -1 | 1) => {
    setLibrary((previous) => {
      const reorder = (item: Playlist) => {
        if (item.id !== playlist.id) return item;
        const index = item.tracks.findIndex((candidate) => candidate.id === track.id);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= item.tracks.length) return item;
        const tracks = [...item.tracks];
        [tracks[index], tracks[nextIndex]] = [tracks[nextIndex], tracks[index]];
        void fetch(appPath(`/api/playlists/${encodeURIComponent(playlist.id)}/tracks`), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ trackIds: tracks.map((candidate) => candidate.id) }) }).catch(() => undefined);
        return { ...item, tracks };
      };
      return playlist.id === previous.likedPlaylist.id ? { ...previous, likedPlaylist: reorder(previous.likedPlaylist) } : { ...previous, playlists: previous.playlists.map(reorder) };
    });
  }, []);

  const toggleQuickDial = useCallback((playlist: Playlist, enabled: boolean) => {
    setLibrary((previous) => ({ ...previous, quickDial: enabled ? [...previous.quickDial, playlist].slice(0, 6) : previous.quickDial.filter((item) => item.id !== playlist.id) }));
    void fetch(appPath('/api/quick-dial'), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ playlistId: playlist.id, enabled }) }).catch(() => undefined);
  }, []);

  const clearRecentSearches = useCallback(() => {
    setLibrary((previous) => ({ ...previous, recentSearches: [] }));
    void fetch(appPath('/api/search'), { method: 'DELETE' }).catch(() => undefined);
  }, []);

  const moveQuickDial = useCallback((playlist: Playlist, direction: -1 | 1) => {
    setLibrary((previous) => {
      const index = previous.quickDial.findIndex((item) => item.id === playlist.id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= previous.quickDial.length) return previous;
      const items = [...previous.quickDial];
      [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
      void fetch(appPath('/api/quick-dial'), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ playlistIds: items.map((item) => item.id) }) }).catch(() => undefined);
      return { ...previous, quickDial: items };
    });
  }, []);

  const queueTrack = useCallback((track: Track) => {
    void playTrack(track, queue.filter((item) => item.id !== track.id));
  }, [playTrack, queue]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      void audio.play().then(() => setIsPlaying(true)).catch(() => setNotice('Playback needs a tap to begin.'));
    } else {
      audio.pause();
      setIsPlaying(false);
      sendEvent(current, 'pause', { positionSeconds: audio.currentTime, completionPercent: durationSeconds ? (audio.currentTime / durationSeconds) * 100 : 0 });
    }
  }, [current, durationSeconds, sendEvent]);

  const previousTrack = useCallback(() => {
    if (progressSeconds > 4) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setProgressSeconds(0);
      return;
    }
    const previous = initialState.library.recentlyPlayed.find((track) => track.id !== current?.id);
    if (previous) void playTrack(previous, queue);
  }, [current?.id, initialState.library.recentlyPlayed, playTrack, progressSeconds, queue]);

  const seek = useCallback((value: number) => { if (audioRef.current) audioRef.current.currentTime = value; setProgressSeconds(value); }, []);

  const visibleTrack = current;
  const progress = durationSeconds ? (progressSeconds / durationSeconds) * 100 : 0;
  const pickerPlaylists = [library.likedPlaylist, ...library.playlists];

  return (
    <div className="app-shell">
      <main className="app-main" data-active-acquisition-jobs={activeJobCount}>
        {page === 'home' && <HomeView state={{ ...initialState, library }} recommendations={recommendations} onPlay={(track) => void playTrack(track)} onPlayAll={playAll} onLike={toggleLike} onAdd={setPickerTrack} onSave={toggleSave} onOpenPlaylist={(playlist) => { setOpenPlaylist(playlist); setPage('library'); }} onToggleQuickDial={toggleQuickDial} onMoveQuickDial={moveQuickDial} />}
        {page === 'search' && <SearchView recentSearches={library.recentSearches} onPlay={(track) => void playTrack(track)} onLike={toggleLike} onAdd={setPickerTrack} onSave={toggleSave} onRadio={startRadio} onClearRecentSearches={clearRecentSearches} />}
        {page === 'library' && <LibraryView library={library} selectedPlaylist={openPlaylist ? (openPlaylist.id === library.likedPlaylist.id ? library.likedPlaylist : library.playlists.find((playlist) => playlist.id === openPlaylist.id)) : undefined} onSelectPlaylist={setOpenPlaylist} onClosePlaylist={() => setOpenPlaylist(undefined)} onPlay={(track) => void playTrack(track)} onPlayAll={playAll} onLike={toggleLike} onAdd={setPickerTrack} onSave={toggleSave} onCreatePlaylist={createPlaylist} onRenamePlaylist={renamePlaylist} onDeletePlaylist={deletePlaylist} onChangeArtwork={changeArtwork} onRemoveTrack={removeTrack} onMoveTrack={movePlaylistTrack} />}
      </main>
      {notice && <button className="notice" onClick={() => setNotice(undefined)}>{notice}<span>×</span></button>}
      <div className="app-dock">
        {visibleTrack && <MiniPlayer track={visibleTrack} isPlaying={isPlaying} progress={progress} onToggle={togglePlayback} onExpand={() => setIsExpanded(true)} />}
        <BottomNav page={page} onChange={setPage} />
      </div>
      <audio ref={audioRef} src={audioUrl} preload="auto" />
      {isExpanded && visibleTrack && <NowPlaying track={visibleTrack} queue={queue} isPlaying={isPlaying} progressSeconds={progressSeconds} durationSeconds={durationSeconds} isLiked={visibleTrack.isLiked} isSaved={visibleTrack.isSaved} shuffle={shuffle} repeat={repeat} volume={volume} autoplayEnabled={autoplayEnabled} onClose={() => setIsExpanded(false)} onToggle={togglePlayback} onPrevious={previousTrack} onNext={() => void advance()} onSeek={seek} onShuffle={() => setShuffle((value) => !value)} onRepeat={() => setRepeat((value) => !value)} onLike={() => toggleLike(visibleTrack)} onSave={() => toggleSave(visibleTrack)} onAdd={() => setPickerTrack(visibleTrack)} onVolume={setVolume} onAutoplay={() => setAutoplayEnabled((value) => !value)} onQueueTrack={queueTrack} onRadio={() => void startRadio(visibleTrack)} />}
      {pickerTrack && <PlaylistPicker track={pickerTrack} playlists={pickerPlaylists} onSelect={addToPlaylist} onCreate={createPlaylist} onClose={() => setPickerTrack(undefined)} />}
    </div>
  );
}

function PlaylistPicker({ track, playlists, onSelect, onCreate, onClose }: { track: Track; playlists: Playlist[]; onSelect: (playlist: Playlist) => void; onCreate: () => void; onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><section className="playlist-picker" onClick={(event) => event.stopPropagation()}><div className="picker-header"><div><span className="eyebrow">ADD TO PLAYLIST</span><h2>{track.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><span>×</span></button></div><div className="picker-list">{playlists.map((playlist) => <button key={playlist.id} onClick={() => onSelect(playlist)}><Artwork src={playlist.artworkUrl} alt="" size="sm" /><span>{playlist.name}</span><small>{playlist.trackCount} tracks</small></button>)}<button className="picker-create" onClick={onCreate}>＋ Create new playlist</button></div></section></div>;
}
