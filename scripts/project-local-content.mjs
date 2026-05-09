#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { z } from "zod";

const DEFAULT_SOURCE_DIR = "src/content/source/posts";
const DEFAULT_METADATA_DIR = "src/content/metadata/posts";
const DEFAULT_PROJECTION_DIR = "src/content/posts";
const SUPPORTED_LOCALES = new Set(["ja", "en"]);

const optionalTextSchema = z.string().min(1).optional();
const localeSchema = z.enum(["ja", "en"]);

const sourceFrontmatterSchema = z
  .object({
    title: z.string().min(1),
  })
  .strict();

const acceptedMetadataSchema = z
  .object({
    slug: z.string().min(1),
    locale: localeSchema,
    description: optionalTextSchema,
    publishedAt: optionalTextSchema,
    updatedAt: optionalTextSchema,
    draft: z.boolean().default(true),
    tags: z.array(z.string().min(1)).default([]),
    series: z
      .object({
        slug: z.string().min(1),
        order: z.number().int().positive().optional(),
      })
      .strict()
      .optional(),
    seo: z
      .object({
        title: optionalTextSchema,
        description: optionalTextSchema,
      })
      .strict()
      .default({}),
    translation: z
      .object({
        disabled: z.boolean().default(false),
        sourceLocale: localeSchema.optional(),
        sourceSlug: optionalTextSchema,
        sourceVersion: optionalTextSchema,
      })
      .strict()
      .default({ disabled: false }),
    visibility: z.enum(["public", "unlisted"]).default("public"),
    statusNote: optionalTextSchema,
    redirects: z.array(z.string().min(1)).default([]),
    revision: z
      .object({
        source: optionalTextSchema,
        reconciled: z.boolean().default(false),
        notes: optionalTextSchema,
      })
      .strict()
      .default({ reconciled: false }),
  })
  .strict();

