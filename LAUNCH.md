# mycal — Launch & Growth Pack

Ready-to-post copy for launching **mycal**, the free, open-source Malaysia Calendar API.

**Canonical links (use these everywhere):**
- Site / demo: https://mycal-web.pages.dev
- One-tap Subscribe: https://mycal-web.pages.dev/subscribe
- Docs: https://mycal-web.pages.dev/docs
- API base: https://mycal-api.huijun00100101.workers.dev/v1
- GitHub: https://github.com/Junhui20/malaysia-calendar-api
- npm: `@catlabtech/mycal-core`, `@catlabtech/mycal-sdk`, `@catlabtech/mycal-mcp-server`

---

## 1. Show HN

**Title** (74 chars)

```
Show HN: Open-source Malaysia calendar API with iCal feeds and an MCP server
```

**Body**

I built mycal, a free and open-source calendar API for Malaysia. It started because almost every Malaysian app I've touched re-hardcodes the same public-holiday list every January, quietly gets the state-specific ones wrong, and never handles *cuti ganti* — the replacement day you get when a public holiday falls on a weekend.

mycal covers all 16 regions (13 states + 3 federal territories), in Bahasa Malaysia / English / Chinese, with the replacement-holiday logic built in. On top of the raw data it does the useful stuff: business-day counting, long-weekend detection, school terms and public-exam dates (SPM/STPM/MUET/PT3), and a leave optimizer that tells you the cheapest annual-leave days to burn for the longest break ("take 2 days, get 5 off"). Every state has its own iCal and CSV feed, and there's a one-tap Subscribe page that drops live, auto-updating holidays into your phone calendar.

The part I had the most fun building: it also ships as an MCP server with 13 read-only tools, so you can ask Claude or ChatGPT "is 2026-09-16 a holiday in Sarawak?" or "plan a 5-day break in Q4 using only 2 leave days" and it answers from real data instead of hallucinating a holiday calendar.

Stack: the API is Hono on Cloudflare Workers; the site and docs are Astro on Cloudflare Pages. The whole thing runs on the free tier. Code is MIT.

- Demo + Subscribe: https://mycal-web.pages.dev/subscribe
- Docs: https://mycal-web.pages.dev/docs
- GitHub: https://github.com/Junhui20/malaysia-calendar-api
- npm: `@catlabtech/mycal-core`, `-sdk`, `-mcp-server`

I'd love feedback on the holiday data model and the MCP tool design.

---

## 2. r/malaysia

**Title**

```
I made a free thing: subscribe to ALL Malaysian public holidays in your phone calendar with one tap (auto-updates every year)
```

**Body**

I got tired of manually adding *cuti umum* to my calendar every January, so I built **mycal** — a free site where you tap one button and all Malaysian public holidays show up in your phone / Google / Apple calendar, and they auto-update when the government announces new dates (or a *cuti ganti*).

You can subscribe to **your own state's** holidays (all 16 regions, including the federal territories) or the nationwide ones. Holiday names show in BM / English / Chinese. No app to install, no signup, no ads — it's just a calendar subscription link.

Subscribe here: **https://mycal-web.pages.dev/subscribe**

Bonus stuff if you're the type who plans cuti early:
- it lists **every long weekend** for the year
- there's a **leave optimizer** that tells you which annual-leave days to take for the longest possible break (e.g. take 2 days → get 5 off)

It's fully open source, and free for devs to use the API too (https://github.com/Junhui20/malaysia-calendar-api). Feedback welcome — especially if you spot a wrong or missing holiday for your state, tell me and I'll fix the data.

---

## 3. LinkedIn

Two things almost every Malaysian workplace re-does by hand each year: rebuilding the public-holiday calendar, and the back-and-forth of staff trying to stretch annual leave around long weekends.

I built **mycal** to remove both. It's a free, open-source Malaysia Calendar API covering all 16 regions (13 states + 3 federal territories) with correct state-by-state holidays and *cuti ganti* (replacement-holiday) logic — in Bahasa Malaysia, English and Chinese.

For people & operations teams:
- **Per-state iCal feeds** you can drop into Google / Outlook / Apple so an entire team shares one always-correct holiday calendar
- A **leave optimizer** that surfaces the most efficient annual-leave days to take ("take 2 days, get 5 off") — useful both for employees planning trips and managers planning coverage
- School-term, public-exam (SPM/STPM/MUET/PT3) and business-day data for anyone scheduling around the academic year

