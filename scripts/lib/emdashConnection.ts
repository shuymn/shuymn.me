import { EmDashClient } from "emdash/client";
import { customHeadersInterceptor } from "emdash/client/cf-access";
import type { Args } from "gunshi";

export const DEFAULT_EMDASH_BASE_URL = "http://localhost:4321";

export const emdashConnectionArgs = {
  baseUrl: {
    type: "string",
    description: `EmDash base URL (default: ${DEFAULT_EMDASH_BASE_URL})`,
  },
  token: {
    type: "string",
    description: "EmDash API token",
  },
  devBypass: {
    type: "boolean",
    negatable: true,
    description: "Use local EmDash dev-bypass auth",
  },
  header: {
    type: "string",
    short: "H",
    multiple: true,
    description: 'Generic request header, repeatable, in "Name: Value" format',
  },
} satisfies Args;

export type EmDashConnectionCliValues = {
  baseUrl?: string;
  token?: string;
  devBypass?: boolean;
  header?: string | string[];
};

export type EmDashConnectionOptions = {
  baseUrl: string;
  token?: string;
  devBypass: boolean;
  headers: Record<string, string>;
};

export function resolveEmDashConnectionOptions(
  values: EmDashConnectionCliValues,
  env: NodeJS.ProcessEnv = process.env,
): EmDashConnectionOptions {
  const baseUrl = stripTrailingSlash(
    readOptionalString(values.baseUrl) ?? readOptionalString(env.EMDASH_BASE_URL) ?? DEFAULT_EMDASH_BASE_URL,
  );
  assertValidBaseUrl(baseUrl);
  const token = readOptionalString(values.token) ?? readOptionalString(env.EMDASH_API_TOKEN);
  const devBypass = values.devBypass ?? parseBooleanEnv(env.EMDASH_DEV_BYPASS);
  const headers = resolveCustomHeaders({
    envHeaders: env.EMDASH_HEADERS,
    cliHeaders: normalizeHeaderValues(values.header),
  });

  if (!token && !devBypass) {
    throw new Error("Set EMDASH_API_TOKEN or pass --dev-bypass for local trusted execution");
  }
  if (token && devBypass) {
    throw new Error("--dev-bypass cannot be combined with EMDASH_API_TOKEN/--token");
  }

  return {
    baseUrl,
    ...(token ? { token } : {}),
    devBypass,
    headers,
  };
}

export function createEmDashClient(options: EmDashConnectionOptions): EmDashClient {
  const interceptors = Object.keys(options.headers).length > 0 ? [customHeadersInterceptor(options.headers)] : [];
  return new EmDashClient({
    baseUrl: options.baseUrl,
    token: options.token,
    devBypass: options.devBypass,
    interceptors,
  });
}

export function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveCustomHeaders({
  envHeaders,
  cliHeaders,
}: {
  envHeaders?: string;
  cliHeaders: string[];
}): Record<string, string> {
  return {
    ...parseHeaderLines(splitEnvHeaderLines(envHeaders), "EMDASH_HEADERS"),
    ...parseHeaderLines(cliHeaders, "--header"),
  };
}

function parseHeaderLines(lines: string[], source: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex < 1) {
      throw new Error(`${source} header must use "Name: Value" format: ${trimmed}`);
    }
    const name = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    validateHeader(name, value, source);
    headers[name] = value;
  }
  return headers;
}

function validateHeader(name: string, value: string, source: string): void {
  try {
    const headers = new Headers();
    headers.set(name, value);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${source} header is invalid: ${name}: ${message}`);
  }
}

function splitEnvHeaderLines(value: string | undefined): string[] {
  return readOptionalString(value)?.split(/\r?\n/) ?? [];
}

function normalizeHeaderValues(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function parseBooleanEnv(value: string | undefined): boolean {
  const normalized = readOptionalString(value)?.toLowerCase();
  return normalized === "1" || normalized === "true";
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function assertValidBaseUrl(value: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid EMDASH_BASE_URL/--base-url: ${value} (${message})`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Invalid EMDASH_BASE_URL/--base-url: ${value} (protocol must be http or https)`);
  }
}
