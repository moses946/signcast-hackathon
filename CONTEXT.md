# SignCast — start here for a new agent

Last updated: 2 November 2026, Africa/Nairobi. Read this file, `HANDOFF.md`, and `docs/VALIDATION.md` before changing or deploying anything. Never interpret a prepared document or a fixture test as evidence of actual Twitch or ASL playback.

## Owner's objective

Finish SignCast for the Codex x TwitchCon hackathon. The owner wants every independent submission requirement prepared while the Signvrse API is unavailable, then real signing validation and the final recording/submission when it recovers. The deadline verified from https://twitchcon-codex.devpost.com/rules is **3 November 2026, 01:00 Nairobi time** (2 November, 14:00 PST). Recheck official rules if resuming after this date.

New public submission repository requested by the owner: **https://github.com/moses946/signcast-hackathon**. The earlier repository https://github.com/moses946/signcast remains intact for provenance and existing support links. All history is from the standalone SignCast app; no private Signvrse history was imported.

Workspace: `C:\Users\moses\Documents\Signvrse\signcast`. This is a separate Git repository inside a larger private workspace. Do not add files from its parent to the public repository.

## Fixed product decisions

- Native **desktop Twitch Video Component Extension** is primary. OBS Browser Source is the fallback.
- English speech (`en-US`) to AI-generated **ASL**, with English captions. Call it an AI-generated signing prototype.
- Microphone comes from the broadcaster companion via AudioWorklet, continuously resampled to mono 16 kHz PCM16. No Twitch stream-audio extraction, desktop capture, mobile, EventSub, chat commands, or runtime LLM.
- **Amazon Transcribe Streaming** replaces the original Google STT choice at the owner's explicit request. AWS hosting also uses the owner's independent account/credits.
- Only the separately supplied hosted **Signvrse enterprise API** may be used. Never reuse Signvrse Google credentials/services, private libraries/backend, avatar assets, or old project keys in SignCast. Read-only outage investigation was authorized separately; it does not authorize transplanting that infrastructure into this app.
- One active broadcaster per deployment, in-memory state, one render per finalized phrase shared by all viewers. Replay is personal and uses retained bytes, never a new provider request.
- Explicit ASL, avatar Zane, 960×540, 30 fps, upper-body camera. No automatic switch to KSL or fake signing.

## Implemented architecture

Node.js 24 / npm workspaces / TypeScript:

- `apps/companion`: React broadcaster capture/dashboard and OBS output.
- `apps/extension`: viewer.html, config.html, live.html; Twitch Helper authorization and player context.
- `apps/server`: Express/ws, Twitch OAuth, Extension JWT validation, Transcribe, Signvrse WS/HTTP adapters, channel sessions and streaming media.
- `packages/shared`: contracts, validation, resampler, per-viewer MSE/Blob playback, scheduling/replay.
- `fixtures/demo.mp4`: distributable synthetic test pattern; not ASL.

The existing implementation preserves authentication boundaries and bounded queues/cache: max 16 words/phrase, three unstarted phrases, 20-second queue wait, overload pause, ten completed clips, 128 MiB total/16 MiB individual, two-minute media TTL, 200 transcript entries/up to 15 minutes, 25 viewers, one-hour/300-render session limits. Do not claim production capacity or latency targets without measurements.

Commit `31719eb` adds an important outage behavior: when Signvrse account preflight fails, real microphone/transcription can still start, signing is explicitly unavailable, no render is submitted, and captions continue. **Retry signing feed** calls owner-only `POST /api/session/signing/resume`; it rechecks the provider before unpausing. Ordinary capture pause/resume preserves signing unavailability. No missed phrases are automatically billed/replayed after recovery.

Public `/privacy` and `/terms` pages and support links are included. They describe the actual prototype and external processing; provider retention must not be invented.

## Deployment and credentials

Hosted companion: **https://si-eb3f0fb6d3914816a6229496e4cfa0e2.ecs.eu-west-1.on.aws**

Hosted OAuth callback: same origin plus `/auth/twitch/callback`.

