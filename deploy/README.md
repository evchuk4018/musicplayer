# Homelab deployment

This compose project is intentionally isolated from the existing Wowzer Bowser stack. It uses its own `musicplayer` Compose project, PostgreSQL database, Navidrome data volume, host music directory, and localhost port `3090`. The existing private Tailscale root remains untouched; the deployment script adds the PWA at `/music`.

The app only invokes spotDL when both `ACQUISITION_ENABLED=true` and `AUTHORIZED_ACQUISITION=true` are set. The second flag is an explicit account-owner policy gate: enable it only for music the account owner is authorized to acquire.

The normal deployment sequence is:

1. Build and push `main` from the local workspace.
2. Archive the pushed checkout into `/srv/storage/wowzerbowser/files/musicplayer`.
3. Create a private `.env` with `MUSICPLAYER_MUSIC_ROOT=/srv/storage/media/music` and a unique PostgreSQL password; the deploy script keeps that mount root traversable by the unprivileged web service.
4. Build and start PostgreSQL/Navidrome.
5. Run migrations and the migration check.
6. Recreate web and worker from the freshly built images with `restart: unless-stopped`, then verify the web service can read and traverse `/music`.
7. Add the `/music` Tailscale Serve path and verify `/music/api/health`.

The resulting private URL is:

`https://homelab.tail861ffd.ts.net/music/`
