# TICKET: Build Self-Hosted Music PWA - Navidrome + spotDL

Status: Complete
Priority: high
Design source of truth: the three attached screenshots

## Design references

- Search reference: `C:\Users\erhol\.codex\codex-remote-attachments\019ff23a-db35-7763-9ba8-d3b01264e9cc\CD22C08D-C29C-42FF-9AA7-54AB8DB32ADB\1-Photo-1.jpg`
- Library reference: `C:\Users\erhol\.codex\codex-remote-attachments\019ff23a-db35-7763-9ba8-d3b01264e9cc\CD22C08D-C29C-42FF-9AA7-54AB8DB32ADB\2-Photo-2.jpg`
- Home reference: `C:\Users\erhol\.codex\codex-remote-attachments\019ff23a-db35-7763-9ba8-d3b01264e9cc\CD22C08D-C29C-42FF-9AA7-54AB8DB32ADB\3-Photo-3.jpg`

The product is a mobile-first, dark, installed-PWA music app with the same visual language as the references: compact spacing, strong typography hierarchy, artwork-led cards and rows, persistent mini-player, bottom navigation, and an expanded Now Playing view. Third-party branding and logos are not copied.

## Product goal

Deliver one unified self-hosted PWA. Navidrome, spotDL, catalog/metadata providers, relationship data, recommendations, and acquisition jobs are implementation details hidden behind the product UI. The normal user flow is:

> Open the PWA -> search the broad music catalog -> tap a song -> play immediately when local or acquire automatically -> keep a five-track look-ahead prepared -> personalize recommendations -> retain liked/saved/playlisted music permanently -> prune disposable cache music safely.

## Infrastructure and deployment

- [x] Configure Navidrome as the local music library/server.
- [x] Configure spotDL as an acquisition provider behind an internal acquisition/job layer.
- [x] Use shared storage so completed acquisitions become available to Navidrome automatically.
- [x] Start all backend services automatically after reboot/power loss.
- [x] Restart services cleanly after crashes and expose service health/status to the app.
- [x] Prevent duplicate acquisition jobs and limit concurrency.
- [x] Only acquire media the user is authorized to download.
- [x] Keep OpenDataLoader, if present in the host stack, CPU-only with the required resource limits and private networking; the music compose project does not alter that existing service.
- [x] Deploy to the `homelab` host only after local checks pass.
- [x] Apply pending database migrations to the local `homelab` server and verify migration state before completion.
- [x] Include health/readiness checks for the web app, database, Navidrome, and acquisition worker.

## Global catalog and local/remote playback

- [x] Search and browse a global catalog, not only downloaded/local files.
- [x] Support songs, artists, albums, and provider playlists.
- [x] Show global search results even when audio is not local.
- [x] Show broader artist catalogs and complete album track listings.
- [x] Play local tracks immediately.
- [x] Automatically enqueue remote tracks for acquisition when selected.
- [x] Show preparing/downloading status and begin playback as soon as practical.
- [x] Automatically expose completed acquisitions to the local library and trigger a Navidrome scan when credentials are configured.
- [x] Keep catalog and acquisition provider adapters replaceable.

## Home

- [x] Match the home reference with a prominent Quick Dial / Speed Dial section near the top.
- [x] Support one-tap Quick Dial playlist access.
- [x] Add, remove, and reorder Quick Dial playlists.
- [x] Include restrained personalized sections: Quick Picks, Recently Played, recommended songs, and recommended artist/album artwork cards.
- [x] Avoid unnecessary tabs or visual clutter.

## Search

- [x] Match the search reference with a top search field and recent-search treatment.
- [x] Show recent searches and recent artwork tiles.
- [x] Search the broad catalog across songs, artists, albums, and playlists where supported.
- [x] Provide clear selection and playback/acquisition states.
- [x] Allow recent searches to be cleared and persist searches in the database.

## Library, playlists, and liked music

- [x] Match the library reference with compact category chips and artwork-led rows.
- [x] Show all playlists, Liked Music, saved music, and useful recent playlist activity.
- [x] Support appropriate sorting and Quick Dial playlist reordering.
- [x] Create, rename, delete, and reorder playlists/tracks where applicable.
- [x] Change playlist artwork by URL where practical.
- [x] Add, remove, and reorder playlist tracks.
- [x] Provide a designated Liked Music playlist/library.
- [x] Make like/unlike a single-tap action that immediately updates Liked Music and persists transactionally.
- [x] Keep add-to-playlist as a separate playlist picker action.
- [x] Never automatically prune liked, saved, protected, or retained-playlist content.

## Player, queue, and PWA behavior

- [x] Keep a persistent mini-player immediately above bottom navigation on Home, Search, and Library.
- [x] Mini-player includes artwork, title, artist, play/pause, progress, and expand interaction.
- [x] Expanded Now Playing includes large artwork, title, artist, play/pause, previous, next, seek, shuffle, repeat, queue, like/unlike, add-to-playlist, and volume.
- [x] Persist player and queue state while navigating and restore it from local storage after reload.
- [x] Support iOS PWA/background audio and Media Session lock-screen controls as far as browser capabilities permit.
- [x] Keep bottom navigation limited to Home, Search, and Library.
- [x] Autoplay relevant recommendations after manual/playlist queues unless disabled.
- [x] Rebuild or invalidate irrelevant future queue items after a new song, album, playlist, radio, seed, or substantial queue change.
- [x] Cancel unnecessary pending acquisition jobs when practical without discarding useful/almost-complete files.

