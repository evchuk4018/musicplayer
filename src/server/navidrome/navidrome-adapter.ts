export class NavidromeAdapter {
  private readonly baseUrl = process.env.NAVIDROME_URL ?? 'http://localhost:4533';

  private authParams() {
    return new URLSearchParams({
      u: process.env.NAVIDROME_USER ?? '',
      p: process.env.NAVIDROME_PASSWORD ?? '',
      v: '1.16.1',
      c: 'musicplayer',
      f: 'json'
    });
  }

  async health() {
    try {
      const response = await fetch(`${this.baseUrl}/ping`, { cache: 'no-store' });
      if (!response.ok) return { status: 'down' as const, detail: `HTTP ${response.status}` };
      return { status: 'up' as const };
    } catch (error) {
      return { status: 'down' as const, detail: error instanceof Error ? error.message : 'unreachable' };
    }
  }

  async scan() {
    const response = await fetch(`${this.baseUrl}/rest/startScan.view?${this.authParams().toString()}`, { method: 'GET', cache: 'no-store' });
    if (!response.ok) throw new Error(`Navidrome scan failed with ${response.status}`);
  }
}

export const navidrome = new NavidromeAdapter();