export function parseArgs(argv) {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  const options = {
    apply: false,
    check: false,
    force: false,
    initFromProjection: false,
    legacyDir: "_posts",
    metadataDir: DEFAULT_METADATA_DIR,
    projectionDir: DEFAULT_PROJECTION_DIR,
    recoverFromGit: "",
    sourceDir: DEFAULT_SOURCE_DIR,
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }
    if (arg === "--check") {
      options.check = true;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--init-from-projection") {
      options.initFromProjection = true;
      continue;
    }
    if (arg === "--recover-from-git") {
      options.recoverFromGit = readValue(args, ++index, "--recover-from-git");
      continue;
    }
    if (arg === "--legacy-dir") {
      options.legacyDir = readValue(args, ++index, "--legacy-dir");
      continue;
    }
    if (arg === "--source-dir") {
      options.sourceDir = readValue(args, ++index, "--source-dir");
      continue;
    }
    if (arg === "--metadata-dir") {
      options.metadataDir = readValue(args, ++index, "--metadata-dir");
      continue;
    }
    if (arg === "--projection-dir") {
      options.projectionDir = readValue(args, ++index, "--projection-dir");
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  if (options.apply === options.check) {
    throw new Error("Pass exactly one of --apply or --check");
  }

  return options;
}

export async function projectLocalContent(options) {
  const sourceDir = resolve(options.sourceDir);
  const metadataDir = resolve(options.metadataDir);
  const projectionDir = resolve(options.projectionDir);

  if (options.recoverFromGit) {
    return recoverAuthorSourceFromGit({
      check: options.check,
      force: options.force,
      legacyDir: options.legacyDir,
      metadataDir,
      sourceDir,
      treeish: options.recoverFromGit,
    });
  }

  if (options.initFromProjection) {
    return initFromProjection({ metadataDir, projectionDir, sourceDir, force: options.force, check: options.check });
  }

  const sourcePaths = await listFiles(sourceDir, ".md");
  const projections = await Promise.all(
    sourcePaths.map((sourcePath) => buildProjectionFromSource({ metadataDir, projectionDir, sourceDir, sourcePath })),
  );
  projections.sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  if (options.check) {
    const stale = [];
    for (const projection of projections) {
      const current = await readOptionalFile(projection.filePath);
      if (current !== projection.content) stale.push(projection.relativePath);
    }
    if (stale.length > 0) {
      throw new Error(`local content projection is stale: ${stale.join(", ")}`);
    }
  } else {
    for (const projection of projections) {
      await mkdir(dirname(projection.filePath), { recursive: true });
      await writeFile(projection.filePath, projection.content);
    }
  }

  return {
    ok: true,
    applied: options.apply,
    checked: options.check,
    initialized: false,
    projections: projections.length,
  };
}

export async function buildProjectionFromSource({ metadataDir, projectionDir, sourceDir, sourcePath }) {
  const relativePath = normalizeRelativePath(relative(sourceDir, sourcePath));
  const { locale, slug } = parseLocalizedMarkdownPath(relativePath);
  const source = parseAuthorSource(await readFile(sourcePath, "utf8"), relativePath);
  const metadataPath = join(metadataDir, `${locale}/${slug}.json`);
  const metadata = parseAcceptedMetadata(await readJsonFile(metadataPath), `${locale}/${slug}.json`);

  if (metadata.locale !== locale) {
    throw new Error(`metadata locale ${metadata.locale} does not match source path ${locale}/${slug}.md`);
  }
  if (metadata.slug !== slug) {
    throw new Error(`metadata slug ${metadata.slug} does not match source path ${locale}/${slug}.md`);
  }

  const projectionFrontmatter = compactObject({
    slug,
    locale,
    title: source.title,
    description: metadata.description,
    publishedAt: metadata.publishedAt,
    updatedAt: metadata.updatedAt,
    draft: metadata.draft,
    tags: metadata.tags,
    series: metadata.series,
    seo: metadata.seo,
    translation: metadata.translation,
    visibility: metadata.visibility === "public" ? undefined : metadata.visibility,
    statusNote: metadata.statusNote,
    redirects: metadata.redirects.length > 0 ? metadata.redirects : undefined,
  });

  return {
    filePath: join(projectionDir, relativePath),
    relativePath,
    content: `${serializeMarkdownFile(projectionFrontmatter, source.body)}\n`,
  };
}

export function parseAuthorSource(content, label = "author source") {
  const file = splitMarkdownFile(content, label);
  const frontmatter = sourceFrontmatterSchema.parse(parseYamlObject(file.frontmatter));
  const body = normalizeMarkdownBody(file.body);
  if (!body.trim()) throw new Error(`${label} body is empty`);
  return { title: frontmatter.title, body };
}

export function parseAcceptedMetadata(value, label = "accepted metadata") {
  return acceptedMetadataSchema.parse(value, { path: [label] });
}

export function serializeMarkdownFile(frontmatter, markdown) {
  return ["---", serializeYaml(frontmatter), "---", "", markdown.trimEnd()].join("\n");
}

async function initFromProjection({ metadataDir, projectionDir, sourceDir, force, check }) {
  const projectionPaths = await listFiles(projectionDir, ".md");
  const outputs = [];

  for (const projectionPath of projectionPaths) {
    const relativePath = normalizeRelativePath(relative(projectionDir, projectionPath));
    const { locale, slug } = parseLocalizedMarkdownPath(relativePath);
    const parsed = splitMarkdownFile(await readFile(projectionPath, "utf8"), relativePath);
    const frontmatter = parseYamlObject(parsed.frontmatter);
    const metadata = buildAcceptedMetadataFromProjection(frontmatter, locale, slug);
    const source = serializeMarkdownFile(
      { title: assertNonEmptyString(frontmatter.title, `${relativePath} title`) },
      normalizeMarkdownBody(parsed.body),
    );

    outputs.push({
      content: `${source}\n`,
      filePath: join(sourceDir, relativePath),
      relativePath,
      type: "source",
    });
    outputs.push({
      content: `${JSON.stringify(metadata, null, 2)}\n`,
      filePath: join(metadataDir, `${locale}/${slug}.json`),
      relativePath: `${locale}/${slug}.json`,
      type: "metadata",
    });
  }

  if (!check) {
    for (const output of outputs) {
      await mkdir(dirname(output.filePath), { recursive: true });
      await writeFile(output.filePath, output.content, { flag: force ? "w" : "wx" });
    }
  }

  return {
    ok: true,
    applied: !check,
    checked: check,
    initialized: true,
    files: outputs.length,
    projections: projectionPaths.length,
  };
}

async function recoverAuthorSourceFromGit({ check, force, legacyDir, metadataDir, sourceDir, treeish }) {
  const legacyPaths = listGitTreeFiles(treeish, legacyDir)
    .filter((path) => path.endsWith(".md"))
    .sort();
  const stale = [];
  let recovered = 0;

  for (const legacyPath of legacyPaths) {
    const slug = legacyPath.split("/").pop()?.replace(/\.md$/, "");
    if (!slug) throw new Error(`could not derive slug from ${legacyPath}`);
    const sourcePath = join(sourceDir, `ja/${slug}.md`);
    const metadataPath = join(metadataDir, `ja/${slug}.json`);
    const legacyContent = readGitFile(treeish, legacyPath);
    const parsed = splitMarkdownFile(legacyContent, `${treeish}:${legacyPath}`);
    const legacyFrontmatter = parseYamlObject(parsed.frontmatter);
    const legacyTitle = assertNonEmptyString(legacyFrontmatter.title, `${legacyPath} title`);
    const legacyDescription = optionalString(legacyFrontmatter.description);
    const currentMetadata = parseAcceptedMetadata(await readJsonFile(metadataPath), `ja/${slug}.json`);
    const nextSource = `${serializeMarkdownFile({ title: legacyTitle }, normalizeMarkdownBody(parsed.body))}\n`;
    const nextMetadata = {
      ...currentMetadata,
      ...(legacyDescription ? { description: legacyDescription } : {}),
      revision: {
        source: "git-history",
        reconciled: true,
        notes: `Recovered from ${treeish}:${legacyPath}`,
      },
    };
    const metadataContent = `${JSON.stringify(parseAcceptedMetadata(nextMetadata, `ja/${slug}.json`), null, 2)}\n`;

    if (check) {
      const currentSource = await readOptionalFile(sourcePath);
      const currentMetadataContent = await readOptionalFile(metadataPath);
      if (currentSource !== nextSource) stale.push(`source:ja/${slug}.md`);
      if (currentMetadataContent !== metadataContent) stale.push(`metadata:ja/${slug}.json`);
    } else {
      await mkdir(dirname(sourcePath), { recursive: true });
      await mkdir(dirname(metadataPath), { recursive: true });
      await writeFile(sourcePath, nextSource, { flag: force ? "w" : "wx" });
      await writeFile(metadataPath, metadataContent, { flag: force ? "w" : "wx" });
    }
    recovered++;
  }

  if (check && stale.length > 0) {
    throw new Error(`historical source recovery is stale: ${stale.join(", ")}`);
  }

  return {
    ok: true,
    applied: !check,
    checked: check,
    recovered,
    treeish,
  };
}

function buildAcceptedMetadataFromProjection(frontmatter, locale, slug) {
  const metadata = compactObject({
    slug,
    locale,
    description: optionalString(frontmatter.description),
    publishedAt: optionalString(frontmatter.publishedAt),
    updatedAt: optionalString(frontmatter.updatedAt),
    draft: frontmatter.draft ?? true,
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    series: frontmatter.series,
    seo: frontmatter.seo && typeof frontmatter.seo === "object" ? frontmatter.seo : {},
    translation:
      frontmatter.translation && typeof frontmatter.translation === "object"
        ? frontmatter.translation
        : { disabled: false },
    visibility: frontmatter.visibility ?? "public",
    statusNote: optionalString(frontmatter.statusNote),
    redirects: Array.isArray(frontmatter.redirects) ? frontmatter.redirects : [],
    revision: {
      source: "emdash-export",
      reconciled: false,
    },
  });
  return parseAcceptedMetadata(metadata, `${locale}/${slug}.json`);
}

function splitMarkdownFile(content, label) {
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error(`${label} must start with frontmatter`);
  }
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    throw new Error(`${label} frontmatter is not closed`);
  }
  return {
    frontmatter: normalized.slice(4, end),
    body: normalized.slice(end + "\n---\n".length),
  };
}

