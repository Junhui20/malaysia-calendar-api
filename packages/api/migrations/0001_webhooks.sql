-- D1 Migration: Webhook subscriptions and delivery log
-- Run: wrangler d1 execute mycal-db --file=./migrations/0001_webhooks.sql

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  email TEXT NOT NULL,
  events TEXT NOT NULL,           -- JSON array: ["holiday.created","holiday.updated"]
  secret TEXT NOT NULL,            -- HMAC-SHA256 signing secret
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id TEXT NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event TEXT NOT NULL,             -- e.g. "holiday.created"
  payload TEXT NOT NULL,           -- JSON payload sent
  status_code INTEGER,             -- HTTP response code from target
  response_body TEXT,              -- Response body (truncated)
  attempt INTEGER NOT NULL DEFAULT 1,
  delivered_at TEXT NOT NULL DEFAULT (datetime('now')),
  success INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_event ON webhook_deliveries(event);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON webhook_subscriptions(active);

-- Changelog table for tracking data changes
CREATE TABLE IF NOT EXISTS changelog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  event TEXT NOT NULL,             -- e.g. "holiday.created", "holiday.status_changed"
  holiday_id TEXT,
  exam_id TEXT,
  description TEXT NOT NULL,
  changes TEXT,                    -- JSON: { "field": { "from": ..., "to": ... } }
  source TEXT                      -- "admin", "scraper", "community"
);

CREATE INDEX IF NOT EXISTS idx_changelog_timestamp ON changelog(timestamp);
CREATE INDEX IF NOT EXISTS idx_changelog_event ON changelog(event);
