# S19 R27 — Lazy W2UI properties rendering during dossier navigation

## Observed browser defect
After R26, clicking a blip while the strategic dossier was visible raised a `TypeError` in `w2tabs.click`, from `w2form.render` (`radar-rationale-panel.js:587`). Earlier failures occurred in `w2form.setFocus` on a hidden properties host. The last R26 change removed explicit synthetic tab clicks, but still constructed and rendered properties while that tab was hidden.

## Decision
The strategic dossier is independent of the W2UI properties form. While the dossier tab is active, selecting a node updates the current dossier and does not construct/render a W2UI properties form. Switching back to the outer Properties tab lazily constructs and renders the form for the current blip, after the host is unhidden. The cached form is reused for the same blip. The previous Context/Extra preference is kept, and tab active state is restored after initial render, not before. W2UI is not monkeypatched.

## Constraints
- Preserve edit-save failure guard, previous currentNode, document target and selected outer tab.
- Do not affect Cytoscape node coordinates, W2UI root layout, full-screen dossier or Tiptap.
- Form focus is disabled to prevent an implicit focus on hidden or unready fields.
- Browser validation must separately verify dossier navigation and Context/Extra navigation: static tests cannot establish that the deployed W2UI runtime has no additional internal errors.

## Regression cases
Hidden dossier: no form factory or render calls. Properties active: form created once, autofocusing disabled, restored tab after render. Repeated same node: no recreation. Outer tab switch: refresh and reveal properties before form render. Save failure: switch rejected.
