---
title: MyCal Documentation
description: Developer documentation for the Malaysia Calendar API — public holidays, school calendar, exam schedules, and MCP server.
template: splash
hero:
  tagline: Malaysia's most complete calendar API. Public holidays, school calendar, exam schedules, business day calculator.
  actions:
    - text: Quick Start
      link: /docs/getting-started/quickstart/
      icon: right-arrow
      variant: primary
    - text: Try the demo
      link: /demo/
      icon: external
    - text: GitHub
      link: https://github.com/Junhui20/malaysia-calendar-api
      icon: external
---

## Three ways to use it

- **[REST API](/docs/getting-started/quickstart/)** — plain HTTP, any language
- **[TypeScript SDK](/docs/sdk/installation/)** — `npm i @mycal/sdk` with fully typed responses
- **[MCP Server](/docs/mcp-server/what-is-mcp/)** — 12 tools for Claude, ChatGPT, and other AI agents
- **[iCal Subscription](/docs/ical/google-calendar/)** — drop into Google, Apple, or Outlook calendar

## Why MyCal

- **49 public holidays** for 2026 from the official JPM gazette
- **16 states + 3 Federal Territories** with correct weekend config (Kedah/Kelantan/Terengganu use Fri–Sat)
- **Cuti ganti** automatically calculated when holidays fall on weekends
- **School calendar** including KPM terms, cuti penggal, cuti perayaan
- **Exam schedules** — SPM, STPM, MUET, PT3
- **Trilingual** — Bahasa Melayu, English, 中文

## Data provenance

Every holiday record includes a gazette reference (e.g. `P.U.(B) 305/2025`) so you can trace it back to the official Warta Kerajaan. Data is sourced exclusively from:

- **JPM BKPP** — Federal and state gazettes
- **JAKIM** — Takwim Hijri-Miladi
- **KPM** — Kalendar Akademik (school calendar)
- **MPM** — STPM and MUET schedules
- **State government portals** — state-specific holidays
