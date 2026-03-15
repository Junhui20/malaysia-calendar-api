import { Hono } from "hono";
import { resolveStateCode } from "@mycal/core";
import { states } from "../data.js";

export const statesRouter = new Hono();

// GET /states
statesRouter.get("/", (c) => {
  return c.json({ data: states, meta: { total: states.length } });
});

// GET /states/resolve?q=kl
statesRouter.get("/resolve", (c) => {
  const query = c.req.query("q");
  if (!query) {
    return c.json({ error: { code: "MISSING_QUERY", message: "Query parameter q is required" } }, 400);
  }

  const state = resolveStateCode(query, states);
  if (!state) {
    const suggestions = states
      .filter((s) => s.code.includes(query.toLowerCase()) || s.aliases.some((a) => a.toLowerCase().includes(query.toLowerCase())))
      .slice(0, 5)
      .map((s) => s.code);

    return c.json({
      error: {
        code: "STATE_NOT_FOUND",
        message: `No state matching "${query}".${suggestions.length > 0 ? ` Did you mean: ${suggestions.join(", ")}?` : ""}`,
        suggestions,
      },
    }, 404);
  }

  return c.json({ data: { canonical: state.code, name: state.name, type: state.type, group: state.group } });
});
