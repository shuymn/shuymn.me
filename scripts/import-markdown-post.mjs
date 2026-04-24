import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { pathToFileURL } from "node:url";
import { markdownToPortableText } from "emdash/client";

const DATE_SLUG_PATTERN = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/;
const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
const TABLE_SEPARATOR_CELL_PATTERN = /^:?-+:?$/;
const OWNER_ENV_KEY = "EMDASH_OWNER";
const OWNER_ID_ENV_KEY = "EMDASH_OWNER_ID";

export function parseArgs(argv) {
  const args = {
    locale: "ja",
    url: process.env.EMDASH_URL ?? "http://localhost:4321",
    token: process.env.EMDASH_TOKEN,
    headers: parseHeaderStrings((process.env.EMDASH_HEADERS ?? "").split("\n")),
    owner: process.env[OWNER_ENV_KEY],
    ownerId: process.env[OWNER_ID_ENV_KEY],
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--file":
        args.file = argv[++index];
        break;
      case "--url":
        args.url = argv[++index];
        break;
      case "--locale":
        args.locale = argv[++index];
        break;
      case "--token":
        args.token = argv[++index];
        break;
      case "--owner":
        args.owner = argv[++index];
        break;
      case "--owner-id":
        args.ownerId = argv[++index];
        break;
      case "--header":
      case "-H": {
        const parsed = parseHeader(argv[++index]);
        if (parsed) {
          args.headers[parsed.name] = parsed.value;
        }
        break;
      }
      case "--dry-run":
        args.dryRun = true;
        break;
      default:
        if (!args.file) {
          args.file = arg;
          break;
        }
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.file) {
    throw new Error(
      "Usage: node scripts/import-markdown-post.mjs --file _posts/YYYY-MM-DD-slug.md [--url https://example.com] [--token TOKEN] [--owner EMAIL_OR_ID | --owner-id USER_ID]",
    );
  }

  args.owner = normalizeOptionalString(args.owner);
  args.ownerId = normalizeOptionalString(args.ownerId);

  if (args.owner && args.ownerId) {
    throw new Error("Use either --owner or --owner-id, not both");
  }

  return args;
}

function normalizeOptionalString(value) {
  if (value === undefined) return undefined;
  const normalized = String(value).trim();
  return normalized || undefined;
}

function parseHeader(value) {
  const separatorIndex = value.indexOf(":");
  if (separatorIndex === -1) return null;

  const name = value.slice(0, separatorIndex).trim();
  const headerValue = value.slice(separatorIndex + 1).trim();
  if (!name) return null;

  return { name, value: headerValue };
}

function parseHeaderStrings(values) {
  const headers = {};
  for (const value of values) {
    const parsed = parseHeader(value.trim());
    if (parsed) {
      headers[parsed.name] = parsed.value;
    }
  }
  return headers;
}

