# Architecture 164 — S19 R25-R2

The R25-R1 full-file replacement of `js/radar.js` was over-constrained to a synthetic fixture and rejected the real R24 SHA256 `1bbf685d…`. R25-R2 applies the W2UI lifecycle patch to the unique existing form factory only, protecting unrelated source changes. Both exact SHA256 and structure are validated. No bypass is possible.

The same patch avoids W2UI registration conflicts for `blipForm`, `blipForm_toolbar` and `blipForm_tabs`; the dossier workflow remains unchanged. Browser acceptance is still required.
