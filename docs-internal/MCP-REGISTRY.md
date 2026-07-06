# Publishing `@catlabtech/mycal-mcp-server` to the MCP Registry

Internal guide for listing the mycal MCP server in the **official MCP Registry**, plus the secondary directories. Verified against the live quickstart and registry repo (June 2026).

> The MCP Registry is in **preview** — breaking changes or data resets may occur before GA. Report issues at https://github.com/modelcontextprotocol/registry/issues.

---

## ✅ Resolution: the namespace problem is fixed

The registry validates **namespace ownership** at publish time: with GitHub auth, the server-name prefix `io.github.<owner>/` must match the GitHub account you authenticate as. We originally shipped `io.github.catlabtech/mycal`, but there is no `catlabtech` GitHub account/org — publishing failed with *"You do not have permission to publish this server."*

We went with **Option B** (use the existing repo owner rather than standing up a `catlabtech` org):

1. `packages/mcp-server/package.json`: `mcpName` set to `io.github.Junhui20/mycal`.
2. `packages/mcp-server/server.json`: `name` set to `io.github.Junhui20/mycal`, `repository.url` set to `https://github.com/Junhui20/malaysia-calendar-api`.
3. **Case sensitivity caveat** (learned the hard way): the registry namespace check is **case-sensitive** against the GitHub login. `io.github.junhui20/mycal` (lowercase, published in v0.1.3) was rejected — the account is `Junhui20` (capital J). Re-published as `io.github.Junhui20/mycal` in **v0.1.4**, which the registry accepted.
4. Published `@catlabtech/mycal-mcp-server@0.1.4` to npm with the corrected `mcpName`, then `mcp-publisher publish` succeeded authenticated as `Junhui20`.

Current state: **live** in the official MCP Registry as `io.github.Junhui20/mycal` at v0.1.4. Verify anytime with:

```bash
curl "https://registry.modelcontextprotocol.io/v0/servers?search=mycal"
# → "name":"io.github.Junhui20/mycal"
```

See `CHANGELOG.md` [0.1.3] / [0.1.4] entries and commits `f373c62`, `54b5855`, `261da55` for the full trail.

---

## The published `server.json`

Lives at `packages/mcp-server/server.json` (schema `2025-12-11`). The 13 tools are **read-only** (no auth, no env vars), transport `stdio`.

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "io.github.Junhui20/mycal",
  "description": "Malaysia public holidays, school terms, business-day math and a leave optimizer — 13 read-only tools.",
  "repository": {
    "url": "https://github.com/Junhui20/malaysia-calendar-api",
    "source": "github"
  },
  "version": "0.1.4",
  "packages": [
    {
      "registryType": "npm",
      "identifier": "@catlabtech/mycal-mcp-server",
      "version": "0.1.4",
      "transport": { "type": "stdio" }
    }
  ]
}
```

Notes for future publishes:
- `server.json` `name` **must** equal `mcpName` in the published `package.json`, and both **must** exactly match the GitHub login's case (`Junhui20`, not `junhui20`).
- Keep `description` short (registry caps ~100 chars).
- `version` (top-level and under `packages[]`) must match the npm version you actually published.
- `mcp-publisher init` scaffolds a `server.json` from `package.json` — run it then trim to the above.

---

## Publish steps (run in `packages/mcp-server/`)

```bash
# 1. Build + publish the npm package (registry stores metadata, not artifacts)
npm run build
npm publish --access public          # @catlabtech/mycal-mcp-server@<version>

# 2. Install the mcp-publisher CLI (or: brew install mcp-publisher)
#    Prebuilt binaries: https://github.com/modelcontextprotocol/registry/releases/latest
mcp-publisher --help

# 3. (optional) scaffold then edit server.json
mcp-publisher init

# 4. Authenticate with GitHub (device-code flow) as `Junhui20`
mcp-publisher login github

# 5. Publish to the registry
mcp-publisher publish
```

**Verify:** `curl "https://registry.modelcontextprotocol.io/v0/servers?search=mycal"` → expect `"name":"io.github.Junhui20/mycal"`.

**Troubleshooting:**

| Error | Fix |
| --- | --- |
| "Registry validation failed for package" | Published npm package is missing the matching `mcpName`. Bump + re-publish to npm. |
| "Invalid or expired Registry JWT token" | Re-run `mcp-publisher login github`. |
| "You do not have permission to publish this server" | Your GitHub identity doesn't own the `io.github.<owner>/` namespace, or the case doesn't match `Junhui20` exactly. |

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
