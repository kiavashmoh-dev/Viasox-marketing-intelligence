# UGC three-tab creator document — design (2026-09-09)

**Decision (Kia):** every UGC brief ships as ONE new Google Doc per task, named after the task,
with three tabs — Creator Brief · Script · Strategy — in the exact style and at the exact level
of information of his example (`src/factory2/docxTemplate/EXAMPLE-UGC-brief.docx`). Trimmed,
essentials only. Workflow unchanged: generate → edit in the app → CMO review → export at the end.
Ecom keeps its current export.

## Architecture
- **Model** `src/factory2/ugcDocModel.ts` — renderer-agnostic `UgcDocument` (tabs of blocks) +
  `UgcCreatorDoc` (the brief's document fields) + `buildUgcDocument(brief)`. The style spec
  measured from the example lives in its header comment.
- **Content** — the UGC writer's JSON contract now IS the document: `creatorDoc` (brief info,
  script note, before-you-submit, strategy incl. optional offer/reference), per-row
  `onScreenText` + roles `reveal`/`offer`, per-hook `hookShots`/`hookOnScreenText`. Header asks
  for tonality/attire/instructions are gone from the UGC writer (the doc has no such fields).
  Calibration: `src/factory2/ugcDocFormat.ts` injects the example as a level-of-information
  exemplar with per-field word budgets and a never-copy fence.
- **Editor** — a "Creator document" section shows every field with hover-regenerate
  (`V2RegenTarget {type:'doc-field', path}`); on-screen text column enabled for UGC rows;
  reveal/offer chips.
- **Export** — `Create Google Doc` (Docs API: documents.create → addDocumentTab ×2 → per-tab fill;
  browser-side Google Identity Services token, scope `drive.file`, OAuth client id pasted once
  into the app, stored in localStorage `viasox_google_client_id`; setup steps in
  `docs/GOOGLE-DOCS-EXPORT-SETUP.md`) and `Download .docx` (JSZip; the example's own package
  parts + a generated document.xml cloned from its fragments).
- **Guards** — ecom smoke harness unchanged and green; UGC prompt snapshot re-baselined on
  purpose (this is a deliberate UGC writer change).

## Conditionals
- Offer rows + offer-led hook 4 only when a promotion is in the batch instructions.
- Reference / Adaptation Note only when an Inspiration Bank example is pinned.
- Briefs written before this format have no `creatorDoc`; the export refuses them with a clear
  message (regenerate / Rework story to get the fields).
