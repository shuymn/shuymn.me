import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildProjectionFromSource,
  parseArgs,
  parseAuthorSource,
  projectLocalContent,
} from "./project-local-content.mjs";

test("projects canonical post source into Astro content frontmatter", async () => {
  const root = await mkdtemp(join(tmpdir(), "local-content-"));
  const sourceDir = join(root, "source");
  const projectionDir = join(root, "posts");

  await mkdir(sourceDir, { recursive: true });
  await writeFile(
    join(sourceDir, "2026-05-10-runtime-notes.md"),
    ["---", 'title: "Runtime Notes"', "---", "", "本文です。", ""].join("\n"),
  );

  const projection = await buildProjectionFromSource({
    projectionDir,
    sourceDir,
    sourcePath: join(sourceDir, "2026-05-10-runtime-notes.md"),
  });

  assert.match(projection.content, /title: "Runtime Notes"/);
  assert.match(projection.content, /slug: "2026-05-10-runtime-notes"/);
  assert.match(projection.content, /locale: "ja"/);
  assert.match(projection.content, /publishedAt: "2026-05-10T00:00:00.000Z"/);
  assert.match(projection.content, /seo:\n {2}title: "Runtime Notes"\n {2}description: "本文です。"/);
  assert.doesNotMatch(projection.content, /tags:/);
  assert.match(projection.content, /本文です。/);
});

test("rejects nested source paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "local-content-"));
  const sourceDir = join(root, "source");
  const projectionDir = join(root, "posts");

  await mkdir(join(sourceDir, "ja"), { recursive: true });
  await writeFile(
    join(sourceDir, "ja/2026-05-10-runtime-notes.md"),
    '---\ntitle: "Runtime Notes"\n---\n\n本文です。\n',
  );

  await assert.rejects(
    () =>
      buildProjectionFromSource({
        projectionDir,
        sourceDir,
        sourcePath: join(sourceDir, "ja/2026-05-10-runtime-notes.md"),
      }),
    /expected <slug>\.md path, got ja\/2026-05-10-runtime-notes\.md/,
  );
});

test("normalizes legacy control characters out of author bodies", () => {
  const source = parseAuthorSource('---\ntitle: "Legacy"\n---\n\nSP皆伝を取った。\n\b高校生のときから遊んだ。\n');

  assert.equal(source.body, "SP皆伝を取った。\n高校生のときから遊んだ。");
});

test("rejects removed one-off migration modes", () => {
  for (const option of ["--recover-from-git", "--init-from-projection", "--legacy-dir", "--force"]) {
    assert.throws(() => parseArgs(["--check", option, "value"]), /Unknown option/);
  }
});

test("check mode detects stale projections", async () => {
  const root = await mkdtemp(join(tmpdir(), "local-content-"));
  const sourceDir = join(root, "source");
  const projectionDir = join(root, "posts");

  await Promise.all([mkdir(sourceDir, { recursive: true }), mkdir(projectionDir, { recursive: true })]);
  await writeFile(join(sourceDir, "2026-05-10-runtime-notes.md"), '---\ntitle: "Runtime Notes"\n---\n\n本文です。\n');
  await writeFile(join(projectionDir, "2026-05-10-runtime-notes.md"), "stale\n");

  await assert.rejects(
    () => projectLocalContent({ sourceDir, projectionDir, check: true, apply: false }),
    /local content projection is stale: 2026-05-10-runtime-notes\.md/,
  );

  await projectLocalContent({ sourceDir, projectionDir, check: false, apply: true });
  const projected = await readFile(join(projectionDir, "2026-05-10-runtime-notes.md"), "utf8");
  assert.match(projected, /title: "Runtime Notes"/);
});
