import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createEmDashApiClient,
  createEmDashClient,
  type EmDashConnectionCliValues,
  resolveEmDashConnectionOptions,
} from "./emdashConnection.ts";

test("EmDash connection helper resolves endpoint credentials and generic headers", () => {
  const values: EmDashConnectionCliValues = {
    baseUrl: "https://cms.example.test/",
    token: "flag-token",
    header: ["CF-Access-Client-Id: flag-id", "CF-Access-Client-Secret: flag-secret"],
  };
  const options = resolveEmDashConnectionOptions(values, {
    EMDASH_BASE_URL: "https://env.example.test",
    EMDASH_API_TOKEN: "env-token",
    EMDASH_HEADERS: "CF-Access-Client-Id: env-id\nX-Trace: env",
  });

  assert.equal(options.baseUrl, "https://cms.example.test");
  assert.equal(options.token, "flag-token");
  assert.equal(options.devBypass, false);
  assert.deepEqual(options.headers, {
    "CF-Access-Client-Id": "flag-id",
    "CF-Access-Client-Secret": "flag-secret",
    "X-Trace": "env",
  });
});

test("EmDash connection helper treats blank env values as unset and fails without auth", () => {
  assert.throws(
    () =>
      resolveEmDashConnectionOptions(
        {},
        {
          EMDASH_BASE_URL: "",
          EMDASH_API_TOKEN: "",
          EMDASH_DEV_BYPASS: "",
        },
      ),
    /Set EMDASH_API_TOKEN or pass --dev-bypass/,
  );

  const options = resolveEmDashConnectionOptions({ devBypass: true }, { EMDASH_BASE_URL: "" });
  assert.equal(options.baseUrl, "http://localhost:4321");
  assert.equal(options.devBypass, true);
});

test("EmDash connection helper rejects combining --dev-bypass with an API token", () => {
  assert.throws(
    () => resolveEmDashConnectionOptions({ token: "flag-token", devBypass: true }, {}),
    /--dev-bypass cannot be combined with EMDASH_API_TOKEN\/--token/,
  );

  assert.throws(
    () => resolveEmDashConnectionOptions({ devBypass: true }, { EMDASH_API_TOKEN: "env-token" }),
    /--dev-bypass cannot be combined with EMDASH_API_TOKEN\/--token/,
  );
});

test("EmDash connection helper lets --no-dev-bypass override EMDASH_DEV_BYPASS=true", () => {
  assert.throws(
    () => resolveEmDashConnectionOptions({ devBypass: false }, { EMDASH_DEV_BYPASS: "true" }),
    /Set EMDASH_API_TOKEN or pass --dev-bypass/,
  );

  const options = resolveEmDashConnectionOptions(
    { token: "flag-token", devBypass: false },
    { EMDASH_DEV_BYPASS: "true" },
  );
  assert.equal(options.devBypass, false);
  assert.equal(options.token, "flag-token");
});

test("EmDash connection helper rejects malformed EMDASH_DEV_BYPASS values", () => {
  assert.throws(
    () => resolveEmDashConnectionOptions({}, { EMDASH_DEV_BYPASS: "yes", EMDASH_API_TOKEN: "token" }),
    /EMDASH_DEV_BYPASS must be one of true\/false\/1\/0/,
  );
});

test("EmDash connection helper rejects base URLs without a usable http(s) protocol", () => {
  assert.throws(
    () => resolveEmDashConnectionOptions({ baseUrl: "localhost:4321", devBypass: true }, {}),
    /Invalid EMDASH_BASE_URL\/--base-url: localhost:4321/,
  );

  assert.throws(
    () => resolveEmDashConnectionOptions({ baseUrl: "ftp://cms.example.test", devBypass: true }, {}),
    /protocol must be http or https/,
  );
});

test("EmDash connection helper attaches custom headers to API requests", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Request[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push(request);
    return new Response(JSON.stringify({ success: true, data: { items: [] } }), {
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const client = createEmDashClient({
      baseUrl: "https://cms.example.test",
      token: "emdash-token",
      devBypass: false,
      headers: {
        "CF-Access-Client-Id": "access-id",
        "CF-Access-Client-Secret": "access-secret",
      },
    });

    await client.collections();
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.headers.get("authorization"), "Bearer emdash-token");
  assert.equal(requests[0]?.headers.get("CF-Access-Client-Id"), "access-id");
  assert.equal(requests[0]?.headers.get("CF-Access-Client-Secret"), "access-secret");
});

test("EmDash API client shares auth headers and unwraps JSON API responses", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Request[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push(request);
    return new Response(JSON.stringify({ success: true, data: { title: "shuymn.me" } }), {
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const client = createEmDashApiClient({
      baseUrl: "https://cms.example.test",
      token: "emdash-token",
      devBypass: false,
      headers: {
        "CF-Access-Client-Id": "access-id",
      },
    });

    const result = await client.request<{ title: string }>("POST", "/settings", { title: "shuymn.me" });

    assert.deepEqual(result, { title: "shuymn.me" });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, "https://cms.example.test/_emdash/api/settings");
  assert.equal(requests[0]?.headers.get("authorization"), "Bearer emdash-token");
  assert.equal(requests[0]?.headers.get("CF-Access-Client-Id"), "access-id");
  assert.equal(requests[0]?.headers.get("X-EmDash-Request"), "1");
  assert.equal(requests[0]?.headers.get("Origin"), "https://cms.example.test");
});
