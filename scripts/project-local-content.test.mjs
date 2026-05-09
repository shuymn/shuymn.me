import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
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

test("projects workflow-generated post metadata into Astro content frontmatter", async () => {
  const root = await mkdtemp(join(tmpdir(), "local-content-"));
  const sourceDir = join(root, "source");
  const projectionDir = join(root, "posts");

  await mkdir(sourceDir, { recursive: true });
  await writeFile(
    join(sourceDir, "2026-05-10-runtime-notes.md"),
    ["---", 'title: "Runtime Notes"', "---", "", "本文です。", ""].join("\n"),
  );

  const projection = await buildProjectionFromSource({
    generateMetadata: ({ slug, source }) => {
      assert.equal(slug, "2026-05-10-runtime-notes");
      assert.equal(source.title, "Runtime Notes");
      return {
        tags: ["runtime", "notes"],
        series: { slug: "local-content", order: 1 },
        updatedAt: "2026-05-11T00:00:00.000Z",
        statusNote: "Updated after publication.",
        relatedPostSlugs: ["2026-05-09-previous-notes"],
      };
    },
    projectionDir,
    sourceDir,
    sourcePath: join(sourceDir, "2026-05-10-runtime-notes.md"),
  });

  assert.match(projection.content, /tags:\n {2}- "runtime"\n {2}- "notes"/);
  assert.match(projection.content, /series:\n {2}slug: "local-content"\n {2}order: 1/);
  assert.match(projection.content, /updatedAt: "2026-05-11T00:00:00.000Z"/);
  assert.match(projection.content, /statusNote: "Updated after publication."/);
  assert.match(projection.content, /relatedPostSlugs:\n {2}- "2026-05-09-previous-notes"/);
});

test("check mode detects stale projections when generated metadata changes", async () => {
  const root = await mkdtemp(join(tmpdir(), "local-content-"));
  const sourceDir = join(root, "source");
  const projectionDir = join(root, "posts");

  await Promise.all([mkdir(sourceDir, { recursive: true }), mkdir(projectionDir, { recursive: true })]);
  await writeFile(join(sourceDir, "2026-05-10-runtime-notes.md"), '---\ntitle: "Runtime Notes"\n---\n\n本文です。\n');
  await projectLocalContent({
    sourceDir,
    projectionDir,
    check: false,
    apply: true,
    generateMetadata: () => ({ tags: ["old"] }),
  });

  await assert.rejects(
    () =>
      projectLocalContent({
        sourceDir,
        projectionDir,
        check: true,
        apply: false,
        generateMetadata: () => ({ tags: ["new"] }),
      }),
    /local content projection is stale: 2026-05-10-runtime-notes\.md/,
  );
});

test("rejects invalid workflow-generated post metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "local-content-"));
  const sourceDir = join(root, "source");
  const projectionDir = join(root, "posts");

  await mkdir(sourceDir, { recursive: true });
  await writeFile(join(sourceDir, "2026-05-10-runtime-notes.md"), '---\ntitle: "Runtime Notes"\n---\n\n本文です。\n');

  await assert.rejects(
    () =>
      buildProjectionFromSource({
        generateMetadata: () => ({ tags: ["runtime", "runtime"] }),
        projectionDir,
        sourceDir,
        sourcePath: join(sourceDir, "2026-05-10-runtime-notes.md"),
      }),
    /tags must not contain duplicate values: runtime/,
  );

  await assert.rejects(
    () =>
      buildProjectionFromSource({
        generateMetadata: () => ({ relatedPostSlugs: ["post-a", "post-a"] }),
        projectionDir,
        sourceDir,
        sourcePath: join(sourceDir, "2026-05-10-runtime-notes.md"),
      }),
    /relatedPostSlugs must not contain duplicate values: post-a/,
  );
});

test("omits missing workflow-generated post metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "local-content-"));
  const sourceDir = join(root, "source");
  const projectionDir = join(root, "posts");

  await mkdir(sourceDir, { recursive: true });
  await writeFile(join(sourceDir, "2026-05-10-runtime-notes.md"), '---\ntitle: "Runtime Notes"\n---\n\n本文です。\n');

  const projection = await buildProjectionFromSource({
    generateMetadata: () => ({}),
    projectionDir,
    sourceDir,
    sourcePath: join(sourceDir, "2026-05-10-runtime-notes.md"),
  });

  assert.doesNotMatch(projection.content, /tags:/);
  assert.doesNotMatch(projection.content, /series:/);
  assert.doesNotMatch(projection.content, /updatedAt:/);
  assert.doesNotMatch(projection.content, /statusNote:/);
  assert.doesNotMatch(projection.content, /relatedPostSlugs:/);
});

test("rejects recall metadata in author source frontmatter", () => {
  assert.throws(
    () => parseAuthorSource('---\ntitle: "Runtime Notes"\ntags:\n  - runtime\n---\n\n本文です。\n'),
    /Unrecognized key.*tags/s,
  );
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

test("rejects and removes orphan projections without matching source", async () => {
  const root = await mkdtemp(join(tmpdir(), "local-content-"));
  const sourceDir = join(root, "source");
  const projectionDir = join(root, "posts");

  await Promise.all([mkdir(sourceDir, { recursive: true }), mkdir(projectionDir, { recursive: true })]);
  await writeFile(join(sourceDir, "2026-05-10-runtime-notes.md"), '---\ntitle: "Runtime Notes"\n---\n\n本文です。\n');
  const orphanPath = join(projectionDir, "2024-01-01-removed-post.md");
  await writeFile(orphanPath, "stale orphan\n");

  await assert.rejects(
    () => projectLocalContent({ sourceDir, projectionDir, check: true, apply: false }),
    /local content projection is stale:.*2024-01-01-removed-post\.md/,
  );

  await projectLocalContent({ sourceDir, projectionDir, check: false, apply: true });
  await assert.rejects(() => access(orphanPath), /ENOENT/);
});

test("omits seo.description when body has no extractable paragraph", async () => {
  const root = await mkdtemp(join(tmpdir(), "local-content-"));
  const sourceDir = join(root, "source");
  const projectionDir = join(root, "posts");

  await mkdir(sourceDir, { recursive: true });
  const sourcePath = join(sourceDir, "2026-05-10-image-only.md");
  await writeFile(sourcePath, '---\ntitle: "Image Only"\n---\n\n![alt](x.png)\n');

  const projection = await buildProjectionFromSource({ projectionDir, sourceDir, sourcePath });

  assert.match(projection.content, /seo:\n {2}title: "Image Only"\n---/);
  assert.doesNotMatch(projection.content, /description:/);
  assert.doesNotMatch(projection.content, /undefined/);
});
