import type { AppState, Playlist, SpeedDialItem, SpeedDialTarget, Track } from '@/domain/music';
import { SpeedDial } from './speed-dial';

type HomeViewProps = {
  state: AppState;
  onPlay: (track: Track) => void;
  onOpenPlaylist: (playlist: Playlist) => void;
  onToggleSpeedDial: (target: SpeedDialTarget, enabled: boolean) => void;
  onMoveSpeedDial: (item: SpeedDialItem, direction: -1 | 1) => void;
};

export function HomeView({ state, onPlay, onOpenPlaylist, onToggleSpeedDial, onMoveSpeedDial }: HomeViewProps) {
  return (
    <div className="view home-view">
      <SpeedDial items={state.library.speedDial} onPlayTrack={onPlay} onOpenPlaylist={onOpenPlaylist} onTogglePin={onToggleSpeedDial} onMove={onMoveSpeedDial} />
    </div>
  );
}
