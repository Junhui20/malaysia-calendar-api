---
title: SDK Installation
description: Install and configure the @mycal/sdk TypeScript client.
---

## Install

```bash
npm install @mycal/sdk
# or
pnpm add @mycal/sdk
# or
yarn add @mycal/sdk
```

Node 18+ is required. The SDK is ESM-only and uses the platform `fetch`.

## Import

```ts
import { MyCalClient } from "@mycal/sdk";

const cal = new MyCalClient();
```

No configuration needed — the SDK defaults to the production API.

## Custom base URL

Useful if you're running your own instance or testing against a staging deployment:

```ts
const cal = new MyCalClient({
  baseUrl: "https://your-worker.example.com/v1",
});
```

## Types

The SDK re-exports types from `@mycal/core` so you don't need a second install for type definitions:

```ts
import type {
  Holiday,
  State,
  SchoolTerm,
  BusinessDaysResult,
} from "@mycal/sdk";
```

Every method returns a `Result<T>` union:

```ts
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; status: number } };
```

This is a Result-pattern rather than throwing — see [Client Usage](/docs/sdk/client/) for why and how.
