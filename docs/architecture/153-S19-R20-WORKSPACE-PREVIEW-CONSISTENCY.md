# S19-R20 — Consistent embedded preview width

## Problem
The static dossier renderer intentionally outputs `main{max-width:880px;margin:auto}` for standalone documents. In the fullscreen Workspace, the editing surface uses the available panel width; switching to the iframe preview therefore narrows both the page and the table. This is a visual inconsistency, not a change to stored `colwidth` or dossier data.

## Decision
Retain the standalone export renderer unchanged. The live Workspace preview (`iframe.srcdoc`) adds a small, fixed CSS override in its `<head>`, after the renderer's own stylesheet. The iframe main area fills the available width (`max-width:none`, `width:100%`) with box-sizing and restrained padding. Tables keep their existing proportional colgroup and horizontal overflow. The CSP and sandbox flags remain unchanged, and no scripts or network access are introduced.

## Verification
Unit tests check override semantics, preservation of content, unchanged editor initialization, and sandbox guards. Browser recipe must compare editing and preview in compact and fullscreen modes, plus a large table with horizontal scrolling. Standalone HTML export should retain its print-friendly maximum width.
