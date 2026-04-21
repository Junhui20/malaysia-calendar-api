---
title: Claude Desktop Setup
description: Add MyCal to Claude Desktop in 60 seconds.
---

## 1. Locate your config file

- **macOS** — `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows** — `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux** — `~/.config/Claude/claude_desktop_config.json`

If the file doesn't exist, create it.

## 2. Add the MyCal server

Add (or merge into) the `mcpServers` block:

```json
{
  "mcpServers": {
    "malaysia-calendar": {
      "command": "npx",
      "args": ["-y", "@mycal/mcp-server"]
    }
  }
}
```

If you already have other MCP servers, add `malaysia-calendar` alongside them inside the existing `mcpServers` object — don't nest.

## 3. Restart Claude Desktop

Completely quit and reopen (not just close the window). Look for the MCP icon or the "Tools" indicator in the conversation UI. You should see "12 tools from malaysia-calendar".

## 4. Test it

Ask Claude: *"Is March 21, 2026 a public holiday in Selangor?"*

It should call `check_malaysia_holiday` and respond with accurate state-aware data.

## Troubleshooting

**"Server disconnected" error** — your Node.js might be outdated. MCP servers need Node 18+. Check with `node -v`.

**"Command not found: npx"** — install Node.js from [nodejs.org](https://nodejs.org). On Windows, make sure "Add to PATH" was checked during install, then restart your terminal.

**The first call is slow** — npx downloads the package on first use. Subsequent calls are instant.

**Network blocked** — the MCP server needs outbound HTTPS to `mycal-api.huijun00100101.workers.dev`. Corporate proxies may block it.

## Next

See [Available Tools](/docs/mcp-server/tools/) for every tool's parameters and example prompts.