For developers:
- A clean REST API and TypeScript SDK on npm, plus an MCP server so AI assistants can answer holiday and leave questions from real data
- Runs on Cloudflare's edge, MIT-licensed, free to use

Subscribe: https://mycal-web.pages.dev/subscribe
Docs: https://mycal-web.pages.dev/docs
GitHub: https://github.com/Junhui20/malaysia-calendar-api

#Malaysia #HRtech #PeopleOps #OpenSource #DeveloperTools #AI

---

## 4. dev.to / Hashnode article

**Title**

```
Building a Malaysia Calendar API on Cloudflare — and turning it into an MCP server for AI assistants
```

**Intro (120 words)**

Every year, Malaysian apps re-hardcode the same public-holiday list — and quietly get it wrong, because holidays differ by state and there's *cuti ganti*, the replacement day you get when a holiday lands on a weekend. I got tired of it and built **mycal**: a free, open-source Malaysia Calendar API covering all 16 regions in three languages, with replacement-holiday logic, school terms, public-exam dates, business-day math, long-weekend detection, and a leave optimizer. The whole thing runs on Cloudflare's free tier. Then I built the part I actually wanted to write about: I wrapped it in a 13-tool MCP server so Claude and ChatGPT can answer "is this a holiday in Sabah?" from real data instead of guessing. Here's how it's built, and what I learned.

**Section outline**

1. **The problem** — why Malaysian holiday data is deceptively hard: per-state differences, *cuti ganti*, tentative vs confirmed Islamic-calendar dates, and trilingual names.
2. **The data model** — how holidays, replacements, school terms and exams are structured (JSON per year, 16 regions, school groups A/B).
3. **The core library** (`@catlabtech/mycal-core`) — business-day math, long-weekend detection, and the leave-optimizer algorithm that turns "take 2 days" into "get 5 off."
4. **The Cloudflare stack** — Hono API on Workers, Astro + Starlight docs on Pages, generating per-state iCal/CSV feeds, and the one-tap `webcal://` Subscribe page.
5. **The MCP angle** — what MCP is, designing 13 *read-only* tools, why no-auth/read-only is the right call for a public data source, and example prompts.
6. **Packaging & publishing** — the monorepo, shipping `@catlabtech/mycal-{core,sdk,mcp-server}` to npm, and submitting to the official MCP registry.
7. **What's next** — call for contributors, and how to report wrong/missing holidays.

---

## 5. Product Hunt

**Tagline** (58 chars)

```
Free Malaysia holidays in your calendar + an AI MCP server
```

**Description**

mycal is a free, open-source Malaysia Calendar API: all 16 regions, trilingual public holidays with *cuti ganti* logic, school terms, business-day math, and a leave optimizer that finds the cheapest days off. Subscribe to your state's holidays in your phone calendar with one tap, or call the REST API and TypeScript SDK. It also ships a 13-tool MCP server, so Claude and ChatGPT can answer holiday and leave questions from real data.

**First comment (from the maker)**

Hi PH, I'm the maker. I built mycal because every Malaysian app re-hardcodes public holidays each year and gets the state-specific ones — and *cuti ganti* — wrong. It's completely free, MIT-licensed, runs on Cloudflare's edge, and there's no signup. The two things I'm proudest of: the one-tap Subscribe page (live, auto-updating holiday feeds for your specific state) and the MCP server, which lets an AI assistant plan your leave around long weekends using real data. Happy to answer anything about the holiday data model, the leave optimizer, or the Cloudflare/MCP setup.

---

## 6. Assets to make (checklist)

- [ ] **15-sec Subscribe GIF** — phone screen recording: open the Subscribe page → tap one state → confirm in Apple/Google Calendar → holidays appear. The hero asset for r/malaysia and Product Hunt.
- [ ] **Leave-optimizer infographic** — a 2026 calendar strip showing "2 leave days → 5 days off," long weekends highlighted, one or two real examples. For LinkedIn and X.
- [ ] **OG image (1200×630)** — product name, "Free Malaysia Calendar API," the hooks (16 regions · BM/EN/ZH · iCal feeds · MCP server), and the URL. Replaces the current placeholder `og.png`.
- [ ] **Terminal cast (GIF / asciinema)** — `npx @catlabtech/mycal-mcp-server` plus a sample Claude prompt and answer. For HN and the dev.to article.
- [ ] **Product Hunt gallery (1270×760 each)** — hero, Subscribe flow, leave-optimizer, and a Claude/ChatGPT MCP screenshot.
- [ ] **Square 1:1 logo/thumbnail** — for the Product Hunt listing and npm/README.
