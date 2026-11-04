/**
 * Fork compatibility (oliverhees): keeps self-hosted deployments of the
 * 3.x "Coolify edition" running after the upgrade to the 5.x monorepo.
 *
 * The old fork read MCP_AUTH_TOKEN, PORT and HOST. The new HTTP transport
 * reads KIE_MCP_HTTP_TOKEN, MCP_HTTP_PORT and MCP_HTTP_HOST, and it also
 * requires MCP_ALLOWED_HOSTS on a public listener. This maps the old names to
 * the new ones and, on Coolify, derives the allowed hosts from the domain
 * Coolify injects. A new name that is already set always wins.
 */

type Env = Record<string, string | undefined>;

function setIfMissing(env: Env, target: string, value: string | undefined) {
  if (!env[target] && value) env[target] = value;
}

/** Turns "https://a.example.com:443/x,b.example.com" into hostnames. */
export function hostsFromUrls(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const withScheme = /^[a-z]+:\/\//i.test(entry)
        ? entry
        : `http://${entry}`;
      try {
        return new URL(withScheme).hostname.toLowerCase();
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

/** Returns the names it mapped, so the caller can log them. */
export function applyLegacyEnv(env: Env = process.env): string[] {
  const mapped: string[] = [];
  const map = (from: string, to: string) => {
    if (!env[to] && env[from]) {
      env[to] = env[from];
      mapped.push(`${from} -> ${to}`);
    }
  };

  map("MCP_AUTH_TOKEN", "KIE_MCP_HTTP_TOKEN");
  map("PORT", "MCP_HTTP_PORT");
  map("HOST", "MCP_HTTP_HOST");

  // The old fork allowed any origin by default ("*"). Only a specific origin
  // list carries over; the new transport also allows any origin when unset.
  const cors = env.MCP_CORS_ORIGIN;
  if (cors && cors.trim() !== "*")
    map("MCP_CORS_ORIGIN", "MCP_ALLOWED_ORIGINS");

  if (!env.MCP_ALLOWED_HOSTS) {
    const sources = [
      env.COOLIFY_FQDN,
      env.COOLIFY_URL,
      ...Object.entries(env)
        .filter(([key]) => /^SERVICE_(FQDN|URL)_/.test(key))
        .map(([, value]) => value),
    ];
    const hosts = [...new Set(sources.flatMap((v) => hostsFromUrls(v)))];
    if (hosts.length > 0) {
      setIfMissing(env, "MCP_ALLOWED_HOSTS", hosts.join(","));
      mapped.push(`Coolify domain -> MCP_ALLOWED_HOSTS (${hosts.join(", ")})`);
    }
  }

  const path = env.MCP_HTTP_PATH;
  if (path && path !== "/mcp") {
    console.error(
      `[Kie.ai MCP] MCP_HTTP_PATH="${path}" is no longer supported; the endpoint is always /mcp.`,
    );
  }

  return mapped;
}
