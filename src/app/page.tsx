import { MusicApp } from '@/components/music-app';
import { getInitialAppState } from '@/server/app-state-service';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const initialState = await getInitialAppState();
  return <MusicApp initialState={initialState} />;
}
