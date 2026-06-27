# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-04-22

### Added

- First public npm releases of the workspace packages under the `@catlabtech` scope:
  - `@catlabtech/mycal-core` — shared types, Zod schemas, and calendar/business-day logic.
  - `@catlabtech/mycal-sdk` — TypeScript client SDK for the REST API.
  - `@catlabtech/mycal-mcp-server` — MCP server exposing 13 calendar tools for AI agents.
- MIT `LICENSE` at the repository root and bundled inside each published package.
- npm package metadata (`author`, `repository`, `homepage`, `bugs`, `keywords`) for discoverability,
  plus `sideEffects: false` on `mycal-core` and an `mcpName` registry identifier on `mycal-mcp-server`.

### Changed

- Bumped the repository version to `0.1.1` to align with the published packages.
- Bumped `hono` to the latest 4.x range in `@mycal/api`.

### Removed

- Dropped the broken `parse:jpm` / `parse:kpm` / `parse:mpm` scripts that pointed at
  non-existent parser files.

## [0.1.0] - 2026-03-15

### Added

- Initial Malaysia Calendar API: public holidays, school calendar, exam schedules,
  business-day calculator, state resolver, iCal feeds, and OpenAPI 3.1 spec.

[Unreleased]: https://github.com/Junhui20/malaysia-calendar-api/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/Junhui20/malaysia-calendar-api/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Junhui20/malaysia-calendar-api/releases/tag/v0.1.0
