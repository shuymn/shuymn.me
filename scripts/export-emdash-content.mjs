#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import Database from "better-sqlite3";
import { portableTextToTranslatableMarkdown } from "../src/lib/englishGeneration.ts";

const DEFAULT_DB_PATH = "data.db";
const DEFAULT_OUT_DIR = "src/content/posts";
const DEFAULT_SITE_SECTIONS_OUT_DIR = "src/content/site-sections";
const OPAQUE_BLOCK_PATTERN = /<!--ec:block\s+.+?-->/s;
const SUPPORTED_LOCALES = new Set(["ja", "en"]);
const STATUS_MAP = new Map([
  ["managed-published", "published"],
  ["failed", "failed"],
]);

export function parseArgs(argv) {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  const options = {
    dbPath: DEFAULT_DB_PATH,
    outDir: DEFAULT_OUT_DIR,
    siteSectionsOutDir: DEFAULT_SITE_SECTIONS_OUT_DIR,
    dryRun: false,
    apply: false,
    force: false,
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--db") {
      options.dbPath = readValue(args, ++index, "--db");
      continue;
    }
    if (arg === "--out-dir") {
      options.outDir = readValue(args, ++index, "--out-dir");
      continue;
    }
    if (arg === "--site-sections-out-dir") {
      options.siteSectionsOutDir = readValue(args, ++index, "--site-sections-out-dir");
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  if (options.dryRun === options.apply) {
    throw new Error("Pass exactly one of --dry-run or --apply");
  }

  return options;
}

export function buildPostExport(row, outDir = DEFAULT_OUT_DIR) {
  const slug = assertSlug(row.slug);
  const locale = assertLocale(row.locale);
  const portableText = parseJsonArray(row.content, `post ${locale}/${slug} content`);
  const markdown = portableTextToTranslatableMarkdown(portableText).trim();
  if (!markdown) {
    throw new Error(`post ${locale}/${slug} exported empty Markdown`);
  }
  if (OPAQUE_BLOCK_PATTERN.test(markdown)) {
    throw new Error(`post ${locale}/${slug} contains unsupported opaque Portable Text blocks`);
  }

  const frontmatter = compactObject({
    slug,
    locale,
    title: assertNonEmptyString(row.title, `post ${locale}/${slug} title`),
    description: optionalString(row.description),
    publishedAt: optionalString(row.published_at),
    updatedAt: optionalString(row.updated_at),
    draft: false,
    tags: [],
    seo: compactObject({
      title: optionalString(row.seo_title),
      description: optionalString(row.seo_description),
    }),
    translation: compactObject({
      disabled: row.english_generation_disabled === 1,
      sourceLocale: locale === "en" && optionalString(row.english_generation_source_slug) ? "ja" : undefined,
      sourceSlug: locale === "en" ? optionalString(row.english_generation_source_slug) : undefined,
      sourceVersion: locale === "en" ? optionalString(row.english_generation_source_version) : undefined,
    }),
    generation: compactObject({
      sourceHash: optionalString(row.english_generation_content_hash),
      status: mapGenerationStatus(row.english_generation_status),
    }),
  });

  const relativePath = `${locale}/${slug}.md`;
  const filePath = join(outDir, relativePath);
  return {
    locale,
    slug,
    relativePath,
    filePath,
    content: `${serializeMarkdownFile(frontmatter, markdown)}\n`,
  };
}

export function buildSiteSectionExport(row, outDir = DEFAULT_SITE_SECTIONS_OUT_DIR) {
  const slug = assertSlug(row.slug);
  const locale = assertLocale(row.locale);
  const portableText = parseJsonArray(row.content, `site section ${locale}/${slug} content`);
  const markdown = portableTextToTranslatableMarkdown(portableText).trim();
  if (!markdown) {
    throw new Error(`site section ${locale}/${slug} exported empty Markdown`);
  }
  if (OPAQUE_BLOCK_PATTERN.test(markdown)) {
    throw new Error(`site section ${locale}/${slug} contains unsupported opaque Portable Text blocks`);
  }

  const frontmatter = compactObject({
    slug,
    locale,
    title: assertNonEmptyString(row.title, `site section ${locale}/${slug} title`),
    publishedAt: optionalString(row.published_at),
    updatedAt: optionalString(row.updated_at),
    links: parseLinks(row.links, `site section ${locale}/${slug} links`),
  });

  const relativePath = `${locale}/${slug}.md`;
  const filePath = join(outDir, relativePath);
  return {
    locale,
    slug,
    relativePath,
    filePath,
    content: `${serializeMarkdownFile(frontmatter, markdown)}\n`,
  };
}

export function serializeMarkdownFile(frontmatter, markdown) {
  return ["---", serializeYaml(frontmatter), "---", "", markdown].join("\n");
}

export function serializeYaml(value, indent = 0) {
  return Object.entries(value)
    .map(([key, entry]) => serializeYamlEntry(key, entry, indent))
    .join("\n");
}

async function run(options) {
  const dbPath = resolve(options.dbPath);
  const outDir = resolve(options.outDir);
  const siteSectionsOutDir = resolve(options.siteSectionsOutDir);
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    const posts = selectPublishedPosts(db);
    const siteSections = selectPublishedSiteSections(db);
    const postExports = posts.map((post) => buildPostExport(post, outDir));
    const siteSectionExports = siteSections.map((siteSection) =>
      buildSiteSectionExport(siteSection, siteSectionsOutDir),
    );
    const summary = buildSummary({
      dbPath,
      outDir,
      siteSectionsOutDir,
      posts,
      siteSections,
      postExports,
      siteSectionExports,
    });

    if (!options.apply) {
      console.log(JSON.stringify({ ok: true, dryRun: true, applied: false, ...summary }, null, 2));
      return;
    }

    for (const item of [...postExports, ...siteSectionExports]) {
      await mkdir(dirname(item.filePath), { recursive: true });
      await writeFile(item.filePath, item.content, { flag: options.force ? "w" : "wx" });
    }

    console.log(JSON.stringify({ ok: true, dryRun: false, applied: true, ...summary }, null, 2));
  } finally {
    db.close();
  }
}

