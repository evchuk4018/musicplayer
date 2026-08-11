export async function GET() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  return Response.json({
    name: 'Pulse Music',
    short_name: 'Pulse',
    description: 'A private self-hosted music player',
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: 'standalone',
    background_color: '#08090d',
    theme_color: '#08090d',
    orientation: 'portrait',
    icons: [{ src: `${basePath}/icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
  }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
