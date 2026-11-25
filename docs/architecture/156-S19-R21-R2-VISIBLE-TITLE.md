# S19 R21-R2 — Visible radar title in Workspace

The radar title is rendered into a dedicated HTML header inside `#svg-container`, as a flex sibling of the SVG. This reserves genuine vertical space within the host and avoids clipping under `overflow:hidden`. The existing SVG title nodes are retained unchanged (but hidden within the live Workspace) for non-DOM SVG consumers. Text is inserted with `textContent`, not HTML. This is a view-only change: no catalog model, datum, geometry or blip coordinates are changed. The header updates through the existing FR/EN refresh cycle.

Validate in Chrome in the compact W2UI layout, custom and default radar geometry, switching revisions and FR/EN; verify no duplicate title, no overlap, and visual title reappears after radar re-render. Standalone SVG export remains a separate release validation item.
