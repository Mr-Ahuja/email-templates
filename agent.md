# Agent Guide — Email Templates (Material Dark Pattern)

Purpose
- Help LLM/agents add or evolve email templates in this repo with consistent structure, safety, and compatibility.
- Keep the JSON contract stable so the UI builder and CLI builder can generate ready-to-send HTML.

Scope
- Applies to the entire repository. Favor incremental, surgical changes.

Design Pattern (Key Tenets)
- Compatibility first: table-based layout, inline styles, minimal CSS, bullets instead of grids. Test mentally for Outlook (Word engine), Gmail, iOS Mail.
- Dark Material look: low-contrast panels on nearly-black canvas, subtle borders, rounded corners, tasteful shadows.
- Clear hierarchy: header (icon, label, project), summary, chips, progress, cards (what’s new, risks, workstreams), milestone track, CTA, contributors, footer.
- Safe motion: optional shimmer/pulse; degrade gracefully and respect `prefers-reduced-motion`.
- Accessibility: sufficient contrast for text, alt text on images, semantic list structure, reasonable font sizes (12–14+).
- Email-safe components: VML fallback for Outlook buttons, avoid forms, JS, external fonts, and advanced layout features.

JSON Contract (Baseline Schema)
- Reference: `email-config.sample.json`.
- Keys: projectName, projectIconUrl, updateDate, preheader, updateSummary, progressPercent, sprintNumber, etaDate, statusLabel, statusChip.{textColor,bgColor,borderColor}, whatsNew[], risks[], workstreams[] ({label,percent}), milestoneTrackPercent, milestones[] ({label,date,current?}), currentMilestoneIndex, contributors[] ({name,imageUrl}), cta.{label,url}.
- Extensions: add new keys only if needed. Keep existing keys backward-compatible. Prefer optional keys with safe defaults.

Naming & Placeholders
- Prefer explicit names: `{{TRACK_1_LABEL}}` over generic placeholders.
- Use `cid:` for inline attachments when needed (e.g., `cid:project_icon`).
- Escape all dynamic text when rendering to HTML to prevent broken markup or injection.

Files & Structure
- Existing locked template: `project-update-material-dark.html` (authoritative reference for style).
- CLI builder: `build-email.ps1` (reads JSON → emits HTML for the Material Dark template).
- UI builder: `builder/index.html`, `builder/builder.js` (lists templates, edits JSON, builds HTML, preview, and Outlook flows).

Adding a New Template (High-Level)
1) Decide: is it a small variant or a new distinct template?
2) Update UI builder registry (`builder/builder.js`):
   - Add a new object to `TEMPLATES` with: `id`, `name`, `description`, `sampleConfig`, and a `buildHtml(cfg)` function that returns the full HTML string.
   - Reuse the current schema; add fields only when necessary.
3) If CLI support is desired, add a `-TemplateId` parameter in `build-email.ps1` and branch to a new `Build-...` function. Keep the default pointing to Material Dark.
4) Keep CSS inside `<style>` minimal and safe; inline critical styles on elements.
5) Maintain Outlook button VML in CTAs.
6) Test via: UI preview, EML download (open in Outlook desktop), Outlook Web deep link.

Compatibility Checklist
- Uses tables for layout; no flex/grid positioning required for critical structure.
- Fonts: system-safe (Segoe UI, Roboto, Arial, sans-serif).
- Colors: maintain contrast; avoid pure #000 text on dark backgrounds for large blocks.
- Images: fixed width/height; alt text; rounded corners only via `border-radius`.
- Motion: optional, degradable, small amplitude. Provide reduced-motion fallback.
- Mobile: single media query for 600px with width/padding/text-align fallbacks.

Security & Robustness
- Always HTML-escape dynamic text (see `Escape-HTML` in `build-email.ps1` and `escapeHtml` in `builder.js`).
- Clamp percentages (0–100) for all progress values.
- Do not fetch remote resources at build-time.

Code Style & Conventions
- Keep indentation and attribute ordering consistent with existing files.
- Limit CSS to what’s necessary; prefer inline style attributes for reliability.
- Use consistent section names: “What’s New”, “Risks & Blockers”, “Workstream Progress”, “Milestone Track”, “Contributors”.

PR Review Tips (for Agents)
- Verify JSON keys used by your template exist in `sampleConfig` and are handled in `buildHtml(cfg)`.
- Confirm CTA has VML fallback.
- Sanity check mobile behavior: title wraps, progress bars scale, chips wrap.
- Confirm no reliance on external fonts or scripts.

Appendix: Builder Integration Snippet (JS)
```
TEMPLATES.push({
  id: 'light-compact',
  name: 'Light — Compact Update',
  description: 'Bright compact status with key metrics.',
  sampleConfig: JSON.stringify({ /* copy and adjust from email-config.sample.json */ }, null, 2),
  buildHtml(cfg) { /* return full HTML string using cfg */ }
});
```

Appendix: CLI Builder Extension (PowerShell)
- Add param: `param([string]$Template = 'material-dark')`
- Route: `switch ($Template) { 'material-dark' { ... } 'light-compact' { ... } default { throw } }`
- Implement a new function `Build-LightCompactHtml($cfg)` returning the full HTML string.

