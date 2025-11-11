# Agent Guide — Email Templates (Builder v2)

Purpose
- Help LLM/agents add or evolve templates with the Builder v2.
- Keep templates as plain HTML with token placeholders.

Design Tenets
- Compatibility first: table-based layout, inline styles, minimal CSS.
- Fixed sections: header, summary, progress, What's New, Risks & Blockers, workstreams, milestones, CTA, footer.
- Accessibility: contrast, alt text, semantic lists, 12–14+ font sizes.
- ASCII-only labels to prevent mojibake.
- No JS, forms, or external fonts.

Template Tokens (Placeholders)
- Use {{TOKEN}} tokens (ASCII only).
- Scalars: {{PROJECT_NAME}}, {{PROJECT_ICON_URL}}, {{UPDATE_DATE}}, {{UPDATE_SUMMARY}}, {{PROGRESS_PERCENT}}, {{CTA_LABEL}}, {{CTA_URL}}.
- Numbered: {{WHATS_NEW_ITEM_1..N}}, {{RISK_ITEM_1..N}}, {{TRACK_1_LABEL}}, {{TRACK_1_PERCENT}}, {{MILESTONE_1}}, {{MILESTONE_1_DATE}}.
- The builder aggregates numbered tokens into arrays.

Files & Structure
- UI builder: builder/index.html, builder/app.js
- HTML templates: builder/templates/*.html, manifest.json
- Dashboard: Load HTML to import any template; over HTTP, manifest auto-load can list templates.

Add a New Template (HTML-first)
1) Create an HTML file in builder/templates/ using tokens.
2) Keep ASCII labels ("What's New"). No external assets.
3) Table layout + inline styles.
4) Add to manifest.json (id, name, file, description).

Checklist
- Tables for layout; no complex CSS for structure.
- System fonts (Segoe UI, Roboto, Arial). No webfonts.
- Fixed image sizes, alt text.
- No animations by default.
- Mobile: single 600px media query if needed.

Robustness
- Builder escapes text and clamps percentages.
- No network fetches in email HTML.

Tips
- Verify tokens resolve as expected in Live Preview.
- Keep consistent section names and order.
