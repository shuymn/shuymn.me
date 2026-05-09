import {
  createTransport,
  csrfInterceptor,
  devBypassInterceptor,
  EmDashApiError,
  EmDashClient,
  type Interceptor,
  tokenInterceptor,
} from "emdash/client";
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

export class EmDashApiClient {
  private readonly baseUrl: string;
  private readonly transport: { fetch: (request: Request) => Promise<Response> };

  constructor(options: EmDashConnectionOptions) {
    this.baseUrl = stripTrailingSlash(options.baseUrl);
    this.transport = createTransport({
      interceptors: createConnectionInterceptors(options),
    });
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.requestRaw(method, path, body);
    await assertOk(response);
    const json = (await response.json()) as { data: T };
    return json.data;
  }

  private async requestRaw(method: string, path: string, body?: unknown): Promise<Response> {
    if (!path.startsWith("/")) {
      throw new Error(`EmDash API path must start with "/": ${path}`);
    }
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    let requestBody: string | undefined;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }
    return this.transport.fetch(
      new Request(`${this.baseUrl}/_emdash/api${path}`, {
        method,
        headers,
        body: requestBody,
      }),
    );
  }
}

export function createEmDashApiClient(options: EmDashConnectionOptions): EmDashApiClient {
  return new EmDashApiClient(options);
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

function createConnectionInterceptors(options: EmDashConnectionOptions): Interceptor[] {
  const interceptors: Interceptor[] = [csrfInterceptor()];
  if (options.token) {
    interceptors.push(tokenInterceptor(options.token));
  } else if (options.devBypass) {
    interceptors.push(devBypassInterceptor(options.baseUrl));
  }
  if (Object.keys(options.headers).length > 0) {
    interceptors.push(customHeadersInterceptor(options.headers));
  }
  return interceptors;
}

async function assertOk(response: Response): Promise<void> {
  if (response.ok) return;

  let code = "UNKNOWN_ERROR";
  let message = `HTTP ${response.status}`;
  let details: Record<string, unknown> | undefined;

  try {
    const json = (await response.json()) as {
      error?: { code?: string; message?: string; details?: Record<string, unknown> };
    };
    if (json.error) {
      code = json.error.code ?? code;
      message = json.error.message ?? message;
      details = json.error.details;
    }
  } catch {
    message = response.statusText || message;
  }

  throw new EmDashApiError(response.status, code, message, details);
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
  if (normalized === undefined) return false;
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  throw new Error(`EMDASH_DEV_BYPASS must be one of true/false/1/0 (got ${JSON.stringify(value)})`);
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