function normalizeMarkdownBody(body) {
  let inFence = false;
  return body
    .split("")
    .filter(isSupportedMarkdownCharacter)
    .join("")
    .replace(/^\n+/, "")
    .trimEnd()
    .split("\n")
    .map((line) => {
      const trimmedLine = line.trimStart();
      const opensOrClosesFence = trimmedLine.startsWith("```") || trimmedLine.startsWith("~~~");
      const normalizedLine = normalizeMarkdownLineEnd(line, inFence);
      if (opensOrClosesFence) inFence = !inFence;
      return normalizedLine;
    })
    .join("\n");
}

function isSupportedMarkdownCharacter(character) {
  const code = character.charCodeAt(0);
  if (code === 0x09 || code === 0x0a) return true;
  return (code >= 0x20 && code !== 0x7f) || code > 0x7f;
}

function normalizeMarkdownLineEnd(line, inFence) {
  if (inFence) return line.replace(/[ \t]+$/u, "");
  if (/[ \t]{2,}$/u.test(line)) return line.replace(/[ \t]+$/u, "\\");
  return line.replace(/[ \t]+$/u, "");
}

function parseYamlObject(yaml) {
  const root = {};
  const stack = [{ indent: -1, value: root }];
  const lines = yaml.split("\n");

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line.trim()) continue;
    const indent = line.match(/^ */)?.[0].length ?? 0;
    const trimmed = line.trim();

    while (stack.length > 1 && indent <= stack.at(-1).indent) stack.pop();
    const parent = stack.at(-1).value;

    if (trimmed.startsWith("- ")) {
      if (!Array.isArray(parent)) throw new Error(`unsupported YAML array item at line ${index + 1}`);
      parent.push(parseScalar(trimmed.slice(2)));
      continue;
    }

    const match = trimmed.match(/^([A-Za-z0-9_]+):(.*)$/);
    if (!match) throw new Error(`unsupported YAML line ${index + 1}: ${line}`);
    const [, key, rawValue] = match;
    const valueText = rawValue.trim();

    if (valueText) {
      parent[key] = parseScalar(valueText);
      continue;
    }

    const nestedValue = nextNonEmptyLineIsArray(lines, index, indent) ? [] : {};
    parent[key] = nestedValue;
    stack.push({ indent, value: nestedValue });
  }

  return root;
}