AWS region `eu-west-1`, ECS cluster `default`, service/slug `signcast-01a19aeb`, CodeBuild project `signcast-01a19aeb-image`, Secrets Manager secret `signcast-01a19aeb/runtime`. ECS task role grants Transcribe streaming; execution role reads the project secret. Runtime never uses root/developer credentials. Minimum/maximum steady-state task count is one.

AWS Express Mode uses a managed canary. It may temporarily run two tasks; do not test stateful sessions until rollout is complete and one task remains. Do not attempt ROLLING (AWS rejected that setting). A configuration-only update replaces the task; capture/login/runtime buffers are lost. AWS resources incur charges; credit coverage is not guaranteed.

Secrets are in ignored local `.env` and AWS Secrets Manager. Never print or commit them. `.env` includes the user-supplied Signvrse key, separate Twitch OAuth and Extension credentials, app secrets, and AWS runtime profile. The OAuth application's Client ID/secret and the Extension's signing secret are separate. A localhost callback in local `.env` is not copied to AWS: the deployment script explicitly uses the hosted callback.

Local AWS profiles: `signcast-developer` is a dedicated IAM user's short-lived login, `signcast-runtime` assumes `SignCastTranscribeRuntime`. `signcast` was used only for authorized provisioning. No permanent access keys were created. Do not copy AWS login caches or the ignored temporary development-password artifact into hosting/public source. If credentials expire, read the signing-in-to-aws skill and honor its login confirmation rule.

Ignored deployment state/evidence is under `artifacts/`: aws-hosting.json, aws-service-status.json, provider-check.json, hosted-live-config-check.json, speech-check.json. These may include private deployment metadata or URLs. A fresh clone lacks this state: inspect existing AWS resources before running provisioning and avoid creating a duplicate deployment.

`scripts/deploy-aws.ps1`: Build uses a full pushed Git commit; Configure with the observed URL and `-Live` updates the existing service. Do not use Deploy to update an existing service—it creates one. Do not rerun Prepare casually: preserve the existing state manifest. Read docs/AWS_HOSTING.md. The image for the outage/policy update was built from `31719eb`.

## Twitch registration actually observed

- Account/channel: **mk__dons**, https://www.twitch.tv/mk__dons.
- Extension Client ID: `qzfhe2w4mmi1r2g1ds7p0eaqxl4i6k` (public identifier).
- Version **0.0.1**, **Hosted Test**, not public release.
- Viewer/config/live paths: `viewer.html`, `config.html`, `live.html`, verified in console.
- Extension origin: `https://qzfhe2w4mmi1r2g1ds7p0eaqxl4i6k.ext-twitch.tv`.
- Listing: https://www.twitch.tv/ext/qzfhe2w4mmi1r2g1ds7p0eaqxl4i6k-0.0.1.
- Only `mk__dons` was observed on the testing allowlist. A second actual tester and judge access still need owner setup/verification.

The owner was asked to complete companion OAuth sign-in and leave the console open; their reply “This is okay” did not establish that sign-in completed. Do not treat consent to continue as observed account authentication. A browser tab was capturing the **local demo**, not proof of real hosted Transcribe.

Windows Computer Use successfully read Hosted Test and access settings, then stopped because it could not verify the current browser URL safely. Do not bypass that protection or automate authentication dialogs. Native installation, real Twitch Helper playback, two real accounts, and OBS playback remain unverified. OBS was not found in standard installation paths. Fixture browser tests cover the overlay page but not the actual OBS application.

The newest extension ZIP is `artifacts/signcast-extension.zip`; it was rebuilt after the caption fallback changes. Do not claim that latest ZIP is already uploaded to Twitch. The existing Hosted Test bundle is compatible with the backend but predates the latest viewer status wording. Updating Twitch assets/settings may require Local Test → upload → Hosted Test. Follow the actual console and skill approval requirements for account/access changes.

## Verification evidence

