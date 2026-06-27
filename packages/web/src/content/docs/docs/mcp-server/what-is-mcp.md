---
title: What is MCP?
description: A quick primer on Model Context Protocol and why MyCal ships an MCP server.
---

**Model Context Protocol (MCP)** is an open standard for connecting AI assistants (Claude Desktop, Claude Code, ChatGPT with MCP support, and many other clients) to external tools and data sources.

When you add MyCal's MCP server to your AI assistant, the assistant gains 13 new capabilities — ask it "Is next Monday a public holiday in KL?" and it calls the right tool instead of hallucinating.

## Why this matters

LLMs are notoriously bad at calendar arithmetic and Malaysia-specific knowledge:

- They get Islamic holidays wrong (wrong Gregorian date mapping)
- They don't know about cuti peristiwa announced after their training cutoff
- They mix up state-specific vs federal holidays
- They default to Sat–Sun weekends even for Kedah / Kelantan / Terengganu

With the MCP server in place, the assistant queries MyCal's bundled calendar dataset directly.

## Architecture

```
Your AI client                     MyCal MCP server
(Claude Desktop, etc.)  ──────▶    (local npx process,
              stdio JSON-RPC        bundled MY calendar data)
```

The MCP server runs locally via `npx @catlabtech/mycal-mcp-server`. It ships with the full Malaysia calendar dataset bundled in, so there's nothing to host and no network call to make.

## What it can do

13 tools covering every common question:

- `get_malaysia_holidays` — list holidays
- `check_malaysia_holiday` — is this date a holiday?
- `next_malaysia_holiday` — what's next?
- `malaysia_business_days` — count working days
- `malaysia_long_weekends` — when are the 3+ day stretches?
- `malaysia_leave_optimizer` — best leave days to take for the longest break
- `list_malaysia_states` — state reference
- `resolve_malaysia_state` — alias to canonical
- `malaysia_holiday_changes` — recent data updates
- `malaysia_school_terms` — KPM school terms
- `malaysia_school_holidays` — cuti penggal / perayaan
- `malaysia_exams` — SPM, STPM, MUET, PT3
- `malaysia_is_school_day` — school day check

Full reference: [Available Tools](/docs/mcp-server/tools/).

## Set it up

- [Claude Desktop](/docs/mcp-server/claude-desktop/)
- [Claude Code](/docs/mcp-server/claude-code/)
- Other MCP clients: follow your client's MCP server setup doc, using `npx @catlabtech/mycal-mcp-server` as the command.
