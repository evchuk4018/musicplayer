# TICKET: Build Self-Hosted Music PWA — Navidrome + spotDL

Status: In progress  
Priority: high  
Design source of truth: the three attached screenshots

## Design references

- Search reference: `C:\Users\erhol\.codex\codex-remote-attachments\019ff23a-db35-7763-9ba8-d3b01264e9cc\CD22C08D-C29C-42FF-9AA7-54AB8DB32ADB\1-Photo-1.jpg`
- Library reference: `C:\Users\erhol\.codex\codex-remote-attachments\019ff23a-db35-7763-9ba8-d3b01264e9cc\CD22C08D-C29C-42FF-9AA7-54AB8DB32ADB\2-Photo-2.jpg`
- Home reference: `C:\Users\erhol\.codex\codex-remote-attachments\019ff23a-db35-7763-9ba8-d3b01264e9cc\CD22C08D-C29C-42FF-9AA7-54AB8DB32ADB\3-Photo-3.jpg`

The product must be a mobile-first, dark, installed-PWA music app with the same visual language as the references: compact spacing, strong typography hierarchy, artwork-led cards and rows, persistent mini-player, bottom navigation, and an expanded Now Playing view. Do not copy third-party branding or logos.

## Product goal

Deliver one unified self-hosted PWA. Navidrome, spotDL, catalog/metadata providers, relationship data, recommendations, and acquisition jobs are implementation details hidden behind the product UI. The normal user flow is:

> Open the PWA → search the broad music catalog → tap a song → play immediately when local or acquire automatically → keep a five-track look-ahead prepared → personalize recommendations → retain liked/saved/playlisted music permanently → prune disposable cache music safely.

## Infrastructure and deployment

- [ ] Configure Navidrome as the local music library/server.
- [ ] Configure spotDL as an acquisition provider behind an internal acquisition/job layer.
- [ ] Use shared storage so completed acquisitions become available to Navidrome automatically.
- [ ] Start all backend services automatically after reboot/power loss.
- [ ] Restart services cleanly after crashes and expose service health/status to the app.
- [ ] Prevent duplicate acquisition jobs and limit concurrency.
- [ ] Only acquire media the user is authorized to download.
- [ ] Keep OpenDataLoader, if present in the host stack, CPU-only with the required resource limits and private networking.
- [ ] Deploy to the `homelab` host only after local checks pass.
- [ ] Apply pending database migrations to the local `homelab` server and verify migration state before completion.
- [ ] Include health/readiness checks for the web app, database, Navidrome, and acquisition worker.

## Global catalog and local/remote playback

- [ ] Search and browse a global catalog, not only downloaded/local files.
- [ ] Support songs, artists, albums, and playlists where the provider supports them.
- [ ] Show global search results even when audio is not local.
- [ ] Show broader artist catalogs and complete album track listings.
- [ ] Play local tracks immediately.
- [ ] Automatically enqueue remote tracks for acquisition when selected.
- [ ] Show preparing/downloading status and begin playback as soon as practical.
- [ ] Automatically expose completed acquisitions to the local library.
- [ ] Keep provider adapters replaceable.

## Home

- [ ] Match the home reference with a prominent Quick Dial / Speed Dial section near the top.
- [ ] Support one-tap Quick Dial playlist access.
- [ ] Add, remove, and reorder Quick Dial playlists.
- [ ] Include restrained personalized sections: Quick Picks, Recently Played, Recommended songs, Recommended artists/albums, and Continue listening.
- [ ] Avoid unnecessary tabs or visual clutter.

## Search

- [ ] Match the search reference with a top search field and recent-search treatment.
- [ ] Show recent searches and recent artwork tiles.
- [ ] Search the broad catalog across songs, artists, albums, and playlists where supported.
- [ ] Provide clear selection and playback/acquisition states.

## Library, playlists, and liked music

- [ ] Match the library reference with compact category chips and artwork-led rows.
- [ ] Show all playlists, Liked Music, saved music, and useful recent playlist activity.
- [ ] Support appropriate sorting and playlist reordering.
- [ ] Create, rename, delete, and reorder playlists.
- [ ] Change playlist artwork where practical.
- [ ] Add, remove, and reorder playlist tracks.
- [ ] Provide a designated Liked Music playlist/library.
- [ ] Make like/unlike a single-tap action that immediately updates Liked Music.
- [ ] Keep add-to-playlist as a separate playlist picker action.
- [ ] Never automatically prune liked, saved, protected, or retained-playlist content.

## Player, queue, and PWA behavior

