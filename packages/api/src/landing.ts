export const landingHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MyCal — Malaysia Calendar API</title>
  <meta name="description" content="Malaysia's most complete calendar API. Public holidays, school calendar, exam schedules, business day calculator. Free, open-source, real-time.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: oklch(0.98 0.005 85);
      --bg-code: oklch(0.16 0.02 260);
      --text: oklch(0.22 0.02 260);
      --text-secondary: oklch(0.45 0.02 260);
      --accent: oklch(0.55 0.18 145);
      --accent-soft: oklch(0.92 0.05 145);
      --border: oklch(0.88 0.01 85);
      --tag-bg: oklch(0.94 0.02 85);
    }

    body {
      font-family: 'Space Grotesk', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 720px;
      margin: 0 auto;
      padding: 0 clamp(1.25rem, 4vw, 2rem);
    }

    /* ─── Hero ─── */
    .hero {
      padding: clamp(3rem, 10vw, 6rem) 0 clamp(2rem, 6vw, 3.5rem);
    }

    .hero-label {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      background: var(--accent-soft);
      padding: 0.3rem 0.75rem;
      border-radius: 2px;
      margin-bottom: 1.25rem;
    }

    h1 {
      font-size: clamp(2.2rem, 6vw, 3.4rem);
      font-weight: 700;
      line-height: 1.1;
      letter-spacing: -0.03em;
      margin-bottom: 1rem;
    }

    h1 span {
      color: var(--accent);
    }

    .hero p {
      font-size: clamp(1rem, 2.5vw, 1.15rem);
      color: var(--text-secondary);
      max-width: 540px;
      line-height: 1.65;
    }

    /* ─── Actions ─── */
    .actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 2rem;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      padding: 0.65rem 1.25rem;
      border-radius: 3px;
      text-decoration: none;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .btn:hover { transform: translateY(-1px); }

    .btn-primary {
      background: var(--text);
      color: var(--bg);
    }

    .btn-secondary {
      background: transparent;
      color: var(--text);
      border: 1.5px solid var(--border);
    }

    /* ─── Try It ─── */
    .try-section {
      padding: 2.5rem 0;
    }

    .try-section h2 {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .endpoint-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .endpoint {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 1rem;
      background: var(--tag-bg);
      border-radius: 3px;
      text-decoration: none;
      color: var(--text);
      font-size: 0.85rem;
      transition: background 0.12s ease;
    }

    .endpoint:hover {
      background: var(--accent-soft);
    }

    .endpoint-method {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--accent);
      min-width: 2.5rem;
    }

    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      flex: 1;
    }

    .endpoint-desc {
      color: var(--text-secondary);
      font-size: 0.8rem;
      display: none;
    }

    @media (min-width: 640px) {
      .endpoint-desc { display: block; }
    }

    /* ─── Code Block ─── */
    .code-section {
      padding: 2.5rem 0;
    }

    .code-section h2 {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    pre {
      background: var(--bg-code);
      color: oklch(0.9 0.01 260);
      padding: 1.25rem 1.5rem;
      border-radius: 4px;
      overflow-x: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      line-height: 1.7;
    }

    pre .comment { color: oklch(0.5 0.02 260); }
    pre .string { color: oklch(0.75 0.15 145); }
    pre .key { color: oklch(0.75 0.12 45); }
    pre .bool { color: oklch(0.7 0.15 300); }

    /* ─── Features ─── */
    .features {
      padding: 2.5rem 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.75rem;
    }

    .feature h3 {
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.35rem;
    }

    .feature p {
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.55;
    }

    /* ─── Footer ─── */
    .divider {
      height: 1px;
      background: var(--border);
      margin: 1rem 0;
    }

    footer {
      padding: 2rem 0 3rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    footer p {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    footer a {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.8rem;
    }

    footer a:hover { color: var(--text); }

    .footer-links {
      display: flex;
      gap: 1.25rem;
    }
  </style>
</head>
<body>
  <div class="container">

    <section class="hero">
      <div class="hero-label">Open Source &middot; Free &middot; Real-time</div>
      <h1>Malaysia<br><span>Calendar API</span></h1>
      <p>Public holidays, school calendar, exam schedules, and business day calculator for all 16 states. Powered by official government gazette data.</p>
      <div class="actions">
        <a href="https://mycal-web.pages.dev" class="btn btn-primary">Full site & demos ↗</a>
        <a href="https://mycal-web.pages.dev/docs" class="btn btn-secondary">Docs</a>
        <a href="https://github.com/Junhui20/malaysia-calendar-api" class="btn btn-secondary">GitHub</a>
      </div>
    </section>

    <section class="try-section">
      <h2>Try it now</h2>
      <div class="endpoint-list">
        <a href="/v1/holidays/check?date=2026-03-21&state=KL" class="endpoint">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-path">/v1/holidays/check?date=2026-03-21&state=KL</span>
          <span class="endpoint-desc">Is this a holiday?</span>
        </a>
        <a href="/v1/holidays?year=2026&state=selangor" class="endpoint">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-path">/v1/holidays?year=2026&state=selangor</span>
          <span class="endpoint-desc">List holidays</span>
        </a>
        <a href="/v1/business-days?start=2026-03-01&end=2026-03-31&state=selangor" class="endpoint">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-path">/v1/business-days?start=...&end=...&state=selangor</span>
          <span class="endpoint-desc">Count working days</span>
        </a>
        <a href="/v1/school/is-school-day?date=2026-03-21&state=selangor" class="endpoint">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-path">/v1/school/is-school-day?date=2026-03-21&state=selangor</span>
          <span class="endpoint-desc">School day check</span>
        </a>
        <a href="/v1/states/resolve?q=penang" class="endpoint">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-path">/v1/states/resolve?q=penang</span>
          <span class="endpoint-desc">Resolve state alias</span>
        </a>
      </div>
    </section>

    <section class="code-section">
      <h2>Response example</h2>
      <pre><span class="comment">// GET /v1/holidays/check?date=2026-03-21&state=selangor</span>
{
  <span class="key">"date"</span>: <span class="string">"2026-03-21"</span>,
  <span class="key">"dayOfWeek"</span>: <span class="string">"Saturday"</span>,
  <span class="key">"isHoliday"</span>: <span class="bool">true</span>,
  <span class="key">"isWeekend"</span>: <span class="bool">true</span>,
  <span class="key">"isWorkingDay"</span>: <span class="bool">false</span>,
  <span class="key">"isSchoolDay"</span>: <span class="bool">false</span>,
  <span class="key">"holidays"</span>: [{
    <span class="key">"name"</span>: { <span class="key">"en"</span>: <span class="string">"Eid al-Fitr"</span>, <span class="key">"ms"</span>: <span class="string">"Hari Raya Aidilfitri"</span> }
  }]
}</pre>
    </section>

    <section class="features">
      <div class="feature">
        <h3>16 States</h3>
        <p>All states + 3 Federal Territories. Different weekends for Kedah, Kelantan, Terengganu.</p>
      </div>
      <div class="feature">
        <h3>Smart Aliases</h3>
        <p>Use KL, JB, Penang, n9, kk — auto-resolves to canonical state code.</p>
      </div>
      <div class="feature">
        <h3>Cuti Ganti</h3>
        <p>Replacement holidays auto-calculated when public holidays fall on weekends.</p>
      </div>
      <div class="feature">
        <h3>School Calendar</h3>
        <p>Terms, holidays, KPM cuti perayaan. Group A & B aware.</p>
      </div>
      <div class="feature">
        <h3>Exam Schedule</h3>
        <p>SPM, STPM, MUET, PT3 dates from KPM and MPM.</p>
      </div>
      <div class="feature">
        <h3>iCal Feed</h3>
        <p>Subscribe in Google Calendar or Apple Calendar. Auto-syncs.</p>
      </div>
      <div class="feature">
        <h3>MCP Server</h3>
        <p>12 tools for AI agents. Claude can answer holiday questions accurately.</p>
      </div>
      <div class="feature">
        <h3>Business Days</h3>
        <p>Count working days, add N business days. State-aware weekends + holidays.</p>
      </div>
      <div class="feature">
        <h3>Trilingual</h3>
        <p>Malay, English, Chinese names for every holiday.</p>
      </div>
    </section>

    <div class="divider"></div>

    <footer>
      <p>MyCal &mdash; Open source Malaysia Calendar API</p>
      <div class="footer-links">
        <a href="https://mycal-web.pages.dev/docs">Docs</a>
        <a href="https://mycal-web.pages.dev/demo">Demo</a>
        <a href="/v1/feed/ical/selangor">iCal</a>
        <a href="https://github.com/Junhui20/malaysia-calendar-api">GitHub</a>
      </div>
    </footer>

  </div>
</body>
</html>`;
