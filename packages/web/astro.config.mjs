import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://mycal.pages.dev",
  integrations: [
    react(),
    starlight({
      title: "MyCal Docs",
      description: "Malaysia Calendar API — developer documentation",
      logo: { src: "./src/assets/logo.svg", replacesTitle: false },
      social: {
        github: "https://github.com/Junhui20/malaysia-calendar-api",
      },
      customCss: ["./src/styles/docs.css"],
      editLink: {
        baseUrl: "https://github.com/Junhui20/malaysia-calendar-api/edit/main/packages/web/",
      },
      components: {
        SiteTitle: "./src/components/docs/SiteTitle.astro",
      },
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", slug: "docs/getting-started/introduction" },
            { label: "Quick Start", slug: "docs/getting-started/quickstart" },
            { label: "Core Concepts", slug: "docs/getting-started/concepts" },
          ],
        },
        {
          label: "REST API",
          items: [
            { label: "Overview", slug: "docs/rest-api/overview" },
            { label: "Holidays", slug: "docs/rest-api/holidays" },
            { label: "Business Days", slug: "docs/rest-api/business-days" },
            { label: "School Calendar", slug: "docs/rest-api/school" },
            { label: "States", slug: "docs/rest-api/states" },
            { label: "iCal Feeds", slug: "docs/rest-api/feeds" },
            { label: "Errors", slug: "docs/rest-api/errors" },
          ],
        },
        {
          label: "SDK (TypeScript)",
          items: [
            { label: "Installation", slug: "docs/sdk/installation" },
            { label: "Client Usage", slug: "docs/sdk/client" },
            { label: "Type Reference", slug: "docs/sdk/reference" },
          ],
        },
        {
          label: "MCP Server",
          items: [
            { label: "What is MCP?", slug: "docs/mcp-server/what-is-mcp" },
            { label: "Claude Desktop Setup", slug: "docs/mcp-server/claude-desktop" },
            { label: "Claude Code Setup", slug: "docs/mcp-server/claude-code" },
            { label: "Available Tools", slug: "docs/mcp-server/tools" },
          ],
        },
        {
          label: "iCal Subscription",
          items: [
            { label: "Google Calendar", slug: "docs/ical/google-calendar" },
            { label: "Apple Calendar", slug: "docs/ical/apple-calendar" },
            { label: "Outlook", slug: "docs/ical/outlook" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "State Codes", slug: "docs/reference/state-codes" },
            { label: "Holiday Types", slug: "docs/reference/holiday-types" },
            { label: "Data Sources", slug: "docs/reference/data-sources" },
          ],
        },
        { label: "Contributing", slug: "docs/contributing" },
        { label: "Changelog", slug: "docs/changelog" },
      ],
    }),
  ],
  vite: {
    ssr: {
      noExternal: ["@catlabtech/mycal-sdk", "@catlabtech/mycal-core"],
    },
  },
});