function nextNonEmptyLineIsArray(lines, index, indent) {
  for (let next = index + 1; next < lines.length; next++) {
    const line = lines[next];
    if (!line.trim()) continue;
    const nextIndent = line.match(/^ */)?.[0].length ?? 0;
    return nextIndent > indent && line.trim().startsWith("- ");
  }
  return false;
}

function parseScalar(value) {
  if (value === "[]") return [];
  if (value === "{}") return {};
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.startsWith('"')) return JSON.parse(value);
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/gu, "'");
  return value;
}

function serializeYaml(value, indent = 0) {
  return Object.entries(value)
    .map(([key, entry]) => serializeYamlEntry(key, entry, indent))
    .join("\n");
}

function serializeYamlEntry(key, value, indent) {
  const prefix = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${prefix}${key}: []`;
    return [`${prefix}${key}:`, ...value.map((item) => `${prefix}  - ${serializeScalar(item)}`)].join("\n");
  }
  if (value && typeof value === "object") {
    const serialized = serializeYaml(value, indent + 2);
    return serialized ? `${prefix}${key}:\n${serialized}` : `${prefix}${key}: {}`;
  }
  return `${prefix}${key}: ${serializeScalar(value)}`;
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
      if (entry && typeof entry === "object" && !Array.isArray(entry) && Object.keys(entry).length === 0) {
        return false;
      }
      return true;
    }),
  );
}

async function listFiles(root, extension) {
  const entries = await readdir(root, { withFileTypes: true }).catch((error) => {
    if (error && error.code === "ENOENT") return [];
    throw error;
  });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name);
      if (entry.isDirectory()) return listFiles(path, extension);
      if (entry.isFile() && entry.name.endsWith(extension)) return [path];
      return [];
    }),
  );
  return files.flat().sort();
}

async function readJsonFile(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${path} must be valid JSON: ${message}`);
  }
}

function listGitTreeFiles(treeish, path) {
  return execFileSync("git", ["ls-tree", "-r", "--name-only", treeish, "--", path], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
}

function readGitFile(treeish, path) {
  return execFileSync("git", ["show", `${treeish}:${path}`], { encoding: "utf8" });
}

async function readOptionalFile(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }
}

function parseLocalizedMarkdownPath(path) {
  const normalized = normalizeRelativePath(path);
  const match = normalized.match(/^([^/]+)\/([^/]+)\.md$/);
  if (!match) throw new Error(`expected <locale>/<slug>.md path, got ${path}`);
  const [, locale, slug] = match;
  if (!SUPPORTED_LOCALES.has(locale)) throw new Error(`unsupported locale: ${locale}`);
  if (slug === "." || slug === "..") throw new Error(`unsupported slug: ${slug}`);
  return { locale, slug };
}

function normalizeRelativePath(path) {
  return path.split("\\").join("/");
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function assertNonEmptyString(value, label) {
  const string = optionalString(value);
  if (!string) throw new Error(`${label} is required`);
  return string;
}

function readValue(argv, index, name) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  projectLocalContent(parseArgs(process.argv.slice(2)))
    .then((summary) => {
      console.log(JSON.stringify(summary, null, 2));
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(JSON.stringify({ ok: false, error: message }));
      process.exit(1);
    });
}
