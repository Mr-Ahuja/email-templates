# Template Constructor — How to Build New Email Templates (Builder v2)

Goal
- Provide a repeatable recipe to construct new templates the builder can parse and render without code changes.

Steps
1) Start with plain HTML
- Create a single-file HTML under builder/templates/ using tables for layout and inline styles only.
- Use ASCII labels ("What's New", "Risks & Blockers").

2) Add placeholders (tokens)
- Scalars: {{PROJECT_NAME}}, {{PROJECT_ICON_URL}}, {{UPDATE_DATE}}, {{UPDATE_SUMMARY}}, {{PROGRESS_PERCENT}}, {{CTA_LABEL}}, {{CTA_URL}}
- Numbered lists: {{WHATS_NEW_ITEM_1}}, {{WHATS_NEW_ITEM_2}}, …; {{RISK_ITEM_1}}, {{RISK_ITEM_2}}, …
- Workstreams: {{TRACK_1_LABEL}}, {{TRACK_1_PERCENT}}, {{TRACK_2_LABEL}}, {{TRACK_2_PERCENT}}, …
- Milestones: {{MILESTONE_1}}, {{MILESTONE_1_DATE}}, {{MILESTONE_2}}, {{MILESTONE_2_DATE}}, …

3) Image handling
- Use {{PROJECT_ICON_URL}} and any {{*_IMAGE_*}} tokens where appropriate.
- The builder pre-fills image tokens with a default inline SVG if missing.

4) Sections to include (recommended)
- Header (project icon, "Project Update" or style equivalent, project name, date)
- Summary paragraph
- Progress bar with {{PROGRESS_PERCENT}}
- What's New (3 items)
- Risks & Blockers (2 items)
- Workstream Progress (3 tracks with percent)
- Next Milestones (3 items with dates)
- CTA button ({{CTA_LABEL}}, {{CTA_URL}})
- Footer (optional scalar text token)

5) Register in manifest (HTTP auto-load)
- Add an entry to builder/templates/manifest.json:
  { "id": "unique-id", "name": "Display Name", "file": "your-file.html", "description": "Short summary" }
- Serving over HTTP (local server or GitHub Pages) enables the builder to list templates automatically.
- For file:// usage, load templates manually via "Load HTML".

6) Test in the builder
- Open builder/index.html
- Load your template (or select it from the dashboard if served over HTTP)
- Fill the form; preview updates live; Download HTML for paste-ready email.

Notes
- Keep markup minimal and email-safe; avoid modern CSS layout.
- Avoid curly quotes or other special punctuation to prevent encoding issues.
- If you need more list items than the template provides, add more numbered tokens.

