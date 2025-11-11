param(
  [string]$Config = "email-config.json",
  [string]$OutFile = "dist\project-update-email.html"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Escape-HTML([string]$s) {
  if ([string]::IsNullOrEmpty($s)) { return '' }
  $t = $s -replace '&','&amp;'
  $t = $t -replace '<','&lt;'
  $t = $t -replace '>','&gt;'
  $t = $t -replace '"','&quot;'
  $t = $t -replace "'",'&#39;'
  return $t
}

function Get-Prop($obj, [string]$name, $default) {
  if ($null -eq $obj) { return $default }
  if ($obj.PSObject.Properties.Name -contains $name) {
    $v = $obj.$name
    if ($null -ne $v -and "" -ne [string]$v) { return $v }
  }
  return $default
}

if (-not (Test-Path -Path $Config)) {
  Write-Error "Config file not found: $Config"
}

$raw = Get-Content -Raw -Path $Config
$cfg = $raw | ConvertFrom-Json -Depth 20

# Defaults
$projectName = [string](Get-Prop $cfg 'projectName' 'Project')
$projectIconUrl = [string](Get-Prop $cfg 'projectIconUrl' '')
$updateDate = [string](Get-Prop $cfg 'updateDate' (Get-Date -Format 'yyyy-MM-dd'))
$updateSummary = [string](Get-Prop $cfg 'updateSummary' '')
$progressPercent = [int](Get-Prop $cfg 'progressPercent' 0)
if ($progressPercent -lt 0) { $progressPercent = 0 }
if ($progressPercent -gt 100) { $progressPercent = 100 }
$sprintNumber = [string](Get-Prop $cfg 'sprintNumber' '')
$etaDate = [string](Get-Prop $cfg 'etaDate' '')
$preheader = [string](Get-Prop $cfg 'preheader' "Weekly update for $projectName — progress, milestones, and next steps.")

# Chips styling (configurable)
$statusLabel = [string](Get-Prop $cfg 'statusLabel' 'On Track')
$statusChip = Get-Prop $cfg 'statusChip' $null
$chipText = if ($statusChip -and $statusChip.PSObject.Properties.Name -contains 'textColor') { [string]$statusChip.textColor } else { '#B0F3FF' }
$chipBg = if ($statusChip -and $statusChip.PSObject.Properties.Name -contains 'bgColor') { [string]$statusChip.bgColor } else { '#0D2A2D' }
$chipBorder = if ($statusChip -and $statusChip.PSObject.Properties.Name -contains 'borderColor') { [string]$statusChip.borderColor } else { '#004F57' }

# Lists
$whatsNew = @()
if ($cfg.whatsNew) { $whatsNew = @($cfg.whatsNew) }
$risks = @()
if ($cfg.risks) { $risks = @($cfg.risks) }

# Workstreams (multiple progress bars)
$workstreams = @()
if ($cfg.PSObject.Properties.Name -contains 'workstreams' -and $cfg.workstreams) { $workstreams = @($cfg.workstreams) }

# Milestones
$milestones = @()
if ($cfg.PSObject.Properties.Name -contains 'milestones' -and $cfg.milestones) { $milestones = @($cfg.milestones) }
$milestoneTrackPercent = [int](Get-Prop $cfg 'milestoneTrackPercent' 0)
if ($milestoneTrackPercent -lt 0) { $milestoneTrackPercent = 0 }
if ($milestoneTrackPercent -gt 100) { $milestoneTrackPercent = 100 }
$currentMilestoneIndex = $null
if ($cfg.PSObject.Properties.Name -contains 'currentMilestoneIndex') { $currentMilestoneIndex = [int]$cfg.currentMilestoneIndex }

# Contributors
$contributors = @()
if ($cfg.PSObject.Properties.Name -contains 'contributors' -and $cfg.contributors) { $contributors = @($cfg.contributors) }

# CTA
$ctaObj = Get-Prop $cfg 'cta' $null
$ctaLabel = if ($ctaObj -and $ctaObj.PSObject.Properties.Name -contains 'label') { [string]$ctaObj.label } else { 'Open Dashboard' }
$ctaUrl = if ($ctaObj -and $ctaObj.PSObject.Properties.Name -contains 'url') { [string]$ctaObj.url } else { '#' }

function Build-ListItems($items) {
  if (-not $items -or $items.Count -eq 0) { return '<li>—</li>' }
  $buf = ''
  foreach ($it in $items) {
    $buf += "<li>$(Escape-HTML $it)</li>"
  }
  return $buf
}

function Build-Workstreams($ws) {
  if (-not $ws -or $ws.Count -eq 0) { return '' }
  $buf = ''
  foreach ($w in $ws) {
    $label = Escape-HTML ([string]$w.label)
    $pct = [int]($w.percent ?? 0)
    if ($pct -lt 0) { $pct = 0 }
    if ($pct -gt 100) { $pct = 100 }
    $buf += @"
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px 0;">
                      <tr>
                        <td valign="middle" style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; color:#CDD3D8;">
                          $label
                        </td>
                        <td align="right" valign="middle" style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; color:#9AA0A6; white-space:nowrap;">
                          $pct%
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:6px;">
                          <div style="background:#2A2A2A; border-radius:9999px; overflow:hidden; height:8px;">
                            <div class="bar-fill shimmer" style="background:#00BCD4; width:${pct}%; height:8px;"></div>
                          </div>
                        </td>
                      </tr>
                    </table>
"@
  }
  return $buf
}

function Build-Milestones($ms, $currentIdx) {
  if (-not $ms -or $ms.Count -eq 0) { return '' }
  $width = [Math]::Round(100.0 / [double]$ms.Count, 2)
  $buf = ''
  $i = 0
  foreach ($m in $ms) {
    $label = Escape-HTML ([string]$m.label)
    $date = Escape-HTML ([string]$m.date)
    $isCurrent = $false
    if ($m.PSObject.Properties.Name -contains 'current' -and $m.current) { $isCurrent = $true }
    if ($null -ne $currentIdx -and $currentIdx -eq $i) { $isCurrent = $true }
    $pulseClass = if ($isCurrent) { ' pulse' } else { '' }
    $buf += @"
                        <td align="center" style="width:${width}%;">
                          <div style="height:10px;">
                            <span class="milestone-dot$pulseClass" style="display:inline-block; width:10px; height:10px; border-radius:9999px; background:#2A2A2A; border:1px solid #3A3A3A;"></span>
                          </div>
                          <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; color:#CDD3D8; margin-top:6px;">$label</div>
                          <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:#9AA0A6;">$date</div>
                        </td>
"@
    $i++
  }
  return $buf
}

function Build-Contributors($people) {
  if (-not $people -or $people.Count -eq 0) { return '' }
  $buf = ''
  $last = $people.Count - 1
  for ($i = 0; $i -lt $people.Count; $i++) {
    $p = $people[$i]
    $name = Escape-HTML ([string]$p.name)
    $img = Escape-HTML ([string]$p.imageUrl)
    $bottomPad = if ($i -lt $last) { '8px' } else { '0' }
    $buf += @"
                <tr>
                  <td width="40" valign="middle" style="padding:0 8px ${bottomPad} 0;">
                    <img src="$img" width="32" height="32" alt="$name" style="display:block; border-radius:9999px; background:#2A2A2A;">
                  </td>
                  <td valign="middle" style="padding:0 0 ${bottomPad} 0;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; line-height:18px; color:#CDD3D8;">
                      $name
                    </div>
                  </td>
                </tr>
"@
  }
  return $buf
}

$whatsNewHtml = Build-ListItems $whatsNew
$risksHtml = Build-ListItems $risks
$workstreamsHtml = Build-Workstreams $workstreams
$milestonesHtml = Build-Milestones $milestones $currentMilestoneIndex
$contributorsHtml = Build-Contributors $contributors

$safeProject = Escape-HTML $projectName
$safeSummary = Escape-HTML $updateSummary -replace "`r?`n", '<br>'
$safePreheader = Escape-HTML $preheader
$safeIcon = Escape-HTML $projectIconUrl
$safeSprint = Escape-HTML $sprintNumber
$safeEta = Escape-HTML $etaDate
$safeStatusLabel = Escape-HTML $statusLabel

# Footer content (configurable): prefer footerHtml, else footerText, else default
$footerHtmlTpl = Get-Prop $cfg 'footerHtml' $null
$footerTextTpl = [string](Get-Prop $cfg 'footerText' '')
if ($footerHtmlTpl) {
  $footerBlockHtml = ($footerHtmlTpl -replace '\{\{PROJECT_NAME\}\}', $safeProject)
} elseif (-not [string]::IsNullOrWhiteSpace($footerTextTpl)) {
  $footerTextResolved = $footerTextTpl -replace '\{\{PROJECT_NAME\}\}', $projectName
  $safeFooterText = Escape-HTML $footerTextResolved
  $footerBlockHtml = "<div style=\"font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:18px; color:#7F8B95;\">$safeFooterText</div>"
} else {
  $footerBlockHtml = "<div style=\"font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:18px; color:#7F8B95;\">You are receiving this update about <span style=\"color:#C9D1D9;\">$safeProject</span>. To change your notification preferences, visit your dashboard.</div>"
}

$html = @"
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>$safeProject — Project Update</title>
  <style>
    @media (max-width: 600px) {
      .container { width: 100% !important; }
      .p-24 { padding: 16px !important; }
      .stack { display: block !important; width: 100% !important; }
      .align-right { text-align: left !important; }
    }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .shimmer { background-image: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%); background-size: 200% 100%; background-repeat: no-repeat; animation: shimmer 2.75s linear infinite; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(0,188,212,0.00); transform: scale(1);} 50% { box-shadow: 0 0 0 6px rgba(0,188,212,0.18); transform: scale(1.06);} 100% { box-shadow: 0 0 0 0 rgba(0,188,212,0.00); transform: scale(1);} }
    .pulse { animation: pulse 3s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .shimmer, .pulse { animation: none !important; } }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
