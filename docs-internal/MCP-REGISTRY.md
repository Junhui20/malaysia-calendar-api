# Publishing `@catlabtech/mycal-mcp-server` to the MCP Registry

Internal guide for listing the mycal MCP server in the **official MCP Registry**, plus the secondary directories. Verified against the live quickstart and registry repo (June 2026).

> The MCP Registry is in **preview** — breaking changes or data resets may occur before GA. Report issues at https://github.com/modelcontextprotocol/registry/issues.

---

## ⚠️ READ FIRST: the namespace problem (blocker)

The registry validates **namespace ownership** at publish time. With GitHub auth, the server-name prefix `io.github.<owner>/` **must** match the GitHub account (or org, via GitHub Actions) you authenticate as.

Our current state is **mismatched**:

| What | Value |
| --- | --- |
| `mcpName` in `packages/mcp-server/package.json` | `io.github.catlabtech/mycal` |
| Actual GitHub repo owner | `Junhui20` (`github.com/Junhui20/malaysia-calendar-api`) |

There is **no `catlabtech` GitHub account/org** backing that namespace, so `mcp-publisher publish` will fail with *"You do not have permission to publish this server."* Pick **one** option first:

### Option A — keep the `catlabtech` namespace (recommended for branding)
1. Create a GitHub **organization** named `catlabtech`.
2. **Transfer** `Junhui20/malaysia-calendar-api` into the `catlabtech` org (you must be an owner/member there).
3. Keep `mcpName` = `io.github.catlabtech/mycal` and `server.json` `name` = `io.github.catlabtech/mycal`.
4. Update every repository URL to the new owner (`package.json` repository/homepage/bugs, `server.json`, README badges, the launch copy).
5. Authenticate as a member of `catlabtech` when you run `mcp-publisher login github`.

### Option B — change the namespace to the existing owner (fastest)
1. In `packages/mcp-server/package.json`: change `"mcpName": "io.github.catlabtech/mycal"` → `"mcpName": "io.github.junhui20/mycal"` (lowercased owner).
2. In `server.json`: `"name": "io.github.junhui20/mycal"`.
3. Authenticate as `Junhui20`.

> **Either option requires a fresh npm publish.** The registry verifies the *published npm package* contains an `mcpName` matching the server name. After editing `mcpName`, bump the version (e.g. `0.1.3`), `npm publish`, and use that version in `server.json`.

---

## The `server.json` to publish

Place at `packages/mcp-server/server.json` (schema `2025-12-11`). The 13 tools are **read-only** (no auth, no env vars), transport `stdio`.

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "io.github.catlabtech/mycal",
  "description": "Malaysia public holidays, school terms, business-day math and a leave optimizer — 13 read-only tools.",
  "repository": {
    "url": "https://github.com/catlabtech/malaysia-calendar-api",
    "source": "github"
  },
  "version": "0.1.3",
  "packages": [
    {
      "registryType": "npm",
      "identifier": "@catlabtech/mycal-mcp-server",
      "version": "0.1.3",
      "transport": { "type": "stdio" }
    }
  ]
}
```

**Option B version** — identical except `"name": "io.github.junhui20/mycal"` and the `repository.url` set to `https://github.com/Junhui20/malaysia-calendar-api`.

Notes:
- `server.json` `name` **must** equal `mcpName` in the published `package.json`.
- Keep `description` short (registry caps ~100 chars).
- `version` (top-level and under `packages[]`) must match the npm version you actually published.
- `mcp-publisher init` scaffolds a `server.json` from `package.json` — run it then trim to the above.

---

## Publish steps (run in `packages/mcp-server/`)

```bash
# 0. Fix the namespace (Option A or B) first, then:

# 1. Build + publish the npm package (registry stores metadata, not artifacts)
npm run build
npm publish --access public          # @catlabtech/mycal-mcp-server@0.1.3

# 2. Install the mcp-publisher CLI (or: brew install mcp-publisher)
#    Prebuilt binaries: https://github.com/modelcontextprotocol/registry/releases/latest
mcp-publisher --help

# 3. (optional) scaffold then edit server.json
mcp-publisher init

# 4. Authenticate with GitHub (device-code flow)
#    Option A: log in as a member of the `catlabtech` org. Option B: log in as `Junhui20`.
mcp-publisher login github

# 5. Publish to the registry
mcp-publisher publish
```

**Verify:** `curl "https://registry.modelcontextprotocol.io/v0/servers?search=mycal"` → expect `"name":"io.github.<owner>/mycal"`.

**Troubleshooting:**

| Error | Fix |
| --- | --- |
| "Registry validation failed for package" | Published npm package is missing the matching `mcpName`. Bump + re-publish to npm. |
| "Invalid or expired Registry JWT token" | Re-run `mcp-publisher login github`. |
| "You do not have permission to publish this server" | Your GitHub identity doesn't own the `io.github.<owner>/` namespace — the namespace problem above. |

> Automate later via GitHub Actions (OIDC) to skip the manual login: https://modelcontextprotocol.io/registry/github-actions

---

## Secondary listings (do all for reach)

### 1. `punkpeye/awesome-mcp-servers` (PR)
Open a PR adding one alphabetical line under the best-fit category. Legend: `📇` TypeScript, `🏠` local (stdio).

```markdown
- [Junhui20/malaysia-calendar-api](https://github.com/Junhui20/malaysia-calendar-api) 📇 🏠 - Malaysia public holidays (with cuti ganti), school terms, business-day math, long weekends and a leave optimizer for all 16 regions, in BM/EN/ZH.
```

### 2. `mcp.so` (submit)
Submit at https://mcp.so/submit with the GitHub URL, the npm package name, and a short description. A good README (install/usage + tools list) improves rendering.

### 3. `glama.ai` (add + Dockerfile)
Add at https://glama.ai/mcp/servers via "Add Server". Glama sandboxes servers to inspect tools — a `Dockerfile` boosts the quality score:

```dockerfile
# packages/mcp-server/Dockerfile
FROM node:22-alpine
RUN npm install -g @catlabtech/mycal-mcp-server@latest
ENTRYPOINT ["mycal-mcp-server"]
```

---

## Sources
- https://modelcontextprotocol.io/registry/quickstart — publish flow, `server.json` schema, `mcpName` rule, troubleshooting.
- https://github.com/modelcontextprotocol/registry — namespace/auth rule.
- https://github.com/punkpeye/awesome-mcp-servers — entry format + legend.
- https://glama.ai/mcp/servers — submission entry point.
