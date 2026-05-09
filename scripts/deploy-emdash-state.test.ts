import assert from "node:assert/strict";
import { test } from "node:test";
import { testInternals } from "./deploy-emdash-state.ts";

test("deploy:emdash parser resolves shared connection values and requires an explicit mode", () => {
  const options = testInternals.parseArgs(
    ["--dry-run", "--seed", "tmp/seed.json", "--base-url", "https://cms.example.test", "--token", "token"],
    {},
  );

  assert.equal(options.mode, "dry-run");
  assert.equal(options.seedPath, "tmp/seed.json");
  assert.equal(options.baseUrl, "https://cms.example.test");
  assert.equal(options.token, "token");
});

test("deploy:emdash parser rejects implicit and conflicting write modes", () => {
  assert.throws(
    () => testInternals.parseArgs(["--base-url", "https://cms.example.test", "--token", "token"], {}),
    /Pass exactly one of --dry-run or --apply/,
  );
  assert.throws(
    () =>
      testInternals.parseArgs(
        ["--dry-run", "--apply", "--base-url", "https://cms.example.test", "--token", "token"],
        {},
      ),
    /Pass exactly one of --dry-run or --apply/,
  );
});