</head>
<body style="margin:0; padding:0; background:#0B0C0E; color:#E6E6E6; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    $safePreheader
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0B0C0E;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:600px; background:#121212; border-radius:16px; box-shadow:0 2px 6px rgba(0,0,0,0.35);">
          <tr>
            <td class="p-24" style="padding:24px 24px 12px 24px; border-top-left-radius:16px; border-top-right-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="52" valign="middle" style="width:52px;">
                    <img src="$safeIcon" width="48" height="48" alt="$safeProject icon" style="display:block; border-radius:10px; outline:none; border:none; text-decoration:none; background:#1E1E1E;">
                  </td>
                  <td valign="middle" style="padding-left:12px;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:16px; color:#B0B3B8; letter-spacing:.3px;">Project Update</div>
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:24px; line-height:28px; font-weight:700; color:#E6E6E6;">$safeProject</div>
                  </td>
                  <td valign="middle" align="right" class="align-right">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:16px; color:#9AA0A6;">$updateDate</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding:0 24px;"><div style="height:1px; background:#222; line-height:1px;">&nbsp;</div></td></tr>
          <tr>
            <td class="p-24" style="padding:16px 24px 0 24px;">
              <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; color:#DDE3E8;">$safeSummary</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 0 24px;">
              <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:18px; color:#9AA0A6;">Overall Progress: <span style="color:#E6E6E6; font-weight:600;">$progressPercent%</span></div>
              <div style="background:#2A2A2A; border-radius:9999px; overflow:hidden; height:10px; margin-top:8px;">
                <div class="bar-fill shimmer" style="background:#00BCD4; width:${progressPercent}%; height:10px;"></div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 0 24px;">
              <span style="display:inline-block; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:$chipText; border:1px solid $chipBorder; background:$chipBg; padding:4px 8px; border-radius:9999px; margin-right:6px;">$safeStatusLabel</span>
              <span style="display:inline-block; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:#B0B3B8; border:1px solid #2A2A2A; background:#1A1A1A; padding:4px 8px; border-radius:9999px; margin-right:6px;">Sprint $safeSprint</span>
              <span style="display:inline-block; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:11px; color:#FFD88A; border:1px solid #4A3A05; background:#2A2104; padding:4px 8px; border-radius:9999px;">ETA: $safeEta</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1A1A1A; border-radius:12px;">
                <tr>
                  <td style="padding:16px;">
                    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:#E6E6E6; margin-bottom:8px;">What’s New</div>
                    <ul style="padding-left:18px; margin:0; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; line-height:20px; color:#CDD3D8;">$whatsNewHtml</ul>
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
                    $workstreamsHtml
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
                      <tr>
                        $milestonesHtml
                      </tr>
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
                    <ul style="padding-left:18px; margin:0; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:13px; line-height:20px; color:#E0B2B2;">$risksHtml</ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:20px 24px 24px 24px;">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="$ctaUrl" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="12%" stroke="f" fillcolor="#00BCD4"><w:anchorlock/><center style="color:#000000; font-family:Segoe UI, Arial, sans-serif; font-size:14px; font-weight:700;">$ctaLabel</center></v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-- -->
              <a href="$ctaUrl" style="background:#00BCD4; color:#000; text-decoration:none; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:14px; font-weight:700; line-height:44px; display:inline-block; min-width:220px; text-align:center; border-radius:6px;">$ctaLabel</a>
              <!--<![endif]-->
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 8px 24px;">
              <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:16px; color:#9AA0A6; margin-bottom:8px;">Contributors</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                $contributorsHtml
              </table>
            </td>
          </tr>
          <tr><td style="padding:0 24px 20px 24px;"><div style="height:1px; background:#222; line-height:1px;">&nbsp;</div></td></tr>
          <tr>
            <td style="padding:8px 24px 24px 24px;">
              $footerBlockHtml
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <div style="display:none; white-space:nowrap; font:15px courier; line-height:0;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
</body>
</html>
"@

$outDir = Split-Path -Parent $OutFile
if ([string]::IsNullOrWhiteSpace($outDir)) { $outDir = '.' }
if (-not (Test-Path -Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }

Set-Content -Path $OutFile -Value $html -Encoding UTF8
Write-Host "Built: $OutFile"
