---
title: Introduction
description: What MyCal is, who it's for, and how to pick the right integration.
---

MyCal is Malaysia's most complete calendar API. It gives you, from one endpoint, the information you'd otherwise have to scrape from five different `.gov.my` websites:

- Federal public holidays
- State-specific public holidays (all 16 states + 3 Federal Territories)
- Replacement holidays (cuti ganti) when a holiday lands on a weekend
- Ad-hoc cuti peristiwa
- JAKIM Islamic (Hijri) dates
- KPM school calendar (terms, cuti penggal, cuti perayaan)
- MPM exam schedules (SPM, STPM, MUET, PT3)

## Who it's for

**Developers** who need correct Malaysian calendar data without maintaining it themselves:

- HR and payroll systems calculating leave balances
- Logistics and e-commerce computing SLA and delivery dates
- Fintech accruing interest on business days
- Schedulers, meeting planners, travel apps
- AI agents answering holiday questions via MCP

## How it's different

| | MyCal | Generic "holiday API" |
|---|---|---|
| State-level resolution | ✓ all 16 states | ✗ federal only |
| Correct weekend per state | ✓ Kumpulan A (Fri–Sat) handled | ✗ assumes Sat–Sun |
| Cuti ganti | ✓ automatic | ✗ missing |
| School + exam calendar | ✓ | ✗ |
| Gazette references | ✓ every record | ✗ |
| iCal subscription | ✓ per-state feed | Usually `.ics` export only |
| MCP server | ✓ 12 tools | ✗ |

## Pick your integration

1. **[REST API](/docs/rest-api/overview/)** — language-agnostic, one HTTP call. Start here if you're curious or using a language without an SDK.
2. **[TypeScript SDK](/docs/sdk/installation/)** — for JS/TS projects. Typed responses, Result-pattern errors.
3. **[MCP Server](/docs/mcp-server/what-is-mcp/)** — for AI assistants (Claude Desktop, Claude Code, etc.).
4. **[iCal feeds](/docs/ical/google-calendar/)** — for end users who just want holidays in their calendar app.

Continue to [Quick Start →](/docs/getting-started/quickstart/)
