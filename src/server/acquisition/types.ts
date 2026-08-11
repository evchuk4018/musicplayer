import type { Track } from '@/domain/music';

export type AcquisitionResult = { localPath: string };

export interface AcquisitionProvider {
  readonly name: string;
  acquire(track: Track, onProgress?: (progress: number) => Promise<void>): Promise<AcquisitionResult>;
  health(): Promise<{ status: 'up' | 'down' | 'disabled'; detail?: string }>;
}
