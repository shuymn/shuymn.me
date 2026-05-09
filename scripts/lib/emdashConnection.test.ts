import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createEmDashClient,
  type EmDashConnectionCliValues,
  resolveEmDashConnectionOptions,
} from "./emdashConnection.ts";

test("EmDash connection helper resolves endpoint credentials and generic headers", () => {
  const values: EmDashConnectionCliValues = {
    baseUrl: "https://cms.example.test/",
    token: "flag-token",
    devBypass: true,
    header: ["CF-Access-Client-Id: flag-id", "CF-Access-Client-Secret: flag-secret"],
  };
  const options = resolveEmDashConnectionOptions(values, {
    EMDASH_BASE_URL: "https://env.example.test",
    EMDASH_API_TOKEN: "env-token",
    EMDASH_HEADERS: "CF-Access-Client-Id: env-id\nX-Trace: env",
  });

  assert.equal(options.baseUrl, "https://cms.example.test");
  assert.equal(options.token, "flag-token");
  assert.equal(options.devBypass, true);
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

test("EmDash connection helper attaches custom headers to API requests", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Request[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const request = input instanceof Request ? input : new Request(input);
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
