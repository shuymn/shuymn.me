import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildProjectionFromSource,
  parseAcceptedMetadata,
  parseAuthorSource,
  projectLocalContent,
} from "./project-local-content.mjs";

test("projects author source and accepted metadata into Astro content frontmatter", async () => {
  const root = await mkdtemp(join(tmpdir(), "local-content-"));
  const sourceDir = join(root, "source");
  const metadataDir = join(root, "metadata");
  const projectionDir = join(root, "posts");

  await mkdir(join(sourceDir, "ja"), { recursive: true });
  await mkdir(join(metadataDir, "ja"), { recursive: true });
  await writeFile(
    join(sourceDir, "ja/2026-05-10-runtime-notes.md"),
    ["---", 'slug: "2026-05-10-runtime-notes"', 'title: "Runtime Notes"', "---", "", "本文です。", ""].join("\n"),
  );
  await writeFile(
    join(metadataDir, "ja/2026-05-10-runtime-notes.json"),
    `${JSON.stringify(
      {
        locale: "ja",
        tags: ["astro"],
        seo: { title: "Runtime Notes" },
        translation: { disabled: false },
      },
      null,
      2,
    )}\n`,
  );

  const projection = await buildProjectionFromSource({
    metadataDir,
    projectionDir,
    sourceDir,
    sourcePath: join(sourceDir, "ja/2026-05-10-runtime-notes.md"),
  });

  assert.match(projection.content, /title: "Runtime Notes"/);
  assert.match(projection.content, /slug: "2026-05-10-runtime-notes"/);
  assert.match(projection.content, /publishedAt: "2026-05-10T00:00:00.000Z"/);
  assert.match(projection.content, /tags:\n {2}- "astro"/);
  assert.doesNotMatch(projection.content, /generation:/);
  assert.match(projection.content, /本文です。/);
});

test("rejects generated state in accepted metadata", () => {
  assert.throws(
    () =>
      parseAcceptedMetadata({
        locale: "ja",
        publishedAt: "2026-05-10T00:00:00.000Z",
        generation: { status: "passed" },
      }),
    /Unrecognized key/,
  );
});

test("rejects former metadata fields", () => {
  for (const field of [
    "slug",
    "description",
    "publishedAt",
    "updatedAt",
    "draft",
    "visibility",
    "redirects",
    "revision",
  ]) {
    assert.throws(
      () =>
        parseAcceptedMetadata({
          locale: "ja",
          [field]: field === "draft" ? false : "legacy",
        }),
      /Unrecognized key/,
    );
  }
});

test("requires source slug to match the source filename", async () => {
  const root = await mkdtemp(join(tmpdir(), "local-content-"));
  const sourceDir = join(root, "source");
  const metadataDir = join(root, "metadata");
  const projectionDir = join(root, "posts");

  await Promise.all([
    mkdir(join(sourceDir, "ja"), { recursive: true }),
    mkdir(join(metadataDir, "ja"), { recursive: true }),
  ]);
  await writeFile(
    join(sourceDir, "ja/2026-05-10-runtime-notes.md"),
    '---\nslug: "2026-05-10-different"\ntitle: "Runtime Notes"\n---\n\n本文です。\n',
  );
  await writeFile(
    join(metadataDir, "ja/2026-05-10-runtime-notes.json"),
    `${JSON.stringify({ locale: "ja" }, null, 2)}\n`,
  );

  await assert.rejects(
    () =>
      buildProjectionFromSource({
        metadataDir,
        projectionDir,
        sourceDir,
        sourcePath: join(sourceDir, "ja/2026-05-10-runtime-notes.md"),
      }),
    /source slug 2026-05-10-different does not match source path ja\/2026-05-10-runtime-notes\.md/,
  );
});

test("normalizes legacy control characters out of author bodies", () => {
  const source = parseAuthorSource(
    '---\nslug: "2020-04-02-legacy"\ntitle: "Legacy"\n---\n\nSP皆伝を取った。\n\b高校生のときから遊んだ。\n',
  );

  assert.equal(source.body, "SP皆伝を取った。\n高校生のときから遊んだ。");
});

test("check mode detects stale projections", async () => {
  const root = await mkdtemp(join(tmpdir(), "local-content-"));
  const sourceDir = join(root, "source");
  const metadataDir = join(root, "metadata");
  const projectionDir = join(root, "posts");

  await Promise.all([
    mkdir(join(sourceDir, "ja"), { recursive: true }),
    mkdir(join(metadataDir, "ja"), { recursive: true }),
    mkdir(join(projectionDir, "ja"), { recursive: true }),
  ]);
  await writeFile(
    join(sourceDir, "ja/2026-05-10-runtime-notes.md"),
    '---\nslug: "2026-05-10-runtime-notes"\ntitle: "Runtime Notes"\n---\n\n本文です。\n',
  );
  await writeFile(
    join(metadataDir, "ja/2026-05-10-runtime-notes.json"),
    `${JSON.stringify({ locale: "ja" }, null, 2)}\n`,
  );
  await writeFile(join(projectionDir, "ja/2026-05-10-runtime-notes.md"), "stale\n");

  await assert.rejects(
    () => projectLocalContent({ sourceDir, metadataDir, projectionDir, check: true, apply: false }),
    /local content projection is stale: ja\/2026-05-10-runtime-notes\.md/,
  );

  await projectLocalContent({ sourceDir, metadataDir, projectionDir, check: false, apply: true });
  const projected = await readFile(join(projectionDir, "ja/2026-05-10-runtime-notes.md"), "utf8");
  assert.match(projected, /title: "Runtime Notes"/);
});