function parseFrontmatter(source) {
  const match = source.match(FRONTMATTER_PATTERN);
  if (!match) {
    throw new Error("Markdown file must start with YAML frontmatter");
  }

  const data = {};
  for (const line of match[1].split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    data[key] = rawValue.replace(/^["']|["']$/g, "");
  }

  return { data, body: match[2].trim() };
}

function deriveSlugAndDate(file) {
  const match = basename(file).match(DATE_SLUG_PATTERN);
  if (!match) {
    throw new Error("Markdown filename must be YYYY-MM-DD-slug.md");
  }

  return {
    date: match[1],
    slug: basename(file).replace(/\.md$/, ""),
  };
}

function toIsoDate(date) {
  return `${date}T00:00:00.000Z`;
}

function markdownToEmDashPortableText(markdown) {
  const blocks = [];
  const lines = markdown.split("\n");
  const textBuffer = [];
  let index = 0;

  function flushTextBuffer() {
    const text = textBuffer.join("\n").trim();
    if (text) {
      blocks.push(...markdownToPortableText(text));
    }
    textBuffer.length = 0;
  }

  while (index < lines.length) {
    if (isTableStart(lines, index)) {
      flushTextBuffer();

      const tableLines = [lines[index], ...collectTableBodyLines(lines, index + 2)];
      blocks.push(makeTableBlock(tableLines));
      index += tableLines.length + 1;
      continue;
    }

    textBuffer.push(lines[index]);
    index += 1;
  }

  flushTextBuffer();
  return blocks;
}

function isTableStart(lines, index) {
  const header = lines[index];
  const separator = lines[index + 1];
  if (!isTableRow(header) || !isTableRow(separator)) return false;

  const headerCells = splitTableRow(header);
  const separatorCells = splitTableRow(separator);

  return (
    headerCells.length >= 2 &&
    headerCells.length === separatorCells.length &&
    separatorCells.every((cell) => TABLE_SEPARATOR_CELL_PATTERN.test(cell.trim()))
  );
}

function collectTableBodyLines(lines, startIndex) {
  const tableLines = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (!isTableRow(line)) break;
    tableLines.push(line);
  }
  return tableLines;
}

function isTableRow(line) {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

export function splitTableRow(line) {
  const trimmed = line.trim();
  const withoutEdges = trimmed.slice(1, -1);
  const cells = [];
  let current = "";

  for (let index = 0; index < withoutEdges.length; index += 1) {
    const char = withoutEdges[index];
    if (char === "\\") {
      if (withoutEdges[index + 1] === "|") {
        current += "|";
        index += 1;
      } else {
        current += char;
      }
      continue;
    }

    if (char === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function makeTableBlock(tableLines) {
  const columnCount = splitTableRow(tableLines[0]).length;
  return {
    _type: "table",
    _key: generateImportKey("table"),
    hasHeaderRow: true,
    rows: tableLines.map((line) => ({
      _type: "tableRow",
      _key: generateImportKey("row"),
      cells: normalizeCells(splitTableRow(line), columnCount).map((cell) => makeTableCell(cell)),
    })),
  };
}

function normalizeCells(cells, columnCount) {
  return Array.from({ length: columnCount }, (_, index) => cells[index] ?? "");
}

function makeTableCell(markdown) {
  const block = markdownToPortableText(markdown)[0];
  return {
    _type: "tableCell",
    _key: generateImportKey("cell"),
    content:
      block?._type === "block" && Array.isArray(block.children)
        ? block.children
        : [{ _type: "span", _key: generateImportKey("span"), text: "", marks: [] }],
    markDefs: block?._type === "block" && Array.isArray(block.markDefs) ? block.markDefs : [],
  };
}

let importKeyCounter = 0;

function generateImportKey(prefix) {
  importKeyCounter += 1;
  return `${prefix}_${importKeyCounter.toString(36)}`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = json?.error?.message ?? `${response.status} ${response.statusText}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = json?.error?.code;
    throw error;
  }

  return { json, response };
}

async function getDevSession(baseUrl) {
  const response = await fetch(new URL("/_emdash/api/auth/dev-bypass", baseUrl), {
    redirect: "manual",
  });
  const setCookie = response.headers.get("set-cookie");

  if (response.body) {
    await response.text().catch(() => {});
  }

  const cookie = setCookie?.match(/^([^;]+)/)?.[1];
  if (!cookie) {
    throw new Error("Could not establish EmDash dev-bypass session");
  }

  return cookie;
}

function isLocalUrl(baseUrl) {
  return baseUrl.hostname === "localhost" || baseUrl.hostname === "127.0.0.1";
}

async function createAuthHeaders(args, baseUrl) {
  const headers = {
    ...args.headers,
    "Content-Type": "application/json",
    "X-EmDash-Request": "1",
    Origin: baseUrl.origin,
  };

  if (args.token) {
    headers.Authorization = `Bearer ${args.token}`;
    return headers;
  }

  if (isLocalUrl(baseUrl)) {
    headers.Cookie = await getDevSession(baseUrl);
    return headers;
  }

  throw new Error("Set EMDASH_TOKEN or pass --token when importing into a non-local EmDash site");
}

function normalizeOwnerComparable(value) {
  return normalizeOptionalString(value)?.toLowerCase();
}

export function selectOwnerUser(users, owner) {
  const normalizedOwner = normalizeOwnerComparable(owner);
  if (!normalizedOwner) {
    throw new Error("Owner must not be empty");
  }

  const matches = users.filter((user) => {
    return (
      normalizeOwnerComparable(user.id) === normalizedOwner ||
      normalizeOwnerComparable(user.email) === normalizedOwner ||
      normalizeOwnerComparable(user.name) === normalizedOwner
    );
  });

  if (matches.length === 0) {
    throw new Error(`Could not find EmDash owner "${owner}"`);
  }

  if (matches.length > 1) {
    throw new Error(`Owner "${owner}" matched multiple EmDash users; pass --owner-id instead`);
  }

  return matches[0];
}

async function getUserById(ownerId, baseUrl, headers) {
  try {
    const result = await requestJson(new URL(`/_emdash/api/admin/users/${encodeURIComponent(ownerId)}`, baseUrl), {
      method: "GET",
      headers,
    });
    return result.json.data.item;
  } catch (error) {
    if (error instanceof Error && error.status === 404) {
      return null;
    }
    throw error;
  }
}

async function listUsersForOwner(owner, baseUrl, headers) {
  const url = new URL("/_emdash/api/admin/users", baseUrl);
  url.searchParams.set("search", owner);
  url.searchParams.set("limit", "100");

  const result = await requestJson(url, {
    method: "GET",
    headers,
  });

  return result.json.data.items;
}

async function resolveOwnerId(args, baseUrl, headers) {
  if (args.ownerId) {
    return args.ownerId;
  }

  if (!args.owner) {
    return undefined;
  }

  const directUser = await getUserById(args.owner, baseUrl, headers);
  if (directUser) {
    return directUser.id;
  }

  const users = await listUsersForOwner(args.owner, baseUrl, headers);
  return selectOwnerUser(users, args.owner).id;
}

export function assertOwnerApplied(item, ownerId) {
  if (!ownerId || item?.authorId === ownerId) {
    return;
  }

  throw new Error(
    `Could not set EmDash owner to "${ownerId}". The authenticated user must have permission to edit any content owner.`,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = await readFile(args.file, "utf-8");
  const { data: frontmatter, body } = parseFrontmatter(source);
  const { date, slug } = deriveSlugAndDate(args.file);
  const title = frontmatter.title;

  if (!title) {
    throw new Error("Frontmatter must include title");
  }

  const publishedAt = toIsoDate(frontmatter.date || date);
  const payload = {
    data: {
      title,
      description: "",
      content: markdownToEmDashPortableText(body),
    },
    slug,
    locale: args.locale,
    createdAt: publishedAt,
    publishedAt,
    seo: {
      title,
      description: frontmatter.description ?? "",
    },
  };

  if (args.dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const baseUrl = new URL(args.url);
  const headers = await createAuthHeaders(args, baseUrl);
  const ownerId = await resolveOwnerId(args, baseUrl, headers);

  const createResult = await requestJson(new URL("/_emdash/api/content/posts", baseUrl), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  let item = createResult.json.data.item;

  if (ownerId && item.authorId !== ownerId) {
    const updateResult = await requestJson(new URL(`/_emdash/api/content/posts/${item.id}`, baseUrl), {
      method: "PUT",
      headers,
      body: JSON.stringify({ authorId: ownerId }),
    });
    item = updateResult.json.data.item;
    assertOwnerApplied(item, ownerId);
  }

  await requestJson(new URL(`/_emdash/api/content/posts/${item.id}/publish`, baseUrl), {
    method: "POST",
    headers,
  });

  console.log(
    JSON.stringify(
      {
        id: item.id,
        slug: item.slug,
        locale: item.locale,
        ownerId: item.authorId,
        publishedAt,
        title,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