- Typecheck and production builds pass.
- **28 unit/integration tests pass**, including the signing-outage → captions → explicit successful retry regression and no render during outage.
- **Four Chromium tests pass**: independent playback/replay/hide, complete-MP4 fallback, basic keyboard/input scope, AudioWorklet synthetic microphone and pause cleanup. Run with `SIGNCAST_TEST_PORT=3001` if the user's demo occupies port 3000.
- CI passed for `31719eb`: https://github.com/moses946/signcast/actions/runs/41457420968.
- A short **real Amazon Transcribe** test returned three final/seven interim segments on the same speech implementation. Long-session recovery/accuracy are not established by that test.
- Hosted config tests passed live health, OAuth redirect/client/callback matching, diagnostic signed Extension JWT exchange, configured-origin CORS, and disabled demo authentication. These are not a real Twitch Helper or human OAuth sign-in test.
- Earlier hosted synthetic shared playback and independent replay passed. Do not call this native or ASL evidence.
- Heuristic source/build/history secret scans pass. Generated images have been inspected; token-bearing OBS fields in published screenshots are masked.

## Signvrse outage: established facts, not guesses

Configured trusted origin: `https://signvrse-backend-817689209292.europe-west6.run.app`.

Repeated account and actual health routes return HTTP **503**, Google Frontend HTML: service not available yet. Both Cloud Run URLs listed by the service failed. No paid render was attempted after failed preflight.

Read-only gcloud investigation established billingEnabled=true, actual service minimum instances=1, current revision `signvrse-backend-00111-qzd` receiving 100% traffic, deployed successfully October 26 with containers healthy in about 25 seconds. These historical readiness conditions do not prove current health. Ordinary scale-from-zero is not established as the cause. **Payment as the underlying cause is unconfirmed.**

Cloud Logging query failed PERMISSION_DENIED for all log views for the signed-in account. Exact outage cause remains unknown until an authorized account can read logs. Do not impersonate an unrelated/private service account or change the private deployment to get around access denial.

## Submission materials already prepared

- `submission/DEVPOST_DRAFT.md`: copy-ready description, tech list, links and accurate disclosure.
- Verified Codex thread/session ID: **01a19aeb-e2f3-7611-9b71-92986ea57fb4**, read from CODEX_THREAD_ID, not invented.
- `submission/VIDEO_SCRIPT.md`: 2:40 recording plan; actual Twitch footage and Codex evidence required. Do not show earlier secret-bearing chat messages.
- `submission/JUDGE_ACCESS.md`: native test-account restrictions and OBS fallback.
- `submission/TWITCH_FIELDS.md`: descriptions, origins, paths, policy URLs, asset mappings.
- `submission/FINAL_STEPS.md`: the owner/provider actions still required.
- `assets/branding/`: logo, 24px icon, discovery image, exact 1024×768 actual dashboard screenshot with Demo data visible. Screenshot is not native signing evidence.
- Local upload bundle: `artifacts/signcast-submission-kit.zip`. It contains prepared text/assets/extension ZIP only, not credentials. It must be regenerated after submission-file changes.

No public YouTube video URL, Devpost draft, final submission, submission receipt, public Twitch approval, or judge allowlist access has been established. Do not claim “everything except signing is done” while those independent actions remain.

## Next actions in order

1. Confirm the current AWS deployment completed with one task; check `/healthz`, `/privacy`, `/terms`, and hosted auth configuration. Record actual results in HANDOFF/VALIDATION.
2. Have the owner complete the real hosted Twitch sign-in. Exercise real microphone → Transcribe → captions while Signvrse is down; verify captions inside native Twitch, actual OBS, and two intended viewer accounts. Observe cleanup on pause/stop.
3. Complete latest Twitch upload/settings and judge access as necessary, without silently claiming a public release. Save the prepared Devpost draft through the owner's account; final submission is a separate action.
4. When Signvrse recovers, run `npm run check:providers -- --render` once (billable), inspect ASL/video/timing, and obtain ASL-fluent review. Then retry signing on the companion and speak new phrases through the actual Twitch/OBS path. Verify shared rendering and zero new requests on replay.
5. Record/assemble the real demonstration, publicly upload to YouTube, verify signed-out access, reconcile all text with evidence, and submit before the deadline. Treat the outage and any unverified behavior honestly if they persist.

Work autonomously within the owner's instructions, keep credentials private, and report blockers precisely. Do not swap providers/languages or expand to private backend reuse to make the main feature appear complete.
