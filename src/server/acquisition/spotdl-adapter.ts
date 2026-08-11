import { spawn } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
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
      const child = spawn(/*turbopackIgnore: true*/ (process.env.SPOTDL_COMMAND ?? 'spotdl'), ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString(); });
      child.on('error', (error) => resolve({ status: 'down', detail: error.message }));
      child.on('close', (code) => resolve(code === 0 ? { status: 'up', detail: output.trim() } : { status: 'down', detail: `spotDL exited with ${code}` }));
    });
  }

  async acquire(track: Track, onProgress?: (progress: number) => Promise<void>) {
    const root = outputRoot();
    const query = `${track.artistName} - ${track.title}`;
    const startedAt = Date.now();
    const outputTemplate = path.join(root, '{artist}', '{album}', '{track-number} - {title}.{output-ext}');
    await new Promise<void>((resolve, reject) => {
      const child = spawn(/*turbopackIgnore: true*/ (process.env.SPOTDL_COMMAND ?? 'spotdl'), ['download', query, '--format', 'mp3', '--output', outputTemplate, '--overwrite', 'skip'], { stdio: ['ignore', 'pipe', 'pipe'] });
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
    const files = await readdir(/*turbopackIgnore: true*/ root, { recursive: true, withFileTypes: true }).catch(() => []);
    const titleWords = track.title.toLowerCase().split(/\W+/).filter(Boolean);
    const matches = await Promise.all(files.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.mp3')).map(async (entry) => {
      const fullPath = entry.parentPath
        ? path.join(/*turbopackIgnore: true*/ entry.parentPath, entry.name)
        : path.join(/*turbopackIgnore: true*/ root, entry.name);
      const info = await stat(fullPath).catch(() => undefined);
      if (!info || info.mtimeMs < startedAt - 5000) return undefined;
      const normalized = fullPath.toLowerCase();
      const score = titleWords.filter((word) => normalized.includes(word)).length;
      return { fullPath, score, mtimeMs: info.mtimeMs };
    }));
    const selected = matches.filter((item): item is { fullPath: string; score: number; mtimeMs: number } => Boolean(item)).sort((left, right) => right.score - left.score || right.mtimeMs - left.mtimeMs)[0];
    if (!selected) throw new Error('spotDL completed but no MP3 file was found in the music root');
    return { localPath: selected.fullPath };
  }
}
