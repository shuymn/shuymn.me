import assert from "node:assert/strict";
import test from "node:test";
import { buildPostExport, buildSiteSectionExport, serializeYaml, testInternals } from "./export-emdash-content.mjs";

function textBlock(text, extra = {}) {
  return {
    _type: "block",
    _key: "block1",
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: "span1", text, marks: [] }],
    ...extra,
  };
}

test("parseArgs requires exactly one mode", () => {
  assert.throws(() => testInternals.parseArgs([]), /exactly one/);
  assert.throws(() => testInternals.parseArgs(["--dry-run", "--apply"]), /exactly one/);
  assert.deepEqual(testInternals.parseArgs(["--dry-run"]), {
    dbPath: "data.db",
    outDir: "src/content/posts",
    siteSectionsOutDir: "src/content/site-sections",
    dryRun: true,
    apply: false,
    force: false,
  });
  assert.equal(testInternals.parseArgs(["--", "--apply"]).apply, true);
  assert.equal(
    testInternals.parseArgs(["--dry-run", "--site-sections-out-dir", "/tmp/sections"]).siteSectionsOutDir,
    "/tmp/sections",
  );
});

test("buildPostExport serializes strict local-post frontmatter and Markdown body", () => {
  const result = buildPostExport(
    {
      slug: "hello-world",
      locale: "en",
      status: "published",
      title: "Hello World",
      description: "",
      published_at: "2026-05-09T00:00:00.000Z",
      updated_at: "2026-05-09T01:00:00.000Z",
      content: JSON.stringify([textBlock("Hello **world**")]),
      english_generation_disabled: 0,
      english_generation_status: "managed-published",
      english_generation_source_slug: "hello-world",
      english_generation_source_version: "source-v1",
      english_generation_content_hash: "abc123",
      seo_title: "",
      seo_description: "SEO description",
    },
    "/tmp/posts",
  );

  assert.equal(result.relativePath, "en/hello-world.md");
  assert.match(result.content, /slug: "hello-world"/);
  assert.match(result.content, /locale: "en"/);
  assert.doesNotMatch(result.content, /description: ""/);
  assert.match(result.content, /sourceLocale: "ja"/);
  assert.match(result.content, /sourceSlug: "hello-world"/);
  assert.match(result.content, /status: "published"/);
  assert.match(result.content, /Hello \*\*world\*\*/);
});

test("buildPostExport converts EmDash table blocks to Markdown tables", () => {
  const result = buildPostExport({
    slug: "with-table",
    locale: "ja",
    status: "published",
    title: "With Table",
    published_at: "2026-05-09T00:00:00.000Z",
    updated_at: "2026-05-09T00:00:00.000Z",
    content: JSON.stringify([textBlock("比較です。"), tableBlock()]),
  });

  assert.doesNotMatch(result.content, /ec:block/);
  assert.match(result.content, /\| 左 \| 右 \|/);
  assert.match(result.content, /\| \[Gatsby]\(https:\/\/www\.gatsbyjs\.com\/\) \| Netlify \|/);
});

test("buildPostExport rejects opaque Portable Text blocks", () => {
  assert.throws(
    () =>
      buildPostExport({
        slug: "opaque",
        locale: "ja",
        status: "published",
        title: "Opaque",
        published_at: "2026-05-09T00:00:00.000Z",
        updated_at: "2026-05-09T00:00:00.000Z",
        content: JSON.stringify([textBlock("<!--ec:block {}-->")]),
      }),
    /opaque Portable Text blocks/,
  );
});

test("buildSiteSectionExport serializes home about content and links", () => {
  const result = buildSiteSectionExport(
    {
      slug: "home-about",
      locale: "ja",
      status: "published",
      title: "Home About",
      published_at: "2026-05-09T00:00:00.000Z",
      updated_at: "2026-05-09T01:00:00.000Z",
      content: JSON.stringify([textBlock("プロフィールです。")]),
      links: JSON.stringify([{ label: "GitHub", url: "https://github.com/shuymn" }]),
    },
    "/tmp/site-sections",
  );

  assert.equal(result.relativePath, "ja/home-about.md");
  assert.match(result.content, /links:/);
  assert.match(result.content, /label: "GitHub"/);
  assert.match(result.content, /プロフィールです。/);
});

test("serializeYaml emits stable nested objects and empty arrays", () => {
  assert.equal(
    serializeYaml({
      slug: "post",
      draft: false,
      tags: [],
      translation: { disabled: false },
    }),
    ['slug: "post"', "draft: false", "tags: []", "translation:", "  disabled: false"].join("\n"),
  );
});

function tableBlock() {
  return {
    _type: "table",
    _key: "table1",
    hasHeaderRow: true,
    rows: [
      {
        _type: "tableRow",
        _key: "row1",
        cells: [tableCell("左"), tableCell("右")],
      },
      {
        _type: "tableRow",
        _key: "row2",
        cells: [tableCell("Gatsby", "https://www.gatsbyjs.com/"), tableCell("Netlify")],
      },
    ],
  };
}

function tableCell(text, href) {
  const markDefs = href ? [{ _key: `${text}-link`, _type: "link", href }] : [];
  return {
    _type: "tableCell",
    _key: `cell-${text}`,
    content: [{ _type: "span", _key: `span-${text}`, text, marks: href ? [`${text}-link`] : [] }],
    markDefs,
  };
}
