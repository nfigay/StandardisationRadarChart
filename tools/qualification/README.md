# S15-D — Historical qualification harnesses

These scripts preserve the exact qualified campaign.
They are not a generic portable release runner.

Qualified application commit: 03474a66da02f57bcf5184b605b994ca5bc06c99

## Campaign

- s15-d-r2.mjs: builds and Web Creator recipe.
- s15-d-r3.mjs: Creator/Publisher continuation.
- s15-d-r4.mjs: offline Viewer continuation.

R3 and R4 refer to the historical macOS evidence
directories and require the original reports and artifacts.
They must not be run as a new independent campaign
without adapting the baseline and workspace inputs.

The scripts preserve the user repository and use
isolated build and Chrome contexts.

Node.js 22.23.5, Chrome and npm were used.

Evidence:
../../docs/evidence/s15-d/manifest.json

The archived scripts retain their original bytes.
Archived JSON reports have user-home path redaction.
The manifest records both original and archived hashes.

For a new release, generalize the runner or prepare
a fresh qualification campaign with the new commit.

## A8.7 — Clôture de la release publiée

a87-qualify.mjs: unified release-candidate recipe.

a87-public-qualify.mjs: exact historical public
qualification campaign for pilot-a87.

The public runner verifies the deployed Pages
manifest, public downloads, live source acquisition
and the Creator/Publisher/Viewer workflow.

The public script is archived byte for byte.
It contains historical campaign paths and requires
the corresponding original evidence and artifacts.

It is not a generic CI runner for future releases.

Evidence: ../../docs/evidence/a87/manifest.json

The release tag must remain fixed to 545ed539df2e117a8aab5158a4bcc5c151308ba3.
