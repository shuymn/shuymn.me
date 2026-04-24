import assert from "node:assert/strict";
import { test } from "node:test";

import { assertOwnerApplied, parseArgs, selectOwnerUser } from "./import-markdown-post.mjs";

test("parseArgs accepts an owner lookup value", () => {
  const args = parseArgs(["--file", "_posts/2026-04-25-example.md", "--owner", "owner@example.com"]);

  assert.equal(args.file, "_posts/2026-04-25-example.md");
  assert.equal(args.owner, "owner@example.com");
});

test("parseArgs accepts an exact owner id", () => {
  const args = parseArgs(["--file", "_posts/2026-04-25-example.md", "--owner-id", "user_123"]);

  assert.equal(args.file, "_posts/2026-04-25-example.md");
  assert.equal(args.ownerId, "user_123");
});

test("parseArgs rejects conflicting owner options", () => {
  assert.throws(
    () =>
      parseArgs(["--file", "_posts/2026-04-25-example.md", "--owner", "owner@example.com", "--owner-id", "user_123"]),
    /Use either --owner or --owner-id/,
  );
});

test("selectOwnerUser resolves an exact email match case-insensitively", () => {
  const user = selectOwnerUser(
    [
      { id: "user_1", email: "other@example.com", name: "Other" },
      { id: "user_2", email: "Owner@Example.com", name: "Owner" },
    ],
    "owner@example.com",
  );

  assert.equal(user.id, "user_2");
});

test("selectOwnerUser rejects ambiguous display-name matches", () => {
  assert.throws(
    () =>
      selectOwnerUser(
        [
          { id: "user_1", email: "first@example.com", name: "Owner" },
          { id: "user_2", email: "second@example.com", name: "Owner" },
        ],
        "Owner",
      ),
    /matched multiple EmDash users/,
  );
});

test("assertOwnerApplied rejects an unchanged owner", () => {
  assert.throws(() => assertOwnerApplied({ authorId: "dev" }, "user_123"), /Could not set EmDash owner/);
});
