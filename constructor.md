# Template Constructor — How to Build New Email Templates

Goal
- Provide a repeatable recipe to construct new templates that plug into both the UI builder and (optionally) the PowerShell builder while following the existing design pattern.

Before You Start
- Skim `project-update-material-dark.html` to understand the visual rhythm, spacing, and component structure.
- Review `email-config.sample.json` to reuse the existing JSON keys.
- Ensure any new keys you introduce are optional and have safe defaults.

Step 1 — Define the Template Brief
- Name: short, descriptive (e.g., “Light — Compact Update”).
- Tone: dark, light, or brand variant; ensure contrast targets are met.
- Sections: list the blocks you need (Header, Summary, Chips, Progress, Cards, Milestone Track, CTA, Contributors, Footer). Remove what you don’t need.

Step 2 — Draft the HTML (Email-Safe)
- Start from a simple table wrapper, container table (600px), and a header row.
- Inline styles on elements; keep `<style>` small (mobile query and optional animations).
- Include Outlook VML fallback for CTA buttons.
- Add alt text to all images and fixed dimensions.
- Avoid complex layout (no flex/grid for critical structure).

Step 3 — Map JSON → HTML
- Use the baseline schema. For lists:
  - `whatsNew[]`, `risks[]` → `<ul><li>…</li></ul>`
  - `workstreams[]` → label + percentage with a progress bar (clamp 0–100).
  - `milestones[]` → evenly spaced markers with label + date (optionally mark current with pulse).
- Respect `prefers-reduced-motion` for any animation.
- Provide placeholders that match keys (e.g., `{{TRACK_1_LABEL}}`) if you deliver a static HTML variant.

Step 4 — Add to the UI Builder
- Open `builder/builder.js` and append to the `TEMPLATES` array:
  - `id`, `name`, `description`.
  - `sampleConfig`: copy `email-config.sample.json`, prune/extend keys, keep valid JSON.
  - `buildHtml(cfg)`: return a full HTML string using escape and clamp helpers like the material template does.
- Verify: load `builder/index.html`, select the new template, paste/edit sample JSON, check preview.

Step 5 — (Optional) Extend PowerShell Builder
- Add a `-Template` or `-TemplateId` parameter to `build-email.ps1`.
- Split existing logic into `Build-MaterialDarkHtml($cfg)` and add `Build-YourTemplateHtml($cfg)`.
- Route via a `switch ($Template)` to return the right HTML.

Step 6 — Validate and Ship
- Preview in the UI builder; use “Download EML” and open in Outlook desktop.
- Use “Open in Outlook Web” to confirm compose handoff.
- Manually inspect on mobile (narrow preview frame) for wrapping and spacing.

Do / Don’t
- Do: table layout, inline styles, VML for CTA, alt text, clamped percentages, graceful animation.
- Don’t: rely on external fonts, JS in email, forms, background images for essential content, absolute positioning.

Snippets

JS registry skeleton:
```
TEMPLATES.push({
  id: 'your-id',
  name: 'Your Template Name',
  description: 'Short summary.',
  sampleConfig: `{
    "projectName": "Your Project",
    "updateSummary": "…",
    "workstreams": [ { "label": "Track A", "percent": 50 } ],
    "milestones": [ { "label": "M1", "date": "Oct 1" } ],
    "cta": { "label": "Open", "url": "https://example.com" }
  }`,
  buildHtml(cfg) {
    // Return full HTML constructed from cfg
    return `<!DOCTYPE html><html>…</html>`;
  }
});
```

PowerShell routing idea:
```
param([string]$Template = 'material-dark')

switch ($Template) {
  'material-dark' { $html = Build-MaterialDarkHtml $cfg }
  'light-compact' { $html = Build-LightCompactHtml $cfg }
  default { throw "Unknown template: $Template" }
}
```

Safety Notes
- Always escape user-provided strings when composing HTML.
- Percentages must be integers 0–100.
- Keep images referenced by HTTPS URLs or `cid:` attachments; avoid data URIs unless your sender supports them.