function selectPublishedPosts(db) {
  return db
    .prepare(`
      select
        p.id,
        p.slug,
        p.locale,
        p.status,
        p.title,
        p.description,
        p.published_at,
        p.updated_at,
        p.content,
        p.english_generation_disabled,
        p.english_generation_status,
        p.english_generation_source_slug,
        p.english_generation_source_version,
        p.english_generation_content_hash,
        seo.seo_title,
        seo.seo_description
      from ec_posts p
      left join _emdash_seo seo
        on seo.collection = 'posts'
       and seo.content_id = p.id
      where p.deleted_at is null
        and p.status = 'published'
      order by p.locale asc, p.published_at desc, p.slug asc
    `)
    .all();
}

function selectPublishedSiteSections(db) {
  return db
    .prepare(`
      select locale, status, slug, title, published_at, updated_at, content, links
      from ec_site_sections
      where deleted_at is null
        and status = 'published'
      order by locale asc, slug asc
    `)
    .all();
}

function buildSummary({ dbPath, outDir, siteSectionsOutDir, posts, siteSections, postExports, siteSectionExports }) {
  return {
    dbPath,
    outDir,
    siteSectionsOutDir,
    counts: {
      posts: posts.length,
      siteSections: siteSections.length,
      exportedPostFiles: postExports.length,
      exportedSiteSectionFiles: siteSectionExports.length,
      exportedFiles: postExports.length + siteSectionExports.length,
    },
    postsByLocale: countBy(posts, "locale"),
    siteSectionsByLocale: countBy(siteSections, "locale"),
    postFiles: postExports.map((item) => item.relativePath),
    siteSectionFiles: siteSectionExports.map((item) => item.relativePath),
  };
}

function serializeYamlEntry(key, value, indent) {
  const prefix = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${prefix}${key}: []`;
    return [`${prefix}${key}:`, ...value.flatMap((item) => serializeYamlArrayItem(item, indent + 2))].join("\n");
  }
  if (value && typeof value === "object") {
    const serialized = serializeYaml(value, indent + 2);
    return serialized ? `${prefix}${key}:\n${serialized}` : `${prefix}${key}: {}`;
  }
  return `${prefix}${key}: ${serializeScalar(value)}`;
}

function serializeYamlArrayItem(value, indent) {
  const prefix = " ".repeat(indent);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return [`${prefix}- {}`];
    const [[firstKey, firstValue], ...rest] = entries;
    return [
      `${prefix}- ${firstKey}: ${serializeScalar(firstValue)}`,
      ...rest.map(([key, entry]) => `${prefix}  ${key}: ${serializeScalar(entry)}`),
    ];
  }
  return [`${prefix}- ${serializeScalar(value)}`];
}

function serializeScalar(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (value === null) return "null";
  return JSON.stringify(String(value));
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry === undefined || entry === null) return false;
      if (typeof entry === "string" && entry.trim() === "") return false;
      if (entry && typeof entry === "object" && !Array.isArray(entry) && Object.keys(entry).length === 0) return false;
      return true;
    }),
  );
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function assertNonEmptyString(value, label) {
  const string = optionalString(value);
  if (!string) throw new Error(`${label} is required`);
  return string;
}

function assertSlug(value) {
  const slug = assertNonEmptyString(value, "slug");
  if (slug.includes("/") || slug.includes("\\") || slug === "." || slug === "..") {
    throw new Error(`unsupported slug path segment: ${slug}`);
  }
  return slug;
}

function assertLocale(value) {
  const locale = assertNonEmptyString(value, "locale");
  if (!SUPPORTED_LOCALES.has(locale)) {
    throw new Error(`unsupported locale: ${locale}`);
  }
  return locale;
}

function parseJsonArray(value, label) {
  try {
    const parsed = JSON.parse(assertNonEmptyString(value, label));
    if (!Array.isArray(parsed)) {
      throw new Error("not an array");
    }
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} must be a JSON array: ${message}`);
  }
}

function parseLinks(value, label) {
  if (!optionalString(value)) return [];
  return parseJsonArray(value, label).map((entry, index) => {
    const record = entry && typeof entry === "object" && !Array.isArray(entry) ? entry : {};
    return {
      label: assertNonEmptyString(record.label, `${label}[${index}].label`),
      url: assertNonEmptyString(record.url, `${label}[${index}].url`),
    };
  });
}

function mapGenerationStatus(value) {
  const status = optionalString(value);
  if (!status) return undefined;
  return STATUS_MAP.get(status) ?? undefined;
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = String(row[key] ?? "");
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function readValue(argv, index, name) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

export const testInternals = {
  buildSummary,
  compactObject,
  countBy,
  mapGenerationStatus,
  parseArgs,
  parseLinks,
};

if (import.meta.url === `file://${process.argv[1]}`) {
  run(parseArgs(process.argv.slice(2))).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ ok: false, error: message }));
    process.exit(1);
  });
}