## Recommendations

- [x] Keep recommendations separate from spotDL/acquisition.
- [x] Implement modular global/base music similarity and personal taste reranking layers.
- [x] Bootstrap cold-start recommendations from external/public music metadata and relationship data.
- [x] Build global artist similarity from replaceable related-artist and public relationship signals.
- [x] Build track candidates from artist/track relationships, current artist, genre/mood/tempo/era metadata, and global associations where available.
- [x] Generate a candidate pool before ranking; target approximately 100 candidates when data allows.
- [x] Track plays, completion percentage, skips and skip timing, replays, likes/unlikes, playlist additions/removals, repeated listening, and recent listening.
- [x] Weight likes and playlist additions strongly positive; replays and full listens positive; early skips strongly negative; late skips nearly neutral; repeated skips stronger without making one skip permanent.
- [x] Weight recent listening more heavily than stale listening.
- [x] Penalize recently played tracks, excessive artist/album repetition, recent skips, and over-exposed songs.
- [x] Include a small related exploration component for unfamiliar but plausible music.
- [x] Support distinct Track/Artist Radio and Home/For You contexts.

## Prefetch, failure handling, and retention

- [x] Maintain approximately five recommended songs ahead of the current song.
- [x] Start acquisition for non-local look-ahead tracks immediately.
- [x] Refill the look-ahead buffer asynchronously as playback advances.
- [x] Do not block normal sequential playback on recommendation generation or acquisition when alternatives exist.
- [x] Mark acquisition failures, replace failed candidates, avoid playback stalls, and suppress permanent retry loops.
- [x] Treat automatically acquired recommendation tracks as a configurable local cache/library.
- [x] Track acquisition date, last played, play count, liked status, playlist membership, and saved/protected state.
- [x] Prune inactive disposable cache tracks after approximately 30 days without meaningful use.
- [x] Keep retention policy modular/configurable.

## Acquisition/job architecture

- [x] Keep frontend code independent from spotDL shell commands.
- [x] Implement queued, active, completed, failed, blocked, and cancelled job states.
- [x] Deduplicate by canonical track identity with a database uniqueness constraint and conflict-safe insertion.
- [x] Support cancellation, retries, a one-worker concurrent download limit, and status updates.
- [x] Keep spotDL in a provider adapter so another acquisition backend can replace it.
- [x] Make status visible through the main app and usable by the worker/operational checks.

## Architecture constraints

Keep these concerns modular and avoid circular dependencies:

- [x] frontend/UI
- [x] player and queue
- [x] local library
- [x] global catalog/search
- [x] metadata
- [x] relationship graph
- [x] candidate generation
- [x] recommendation ranking/personalization
- [x] acquisition and spotDL adapter
- [x] Navidrome adapter
- [x] retention/pruning
- [x] playlists
- [x] listening-history/event tracking

Route handlers remain thin: authenticate/validate where applicable, call a domain service, and format the response. Database queries belong in repositories. Shared protocol schemas stay independent from the web app and worker. Provider adapters, manifests, executors, and policy gates remain separate. The design allows future provider, recommender, retention, page, and playback-client changes without a rewrite.

## Acceptance criteria

- [x] A user can install/open one PWA, search a non-local song, tap it, see an acquisition state, and play the available preview/full local stream when ready.
- [x] Local songs play without unnecessary acquisition.
- [x] Home, Search, and Library match the supplied mobile references in layout, tone, hierarchy, spacing, and interaction patterns.
- [x] Mini-player and player state persist across all three main views.
- [x] Likes, playlists, queue actions, listening events, recommendations, and retention state survive reloads.
- [x] Five-song prefetch is visible through queue/status state and refills as playback advances.
- [x] A failed acquisition is replaced without stalling the queue.
- [x] Services and database are healthy after deployment and recover with the host stack.
- [x] Local tests/builds pass, changes are committed at logical points, `main` is pushed, and homelab deployment plus migration verification are complete.

## Completion verification

- Local `npm run typecheck`, `npm run lint`, and `/music` production builds pass.
- `main` is pushed through commits `3a0d09c`, `53e1a18`, `cdf8e01`, `edb24c0`, `52eb2d7`, `6648fad`, `c9f3d84`, `5fe4f11`, `9ffe599`, `3307cbf`, `0320f9b`, and `1fbb397`.
- Homelab is deployed at `https://homelab.tail861ffd.ts.net/music/` with isolated Compose services and `/music` Tailscale routing.
- PostgreSQL, Navidrome, web, and worker are healthy; acquisition reports spotDL `4.5.2`.
- Migration verification passed with `1 migration(s) applied` after the final deployment.
- The homelab authorization gate is explicitly enabled; only media the account owner is authorized to acquire should be requested.
