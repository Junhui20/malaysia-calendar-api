---
title: Claude Code Setup
description: Add MyCal as an MCP server in Claude Code (CLI).
---

Claude Code supports MCP servers via the same config format. You can add them at user scope (all projects) or project scope (per-repo via `.mcp.json`).

## User scope (recommended for personal use)

Run:

```bash
claude mcp add malaysia-calendar --scope user -- npx -y @catlabtech/mycal-mcp-server
```

This writes to your global `~/.claude.json` and makes the tools available in every project.

## Project scope

Create or edit `.mcp.json` in your repo root:

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

Commit it — teammates using Claude Code will get the same tools.

## Verify

In a Claude Code session, run:

```
/mcp
```

You should see `malaysia-calendar` listed with "connected" status. The tools menu will show all 12 MyCal tools alongside any others you've added.

## Usage

Tool invocations happen automatically. Just ask in natural language:

- "When's Hari Raya Haji this year?"
- "How many business days between now and end of March in KL?"
- "What are the long weekends for Selangor in 2026?"

## Notes

- Claude Code's MCP integration re-uses the same protocol Claude Desktop uses, so the setup is symmetric.
- Use `claude mcp list` to see all configured servers.
- Use `claude mcp remove malaysia-calendar` to uninstall.
