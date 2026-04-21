# @catlabtech/mycal-mcp-server

MCP (Model Context Protocol) server exposing the **Malaysia Calendar API** as 12 ready-to-use tools for Claude, ChatGPT, and other AI agents.

> Data sourced from the official Malaysian government gazette (JPM BKPP), JAKIM, KPM, and MPM.

## Why

LLMs are notoriously bad at Malaysia-specific calendar questions:

- They get Islamic holidays wrong (incorrect Hijri → Gregorian mapping)
- They don't know about cuti peristiwa announced after their training cutoff
- They confuse state-specific vs federal holidays
- They default to Sat–Sun weekends — wrong for Kedah, Kelantan, Terengganu (Fri–Sat)

Drop this MCP server into your AI client and all those questions get answered from the live gazette-backed API instead of hallucinated.

## Setup with Claude Desktop

Edit your Claude Desktop config:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Add (or merge into the existing `mcpServers` block):

```json
{
  "mcpServers": {
    "malaysia-calendar": {
      "command": "npx",
      "args": ["-y", "@catlabtech/mycal-mcp-server"]
    }
  }
}
```

Completely quit Claude Desktop and reopen. Test with:

> *"Is March 21, 2026 a public holiday in Selangor?"*
> *"What are the long weekends for KL in 2026?"*

## Setup with Claude Code

```bash
claude mcp add malaysia-calendar --scope user -- npx -y @catlabtech/mycal-mcp-server
```

Or commit to your repo's `.mcp.json` for team-wide setup. Verify with `/mcp` in a Claude Code session.

## Available tools (12)

| Tool | What it does |
|------|-------------|
| `get_malaysia_holidays` | List holidays (filter by year, state, type, status, month) |
| `check_malaysia_holiday` | Is this date a holiday, weekend, working day, or school day? |
| `next_malaysia_holiday` | Next N upcoming holidays |
| `malaysia_business_days` | Count working days in range, or add N business days to a date |
| `malaysia_long_weekends` | All 3+ day non-working stretches in the year |
| `list_malaysia_states` | 16 states + 3 FTs with weekend config |
| `resolve_malaysia_state` | Alias (`kl`, `jb`, `n9`) → canonical code |
| `malaysia_holiday_changes` | Recent additions / changes — useful for cuti peristiwa tracking |
| `malaysia_school_terms` | KPM school term dates + school-day counts |
| `malaysia_school_holidays` | Cuti penggal, pertengahan, akhir, perayaan |
| `malaysia_exams` | SPM, STPM, MUET, PT3 schedules |
| `malaysia_is_school_day` | Is this date a school day for this state/group? |

## How it works

```
Your AI client                MyCal MCP server            Calendar API
(Claude, etc.)      ──────▶   (local npx process)  ────▶  (Cloudflare Workers)
            stdio JSON-RPC                           HTTPS
```

The server runs locally via `npx`. It speaks MCP over stdio on one side and HTTPS to the API on the other. Nothing to host yourself. No API key needed.

## Troubleshooting

**"Command not found: npx"** — install Node 18+ from [nodejs.org](https://nodejs.org/).

**"Server disconnected" / MCP not responding** — check `node -v` is ≥ 18. Older Node versions lack ESM/fetch features the server needs.

**First call is slow** — `npx` downloads the package on first use. Subsequent calls are fast.

**Corporate network blocked** — the server needs outbound HTTPS to `mycal-api.huijun00100101.workers.dev`.

## Documentation

- **Full guide:** [https://mycal-web.pages.dev/docs/mcp-server/what-is-mcp](https://mycal-web.pages.dev/docs/mcp-server/what-is-mcp)
- **Tool reference:** [https://mycal-web.pages.dev/docs/mcp-server/tools](https://mycal-web.pages.dev/docs/mcp-server/tools)

## Related packages

- **[`@catlabtech/mycal-sdk`](https://www.npmjs.com/package/@catlabtech/mycal-sdk)** — TypeScript client SDK for direct REST usage
- **[`@catlabtech/mycal-core`](https://www.npmjs.com/package/@catlabtech/mycal-core)** — shared types and schemas

## License

MIT — © catlab.tech

Issues and contributions: [github.com/Junhui20/malaysia-calendar-api](https://github.com/Junhui20/malaysia-calendar-api)
