# Generating multi-language SDKs from the OpenAPI spec

mycal already ships a hand-written TypeScript SDK (`@catlabtech/mycal-sdk`). For Python / PHP / Go, generate them from `openapi.yaml` with **OpenAPI Generator** rather than hand-writing/maintaining them.

> Prerequisite: OpenAPI Generator needs **Java 11+** (the `npx` wrapper downloads the runnable JAR) or **Docker**. Nothing to add to `package.json` — the commands use `npx`, so they don't touch the pnpm lockfile.

## Generate

```bash
# Python  → packages/sdk-python/
npx -y @openapitools/openapi-generator-cli generate \
  -i openapi.yaml -g python -o packages/sdk-python \
  --additional-properties=packageName=mycal,projectName=mycal,packageVersion=0.1.0

# PHP     → packages/sdk-php/
npx -y @openapitools/openapi-generator-cli generate \
  -i openapi.yaml -g php -o packages/sdk-php \
  --additional-properties=invokerPackage=CatLabTech\\Mycal,composerVendorName=catlabtech,composerProjectName=mycal

# Go      → packages/sdk-go/
npx -y @openapitools/openapi-generator-cli generate \
  -i openapi.yaml -g go -o packages/sdk-go \
  --additional-properties=packageName=mycal,moduleName=github.com/Junhui20/malaysia-calendar-api/sdk-go
```

(Docker alternative: `docker run --rm -v "$PWD:/local" openapitools/openapi-generator-cli generate -i /local/openapi.yaml -g python -o /local/packages/sdk-python`.)

## Before you generate — tighten the spec
The generated SDK is only as good as `openapi.yaml`. Make sure it includes the newer routes (`/holidays/leave-optimizer`, `/feed/csv/:state`, `/data/*`, `/prayer-times/*`) and `operationId`s, since generators name methods from `operationId`. The spec currently lags the live API — fill the gaps first.

## Publish (manual / external — each needs its own account + auth)
- **Python → PyPI:** `cd packages/sdk-python && python -m build && twine upload dist/*` (needs a PyPI token).
- **PHP → Packagist:** push `packages/sdk-php` to its own repo (or a subtree) and submit the repo URL at https://packagist.org/packages/submit.
- **Go → pkg.go.dev:** Go modules are published by **tagging a git release** (e.g. `git tag sdk-go/v0.1.0 && git push --tags`); pkg.go.dev indexes it automatically on first fetch.

## Recommendation
Don't commit the generated output to this monorepo's main tree — generate on release into separate package dirs (gitignore them here, or use a `release` branch / separate repos). A thin CI job (`on: release`) that regenerates + publishes keeps them in sync with the spec without hand-maintenance. Start with **Python** (largest data/automation audience), then Go, then PHP.
