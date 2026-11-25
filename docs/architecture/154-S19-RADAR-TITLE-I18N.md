# S19-R21 — Radar title / internationalisation FR-EN

The SVG heading is derived from the active revision and Workspace organization, rather than the computer's current date. Its first line remains **Strategic Standard Chart** as requested. Subsequent lines contain organization and radar name, revision version and localized status, and last saved/modified information.

`js/radar-title.js` is the unique formatter and renderer. Both classic and custom SVG paths call it, and the Workspace calls it when the revision changes. The module listens to i18next language changes. Its only DOM mutation affects the text spans inside `#svgTitle`; it cannot change blip positions.

FR/EN status labels, date formatting, dirty indicators and missing-value text are localized. Never invent a save timestamp. `revision.extensions.administration.lastSavedAt` is used only if present and parseable; when absent, `revision.updatedAt` may be described as *last modified*, but not *last saved*. If neither exists, display an explicit unavailable value. Pending changes are derived from the existing dirty-state API. Persistence of a true last-saved timestamp across imports will require a separate authoritative storage contract.

For long metadata, the SVG title must remain within the viewBox. Preserve text nodes instead of `innerHTML` to prevent markup injection. Published presentation must not overwrite the shared title. Standalone publication title rendering remains a separate integration checkpoint.

No migration, commit, geometry mutation, or distribution is performed by this patch.
