import { spawn } from 'node:child_process';
import path from 'node:path';
import type { Track } from '@/domain/music';
import type { AcquisitionProvider } from './types';

function outputRoot() {
  return process.env.SPOTDL_OUTPUT ?? process.env.MUSIC_ROOT ?? './data/music';
}

export class SpotDlAdapter implements AcquisitionProvider {
  readonly name = 'spotdl';

  async health() {
    if (process.env.ACQUISITION_ENABLED !== 'true') return { status: 'disabled' as const, detail: 'Acquisition is disabled by configuration' };
    if (process.env.AUTHORIZED_ACQUISITION !== 'true') return { status: 'disabled' as const, detail: 'Authorization gate is not enabled' };
    return new Promise<{ status: 'up' | 'down'; detail?: string }>((resolve) => {
      const child = spawn(process.env.SPOTDL_COMMAND ?? 'spotdl', ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString(); });
      child.on('error', (error) => resolve({ status: 'down', detail: error.message }));
      child.on('close', (code) => resolve(code === 0 ? { status: 'up', detail: output.trim() } : { status: 'down', detail: `spotDL exited with ${code}` }));
    });
  }

  async acquire(track: Track, onProgress?: (progress: number) => Promise<void>) {
    const root = outputRoot();
    const query = `${track.artistName} - ${track.title}`;
    const destination = path.join(root, track.artistName, `${track.title}.mp3`);
    await new Promise<void>((resolve, reject) => {
      const child = spawn(process.env.SPOTDL_COMMAND ?? 'spotdl', ['download', query, '--output', root], { stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';
      child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
      child.stdout.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        const match = text.match(/(\d{1,3})%/);
        if (match && onProgress) void onProgress(Number(match[1]));
      });
      child.on('error', reject);
      child.on('close', (code) => code === 0 ? resolve() : reject(new Error(stderr.trim() || `spotDL exited with ${code}`)));
    });
    return { localPath: destination };
  }
}
