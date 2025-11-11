// Simple UI-based builder for project update emails
// Uses the same JSON schema as email-config.sample.json

(function () {
  // --- Templates registry ---
  const TEMPLATES = [
    {
      id: 'material-dark-update',
      name: 'Material Dark — Project Update',
      description: 'Dark Material look with progress bars, milestones, and contributors.',
      sampleConfig: `{
  "projectName": "Nebula CRM",
  "projectIconUrl": "https://example.com/icon.png",
  "updateDate": "2025-11-10",
  "preheader": "Weekly update — highlights, risks, and next steps.",
  "updateSummary": "We completed the onboarding flow revamp, improved sync reliability, and began the dashboard filters work.",
  "progressPercent": 68,
  "sprintNumber": "42",
  "etaDate": "Dec 15, 2025",

  "statusLabel": "On Track",
  "statusChip": { "textColor": "#B0F3FF", "bgColor": "#0D2A2D", "borderColor": "#004F57" },

  "whatsNew": [
    "Onboarding flow redesigned with progressive hints",
    "API rate limiter tuned for burst traffic",
    "Dashboard: initial filter chips and presets"
  ],
  "risks": [
    "3rd‑party billing SDK upgrade pending security review",
    "Legacy export job spikes CPU during peak hours"
  ],

  "workstreams": [
    { "label": "Frontend Revamp", "percent": 80 },
    { "label": "Sync Service", "percent": 62 },
    { "label": "Dashboard Filters", "percent": 40 },
    { "label": "Billing Migration", "percent": 25 }
  ],

  "milestoneTrackPercent": 60,
  "currentMilestoneIndex": 2,
  "milestones": [
    { "label": "Spec", "date": "Sep 18" },
    { "label": "MVP", "date": "Oct 10" },
    { "label": "Beta", "date": "Oct 28", "current": true },
    { "label": "RC", "date": "Nov 20" },
    { "label": "GA", "date": "Dec 15" }
  ],

  "contributors": [
    { "name": "Alex Rivera", "imageUrl": "https://example.com/alex.jpg" },
    { "name": "Priya Singh", "imageUrl": "https://example.com/priya.jpg" },
    { "name": "Chen Li", "imageUrl": "https://example.com/chen.jpg" }
  ],

  "cta": { "label": "View Project Dashboard", "url": "https://example.com/app/projects/nebula" }
}`,
      buildHtml
    },
    {
      id: 'brutalist-neon',
      name: 'Brutalist Neon — Status Brief',
      description: 'Unorthodox, high-contrast neon brutalist layout with ASCII bars and bold blocks.',
      sampleConfig: `{
  "projectName": "Project Hermes",
  "projectIconUrl": "https://example.com/hermes-icon.png",
  "updateDate": "2025-11-10",
  "preheader": "Status brief — neon brutalist.",
  "updateSummary": "Blunt, bold, and bright: key signals and next actions.",
  "progressPercent": 64,
  "sprintNumber": "9",
  "etaDate": "Jan 20, 2026",

  "whatsNew": ["Relay refactor", "Courier offline queue", "Routing heuristic v2"],
  "risks": ["Tiles quota", "Webhook retries"],
  "workstreams": [
    { "label": "Relays", "percent": 80 },
    { "label": "Courier App", "percent": 58 },
    { "label": "Routing", "percent": 31 }
  ],
  "milestoneTrackPercent": 54,
  "currentMilestoneIndex": 2,
  "milestones": [
    { "label": "Spec", "date": "Oct 10" },
    { "label": "Proto", "date": "Nov 05" },
    { "label": "Beta", "date": "Dec 01", "current": true },
    { "label": "RC", "date": "Jan 05" },
    { "label": "GA", "date": "Jan 20" }
  ],
  "contributors": [
    { "name": "Daphne", "imageUrl": "https://example.com/daphne.jpg" },
    { "name": "Orion", "imageUrl": "https://example.com/orion.jpg" }
  ],
  "cta": { "label": "OPEN CONSOLE", "url": "https://example.com/hermes" },
  "footerText": "Brief for {{PROJECT_NAME}} — unsubscribe or manage prefs in your profile.",
  "accentColor": "#FF2D9B",
  "accentAltColor": "#00FFD1"
}`,
      buildHtml: function buildHtmlBrutalistNeon(cfg) {
        const esc = (s)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
        const clamp=(n)=>Math.max(0,Math.min(100,+n||0));
        const asciiBar=(pct,len=20)=>{ pct=clamp(pct); const filled=Math.round((pct/100)*len); const empty=len-filled; return '['+'█'.repeat(filled)+'░'.repeat(Math.max(0,empty))+`] ${pct}%`; };

        const projectName = String(cfg.projectName || 'PROJECT');
        const projectIconUrl = String(cfg.projectIconUrl || '');
        const updateDate = String(cfg.updateDate || new Date().toISOString().slice(0,10));
        const preheader = String(cfg.preheader || `Status brief.`);
        const updateSummary = String(cfg.updateSummary || '');
        const progressPercent = clamp(cfg.progressPercent);
        const sprintNumber = String(cfg.sprintNumber || '');
        const etaDate = String(cfg.etaDate || '');
        const whatsNew = cfg.whatsNew || [];
        const risks = cfg.risks || [];
        const workstreams = cfg.workstreams || [];
        const milestones = cfg.milestones || [];
        const milestoneTrackPercent = clamp(cfg.milestoneTrackPercent);
        const currentMilestoneIndex = (typeof cfg.currentMilestoneIndex==='number')?cfg.currentMilestoneIndex:undefined;
        const contributors = cfg.contributors || [];
        const cta = cfg.cta || {}; const ctaLabel = cta.label || 'OPEN'; const ctaUrl = cta.url || '#';
        const footerHtmlTpl = cfg.footerHtml; const footerTextTpl = cfg.footerText;
        const ACC = String(cfg.accentColor || '#FF2D9B');
        const ACC2 = String(cfg.accentAltColor || '#00FFD1');

        function list(items, color){ if(!items||!items.length) return '<li>—</li>'; return items.map(x=>`<li style="color:${color};">${esc(x)}</li>`).join(''); }
        function wsTable(ws){ if(!ws||!ws.length) return ''; return ws.map(w=>{ const p=clamp(w.percent); return `
          <tr>
            <td style="padding:6px 0; font-family:Consolas, 'Courier New', monospace; font-size:12px; color:#111;">${esc(w.label||'')}</td>
            <td align="right" style="padding:6px 0; font-family:Consolas, 'Courier New', monospace; font-size:12px; color:#111; white-space:nowrap;">${p}%</td>
          </tr>
          <tr><td colspan="2" style="padding:0 0 8px 0; font-family:Consolas, 'Courier New', monospace; font-size:12px; color:#111;">${esc(asciiBar(p, 24))}</td></tr>`; }).join(''); }
        function miles(ms, idx){ if(!ms||!ms.length) return ''; const w=(100/ms.length).toFixed(2); return ms.map((m,i)=>{ const cur = !!m.current || (typeof idx==='number'&&idx===i); const dotStyle = cur? `background:${ACC};` : 'background:#111;'; return `
          <td align="center" style="width:${w}%;">
            <div style="height:16px;">
              <span style="display:inline-block; width:2px; height:16px; ${dotStyle}"></span>
            </div>
            <div style="font-family:Consolas, 'Courier New', monospace; font-size:12px; color:#111; margin-top:6px;">${esc(m.label||'')}</div>
            <div style="font-family:Consolas, 'Courier New', monospace; font-size:11px; color:#4B5563;">${esc(m.date||'')}</div>
          </td>`; }).join(''); }
        function people(ps){ if(!ps||!ps.length) return ''; return ps.map((p,i)=>{ const name=esc(p.name||''); const img=esc(p.imageUrl||''); const b=(i<ps.length-1)?'8px':'0'; return `
          <tr>
            <td width="40" valign="middle" style="padding:0 8px ${b} 0;"><img src="${img}" width="32" height="32" alt="${name}" style="display:block; border:2px solid #000; background:#fff;"></td>
            <td valign="middle" style="padding:0 0 ${b} 0; font-family:Consolas, 'Courier New', monospace; font-size:13px; color:#111;">— ${name}</td>
          </tr>`; }).join(''); }

        let footerBlock;
        if (typeof footerHtmlTpl === 'string' && footerHtmlTpl.length) {
          footerBlock = footerHtmlTpl.replace(/\{\{PROJECT_NAME\}\}/g, esc(projectName));
        } else if (typeof footerTextTpl === 'string' && footerTextTpl.length) {
          const resolved = footerTextTpl.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
          footerBlock = `<div style="font-family:Consolas, 'Courier New', monospace; font-size:12px; line-height:18px; color:#111;">${esc(resolved)}</div>`;
        } else {
          footerBlock = `<div style="font-family:Consolas, 'Courier New', monospace; font-size:12px; line-height:18px; color:#111;">Brief for <span style="font-weight:700;">${esc(projectName)}</span>. Manage preferences in your profile.</div>`;
        }

        const safeProject = esc(projectName);
        const safeSummary = esc(updateSummary).replace(/\n/g,'<br>');
        const safePreheader = esc(preheader);
        const safeIcon = esc(projectIconUrl);

        const whatsNewHtml = list(whatsNew, '#111');
        const risksHtml = list(risks, '#7F1D1D');
        const workstreamsHtml = wsTable(workstreams);
        const milestonesHtml = miles(milestones, currentMilestoneIndex);
        const contributorsHtml = people(contributors);
        const asciiOverall = asciiBar(progressPercent, 28);

        return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${safeProject} — Status Brief</title>
  <style>
    @media (max-width: 600px) { .container { width: 100% !important; } .p-24 { padding: 16px !important; } .stack { display: block !important; width: 100% !important; } .align-right { text-align: left !important; } }
  </style>
  <!--[if mso]><style type="text/css">body, table, td { font-family: Arial, sans-serif !important; }</style><![endif]-->
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
</head>
<body style="margin:0; padding:0; background:#0F0F0F; color:#111; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${safePreheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0F0F0F;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" class="container" style="width:640px; max-width:640px; background:#FFFFFF; border:4px solid #000000;">
          <!-- Head neon strip -->
          <tr>
            <td style="padding:10px 16px; background:${ACC}; color:#000; font-family:Consolas, 'Courier New', monospace; font-size:12px; letter-spacing:1px; font-weight:700; text-transform:uppercase;">STATUS BRIEF · ${esc(updateDate)}</td>
          </tr>
          <!-- Header -->
          <tr>
            <td class="p-24" style="padding:16px 16px 8px 16px; border-bottom:4px solid #000000;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="60" valign="middle" style="width:60px;">
                    <img src="${safeIcon}" width="56" height="56" alt="${safeProject} icon" style="display:block; border:3px solid #000; background:#fff;">
                  </td>
                  <td valign="middle" style="padding-left:12px;">
                    <div style="font-family:Consolas, 'Courier New', monospace; font-size:11px; color:#111;">PROJECT</div>
                    <div style="font-family:Impact, 'Arial Black', Arial, sans-serif; font-size:28px; line-height:30px; color:#000; text-transform:uppercase;">${safeProject}</div>
                  </td>
                  <td valign="middle" align="right" class="align-right">
                    <div style="font-family:Consolas, 'Courier New', monospace; font-size:11px; color:#111;">SPRINT ${esc(sprintNumber)} · ETA ${esc(etaDate)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary + Overall Progress (ASCII) -->
          <tr>
            <td class="p-24" style="padding:12px 16px 0 16px;">
              <div style="font-family:Arial, sans-serif; font-size:15px; line-height:22px; color:#111;">${safeSummary}</div>
              <div style="margin-top:12px; font-family:Consolas, 'Courier New', monospace; font-size:13px; color:#111;">${esc(asciiOverall)}</div>
              <div style="background:#000; height:2px; margin-top:8px; line-height:2px;">&nbsp;</div>
              <div style="background:${ACC2}; height:6px; width:${progressPercent}%; margin-top:-4px;"></div>
            </td>
          </tr>

          <!-- Two columns: What's New / Risks -->
          <tr>
            <td style="padding:12px 16px 0 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="stack" width="50%" valign="top" style="padding-right:8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:3px solid #000;">
                      <tr><td style="padding:10px; background:#000; color:#fff; font-family:Consolas, 'Courier New', monospace; font-size:12px; font-weight:700;">WHAT'S NEW</td></tr>
                      <tr><td style="padding:12px; font-family:Arial, sans-serif; font-size:13px; color:#111;"><ul style="padding-left:18px; margin:0;">${whatsNewHtml}</ul></td></tr>
                    </table>
                  </td>
                  <td class="stack" width="50%" valign="top" style="padding-left:8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:3px solid #000;">
                      <tr><td style="padding:10px; background:#000; color:#fff; font-family:Consolas, 'Courier New', monospace; font-size:12px; font-weight:700;">HEADWINDS</td></tr>
                      <tr><td style="padding:12px; font-family:Arial, sans-serif; font-size:13px; color:#111;"><ul style="padding-left:18px; margin:0;">${risksHtml}</ul></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Workstreams with ASCII bars -->
          <tr>
            <td style="padding:12px 16px 0 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:3px solid #000;">
                <tr><td style="padding:10px; background:${ACC2}; color:#000; font-family:Consolas, 'Courier New', monospace; font-size:12px; font-weight:700;">WORKSTREAMS</td></tr>
                <tr><td style="padding:8px 12px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${workstreamsHtml}</table>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- Route timeline -->
          <tr>
            <td style="padding:12px 16px 0 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:3px solid #000;">
                <tr><td style="padding:10px; background:${ACC}; color:#000; font-family:Consolas, 'Courier New', monospace; font-size:12px; font-weight:700;">ROUTE</td></tr>
                <tr><td style="padding:12px;">
                  <div style="background:#000; height:2px; line-height:2px;">&nbsp;</div>
                  <div style="background:${ACC}; height:6px; width:${milestoneTrackPercent}%; margin-top:-4px;"></div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;"><tr>${milestonesHtml}</tr></table>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="left" style="padding:16px 16px 12px 16px;">
              <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${esc(ctaUrl)}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="0%" stroke="t" strokecolor="#000000" strokeweight="3px" fillcolor="${ACC2}"><w:anchorlock/><center style="color:#000000; font-family:Arial, sans-serif; font-size:14px; font-weight:800; letter-spacing:1px;">${esc(ctaLabel)}</center></v:roundrect><![endif]-->
              <!--[if !mso]><!-- -->
              <a href="${esc(ctaUrl)}" style="background:${ACC2}; color:#000; text-decoration:none; font-family:Arial, sans-serif; font-size:14px; font-weight:800; letter-spacing:1px; line-height:48px; display:inline-block; min-width:260px; text-align:center; border:3px solid #000;">${esc(ctaLabel)}</a>
              <!--<![endif]-->
            </td>
          </tr>

          <!-- Contributors -->
          ${contributors && contributors.length ? `<tr><td style="padding:6px 16px 0 16px;"><div style=\"font-family:Consolas, 'Courier New', monospace; font-size:12px; line-height:16px; color:#111; margin-bottom:6px;\">CREW</div><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">${contributorsHtml}</table></td></tr>` : ''}

          <!-- Footer -->
          <tr><td style="padding:0 16px 12px 16px;"><div style="height:2px; background:#000; line-height:2px;">&nbsp;</div></td></tr>
          <tr><td style="padding:8px 16px 16px 16px;">${footerBlock}</td></tr>
        </table>
      </td>
    </tr>
  </table>
  <div style="display:none; white-space:nowrap; font:15px courier; line-height:0;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
</body>
</html>`;
      }
    },
    {
      id: 'hermes-mythic-light-alt',
      name: 'Mythic Light — Hermes Alt',
      description: 'Light variant with hero, metric cards, split columns, and route timeline.',
      sampleConfig: `{
  "projectName": "Project Hermes",
  "projectIconUrl": "https://example.com/hermes-icon.png",
  "bannerUrl": "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200",
  "updateDate": "2025-11-10",
  "preheader": "Hermes dispatch — weekly status and next steps.",
  "updateSummary": "Swift progress on the relays and courier tracking module; infra updated.",
  "progressPercent": 72,
  "sprintNumber": "9",
  "etaDate": "Jan 20, 2026",

  "metrics": [
    { "label": "Deliveries", "value": "12.4k", "delta": "+8%", "trend": "up" },
    { "label": "Latency", "value": "142ms", "delta": "-12%", "trend": "down" },
    { "label": "Uptime", "value": "99.95%", "delta": "+0.02%", "trend": "up" }
  ],

  "spotlight": "Courier network stabilized in new regions; early telemetry promising.",
  "quote": { "text": "Swift as thought, Hermes crosses the sky.", "author": "Homer" },

  "whatsNew": [ "Relay pipeline refactor", "Courier app offline queue", "Routing heuristic update" ],
  "risks": [ "Map tiles quota", "Webhook retry cascades" ],

  "workstreams": [ { "label": "Relays", "percent": 80 }, { "label": "Courier App", "percent": 65 } ],
  "milestoneTrackPercent": 55,
  "currentMilestoneIndex": 1,
  "milestones": [
    { "label": "Specs", "date": "Oct 12" },
    { "label": "Prototype", "date": "Nov 08", "current": true },
    { "label": "Beta", "date": "Dec 05" },
    { "label": "RC", "date": "Jan 10" },
    { "label": "GA", "date": "Jan 20" }
  ],

  "contributors": [
    { "name": "Daphne", "imageUrl": "https://example.com/daphne.jpg" },
    { "name": "Orion", "imageUrl": "https://example.com/orion.jpg" }
  ],

  "cta": { "label": "Open Dispatch Console", "url": "https://example.com/hermes" },
  "footerText": "Dispatch notice for {{PROJECT_NAME}}. Manage preferences in your profile."
}`,
      buildHtml: function buildHtmlHermesAlt(cfg) {
        const esc = (s)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
        const clamp=(n)=>Math.max(0,Math.min(100,+n||0));

        // Base fields
        const projectName = String(cfg.projectName || 'Project Hermes');
        const projectIconUrl = String(cfg.projectIconUrl || '');
        const bannerUrl = String(cfg.bannerUrl || '');
        const updateDate = String(cfg.updateDate || new Date().toISOString().slice(0,10));
        const preheader = String(cfg.preheader || `Hermes dispatch — status and next steps.`);
        const updateSummary = String(cfg.updateSummary || '');
        const progressPercent = clamp(cfg.progressPercent);
        const sprintNumber = String(cfg.sprintNumber || '');
        const etaDate = String(cfg.etaDate || '');
        const whatsNew = cfg.whatsNew || [];
        const risks = cfg.risks || [];
        const workstreams = cfg.workstreams || [];
        const milestones = cfg.milestones || [];
        const milestoneTrackPercent = clamp(cfg.milestoneTrackPercent);
        const currentMilestoneIndex = (typeof cfg.currentMilestoneIndex==='number')?cfg.currentMilestoneIndex:undefined;
        const contributors = cfg.contributors || [];
        const metrics = cfg.metrics || [];
        const spotlight = cfg.spotlight || '';
        const quote = cfg.quote || {};
        const cta = cfg.cta || {}; const ctaLabel = cta.label || 'Open Console'; const ctaUrl = cta.url || '#';
        const footerHtmlTpl = cfg.footerHtml; const footerTextTpl = cfg.footerText;

        function metricCard(m){
          const label=esc(m.label||''); const value=esc(m.value||''); const delta=String(m.delta||''); const trend=(m.trend||'').toLowerCase();
          const color = trend==='down' ? '#B45309' : '#065F46';
          const bg = trend==='down' ? '#FEF3C7' : '#D1FAE5';
          const border = trend==='down' ? '#FCD34D' : '#34D399';
          return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F9FAFB; border:1px solid #E5E7EB; border-radius:12px;">
              <tr><td style="padding:12px 12px 8px 12px; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; color:#6B7280;">${label}</td></tr>
              <tr><td style="padding:0 12px 10px 12px; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:22px; line-height:28px; color:#111827; font-weight:700;">${value}</td></tr>
              <tr><td style="padding:0 12px 12px 12px;"><span style="display:inline-block; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:${color}; border:1px solid ${border}; background:${bg}; padding:2px 8px; border-radius:9999px;">${esc(delta)}</span></td></tr>
            </table>`;
        }

        function metricsRow(ms){
          if(!ms||!ms.length) return '';
          const a=ms[0]||{}, b=ms[1]||{}, c=ms[2]||{};
          return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="stack" width="33%" valign="top" style="padding-right:8px;">${metricCard(a)}</td>
              <td class="stack" width="33%" valign="top" style="padding:0 4px;">${metricCard(b)}</td>
              <td class="stack" width="33%" valign="top" style="padding-left:8px;">${metricCard(c)}</td>
            </tr>
          </table>`;
        }

        function list(items, color){ if(!items||!items.length) return '<li>—</li>'; return items.map(x=>`<li style="color:${color};">${esc(x)}</li>`).join(''); }

        function milestoneRow(ms, idx){ if(!ms||!ms.length) return ''; const w=(100/ms.length).toFixed(2); return ms.map((m,i)=>{ const cur = !!m.current || (typeof idx==='number'&&idx===i); const dot = cur ? 'background:#2D7FF9; border:1px solid #1D4ED8;' : 'background:#F3F4F6; border:1px solid #D1D5DB;'; return `
            <td align="center" style="width:${w}%;">
              <div style="height:10px;"><span style="display:inline-block; width:10px; height:10px; border-radius:9999px; ${dot}"></span></div>
              <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; color:#374151; margin-top:6px;">${esc(m.label||'')}</div>
              <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:#6B7280;">${esc(m.date||'')}</div>
            </td>`; }).join(''); }

        function people(ps){ if(!ps||!ps.length) return ''; return ps.map((p,i)=>{ const name=esc(p.name||''); const img=esc(p.imageUrl||''); const b=(i<ps.length-1)?'8px':'0'; return `
          <tr>
            <td width="40" valign="middle" style="padding:0 8px ${b} 0;"><img src="${img}" width="32" height="32" alt="${name}" style="display:block; border-radius:9999px; background:#F3F4F6;"></td>
            <td valign="middle" style="padding:0 0 ${b} 0;"><div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; line-height:18px; color:#374151;">${name}</div></td>
          </tr>`; }).join(''); }

        let footerBlock;
        if (typeof footerHtmlTpl === 'string' && footerHtmlTpl.length) {
          footerBlock = footerHtmlTpl.replace(/\{\{PROJECT_NAME\}\}/g, esc(projectName));
        } else if (typeof footerTextTpl === 'string' && footerTextTpl.length) {
          const resolved = footerTextTpl.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
          footerBlock = `<div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:18px; color:#6B7280;">${esc(resolved)}</div>`;
        } else {
          footerBlock = `<div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:18px; color:#6B7280;">Dispatch notice for <span style="color:#111827; font-weight:600;">${esc(projectName)}</span>. Manage preferences in your profile.</div>`;
        }

        const safeProject = esc(projectName);
        const safeSummary = esc(updateSummary).replace(/\n/g,'<br>');
        const safePreheader = esc(preheader);
        const safeIcon = esc(projectIconUrl);
        const safeBanner = esc(bannerUrl);

        const whatsNewHtml = list(whatsNew, '#374151');
        const risksHtml = list(risks, '#7F1D1D');
        const workstreamsHtml = workstreams && workstreams.length ? workstreams.map(w=>{
          const pct = clamp(w.percent);
          return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px 0;">
              <tr>
                <td valign="middle" style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; color:#374151;">${esc(w.label||'')}</td>
                <td align="right" valign="middle" style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; color:#6B7280; white-space:nowrap;">${pct}%</td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:6px;">
                  <div style="background:#E5E7EB; border-radius:9999px; overflow:hidden; height:8px;">
                    <div style="background:#2D7FF9; width:${pct}%; height:8px;"></div>
                  </div>
                </td>
              </tr>
            </table>`;
        }).join(''):'';

        const milestonesHtml = milestoneRow(milestones, currentMilestoneIndex);
        const contributorsHtml = people(contributors);

        return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${safeProject} — Dispatch</title>
  <style>
    @media (max-width: 600px) { .container { width: 100% !important; } .p-24 { padding: 16px !important; } .stack { display: block !important; width: 100% !important; } .align-right { text-align: left !important; } }
  </style>
  <!--[if mso]><style type="text/css">body, table, td { font-family: Arial, sans-serif !important; }</style><![endif]-->
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
</head>
<body style="margin:0; padding:0; background:#F5F7FA; color:#111827; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${safePreheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F5F7FA;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:600px; background:#FFFFFF; border:1px solid #E5E7EB; border-radius:16px; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <!-- Hero banner -->
          ${safeBanner ? `<tr><td style="border-top-left-radius:16px; border-top-right-radius:16px; overflow:hidden;"><img src="${safeBanner}" width="600" alt="${safeProject} banner" style="display:block; width:100%; height:auto; border-top-left-radius:16px; border-top-right-radius:16px;"></td></tr>` : ''}
          <!-- Header -->
          <tr>
            <td class="p-24" style="padding:16px 24px 12px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="52" valign="middle" style="width:52px;">
                    <img src="${safeIcon}" width="48" height="48" alt="${safeProject} icon" style="display:block; border-radius:10px; outline:none; border:1px solid #E5E7EB; background:#FAFAFA;">
                  </td>
                  <td valign="middle" style="padding-left:12px;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:16px; color:#6B7280; letter-spacing:.3px;">Dispatch</div>
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:24px; line-height:28px; font-weight:700; color:#111827;">${safeProject}</div>
                  </td>
                  <td valign="middle" align="right" class="align-right">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:16px; color:#6B7280;">${esc(updateDate)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Mythic ornament divider -->
          <tr><td style="padding:0 24px;"><div style="height:1px; background:#E5E7EB; line-height:1px;">&nbsp;</div><div style="text-align:center; padding:6px 0; color:#1D4ED8; font-size:12px; letter-spacing:4px;">· · ·  H  E  R  M  E  S  · · ·</div></td></tr>

          <!-- Summary -->
          <tr>
            <td class="p-24" style="padding:8px 24px 0 24px;">
              <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; color:#1F2937;">${safeSummary}</div>
            </td>
          </tr>

          <!-- Metrics cards -->
          ${metrics && metrics.length ? `<tr><td style="padding:12px 24px 0 24px;">${metricsRow(metrics)}</td></tr>` : ''}

          <!-- Spotlight / Callout -->
          ${spotlight ? `<tr><td style="padding:12px 24px 0 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDFDFE; border:1px solid #DBEAFE; border-left:4px solid #1D4ED8; border-radius:10px;"><tr><td style="padding:12px; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; color:#1F2937;">${esc(spotlight)}</td></tr></table></td></tr>` : ''}

          <!-- Split columns: What’s in Flight / Headwinds -->
          <tr>
            <td style="padding:12px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="stack" width="50%" valign="top" style="padding-right:8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF; border:1px solid #E5E7EB; border-radius:12px;">
                      <tr><td style="padding:16px;">
                        <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:#111827; margin-bottom:8px;">What’s in Flight</div>
                        <ul style="padding-left:18px; margin:0; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; line-height:20px;">${whatsNewHtml}</ul>
                      </td></tr>
                    </table>
                  </td>
                  <td class="stack" width="50%" valign="top" style="padding-left:8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF; border:1px solid #E5E7EB; border-radius:12px;">
                      <tr><td style="padding:16px;">
                        <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:#111827; margin-bottom:8px;">Headwinds</div>
                        <ul style="padding-left:18px; margin:0; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; line-height:20px;">${risksHtml}</ul>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Route timeline -->
          <tr>
            <td style="padding:12px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF; border:1px solid #E5E7EB; border-radius:12px;">
                <tr><td style="padding:16px;">
                  <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:#111827; margin-bottom:8px;">Route</div>
                  <div style="background:#E5E7EB; border-radius:9999px; overflow:hidden; height:8px;"><div style="background:#2D7FF9; width:${milestoneTrackPercent}%; height:8px;"></div></div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;"><tr>${milestonesHtml}</tr></table>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- Optional quote -->
          ${(quote && (quote.text||quote.author)) ? `<tr><td style="padding:12px 24px 0 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F9FAFB; border:1px solid #E5E7EB; border-radius:12px;"><tr><td style="padding:14px; font-family:Georgia, 'Times New Roman', serif; font-size:14px; color:#111827;">“${esc(quote.text||'') }”<div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; color:#6B7280; margin-top:6px;">— ${esc(quote.author||'')}</div></td></tr></table></td></tr>` : ''}

          <!-- CTA -->
          <tr>
            <td align="left" style="padding:20px 24px 24px 24px;">
              <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${esc(ctaUrl)}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="12%" stroke="f" fillcolor="#2D7FF9"><w:anchorlock/><center style="color:#ffffff; font-family:Segoe UI, Arial, sans-serif; font-size:14px; font-weight:700;">${esc(ctaLabel)}</center></v:roundrect><![endif]-->
              <!--[if !mso]><!-- -->
              <a href="${esc(ctaUrl)}" style="background:#2D7FF9; color:#ffffff; text-decoration:none; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; font-weight:700; line-height:44px; display:inline-block; min-width:240px; text-align:center; border-radius:6px;">${esc(ctaLabel)}</a>
              <!--<![endif]-->
            </td>
          </tr>

          <!-- Contributors -->
          ${contributors && contributors.length ? `<tr><td style="padding:12px 24px 0 24px;"><div style=\"font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:16px; color:#6B7280; margin-bottom:8px;\">Contributors</div><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">${contributorsHtml}</table></td></tr>` : ''}

          <!-- Footer -->
          <tr><td style="padding:0 24px 20px 24px;"><div style="height:1px; background:#E5E7EB; line-height:1px;">&nbsp;</div></td></tr>
          <tr><td style="padding:8px 24px 24px 24px;">${footerBlock}</td></tr>
        </table>
      </td>
    </tr>
  </table>
  <div style="display:none; white-space:nowrap; font:15px courier; line-height:0;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
</body>
</html>`;
      }
    },
    {
      id: 'mythic-light-hermes',
      name: 'Mythic Light — Hermes Update',
      description: 'Light theme with subtle Greek myth aesthetics (Hermes).',
      sampleConfig: `{
  "projectName": "Project Hermes",
  "projectIconUrl": "https://example.com/hermes-icon.png",
  "updateDate": "2025-11-10",
  "preheader": "Hermes dispatch — weekly status and next steps.",
  "updateSummary": "Swift progress on the messaging relays and route optimization. QA started on the courier tracking module.",
  "progressPercent": 72,
  "sprintNumber": "9",
  "etaDate": "Jan 20, 2026",

  "statusLabel": "On Track",
  "statusChip": { "textColor": "#075985", "bgColor": "#E0F2FE", "borderColor": "#7DD3FC" },

  "whatsNew": [
    "Relay pipeline refactored for lower latency",
    "Courier mobile app gains offline queue",
    "Routing heuristic adds wind/current factors"
  ],
  "risks": [
    "3P map tiles quota nearing limit",
    "Legacy webhook retries can cascade on outage"
  ],

  "workstreams": [
    { "label": "Relays", "percent": 80 },
    { "label": "Courier App", "percent": 65 },
    { "label": "Routing Heuristics", "percent": 45 }
  ],

  "milestoneTrackPercent": 55,
  "currentMilestoneIndex": 1,
  "milestones": [
    { "label": "Specs", "date": "Oct 12" },
    { "label": "Prototype", "date": "Nov 08", "current": true },
    { "label": "Beta", "date": "Dec 05" },
    { "label": "RC", "date": "Jan 10" },
    { "label": "GA", "date": "Jan 20" }
  ],

  "contributors": [
    { "name": "Daphne", "imageUrl": "https://example.com/daphne.jpg" },
    { "name": "Orion", "imageUrl": "https://example.com/orion.jpg" }
  ],

  "cta": { "label": "Open Dispatch Console", "url": "https://example.com/hermes" },
  "footerText": "This Hermes dispatch concerns {{PROJECT_NAME}}. Manage your preferences in your profile."
}`,
      buildHtml: function buildHtmlMythicLight(cfg) {
        const projectName = String(cfg.projectName || 'Project Hermes');
        const projectIconUrl = String(cfg.projectIconUrl || '');
        const updateDate = String(cfg.updateDate || new Date().toISOString().slice(0,10));
        const preheader = String(cfg.preheader || `Hermes dispatch — status and next steps.`);
        const updateSummary = String(cfg.updateSummary || '');
        const progressPercent = Math.max(0, Math.min(100, +cfg.progressPercent || 0));
        const sprintNumber = String(cfg.sprintNumber || '');
        const etaDate = String(cfg.etaDate || '');
        const statusLabel = String(cfg.statusLabel || 'On Track');
        const statusChip = cfg.statusChip || {};
        const chipText = statusChip.textColor || '#075985';
        const chipBg = statusChip.bgColor || '#E0F2FE';
        const chipBorder = statusChip.borderColor || '#7DD3FC';
        const whatsNew = cfg.whatsNew || [];
        const risks = cfg.risks || [];
        const workstreams = cfg.workstreams || [];
        const milestones = cfg.milestones || [];
        const milestoneTrackPercent = Math.max(0, Math.min(100, +cfg.milestoneTrackPercent || 0));
        const currentMilestoneIndex = (typeof cfg.currentMilestoneIndex === 'number') ? cfg.currentMilestoneIndex : undefined;
        const contributors = cfg.contributors || [];
        const cta = cfg.cta || {}; const ctaLabel = cta.label || 'Open Console'; const ctaUrl = cta.url || '#';
        const footerHtmlTpl = cfg.footerHtml; const footerTextTpl = cfg.footerText;

        const escape = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
        const clamp = (n) => Math.max(0, Math.min(100, +n || 0));

        function list(items){ return (!items||!items.length) ? '<li>—</li>' : items.map(x=>`<li>${escape(x)}</li>`).join(''); }
        function work(ws){ if(!ws||!ws.length) return ''; return ws.map(w=>{const p=clamp(w.percent);return `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px 0;">
                      <tr>
                        <td valign="middle" style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; color:#374151;">${escape(w.label||'')}</td>
                        <td align="right" valign="middle" style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; color:#6B7280; white-space:nowrap;">${p}%</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:6px;">
                          <div style="background:#E5E7EB; border-radius:9999px; overflow:hidden; height:8px;">
                            <div style="background:#2D7FF9; width:${p}%; height:8px;"></div>
                          </div>
                        </td>
                      </tr>
                    </table>`;}).join(''); }
        function miles(ms, idx){ if(!ms||!ms.length) return ''; const w=(100/ms.length).toFixed(2); return ms.map((m,i)=>{ const cur = !!m.current || (typeof idx==='number' && idx===i); const dotStyle = cur? 'background:#2D7FF9; border:1px solid #1D4ED8;' : 'background:#F3F4F6; border:1px solid #D1D5DB;'; return `
                        <td align="center" style="width:${w}%;">
                          <div style="height:10px;">
                            <span style="display:inline-block; width:10px; height:10px; border-radius:9999px; ${dotStyle}"></span>
                          </div>
                          <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; color:#374151; margin-top:6px;">${escape(m.label||'')}</div>
                          <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:#6B7280;">${escape(m.date||'')}</div>
                        </td>`; }).join(''); }
        function people(ps){ if(!ps||!ps.length) return ''; return ps.map((p,i)=>{const name=escape(p.name||''); const img=escape(p.imageUrl||''); const b=(i<ps.length-1)?'8px':'0'; return `
                <tr>
                  <td width="40" valign="middle" style="padding:0 8px ${b} 0;">
                    <img src="${img}" width="32" height="32" alt="${name}" style="display:block; border-radius:9999px; background:#F3F4F6;">
                  </td>
                  <td valign="middle" style="padding:0 0 ${b} 0;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; line-height:18px; color:#374151;">${name}</div>
                  </td>
                </tr>`;}).join(''); }

        const safeProject = escape(projectName);
        const safeSummary = escape(updateSummary).replace(/\n/g,'<br>');
        const safePreheader = escape(preheader);
        const safeIcon = escape(projectIconUrl);
        const safeSprint = escape(sprintNumber);
        const safeEta = escape(etaDate);
        const safeStatusLabel = escape(statusLabel);

        let footerBlock;
        if (typeof footerHtmlTpl === 'string' && footerHtmlTpl.length) {
          footerBlock = footerHtmlTpl.replace(/\{\{PROJECT_NAME\}\}/g, safeProject);
        } else if (typeof footerTextTpl === 'string' && footerTextTpl.length) {
          const resolved = footerTextTpl.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
          footerBlock = `<div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:18px; color:#6B7280;">${escape(resolved)}</div>`;
        } else {
          footerBlock = `<div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:18px; color:#6B7280;">This Hermes dispatch concerns <span style="color:#111827; font-weight:600;">${safeProject}</span>. Manage your preferences in your profile.</div>`;
        }

        const whatsNewHtml = list(whatsNew);
        const risksHtml = list(risks);
        const workstreamsHtml = work(workstreams);
        const milestonesHtml = miles(milestones, currentMilestoneIndex);
        const contributorsHtml = people(contributors);

        return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${safeProject} — Status Dispatch</title>
  <style>
    @media (max-width: 600px) { .container { width: 100% !important; } .p-24 { padding: 16px !important; } .stack { display: block !important; width: 100% !important; } .align-right { text-align: left !important; } }
  </style>
  <!--[if mso]><style type="text/css">body, table, td { font-family: Arial, sans-serif !important; }</style><![endif]-->
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
</head>
<body style="margin:0; padding:0; background:#F5F7FA; color:#111827; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${safePreheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F5F7FA;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:600px; background:#FFFFFF; border:1px solid #E5E7EB; border-radius:16px; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:0; border-top-left-radius:16px; border-top-right-radius:16px;">
              <!-- Ornament: subtle Greek-inspired divider -->
              <div style="text-align:center; padding:8px 0; color:#1D4ED8; font-size:12px; letter-spacing:4px;">· · ·  H  E  R  M  E  S  · · ·</div>
            </td>
          </tr>
          <tr>
            <td class="p-24" style="padding:16px 24px 12px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="52" valign="middle" style="width:52px;">
                    <img src="${safeIcon}" width="48" height="48" alt="${safeProject} icon" style="display:block; border-radius:10px; outline:none; border:1px solid #E5E7EB; background:#FAFAFA;">
                  </td>
                  <td valign="middle" style="padding-left:12px;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:16px; color:#6B7280; letter-spacing:.3px;">Status Dispatch</div>
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:24px; line-height:28px; font-weight:700; color:#111827;">${safeProject}</div>
                  </td>
                  <td valign="middle" align="right" class="align-right">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:16px; color:#6B7280;">${escape(updateDate)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding:0 24px;"><div style="height:1px; background:#E5E7EB; line-height:1px;">&nbsp;</div></td></tr>
          <tr>
            <td class="p-24" style="padding:16px 24px 0 24px;">
              <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; color:#1F2937;">${safeSummary}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 0 24px;">
              <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:18px; color:#6B7280;">Overall Progress: <span style="color:#111827; font-weight:600;">${progressPercent}%</span></div>
              <div style="background:#E5E7EB; border-radius:9999px; overflow:hidden; height:10px; margin-top:8px;">
                <div style="background:#2D7FF9; width:${progressPercent}%; height:10px;"></div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 0 24px;">
              <span style="display:inline-block; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:${chipText}; border:1px solid ${chipBorder}; background:${chipBg}; padding:4px 8px; border-radius:9999px; margin-right:6px;">${safeStatusLabel}</span>
              <span style="display:inline-block; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:#374151; border:1px solid #E5E7EB; background:#F9FAFB; padding:4px 8px; border-radius:9999px; margin-right:6px;">Sprint ${safeSprint}</span>
              <span style="display:inline-block; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:#92400E; border:1px solid #FCD34D; background:#FEF3C7; padding:4px 8px; border-radius:9999px;">ETA: ${safeEta}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF; border:1px solid #E5E7EB; border-radius:12px;">
                <tr>
                  <td style="padding:16px;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:#111827; margin-bottom:8px;">Hermes — What’s New</div>
                    <ul style="padding-left:18px; margin:0; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; line-height:20px; color:#374151;">${whatsNewHtml}</ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF; border:1px solid #E5E7EB; border-radius:12px;">
                <tr>
                  <td style="padding:16px;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:#111827; margin-bottom:8px;">Workstream Progress</div>
                    ${workstreamsHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF; border:1px solid #E5E7EB; border-radius:12px;">
                <tr>
                  <td style="padding:16px;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:#111827; margin-bottom:8px;">Milestone Track</div>
                    <div style="background:#E5E7EB; border-radius:9999px; overflow:hidden; height:8px;">
                      <div style="background:#2D7FF9; width:${milestoneTrackPercent}%; height:8px;"></div>
                    </div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
                      <tr>${milestonesHtml}</tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF; border:1px solid #E5E7EB; border-radius:12px;">
                <tr>
                  <td style="padding:16px;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:#111827; margin-bottom:8px;">Risks & Blockers</div>
                    <ul style="padding-left:18px; margin:0; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; line-height:20px; color:#7F1D1D;">${risksHtml}</ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:20px 24px 24px 24px;">
              <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${escape(ctaUrl)}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="12%" stroke="f" fillcolor="#2D7FF9"><w:anchorlock/><center style="color:#ffffff; font-family:Segoe UI, Arial, sans-serif; font-size:14px; font-weight:700;">${escape(ctaLabel)}</center></v:roundrect><![endif]-->
              <!--[if !mso]><!-- -->
              <a href="${escape(ctaUrl)}" style="background:#2D7FF9; color:#ffffff; text-decoration:none; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; font-weight:700; line-height:44px; display:inline-block; min-width:240px; text-align:center; border-radius:6px;">${escape(ctaLabel)}</a>
              <!--<![endif]-->
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 0 24px;">
              <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:16px; color:#6B7280; margin-bottom:8px;">Contributors</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${contributorsHtml}
              </table>
            </td>
          </tr>
          <tr><td style="padding:0 24px 20px 24px;"><div style="height:1px; background:#E5E7EB; line-height:1px;">&nbsp;</div></td></tr>
          <tr>
            <td style="padding:8px 24px 24px 24px;">${footerBlock}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <div style="display:none; white-space:nowrap; font:15px courier; line-height:0;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
</body>
</html>`;
      }
    }
  ];

  // --- DOM helpers ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function clamp(n, lo, hi) { n = +n || 0; return Math.max(lo, Math.min(hi, n)); }

  function buildList(items) {
    if (!items || !items.length) return '<li>—</li>';
    return items.map(x => `<li>${escapeHtml(x)}</li>`).join('');
  }

  function buildWorkstreams(ws) {
    if (!ws || !ws.length) return '';
    return ws.map(w => {
      const label = escapeHtml(w.label || '');
      const pct = clamp(w.percent, 0, 100);
      return `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px 0;">
                      <tr>
                        <td valign="middle" style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; color:#CDD3D8;">${label}</td>
                        <td align="right" valign="middle" style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; color:#9AA0A6; white-space:nowrap;">${pct}%</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:6px;">
                          <div style="background:#2A2A2A; border-radius:9999px; overflow:hidden; height:8px;">
                            <div class="bar-fill shimmer" style="background:#00BCD4; width:${pct}%; height:8px;"></div>
                          </div>
                        </td>
                      </tr>
                    </table>`;
    }).join('');
  }

  function buildMilestones(ms, currentIdx) {
    if (!ms || !ms.length) return '';
    const width = Math.round((100 / ms.length) * 100) / 100;
    return ms.map((m, i) => {
      const label = escapeHtml(m.label || '');
      const date = escapeHtml(m.date || '');
      const isCurrent = !!m.current || (typeof currentIdx === 'number' && currentIdx === i);
      const pulse = isCurrent ? ' pulse' : '';
      return `
                        <td align="center" style="width:${width}%;">
                          <div style="height:10px;">
                            <span class="milestone-dot${pulse}" style="display:inline-block; width:10px; height:10px; border-radius:9999px; background:#2A2A2A; border:1px solid #3A3A3A;"></span>
                          </div>
                          <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; color:#CDD3D8; margin-top:6px;">${label}</div>
                          <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:#9AA0A6;">${date}</div>
                        </td>`;
    }).join('');
  }

  function buildContributors(people) {
    if (!people || !people.length) return '';
    return people.map((p, i) => {
      const name = escapeHtml(p.name || '');
      const img = escapeHtml(p.imageUrl || '');
      const bottom = (i < people.length - 1) ? '8px' : '0';
      return `
                <tr>
                  <td width="40" valign="middle" style="padding:0 8px ${bottom} 0;">
                    <img src="${img}" width="32" height="32" alt="${name}" style="display:block; border-radius:9999px; background:#2A2A2A;">
                  </td>
                  <td valign="middle" style="padding:0 0 ${bottom} 0;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; line-height:18px; color:#CDD3D8;">${name}</div>
                  </td>
                </tr>`;
    }).join('');
  }

  function buildHtml(cfg) {
    const projectName = String(cfg.projectName || 'Project');
    const projectIconUrl = String(cfg.projectIconUrl || '');
    const updateDate = String(cfg.updateDate || new Date().toISOString().slice(0,10));
    const preheader = String(cfg.preheader || `Weekly update for ${projectName} — progress, milestones, and next steps.`);
    const updateSummary = String(cfg.updateSummary || '');
    const progressPercent = clamp(cfg.progressPercent, 0, 100);
    const sprintNumber = String(cfg.sprintNumber || '');
    const etaDate = String(cfg.etaDate || '');
    const statusLabel = String(cfg.statusLabel || 'On Track');
    const statusChip = cfg.statusChip || {};
    const chipText = statusChip.textColor || '#B0F3FF';
    const chipBg = statusChip.bgColor || '#0D2A2D';
    const chipBorder = statusChip.borderColor || '#004F57';
    const whatsNew = cfg.whatsNew || [];
    const risks = cfg.risks || [];
    const workstreams = cfg.workstreams || [];
    const milestones = cfg.milestones || [];
    const milestoneTrackPercent = clamp(cfg.milestoneTrackPercent, 0, 100);
    const currentMilestoneIndex = (typeof cfg.currentMilestoneIndex === 'number') ? cfg.currentMilestoneIndex : undefined;
    const contributors = cfg.contributors || [];
    const cta = cfg.cta || {}; const ctaLabel = cta.label || 'Open Dashboard'; const ctaUrl = cta.url || '#';
    const footerHtmlTpl = cfg.footerHtml;
    const footerTextTpl = cfg.footerText;

    const safeProject = escapeHtml(projectName);
    const safeSummary = escapeHtml(updateSummary).replace(/\n/g, '<br>');
    const safePreheader = escapeHtml(preheader);
    const safeIcon = escapeHtml(projectIconUrl);
    const safeSprint = escapeHtml(sprintNumber);
    const safeEta = escapeHtml(etaDate);
    const safeStatusLabel = escapeHtml(statusLabel);

    const whatsNewHtml = buildList(whatsNew);
    const risksHtml = buildList(risks);
    const workstreamsHtml = buildWorkstreams(workstreams);
    const milestonesHtml = buildMilestones(milestones, currentMilestoneIndex);
    const contributorsHtml = buildContributors(contributors);
    let footerBlock;
    if (typeof footerHtmlTpl === 'string' && footerHtmlTpl.length) {
      footerBlock = footerHtmlTpl.replace(/\{\{PROJECT_NAME\}\}/g, safeProject);
    } else if (typeof footerTextTpl === 'string' && footerTextTpl.length) {
      const resolved = footerTextTpl.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
      footerBlock = `<div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:18px; color:#7F8B95;">${escapeHtml(resolved)}</div>`;
    } else {
      footerBlock = `<div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:18px; color:#7F8B95;">You are receiving this update about <span style="color:#C9D1D9;">${safeProject}</span>. To change your notification preferences, visit your dashboard.</div>`;
    }

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${safeProject} — Project Update</title>
  <style>
    @media (max-width: 600px) { .container { width: 100% !important; } .p-24 { padding: 16px !important; } .stack { display: block !important; width: 100% !important; } .align-right { text-align: left !important; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .shimmer { background-image: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%); background-size: 200% 100%; background-repeat: no-repeat; animation: shimmer 2.75s linear infinite; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(0,188,212,0.00); transform: scale(1);} 50% { box-shadow: 0 0 0 6px rgba(0,188,212,0.18); transform: scale(1.06);} 100% { box-shadow: 0 0 0 0 rgba(0,188,212,0.00); transform: scale(1);} }
    .pulse { animation: pulse 3s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .shimmer, .pulse { animation: none !important; } }
  </style>
  <!--[if mso]><style type="text/css">body, table, td { font-family: Arial, sans-serif !important; }</style><![endif]-->
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
</head>
<body style="margin:0; padding:0; background:#0B0C0E; color:#E6E6E6; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${safePreheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0B0C0E;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:600px; background:#121212; border-radius:16px; box-shadow:0 2px 6px rgba(0,0,0,0.35);">
          <tr>
            <td class="p-24" style="padding:24px 24px 12px 24px; border-top-left-radius:16px; border-top-right-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="52" valign="middle" style="width:52px;">
                    <img src="${safeIcon}" width="48" height="48" alt="${safeProject} icon" style="display:block; border-radius:10px; outline:none; border:none; text-decoration:none; background:#1E1E1E;">
                  </td>
                  <td valign="middle" style="padding-left:12px;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:16px; color:#B0B3B8; letter-spacing:.3px;">Project Update</div>
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:24px; line-height:28px; font-weight:700; color:#E6E6E6;">${safeProject}</div>
                  </td>
                  <td valign="middle" align="right" class="align-right">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:16px; color:#9AA0A6;">${escapeHtml(updateDate)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding:0 24px;"><div style="height:1px; background:#222; line-height:1px;">&nbsp;</div></td></tr>
          <tr>
            <td class="p-24" style="padding:16px 24px 0 24px;">
              <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; color:#DDE3E8;">${safeSummary}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 0 24px;">
              <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:18px; color:#9AA0A6;">Overall Progress: <span style="color:#E6E6E6; font-weight:600;">${progressPercent}%</span></div>
              <div style="background:#2A2A2A; border-radius:9999px; overflow:hidden; height:10px; margin-top:8px;">
                <div class="bar-fill shimmer" style="background:#00BCD4; width:${progressPercent}%; height:10px;"></div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 0 24px;">
              <span style="display:inline-block; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:${chipText}; border:1px solid ${chipBorder}; background:${chipBg}; padding:4px 8px; border-radius:9999px; margin-right:6px;">${safeStatusLabel}</span>
              <span style="display:inline-block; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:#B0B3B8; border:1px solid #2A2A2A; background:#1A1A1A; padding:4px 8px; border-radius:9999px; margin-right:6px;">Sprint ${safeSprint}</span>
              <span style="display:inline-block; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:#FFD88A; border:1px solid #4A3A05; background:#2A2104; padding:4px 8px; border-radius:9999px;">ETA: ${safeEta}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1A1A1A; border-radius:12px;">
                <tr>
                  <td style="padding:16px;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:#E6E6E6; margin-bottom:8px;">What’s New</div>
                    <ul style="padding-left:18px; margin:0; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; line-height:20px; color:#CDD3D8;">${whatsNewHtml}</ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1A1A1A; border-radius:12px;">
                <tr>
                  <td style="padding:16px;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:#E6E6E6; margin-bottom:8px;">Workstream Progress</div>
                    ${workstreamsHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#191919; border-radius:12px;">
                <tr>
                  <td style="padding:16px;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:#E6E6E6; margin-bottom:8px;">Milestone Track</div>
                    <div style="background:#2A2A2A; border-radius:9999px; overflow:hidden; height:8px;">
                      <div class="bar-fill shimmer" style="background:#00BCD4; width:${milestoneTrackPercent}%; height:8px;"></div>
                    </div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
                      <tr>${milestonesHtml}</tr>
                    </table>
                    <!--[if mso]><p style="margin:12px 0 0 0; font-family:Arial, sans-serif; font-size:12px; color:#9AA0A6;">Milestones listed left → right.</p><![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#191919; border-radius:12px;">
                <tr>
                  <td style="padding:16px;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:#E6E6E6; margin-bottom:8px;">Risks & Blockers</div>
                    <ul style="padding-left:18px; margin:0; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; line-height:20px; color:#E0B2B2;">${risksHtml}</ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:20px 24px 24px 24px;">
              <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${escapeHtml(ctaUrl)}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="12%" stroke="f" fillcolor="#00BCD4"><w:anchorlock/><center style="color:#000000; font-family:Segoe UI, Arial, sans-serif; font-size:14px; font-weight:700;">${escapeHtml(ctaLabel)}</center></v:roundrect><![endif]-->
              <!--[if !mso]><!-- -->
              <a href="${escapeHtml(ctaUrl)}" style="background:#00BCD4; color:#000; text-decoration:none; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; font-weight:700; line-height:44px; display:inline-block; min-width:220px; text-align:center; border-radius:6px;">${escapeHtml(ctaLabel)}</a>
              <!--<![endif]-->
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 0 24px;">
              <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:16px; color:#9AA0A6; margin-bottom:8px;">Contributors</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${contributorsHtml}
              </table>
            </td>
          </tr>
          <tr><td style="padding:0 24px 20px 24px;"><div style="height:1px; background:#222; line-height:1px;">&nbsp;</div></td></tr>
          <tr>
            <td style="padding:8px 24px 24px 24px;">${footerBlock}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <div style="display:none; white-space:nowrap; font:15px courier; line-height:0;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
</body>
</html>`;
  }

  // --- Avatar SVG generator ---
  const AVATAR_PALETTE = ['#00BCD4','#F59E0B','#22C55E','#EF4444','#8B5CF6','#10B981','#F472B6','#60A5FA'];
  function hash32(str){ let h=2166136261>>>0; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }
  function initials(name){ if(!name) return '?'; const parts=String(name).trim().split(/\s+/); const a=(parts[0]||'')[0]||''; const b=(parts.length>1? (parts[parts.length-1]||'')[0] : '')||''; return (a+b||a||'?').toUpperCase(); }
  function svgAvatar(name, seed){ const text=initials(name); const h=seed!=null?seed:hash32(name); const bg=AVATAR_PALETTE[h % AVATAR_PALETTE.length]; const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="54%" dy=".1em" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="56" fill="#000">${text}</text></svg>`; return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg); }

  // --- Storage (local projects) ---
  const STORAGE_KEY = 'emailBuilder.projects.v1';
  let projectIndex = {}; // id -> {id,name,templateId,config,updatedAt}
  let currentProjectId = null;
  function loadProjects(){ try{ const s=localStorage.getItem(STORAGE_KEY); projectIndex = s? JSON.parse(s):{}; }catch{ projectIndex={}; } }
  function saveProjects(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(projectIndex)); }
  function genId(){ return 'p_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }
  function listProjects(){ return Object.values(projectIndex).sort((a,b)=> (b.updatedAt||0)-(a.updatedAt||0)); }

  // --- Form builder helpers ---
  function deepGet(obj, path){ if(!path) return obj; const parts=path.split('.'); let cur=obj; for(const p of parts){ if(cur==null) return undefined; cur = cur[p]; } return cur; }
  function deepSet(obj, path, value){ const parts=path.split('.'); let cur=obj; for(let i=0;i<parts.length-1;i++){ const k=parts[i]; if(cur[k]==null || typeof cur[k] !== 'object') cur[k] = {}; cur = cur[k]; } cur[parts[parts.length-1]] = value; }
  function ensureArray(obj, key){ if(!Array.isArray(obj[key])) obj[key] = []; return obj[key]; }
  function clamp(n, lo=0, hi=100){ n = +n || 0; return Math.max(lo, Math.min(hi, n)); }

  function inferType(key, value){
    if (Array.isArray(value)) return 'list';
    if (typeof value === 'number') return key.toLowerCase().includes('percent') ? 'percent' : 'number';
    if (typeof value === 'boolean') return 'checkbox';
    if (typeof value === 'string') {
      const lk = key.toLowerCase();
      if (lk.includes('color')) return 'color';
      if (lk.includes('url') || lk.includes('icon')) return 'image';
      if (lk.includes('summary') || lk.includes('footerhtml') || lk.includes('footertext') || lk.includes('quote')) return 'textarea';
      return 'text';
    }
    if (typeof value === 'object' && value) return 'group';
    return 'text';
  }

  function buildPrimitiveInput(path, label, type, value, onChange){
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '10px';
    const lab = document.createElement('div'); lab.className='muted'; lab.textContent = label; wrap.appendChild(lab);
    if (type === 'textarea'){
      const ta = document.createElement('textarea'); ta.className='input'; ta.style.minHeight='80px'; ta.value = value||''; ta.addEventListener('input', ()=> onChange(ta.value)); wrap.appendChild(ta);
    } else if (type === 'checkbox'){
      const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = !!value; cb.addEventListener('change', ()=> onChange(cb.checked)); wrap.appendChild(cb);
    } else if (type === 'percent'){
      const row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px';
      const num = document.createElement('input'); num.type='number'; num.className='input'; num.style.maxWidth='120px'; num.min='0'; num.max='100'; num.step='1'; num.value = (value??0);
      num.addEventListener('input', ()=> onChange(clamp(num.value)) );
      const rng = document.createElement('input'); rng.type='range'; rng.min='0'; rng.max='100'; rng.step='1'; rng.value = (value??0);
      rng.addEventListener('input', ()=> { num.value = rng.value; onChange(clamp(rng.value)); });
      row.appendChild(num); row.appendChild(rng); wrap.appendChild(row);
    } else if (type === 'color'){
      const row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px';
      const color = document.createElement('input'); color.type='color'; color.value = /^#/.test(value||'') ? value : '#000000';
      const txt = document.createElement('input'); txt.type='text'; txt.className='input'; txt.value = value||'';
      color.addEventListener('input', ()=> { txt.value = color.value; onChange(txt.value); });
      txt.addEventListener('input', ()=> onChange(txt.value));
      row.appendChild(color); row.appendChild(txt); wrap.appendChild(row);
    } else if (type === 'image'){
      const modeRow = document.createElement('div'); modeRow.style.display='flex'; modeRow.style.gap='8px'; modeRow.style.alignItems='center';
      const urlBtn = document.createElement('button'); urlBtn.className='btn ghost'; urlBtn.textContent='Use URL';
      const svgBtn = document.createElement('button'); svgBtn.className='btn ghost'; svgBtn.textContent='SVG from name';
      const urlInput = document.createElement('input'); urlInput.type='text'; urlInput.className='input'; urlInput.placeholder='https://...'; urlInput.value = value||''; urlInput.style.marginTop='6px';
      const prev = document.createElement('img'); prev.alt='preview'; prev.style.width='40px'; prev.style.height='40px'; prev.style.borderRadius='50%'; prev.style.border='1px solid #2a2a2a'; prev.style.marginLeft='8px';
      function setUrlMode(){ urlBtn.className='btn'; svgBtn.className='btn ghost'; urlInput.style.display=''; prev.style.display=''; prev.src = urlInput.value; }
      function setSvgMode(){ urlBtn.className='btn ghost'; svgBtn.className='btn'; urlInput.style.display='none'; prev.style.display=''; const displayName = path.toLowerCase().includes('projecticonurl') ? deepGet(currentConfig,'projectName') : guessNameForImage(path); prev.src = svgAvatar(displayName||''); onChange(prev.src); }
      function guessNameForImage(path){
        // try sibling 'name' for contributors, else projectName
        if (path.includes('contributors')) return ' ';
        return deepGet(currentConfig,'projectName') || 'Project';
      }
      urlBtn.addEventListener('click', (e)=>{ e.preventDefault(); setUrlMode(); onChange(urlInput.value); });
      svgBtn.addEventListener('click', (e)=>{ e.preventDefault(); setSvgMode(); });
      urlInput.addEventListener('input', ()=> { prev.src = urlInput.value; onChange(urlInput.value); });
      modeRow.appendChild(urlBtn); modeRow.appendChild(svgBtn); modeRow.appendChild(prev);
      wrap.appendChild(modeRow); wrap.appendChild(urlInput);
      // default to URL mode
      setUrlMode();
    } else {
      const inp = document.createElement('input'); inp.type = (type==='number'?'number':'text'); inp.className='input'; inp.value = (value??''); inp.addEventListener('input', ()=> onChange(inp.value) ); wrap.appendChild(inp);
    }
    return wrap;
  }

  function buildListPrimitive(path, label, arr, onChange){
    const wrap = document.createElement('div');
    const title = document.createElement('div'); title.className='muted'; title.textContent = label; wrap.appendChild(title);
    const listDiv = document.createElement('div'); wrap.appendChild(listDiv);
    function render(){
      listDiv.innerHTML = '';
      (arr||[]).forEach((val, idx)=>{
        const row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; row.style.margin='6px 0';
        const inp = document.createElement('input'); inp.type='text'; inp.className='input'; inp.style.flex='1'; inp.value = val||'';
        inp.addEventListener('input', ()=> { arr[idx] = inp.value; onChange(arr); });
        const del = document.createElement('button'); del.className='btn ghost'; del.textContent='Remove'; del.addEventListener('click', (e)=>{ e.preventDefault(); arr.splice(idx,1); onChange(arr); render(); });
        row.appendChild(inp); row.appendChild(del); listDiv.appendChild(row);
      });
    }
    const add = document.createElement('button'); add.className='btn secondary'; add.textContent='Add Item'; add.addEventListener('click', (e)=>{ e.preventDefault(); arr.push(''); onChange(arr); render(); });
    render(); wrap.appendChild(add); return wrap;
  }

  function buildListObjects(path, label, arr, itemSpec, onChange){
    const wrap = document.createElement('div');
    const title = document.createElement('div'); title.className='muted'; title.textContent = label; wrap.appendChild(title);
    const listDiv = document.createElement('div'); wrap.appendChild(listDiv);
    function render(){
      listDiv.innerHTML = '';
      (arr||[]).forEach((obj, idx)=>{
        const card = document.createElement('div'); card.className='panel'; card.style.padding='12px'; card.style.margin='8px 0';
        const head = document.createElement('div'); head.className='muted'; head.textContent = `Item ${idx+1}`; card.appendChild(head);
        const grid = document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(auto-fit,minmax(160px,1fr))'; grid.style.gap='8px';
        itemSpec.forEach(f=>{
          const key = f.path; const t=f.type||inferType(key, obj[key]);
          const val = obj[key];
          const ctl = buildPrimitiveInput(`${path}.${idx}.${key}`, f.label||key, t, val, (nv)=>{ obj[key] = (t==='percent'? clamp(nv): (t==='number'? (+nv||0): (t==='checkbox'? !!nv : nv))); onChange(arr); });
          grid.appendChild(ctl);
        });
        const del = document.createElement('button'); del.className='btn ghost'; del.textContent='Remove'; del.addEventListener('click', (e)=>{ e.preventDefault(); arr.splice(idx,1); onChange(arr); render(); });
        card.appendChild(grid); card.appendChild(del); listDiv.appendChild(card);
      });
    }
    const add = document.createElement('button'); add.className='btn secondary'; add.textContent='Add Item'; add.addEventListener('click', (e)=>{ e.preventDefault(); arr.push({}); onChange(arr); render(); });
    render(); wrap.appendChild(add); return wrap;
  }

  function renderFormFromConfig(cfg, templateId){
    const container = document.getElementById('dynamic-form');
    container.innerHTML = '';
    // Basic scalar fields we care about, in useful order
    const scalarOrder = [
      'projectName','projectIconUrl','bannerUrl','updateDate','preheader','updateSummary','progressPercent','sprintNumber','etaDate','statusLabel',
      'milestoneTrackPercent','currentMilestoneIndex','accentColor','accentAltColor','spotlight'
    ];
    const groups = [];
    const scalars = document.createElement('div');
    scalarOrder.forEach(k=>{
      if (k in cfg || (k==='bannerUrl' && templateId.includes('hermes'))){
        const t = inferType(k, cfg[k]);
        const ctl = buildPrimitiveInput(k, k, t, cfg[k], (nv)=>{ if (t==='percent') nv=clamp(nv); deepSet(currentConfig,k,nv); syncJsonFromConfig(); schedulePreview(); });
        scalars.appendChild(ctl);
      }
    });
    if (scalars.childNodes.length){ const sec=document.createElement('div'); const hdr=document.createElement('h3'); hdr.textContent='Basics'; hdr.style.fontSize='14px'; hdr.style.color='#cfd5db'; hdr.style.margin='4px 0 8px'; sec.appendChild(hdr); sec.appendChild(scalars); container.appendChild(sec); }

    // Nested object groups we know: statusChip, cta, quote
    [['statusChip','Status Chip'],['cta','Call To Action'],['quote','Quote']].forEach(([key,label])=>{
      if (cfg[key] && typeof cfg[key]==='object'){
        const sec=document.createElement('div'); const hdr=document.createElement('h3'); hdr.textContent=label; hdr.style.fontSize='14px'; hdr.style.color='#cfd5db'; hdr.style.margin='8px 0'; sec.appendChild(hdr);
        const grid=document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(auto-fit,minmax(160px,1fr))'; grid.style.gap='8px';
        Object.keys(cfg[key]).forEach(sub=>{
          const p = `${key}.${sub}`; const t=inferType(sub, cfg[key][sub]);
          const ctl = buildPrimitiveInput(p, sub, t, cfg[key][sub], (nv)=>{ if (t==='percent') nv=clamp(nv); deepSet(currentConfig,p,nv); syncJsonFromConfig(); schedulePreview(); });
          grid.appendChild(ctl);
        });
        sec.appendChild(grid); container.appendChild(sec);
      }
    });

    // Lists: whatsNew, risks (primitives)
    [['whatsNew','What’s New'],['risks','Risks & Blockers']].forEach(([key,label])=>{
      if (Array.isArray(cfg[key])){
        const wrap = buildListPrimitive(key,label, cfg[key], (arr)=>{ deepSet(currentConfig,key,arr); syncJsonFromConfig(); schedulePreview(); });
        const sec=document.createElement('div'); const hdr=document.createElement('h3'); hdr.textContent=label; hdr.style.fontSize='14px'; hdr.style.color='#cfd5db'; hdr.style.margin='8px 0'; sec.appendChild(hdr); sec.appendChild(wrap); container.appendChild(sec);
      }
    });

    // workstreams (objects)
    if (Array.isArray(cfg.workstreams)){
      const wrap = buildListObjects('workstreams','Workstreams', cfg.workstreams, [
        { path:'label', label:'Label', type:'text' },
        { path:'percent', label:'Percent', type:'percent' }
      ], (arr)=>{ deepSet(currentConfig,'workstreams',arr); syncJsonFromConfig(); schedulePreview(); });
      const sec=document.createElement('div'); const hdr=document.createElement('h3'); hdr.textContent='Workstreams'; hdr.style.fontSize='14px'; hdr.style.color='#cfd5db'; hdr.style.margin='8px 0'; sec.appendChild(hdr); sec.appendChild(wrap); container.appendChild(sec);
    }

    // milestones
    if (Array.isArray(cfg.milestones)){
      const wrap = buildListObjects('milestones','Milestones', cfg.milestones, [
        { path:'label', label:'Label', type:'text' },
        { path:'date', label:'Date', type:'text' },
        { path:'current', label:'Current', type:'checkbox' }
      ], (arr)=>{ deepSet(currentConfig,'milestones',arr); syncJsonFromConfig(); schedulePreview(); });
      const sec=document.createElement('div'); const hdr=document.createElement('h3'); hdr.textContent='Milestones'; hdr.style.fontSize='14px'; hdr.style.color='#cfd5db'; hdr.style.margin='8px 0'; sec.appendChild(hdr); sec.appendChild(wrap); container.appendChild(sec);
    }

    // contributors
    if (Array.isArray(cfg.contributors)){
      const wrap = buildListObjects('contributors','Contributors', cfg.contributors, [
        { path:'name', label:'Name', type:'text' },
        { path:'imageUrl', label:'Image', type:'image' }
      ], (arr)=>{ deepSet(currentConfig,'contributors',arr); syncJsonFromConfig(); schedulePreview(); });
      const sec=document.createElement('div'); const hdr=document.createElement('h3'); hdr.textContent='Contributors'; hdr.style.fontSize='14px'; hdr.style.color='#cfd5db'; hdr.style.margin='8px 0'; sec.appendChild(hdr); sec.appendChild(wrap); container.appendChild(sec);
    }

    // footer fields if present
    ['footerText','footerHtml'].forEach(key=>{
      if (key in cfg){ const t = key==='footerHtml' ? 'textarea' : 'textarea'; const ctl = buildPrimitiveInput(key, key, t, cfg[key], (nv)=>{ deepSet(currentConfig,key,nv); syncJsonFromConfig(); schedulePreview(); }); container.appendChild(ctl); }
    });
  }

  // --- UI logic ---
  const listEl = document.getElementById('template-list');
  const toStep2Btn = document.getElementById('to-step-2');
  const backTo1Btn = document.getElementById('back-to-1');
  const toStep3Btn = document.getElementById('to-step-3');
  const backTo2Btn = document.getElementById('back-to-2');
  const editor = document.getElementById('config-editor');
  const toInput = document.getElementById('to');
  const subjectInput = document.getElementById('subject');
  const previewFrame = document.getElementById('preview');
  const copyBtn = document.getElementById('copy-html');
  const downloadHtmlBtn = document.getElementById('download-html');
  const downloadEmlBtn = document.getElementById('download-eml');
  const openOutlookWebBtn = document.getElementById('open-outlook-web');
  const projTitle = document.getElementById('project-title');
  const projNewBtn = document.getElementById('proj-new');
  const projSaveBtn = document.getElementById('proj-save');
  const projSaveAsBtn = document.getElementById('proj-save-as');
  const projSelect = document.getElementById('proj-select');
  const projDupBtn = document.getElementById('proj-dup');
  const projDelBtn = document.getElementById('proj-del');
  const projExportBtn = document.getElementById('proj-export');
  const projImportBtn = document.getElementById('proj-import');
  const projImportFile = document.getElementById('proj-import-file');
  const formPane = document.getElementById('form-pane');
  const jsonPane = document.getElementById('json-pane');
  const modeFormBtn = document.getElementById('mode-form');
  const modeJsonBtn = document.getElementById('mode-json');
  const syncFromJsonBtn = document.getElementById('sync-from-json');

  let selectedTemplate = null;
  let lastHtml = '';
  let currentConfig = {};

  function selectTemplate(t) {
    selectedTemplate = t;
    for (const card of $$('.card')) card.classList.remove('selected');
    const chosen = document.querySelector(`[data-id="${t.id}"]`);
    if (chosen) chosen.classList.add('selected');
    toStep2Btn.disabled = false;
  }

  function renderTemplates() {
    listEl.innerHTML = '';
    TEMPLATES.forEach(t => {
      const div = document.createElement('div');
      div.className = 'card';
      div.dataset.id = t.id;
      div.innerHTML = `<h3>${t.name}</h3><p>${t.description}</p>`;
      div.addEventListener('click', () => selectTemplate(t));
      listEl.appendChild(div);
    });
    // Auto-select first
    if (TEMPLATES[0]) selectTemplate(TEMPLATES[0]);
  }

  function parseConfig() {
    try { return JSON.parse(editor.value); }
    catch (e) { alert('Invalid JSON: ' + e.message); throw e; }
  }

  function showStep(n) {
    document.getElementById('step-1').style.display = (n === 1 ? '' : 'none');
    document.getElementById('step-2').style.display = (n === 2 ? '' : 'none');
    document.getElementById('step-3').style.display = (n === 3 ? '' : 'none');
  }

  function setPreview(html) {
    lastHtml = html;
    const doc = previewFrame.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();
  }

  function download(filename, mime, content) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function buildEml(to, subject, html) {
    const headers = [
      `From: `,
      `To: ${to || ''}`,
      `Subject: ${subject || ''}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      '',
    ].join('\r\n');
    return headers + html;
  }

  function openOutlookWeb(to, subject, html) {
    // Deep link to Outlook Web compose with HTML body. Some tenants redirect.
    const base = 'https://outlook.office.com/mail/deeplink/compose';
    const url = `${base}?to=${encodeURIComponent(to || '')}&subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(html)}&mailBodyType=html`;
    window.open(url, '_blank');
  }

  // Project UI helpers
  function refreshProjSelect(){
    const items = listProjects();
    const cur = projSelect.value;
    projSelect.innerHTML = '<option value="">Open project…</option>' + items.map(p=>`<option value="${p.id}">${p.name} — ${p.templateId}</option>`).join('');
    if (cur) projSelect.value = cur;
  }
  function loadProject(id){ const p=projectIndex[id]; if(!p) return; currentProjectId = id; const tpl = TEMPLATES.find(x=>x.id===p.templateId) || selectedTemplate; if (tpl.id !== selectedTemplate.id){ selectTemplate(tpl); }
    currentConfig = JSON.parse(JSON.stringify(p.config)); projTitle.value = p.name || ''; editor.value = JSON.stringify(currentConfig, null, 2); renderFormFromConfig(currentConfig, tpl.id); schedulePreview(); }
  function saveCurrentProject(asNew=false){ const name = (projTitle.value||'Untitled').trim(); const data = { id: currentProjectId && !asNew ? currentProjectId : genId(), name, templateId: selectedTemplate.id, config: currentConfig, updatedAt: Date.now()}; projectIndex[data.id]=data; currentProjectId = data.id; saveProjects(); refreshProjSelect(); }

  // Sync helpers
  function syncJsonFromConfig(){ editor.value = JSON.stringify(currentConfig, null, 2); }
  function syncConfigFromJson(){ try{ const obj = parseConfig(); currentConfig = obj; projTitle.value = currentConfig.projectName || projTitle.value; renderFormFromConfig(currentConfig, selectedTemplate.id); schedulePreview(); }catch{} }
  let previewTimer = null; function schedulePreview(){ clearTimeout(previewTimer); previewTimer = setTimeout(()=>{ const html = selectedTemplate.buildHtml(currentConfig); setPreview(html); }, 150); }

  // Wire up buttons
  toStep2Btn.addEventListener('click', () => {
    // Init projects
    loadProjects(); refreshProjSelect();
    editor.value = selectedTemplate.sampleConfig;
    try { currentConfig = JSON.parse(editor.value); } catch { currentConfig = {}; }
    projTitle.value = currentConfig.projectName || '';
    renderFormFromConfig(currentConfig, selectedTemplate.id);
    // Default subject from projectName
    try {
      const cfg = JSON.parse(editor.value);
      subjectInput.value = `Weekly Update — ${cfg.projectName || 'Project'}`;
    } catch {}
    // Default to Form mode
    formPane.style.display=''; jsonPane.style.display='none'; modeFormBtn.className='btn'; modeJsonBtn.className='btn secondary';
    schedulePreview();
    showStep(2);
  });

  backTo1Btn.addEventListener('click', () => showStep(1));

  toStep3Btn.addEventListener('click', () => {
    const html = selectedTemplate.buildHtml(currentConfig);
    setPreview(html);
    showStep(3);
  });

  backTo2Btn.addEventListener('click', () => showStep(2));

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(lastHtml);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy HTML'), 1200);
    } catch (e) {
      alert('Copy failed: ' + e.message);
    }
  });

  downloadHtmlBtn.addEventListener('click', () => {
    const name = (currentConfig.projectName || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    download(`${name}-update.html`, 'text/html;charset=utf-8', lastHtml);
  });

  downloadEmlBtn.addEventListener('click', () => {
    const to = toInput.value.trim();
    const subject = subjectInput.value.trim();
    const eml = buildEml(to, subject, lastHtml);
    const name = subject ? subject.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'project-update';
    download(`${name}.eml`, 'message/rfc822', eml);
  });

  openOutlookWebBtn.addEventListener('click', () => {
    const to = toInput.value.trim();
    const subject = subjectInput.value.trim();
    openOutlookWeb(to, subject, lastHtml);
  });

  // Mode switching
  modeFormBtn.addEventListener('click', ()=>{ formPane.style.display=''; jsonPane.style.display='none'; modeFormBtn.className='btn'; modeJsonBtn.className='btn secondary'; });
  modeJsonBtn.addEventListener('click', ()=>{ formPane.style.display='none'; jsonPane.style.display=''; modeFormBtn.className='btn secondary'; modeJsonBtn.className='btn'; });
  syncFromJsonBtn.addEventListener('click', ()=>{ syncConfigFromJson(); });

  // Project wire-up
  projNewBtn.addEventListener('click', ()=>{ if (confirm('Start a new project? Unsaved changes will be lost.')) { currentProjectId=null; currentConfig = JSON.parse(selectedTemplate.sampleConfig); projTitle.value = currentConfig.projectName || ''; syncJsonFromConfig(); renderFormFromConfig(currentConfig, selectedTemplate.id); schedulePreview(); }});
  projSaveBtn.addEventListener('click', ()=>{ saveCurrentProject(false); });
  projSaveAsBtn.addEventListener('click', ()=>{ saveCurrentProject(true); });
  projDupBtn.addEventListener('click', ()=>{ saveCurrentProject(true); });
  projDelBtn.addEventListener('click', ()=>{ if (!currentProjectId) return; if (confirm('Delete this project?')) { delete projectIndex[currentProjectId]; currentProjectId=null; saveProjects(); refreshProjSelect(); }});
  projSelect.addEventListener('change', ()=>{ const id = projSelect.value; if (id) loadProject(id); });
  projExportBtn.addEventListener('click', ()=>{ const payload = { id: currentProjectId || genId(), name: projTitle.value || 'Untitled', templateId: selectedTemplate.id, config: currentConfig }; download(`${(payload.name||'project').toLowerCase().replace(/[^a-z0-9]+/g,'-')}.json`, 'application/json', JSON.stringify(payload, null, 2)); });
  projImportBtn.addEventListener('click', ()=> projImportFile.click());
  projImportFile.addEventListener('change', ()=>{ const f = projImportFile.files[0]; if (!f) return; const r = new FileReader(); r.onload = ()=>{ try { const data = JSON.parse(r.result); if (data && data.templateId && data.config) { const tpl = TEMPLATES.find(x=>x.id===data.templateId) || selectedTemplate; selectTemplate(tpl); currentConfig = data.config; projTitle.value = data.name || currentConfig.projectName || ''; currentProjectId=null; syncJsonFromConfig(); renderFormFromConfig(currentConfig, tpl.id); schedulePreview(); } else { // raw config
          currentConfig = data; projTitle.value = currentConfig.projectName || ''; currentProjectId=null; syncJsonFromConfig(); renderFormFromConfig(currentConfig, selectedTemplate.id); schedulePreview(); }
        } catch(e){ alert('Import failed: ' + e.message); } }; r.readAsText(f); projImportFile.value = ''; });

  // Init
  renderTemplates();
})();
