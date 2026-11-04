import { getTool } from "@felores/kie-ai-core";
import { describe, expect, test } from "@jest/globals";
import { validateHttpTransportSecurity } from "../http-transport.js";
import { applyLegacyEnv, hostsFromUrls } from "../legacy-env.js";

describe("fork: legacy 3.x env names", () => {
  test("maps old token, port and host names to the new ones", () => {
    const env: Record<string, string | undefined> = {
      MCP_AUTH_TOKEN: "secret",
      PORT: "3000",
      HOST: "0.0.0.0",
    };
    applyLegacyEnv(env);
    expect(env.KIE_MCP_HTTP_TOKEN).toBe("secret");
    expect(env.MCP_HTTP_PORT).toBe("3000");
    expect(env.MCP_HTTP_HOST).toBe("0.0.0.0");
  });

  test("never overrides a new name that is already set", () => {
    const env: Record<string, string | undefined> = {
      MCP_AUTH_TOKEN: "old",
      KIE_MCP_HTTP_TOKEN: "new",
      MCP_ALLOWED_HOSTS: "a.example.com",
      SERVICE_FQDN_KIEAIMCP_3000: "b.example.com",
    };
    applyLegacyEnv(env);
    expect(env.KIE_MCP_HTTP_TOKEN).toBe("new");
    expect(env.MCP_ALLOWED_HOSTS).toBe("a.example.com");
  });

  test("derives MCP_ALLOWED_HOSTS from the Coolify domain", () => {
    const env: Record<string, string | undefined> = {
      SERVICE_FQDN_KIEAIMCP_3000: "kie-mcp.example.com",
      SERVICE_URL_KIEAIMCP_3000: "https://kie-mcp.example.com",
      COOLIFY_URL: "https://kie-mcp.example.com:443,https://alt.example.com",
    };
    applyLegacyEnv(env);
    expect(env.MCP_ALLOWED_HOSTS).toBe("kie-mcp.example.com,alt.example.com");
  });

  test("keeps any-origin behaviour for the old CORS default", () => {
    const env: Record<string, string | undefined> = { MCP_CORS_ORIGIN: "*" };
    applyLegacyEnv(env);
    expect(env.MCP_ALLOWED_ORIGINS).toBeUndefined();
  });

  test("an old Coolify setup passes the new security check", () => {
    const env: Record<string, string | undefined> = {
      MCP_AUTH_TOKEN: "secret",
      HOST: "0.0.0.0",
      SERVICE_FQDN_KIEAIMCP_3000: "kie-mcp.example.com",
    };
    applyLegacyEnv(env);
    expect(() =>
      validateHttpTransportSecurity({
        host: env.MCP_HTTP_HOST!,
        token: env.KIE_MCP_HTTP_TOKEN!,
        allowedHosts: env.MCP_ALLOWED_HOSTS!.split(","),
      }),
    ).not.toThrow();
  });

  test("parses hosts from mixed URL lists", () => {
    expect(
      hostsFromUrls("https://A.example.com/x, b.example.com:8080"),
    ).toEqual(["a.example.com", "b.example.com"]);
    expect(hostsFromUrls(undefined)).toEqual([]);
  });
});

describe("fork: gpt_image_2 alias", () => {
  test("is registered with the same schema and runner as gpt_image", () => {
    const alias = getTool("gpt_image_2");
    const tool = getTool("gpt_image");
    expect(alias).toBeDefined();
    expect(alias!.schema).toBe(tool!.schema);
    expect(alias!.run).toBe(tool!.run);
    expect(alias!.category).toBe("image");
  });
});