- [ ] Keep a persistent mini-player immediately above bottom navigation on Home, Search, and Library.
- [ ] Mini-player includes artwork, title, artist, play/pause, progress, and expand interaction.
- [ ] Expanded Now Playing includes large artwork, title, artist, play/pause, previous, next, seek, shuffle, repeat, queue, like/unlike, add-to-playlist, and volume where supported.
- [ ] Persist player and queue state while navigating.
- [ ] Support iOS PWA/background audio and Media Session lock-screen controls as far as browser capabilities permit.
- [ ] Keep bottom navigation limited to Home, Search, and Library.
- [ ] Autoplay relevant recommendations after manual/playlist queues unless disabled.
- [ ] Rebuild or invalidate irrelevant future queue items after a new song, album, playlist, radio, seed, or substantial queue change.
- [ ] Cancel unnecessary pending acquisitions when practical without discarding useful/almost-complete files.

## Recommendations

- [ ] Keep recommendations separate from spotDL/acquisition.
- [ ] Implement modular global/base music similarity and personal taste reranking layers.
- [ ] Bootstrap cold-start recommendations from external/public music metadata and relationship data.
- [ ] Build global artist similarity from replaceable relationship signals such as similar artists, collaborations, shared genres/tags, producers, compilations/playlists, and other public associations.
- [ ] Build track candidates from artist/track relationships, current artist, collaborators, genre/subgenre, era, tags, mood, energy, tempo, instrumentation/audio characteristics, and global associations where available.
- [ ] Generate a candidate pool before ranking; target approximately 100 candidates when data allows.
- [ ] Track plays, completion percentage, skips and skip timing, replays, likes/unlikes, playlist additions/removals, repeated listening, and recent listening.
- [ ] Weight likes and playlist additions strongly positive; replays and full listens positive; early skips strongly negative; late skips nearly neutral; repeated skips stronger without making one skip permanent.
- [ ] Weight recent listening more heavily than stale listening.
- [ ] Penalize recently played tracks, excessive artist/album repetition, recent skips, and over-exposed songs.
- [ ] Include a small related exploration component for unfamiliar but plausible music.
- [ ] Support distinct Track/Artist Radio and Home/For You contexts.

## Prefetch, failure handling, and retention

- [ ] Maintain approximately five recommended songs ahead of the current song.
- [ ] Start acquisition for non-local look-ahead tracks immediately.
- [ ] Refill the look-ahead buffer asynchronously as playback advances.
- [ ] Do not block normal sequential playback on recommendation generation or acquisition when alternatives exist.
- [ ] Mark acquisition failures, replace failed candidates, avoid playback stalls, and suppress permanent retry loops.
- [ ] Treat automatically acquired recommendation tracks as a configurable local cache/library.
- [ ] Track acquisition date, last played, play count, liked status, playlist membership, and saved/protected state.
- [ ] Prune inactive disposable cache tracks after approximately 30 days without meaningful use.
- [ ] Keep retention policy modular/configurable.

## Acquisition/job architecture

- [ ] Keep frontend code independent from spotDL shell commands.
- [ ] Implement queued, active, completed, failed, and cancelled job states.
- [ ] Deduplicate by canonical track identity.
- [ ] Support cancellation, retries, concurrent download limits, and status updates.
- [ ] Keep spotDL in a provider adapter so another acquisition backend can replace it.
- [ ] Make status visible through the main app and usable by the worker/operational checks.

## Architecture constraints

Keep these concerns modular and avoid circular dependencies:

- frontend/UI
- player and queue
- local library
- global catalog/search
- metadata
- relationship graph
- candidate generation
- recommendation ranking/personalization
- acquisition and spotDL adapter
- Navidrome adapter
- retention/pruning
- playlists
- listening-history/event tracking

Route handlers remain thin: authenticate, validate, call a domain service, and format the response. Database queries belong in repositories. Shared protocol schemas stay independent of the web app and worker. Tool manifests, executors, and permission policies remain separate. The design must allow future provider, recommender, retention, page, and playback-client changes without a rewrite.

## Acceptance criteria

- [ ] A user can install/open one PWA, search a non-local song, tap it, see an acquisition state, and play it when ready.
- [ ] Local songs play without unnecessary acquisition.
- [ ] Home, Search, and Library match the supplied mobile references in layout, tone, hierarchy, spacing, and interaction patterns.
- [ ] Mini-player and player state persist across all three main views.
- [ ] Likes, playlists, queue actions, listening events, recommendations, and retention state survive reloads.
- [ ] Five-song prefetch is visible through queue/status state and refills as playback advances.
- [ ] A failed acquisition is replaced without stalling the queue.
- [ ] Services and database are healthy after deployment and recover with the host stack.
- [ ] Local tests/builds pass, changes are committed at logical points, `main` is pushed, and homelab deployment plus migration verification are complete.
