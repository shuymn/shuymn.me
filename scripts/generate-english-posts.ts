#!/usr/bin/env node

import { createHash } from "node:crypto";
import { APICallError, generateText, type LanguageModel, Output, tool } from "ai";
import { createAiGateway } from "ai-gateway-provider";
import { createOpenRouter } from "ai-gateway-provider/providers/openrouter";
import type { ContentItem } from "emdash/client";
import { type ArgValues, cli, define } from "gunshi";
import {
  asRecord,
  buildEnglishGenerationData,
  buildEnglishGenerationSeo,
  buildReviewPrompt,
  buildTranslationEditPrompt,
  buildTranslationPrompt,
  type ContentItemLike,
  classifyExistingEnglishCandidate,
  EDIT_PROMPT_VERSION,
  ENGLISH_GENERATION_FAILED,
  ENGLISH_GENERATION_MANAGED_PUBLISHED,
  ENGLISH_LOCALE,
  getContentMarkdown,
  getStringField,
  type JsonRecord,
  type NormalizedSourcePost,
  normalizeSourcePost,
  normalizeTranslationPayload,
  precheckSourcePost,
  REVIEW_PROMPT_VERSION,
  type ReviewPayload,
  reviewPayloadSchema,
  runDeterministicChecks,
  runTranslationReviewFixLoop,
  SOURCE_LOCALE,
  TRANSLATION_NOTE_VERSION,
  TRANSLATION_PROMPT_VERSION,
  type TranslationEditPayload,
  type TranslationPayload,
  translationEditPayloadSchema,
  translationPayloadSchema,
} from "../src/lib/englishGeneration.ts";
import {
  createEmDashClient,
  type EmDashConnectionCliValues,
  type EmDashConnectionOptions,
  emdashConnectionArgs,
  readOptionalString,
  resolveEmDashConnectionOptions,
} from "./lib/emdashConnection.ts";
import { formatCliError, normalizeScriptArgv, resolveHostCliValues } from "./lib/hostCli.ts";

const DEFAULT_LIMIT = 25;
const DEFAULT_MAX_FIX_ATTEMPTS = 1;
const POSTS_COLLECTION = "posts";

type Client = ReturnType<typeof createEmDashClient>;
type ContentItemWithSeo = ContentItem & { seo?: unknown; _rev?: string };

type CliOptions = EmDashConnectionOptions & {
  providerApiKey?: string;
  cfAiGatewayAccountId?: string;
  cfAiGatewayGateway?: string;
  cfAiGatewayToken?: string;
  model?: string;
  editModel?: string;
  reviewModel?: string;
  source?: string;
  limit: number;
  maxFixAttempts: number;
  regenerate: boolean;
  force: boolean;
  dryRun: boolean;
  temperature?: number;
};

type EnglishGenerationCliValues = EmDashConnectionCliValues &
  ArgValues<typeof englishGenerationArgs> & {
    providerApiKey?: string;
    cfAigAccountId?: string;
    cfAigGateway?: string;
    cfAigToken?: string;
    model?: string;
    editModel?: string;
    reviewModel?: string;
    source?: string;
    limit?: number;
    maxFixAttempts?: number;
    regenerate?: boolean;
    force?: boolean;
    dryRun?: boolean;
    temperature?: number;
  };

type EnglishGenerationProvider = {
  translationModel: LanguageModel;
  editModel: LanguageModel;
  reviewModel: LanguageModel;
  temperature?: number;
};

type ContentSeoInput = {
  title?: string | null;
  description?: string | null;
};

type ProcessResult = {
  sourceId: string;
  sourceSlug: string | null;
  status: string;
  [key: string]: unknown;
};

async function main(argv: string[], env: NodeJS.ProcessEnv): Promise<void> {
  const normalizedArgv = normalizeScriptArgv(argv);
  const command = define({
    name: "generate:english",
    description: "Generate English EmDash posts from published Japanese posts",
    args: englishGenerationArgs,
    toKebab: true,
    rendering: {
      header: null,
      validationErrors: null,
    },
    run: async (ctx) => {
      await runGenerateEnglish(parseArgs(ctx._, env));
    },
  });

  await cli(normalizedArgv, command, { name: "generate:english" });
}

async function runGenerateEnglish(options: CliOptions): Promise<void> {
  const client = createEmDashClient(options);
  const provider = options.dryRun ? null : createEnglishGenerationProvider(options);
  const results: ProcessResult[] = [];

  let processed = 0;
  for await (const listedSource of client.listAll(POSTS_COLLECTION, {
    status: "published",
    locale: SOURCE_LOCALE,
    limit: Math.min(options.limit, DEFAULT_LIMIT),
    orderBy: "updatedAt",
    order: "desc",
  })) {
    if (processed >= options.limit) break;
    if (options.source && ![listedSource.id, listedSource.slug].includes(options.source)) continue;

    processed++;
    const source = listedSource as ContentItemWithSeo;
    try {
      results.push(await processSourcePost({ client, provider, source, options }));
    } catch (error) {
      const serializedError = serializeError(error);
      const result: ProcessResult = {
        sourceId: source.id,
        sourceSlug: source.slug,
        status: "error",
        error: serializedError.message,
        ...(serializedError.details ? { errorDetails: serializedError.details } : {}),
      };
      results.push(result);
      if (result.status === "error") break;
    }
  }

  const summary = {
    ok: results.every((result) => result.status !== "error"),
    dryRun: options.dryRun,
    processed: results.length,
    results,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) {
    process.exitCode = 1;
  }
}

const englishGenerationArgs = {
  ...emdashConnectionArgs,
  providerApiKey: {
    type: "string",
    description: "OpenRouter API key",
  },
  cfAigAccountId: {
    type: "string",
    description: "Cloudflare AI Gateway account ID",
  },
  cfAigGateway: {
    type: "string",
    description: "Cloudflare AI Gateway name",
  },
  cfAigToken: {
    type: "string",
    description: "Cloudflare AI Gateway token",
  },
  model: {
    type: "string",
    description: "Translation model",
  },
  editModel: {
    type: "string",
    description: "Diff edit model (default: translation model)",
  },
  reviewModel: {
    type: "string",
    description: "Separate review model",
  },
  source: {
    type: "string",
    description: "Limit to one Japanese source post",
  },
  limit: {
    type: "number",
    description: "Maximum published Japanese posts to scan",
  },
  maxFixAttempts: {
    type: "number",
    description: `Review-driven diff edit attempts per post (default: ${DEFAULT_MAX_FIX_ATTEMPTS})`,
  },
  regenerate: {
    type: "boolean",
    description: "Explicitly regenerate when the source version changed",
  },
  force: {
    type: "boolean",
    description: "Override manual-edit protection",
  },
  dryRun: {
    type: "boolean",
    description: "Scan and classify without calling the provider or writing content",
  },
  temperature: {
    type: "number",
    description: "Optional sampling temperature; omitted by default",
  },
} as const;

export async function processSourcePost({
  client,
  provider,
  source,
  options,
}: {
  client: Client;
  provider: EnglishGenerationProvider | null;
  source: ContentItem;
  options: CliOptions;
}): Promise<ProcessResult> {
  const precheck = precheckSourcePost(source);
  if (!precheck.passed) {
    return {
      sourceId: source.id,
      sourceSlug: source.slug,
      status: "precheck_failed",
      failures: precheck.failures,
    };
  }

  const normalizedSource = precheck.source;
  const sourceVersion = buildSourceVersion(normalizedSource);
  const existing = await getExistingEnglishTranslation(client, normalizedSource.id);
  const currentContentHash = existing ? buildContentHash(existing) : "";
  const classification = classifyExistingEnglishCandidate({
    existing,
    sourceVersion,
    currentContentHash,
    regenerate: options.regenerate,
    force: options.force,
  });

  const linkedEnglishRepair =
    existing && shouldRepairLinkedEnglish(classification)
      ? buildLinkedEnglishRepair({ existing, source: normalizedSource })
      : null;
  if (existing && linkedEnglishRepair?.needsRepair) {
    if (options.dryRun) {
      return {
        sourceId: normalizedSource.id,
        sourceSlug: normalizedSource.slug,
        status: "dry_run_repair_linked_english",
        reason: "linked English metadata differs from source-derived rules",
        existingId: existing.id,
        repairs: linkedEnglishRepair.reasons,
      };
    }

    const updated = await updateContent(client, existing.id, {
      ...linkedEnglishRepair.update,
      _rev: requireExistingRevision(existing),
    });
    return {
      sourceId: normalizedSource.id,
      sourceSlug: normalizedSource.slug,
      status: "linked_english_repaired",
      reason: "linked English metadata differed from source-derived rules",
      existingId: updated.id,
      repairs: linkedEnglishRepair.reasons,
      englishSlug: updated.slug,
    };
  }

  if (classification.action === "skip") {
    return {
      sourceId: normalizedSource.id,
      sourceSlug: normalizedSource.slug,
      status: "skipped",
      reason: classification.reason,
      existingId: existing?.id,
    };
  }

  if (options.dryRun) {
    return {
      sourceId: normalizedSource.id,
      sourceSlug: normalizedSource.slug,
      status: `dry_run_${classification.action}`,
      reason: classification.reason,
      sourceVersion,
      existingId: existing?.id,
    };
  }

  if (!provider) {
    throw new Error("provider is required outside dry-run mode");
  }

  const initialTranslation = await translatePost(provider, normalizedSource);
  const fixLoop = await runTranslationReviewFixLoop({
    source: normalizedSource,
    initialTranslation,
    maxFixAttempts: options.maxFixAttempts,
    review: (translation) => reviewTranslation(provider, normalizedSource, translation),
    edit: ({ translation, review, attempt }) =>
      editTranslation(provider, normalizedSource, translation, review, attempt),
  });
  const { translation, review, editAttempts } = fixLoop;
  const gate = runDeterministicChecks({
    source: normalizedSource,
    translation,
    review,
    noteVersion: TRANSLATION_NOTE_VERSION,
  });
  const generatedAt = new Date().toISOString();
  const contentHash = buildContentHash(translation);
  const failureReason = gate.failures.join("; ");
  const generationData = buildEnglishGenerationData({
    translation,
    source: normalizedSource,
    sourceVersion,
    contentHash,
    status: gate.passed ? ENGLISH_GENERATION_MANAGED_PUBLISHED : ENGLISH_GENERATION_FAILED,
    gateResults: gate,
    editAttempts,
    failureReason,
    generatedAt,
  });

  if (!gate.passed && existing?.status === "published") {
    return {
      sourceId: normalizedSource.id,
      sourceSlug: normalizedSource.slug,
      status: "regeneration_failed_existing_preserved",
      existingId: existing.id,
      failures: gate.failures,
      editAttempts,
    };
  }

  const written = await writeEnglishCandidate({
    client,
    existing,
    source: normalizedSource,
    data: generationData,
    seo: buildEnglishGenerationSeo({ source: normalizedSource, translation, existing }),
    slug: resolveEnglishSlug(normalizedSource),
  });

  if (!gate.passed) {
    return {
      sourceId: normalizedSource.id,
      sourceSlug: normalizedSource.slug,
      status: "candidate_failed",
      candidateId: written.id,
      failures: gate.failures,
      editAttempts,
    };
  }

  await publishEnglishCandidate(client, written.id, normalizedSource.publishedAt);
  const verified = await verifyPublishedEnglishTranslation(client, normalizedSource.id, written.id, {
    expectedPublishedAt: normalizedSource.publishedAt,
    expectedSlug: resolveEnglishSlug(normalizedSource),
  });

  return {
    sourceId: normalizedSource.id,
    sourceSlug: normalizedSource.slug,
    status: "published",
    englishId: verified.item.id,
    englishSlug: verified.item.slug,
    sourceVersion,
    editAttempts,
  };
}

function parseArgs(args: string[], env: NodeJS.ProcessEnv): CliOptions {
  return resolveOptions(resolveHostCliValues(englishGenerationArgs, args) as EnglishGenerationCliValues, env);
}

function resolveOptions(values: EnglishGenerationCliValues, env: NodeJS.ProcessEnv): CliOptions {
  const connection = resolveEmDashConnectionOptions(values, env);
  const model = readOptionalString(values.model) ?? readOptionalString(env.ENGLISH_GENERATION_MODEL);
  const editModel = readOptionalString(values.editModel) ?? readOptionalString(env.ENGLISH_EDIT_MODEL) ?? model;
  const reviewModel = readOptionalString(values.reviewModel) ?? readOptionalString(env.ENGLISH_REVIEW_MODEL) ?? model;
  const options: CliOptions = {
    ...connection,
    providerApiKey: readOptionalString(values.providerApiKey) ?? readOptionalString(env.ENGLISH_GENERATION_API_KEY),
    cfAiGatewayAccountId: readOptionalString(values.cfAigAccountId) ?? readOptionalString(env.CF_AIG_ACCOUNT_ID),
    cfAiGatewayGateway: readOptionalString(values.cfAigGateway) ?? readOptionalString(env.CF_AIG_GATEWAY),
    cfAiGatewayToken: readOptionalString(values.cfAigToken) ?? readOptionalString(env.CF_AIG_TOKEN),
    model,
    editModel,
    reviewModel,
    source: readOptionalString(values.source),
    limit: values.limit ?? readNumberEnv(env.ENGLISH_GENERATION_LIMIT) ?? DEFAULT_LIMIT,
    maxFixAttempts:
      values.maxFixAttempts ?? readNumberEnv(env.ENGLISH_GENERATION_MAX_FIX_ATTEMPTS) ?? DEFAULT_MAX_FIX_ATTEMPTS,
    regenerate: values.regenerate ?? false,
    force: values.force ?? false,
    dryRun: values.dryRun ?? false,
    temperature: values.temperature ?? readNumberEnv(env.ENGLISH_GENERATION_TEMPERATURE),
  };

  if (!Number.isInteger(options.limit) || options.limit < 1) {
    throw new Error("--limit must be a positive integer");
  }
  if (!Number.isInteger(options.maxFixAttempts) || options.maxFixAttempts < 0 || options.maxFixAttempts > 3) {
    throw new Error("--max-fix-attempts must be an integer between 0 and 3");
  }
  if (
    options.temperature !== undefined &&
    (!Number.isFinite(options.temperature) || options.temperature < 0 || options.temperature > 2)
  ) {
    throw new Error("--temperature must be between 0 and 2");
  }
  if (!options.dryRun) {
    if (!options.providerApiKey) throw new Error("Set ENGLISH_GENERATION_API_KEY or pass --provider-api-key");
    if (!options.cfAiGatewayAccountId) throw new Error("Set CF_AIG_ACCOUNT_ID or pass --cf-aig-account-id");
    if (!options.cfAiGatewayGateway) throw new Error("Set CF_AIG_GATEWAY or pass --cf-aig-gateway");
    if (!options.cfAiGatewayToken) throw new Error("Set CF_AIG_TOKEN or pass --cf-aig-token");
    if (!options.model) throw new Error("Set ENGLISH_GENERATION_MODEL or pass --model");
    if (!options.editModel) throw new Error("Set ENGLISH_EDIT_MODEL or pass --edit-model");
    if (!options.reviewModel) throw new Error("Set ENGLISH_REVIEW_MODEL or pass --review-model");
  }

  return options;
}

function readNumberEnv(value: string | undefined): number | undefined {
  const normalized = readOptionalString(value);
  return normalized === undefined ? undefined : Number(normalized);
}

function createEnglishGenerationProvider(options: CliOptions): EnglishGenerationProvider {
  const aigateway = createAiGateway({
    accountId: requireConfigured(options.cfAiGatewayAccountId, "CF_AIG_ACCOUNT_ID or pass --cf-aig-account-id"),
    gateway: requireConfigured(options.cfAiGatewayGateway, "CF_AIG_GATEWAY or pass --cf-aig-gateway"),
    apiKey: requireConfigured(options.cfAiGatewayToken, "CF_AIG_TOKEN or pass --cf-aig-token"),
  });
  const provider = createOpenRouter({
    apiKey: requireConfigured(options.providerApiKey, "ENGLISH_GENERATION_API_KEY or pass --provider-api-key"),
  });

  return {
    translationModel: aigateway(provider(requireConfigured(options.model, "ENGLISH_GENERATION_MODEL or pass --model"))),
    editModel: aigateway(provider(requireConfigured(options.editModel, "ENGLISH_EDIT_MODEL or pass --edit-model"))),
    reviewModel: aigateway(
      provider(requireConfigured(options.reviewModel, "ENGLISH_REVIEW_MODEL or pass --review-model")),
    ),
    temperature: options.temperature,
  };
}

function requireConfigured(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Set ${label}`);
  }
  return value;
}

async function translatePost(
  provider: EnglishGenerationProvider,
  source: NormalizedSourcePost,
): Promise<TranslationPayload> {
  const prompt = buildTranslationPrompt(source);
  const { output } = await generateText({
    model: provider.translationModel,
    system: prompt.system,
    messages: prompt.messages,
    output: Output.object({
      schema: translationPayloadSchema,
      name: "englishTranslation",
      description: "English translation of a Japanese personal blog post.",
    }),
    temperature: provider.temperature,
  });
  return normalizeTranslationPayload(output);
}

async function editTranslation(
  provider: EnglishGenerationProvider,
  source: NormalizedSourcePost,
  translation: TranslationPayload,
  review: ReviewPayload,
  attempt: number,
): Promise<TranslationEditPayload> {
  const prompt = buildTranslationEditPrompt({ source, translation, review, attempt });
  const result = await generateText({
    model: provider.editModel,
    system: prompt.system,
    messages: prompt.messages,
    tools: {
      editTranslation: tool({
        description:
          "Return minimal exact diff edits for an English translation. Each edit replaces oldText with newText in one field.",
        inputSchema: translationEditPayloadSchema,
        execute: async (input) => input,
      }),
    },
    toolChoice: { type: "tool", toolName: "editTranslation" },
    temperature: provider.temperature,
  });
  const editOutput = result.toolResults.find((toolResult) => toolResult.toolName === "editTranslation")?.output;
  if (!editOutput) {
    throw new Error("editTranslation tool was not called");
  }
  return translationEditPayloadSchema.parse(editOutput);
}

async function reviewTranslation(
  provider: EnglishGenerationProvider,
  source: NormalizedSourcePost,
  translation: TranslationPayload,
): Promise<ReviewPayload> {
  const prompt = buildReviewPrompt(source, translation);
  const { output } = await generateText({
    model: provider.reviewModel,
    system: prompt.system,
    messages: prompt.messages,
    output: Output.object({
      schema: reviewPayloadSchema,
      name: "englishTranslationReview",
      description: "Automated publication review for an English translation of a Japanese blog post.",
    }),
    temperature: provider.temperature,
  });
  return output;
}

async function getExistingEnglishTranslation(client: Client, sourceId: string): Promise<ContentItemWithSeo | null> {
  const result = await client.translations(POSTS_COLLECTION, sourceId);
  const english = result.translations.find((translation) => translation.locale === ENGLISH_LOCALE);
  return english ? ((await client.get(POSTS_COLLECTION, english.id, { raw: true })) as ContentItemWithSeo) : null;
}

async function writeEnglishCandidate({
  client,
  existing,
  source,
  data,
  seo,
  slug,
}: {
  client: Client;
  existing: ContentItemWithSeo | null;
  source: NormalizedSourcePost;
  data: JsonRecord;
  seo?: ContentSeoInput;
  slug: string;
}): Promise<ContentItem> {
  if (existing) {
    return updateContent(client, existing.id, { data, seo, slug, _rev: requireExistingRevision(existing) });
  }
  const input: Parameters<Client["create"]>[1] & { seo?: ContentSeoInput } = {
    data,
    slug,
    locale: ENGLISH_LOCALE,
    translationOf: source.id,
    ...(seo ? { seo } : {}),
  };
  return client.create(POSTS_COLLECTION, input);
}

async function updateContent(
  client: Client,
  id: string,
  input: { data?: JsonRecord; publishedAt?: string; seo?: ContentSeoInput; slug?: string; _rev?: string },
): Promise<ContentItem> {
  const result = await emdashRequest<{ item: ContentItem; _rev?: string }>(
    client,
    "PUT",
    `/content/${encodeURIComponent(POSTS_COLLECTION)}/${encodeURIComponent(id)}`,
    input,
  );
  if (result._rev) {
    result.item._rev = result._rev;
  }
  return result.item;
}

function requireExistingRevision(existing: ContentItemWithSeo): string {
  if (!existing._rev) {
    throw new Error(`Existing English translation ${existing.id} is missing _rev; refusing blind write`);
  }
  return existing._rev;
}

function shouldRepairLinkedEnglish(classification: {
  action: "create" | "update" | "skip";
  reasonCode: string;
}): boolean {
  return (
    classification.action === "skip" &&
    (classification.reasonCode === "already_published" || classification.reasonCode === "source_changed")
  );
}

async function publishEnglishCandidate(client: Client, id: string, publishedAt: string): Promise<void> {
  await emdashRequest<unknown>(
    client,
    "POST",
    `/content/${encodeURIComponent(POSTS_COLLECTION)}/${encodeURIComponent(id)}/publish`,
    { publishedAt },
  );
}

async function emdashRequest<T>(client: Client, method: string, path: string, body?: unknown): Promise<T> {
  const request = (
    client as unknown as { request<TResponse>(method: string, path: string, body?: unknown): Promise<TResponse> }
  ).request;
  return request.call(client, method, path, body) as Promise<T>;
}

function resolveEnglishSlug(source: NormalizedSourcePost): string {
  return source.slug;
}

function shouldRepairEnglishSlug({
  existing,
  source,
}: {
  existing: { slug?: string | null };
  source: NormalizedSourcePost;
}): boolean {
  return existing.slug !== resolveEnglishSlug(source);
}

function buildLinkedEnglishRepair({
  existing,
  source,
}: {
  existing: { slug?: string | null; publishedAt?: string | null; data?: unknown; seo?: unknown };
  source: NormalizedSourcePost;
}): {
  needsRepair: boolean;
  reasons: string[];
  update: { data?: JsonRecord; publishedAt?: string; seo?: ContentSeoInput; slug?: string };
} {
  const data = asRecord(existing.data);
  const existingSeo = asRecord(existing.seo);
  const dataPatch: JsonRecord = {};
  const seoPatch: ContentSeoInput = {};
  const reasons: string[] = [];
  const slugMismatch = shouldRepairEnglishSlug({ existing, source });
  const publishedAtMismatch = existing.publishedAt !== source.publishedAt;

  if (slugMismatch) {
    dataPatch.english_generation_source_slug = resolveEnglishSlug(source);
    reasons.push("slug");
  }
  if (publishedAtMismatch) {
    reasons.push("publishedAt");
  }
  if (!source.description && getStringField(data, "description")) {
    dataPatch.description = null;
    reasons.push("description");
  }

  const existingTitle = getStringField(data, "title");
  const existingSeoTitle = getStringField(existingSeo, "title");
  if (source.seoTitle && existingTitle && existingSeoTitle !== existingTitle) {
    seoPatch.title = existingTitle;
    reasons.push("seo.title");
  } else if (!source.seoTitle && existingSeoTitle) {
    seoPatch.title = null;
    reasons.push("seo.title");
  }

  const existingSeoDescription = getStringField(existingSeo, "description");
  if (!source.seoDescription && existingSeoDescription) {
    seoPatch.description = null;
    reasons.push("seo.description");
  }

  const update = removeUndefinedFields({
    ...(slugMismatch ? { slug: resolveEnglishSlug(source) } : {}),
    ...(publishedAtMismatch ? { publishedAt: source.publishedAt } : {}),
    ...(Object.keys(dataPatch).length > 0 ? { data: dataPatch } : {}),
    ...(Object.keys(seoPatch).length > 0 ? { seo: seoPatch } : {}),
  }) as { data?: JsonRecord; publishedAt?: string; seo?: ContentSeoInput; slug?: string };

  return {
    needsRepair: reasons.length > 0,
    reasons,
    update,
  };
}

async function verifyPublishedEnglishTranslation(
  client: Client,
  sourceId: string,
  englishId: string,
  options: { expectedPublishedAt: string; expectedSlug: string },
): Promise<{ item: ContentItem; translations: Awaited<ReturnType<Client["translations"]>> }> {
  const [item, translations] = await Promise.all([
    client.get(POSTS_COLLECTION, englishId, { raw: true }),
    client.translations(POSTS_COLLECTION, sourceId),
  ]);
  if (item.status !== "published") {
    throw new Error(`English translation ${englishId} was not published`);
  }
  if (item.locale !== ENGLISH_LOCALE) {
    throw new Error(`English translation ${englishId} locale is ${item.locale ?? "null"}`);
  }
  if (item.publishedAt !== options.expectedPublishedAt) {
    throw new Error(
      `English translation ${englishId} publishedAt is ${item.publishedAt ?? "null"}, expected ${options.expectedPublishedAt}`,
    );
  }
  if (item.slug !== options.expectedSlug) {
    throw new Error(
      `English translation ${englishId} slug is ${item.slug ?? "null"}, expected ${options.expectedSlug}`,
    );
  }

  const hasLinkedEnglish = translations.translations.some(
    (translation) => translation.id === englishId && translation.locale === ENGLISH_LOCALE,
  );
  if (!hasLinkedEnglish) {
    throw new Error(`English translation ${englishId} is not linked to source ${sourceId}`);
  }

  return { item, translations };
}

function buildSourceVersion(source: NormalizedSourcePost): string {
  return sha256({
    source: {
      id: source.id,
      slug: source.slug,
      updatedAt: source.updatedAt,
      title: source.title,
      description: source.description,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      contentMarkdown: source.contentMarkdown,
    },
    promptVersion: TRANSLATION_PROMPT_VERSION,
    reviewVersion: REVIEW_PROMPT_VERSION,
    editVersion: EDIT_PROMPT_VERSION,
    noteVersion: TRANSLATION_NOTE_VERSION,
  });
}

function buildContentHash(data: unknown): string {
  const record = asRecord(data);
  const contentData = asRecord(record.data ?? data);
  const seo = asRecord(record.seo);
  return sha256({
    title: getStringField(contentData, "title"),
    description: getStringField(contentData, "description"),
    seoDescription: getStringField(contentData, "seoDescription") || getStringField(seo, "description"),
    contentMarkdown: getContentMarkdown(contentData),
  });
}

function serializeError(error: unknown): { message: string; details?: JsonRecord } {
  const message = error instanceof Error ? error.message : String(error);
  const apiError = findApiCallError(error);
  if (!apiError) {
    return { message };
  }

  return {
    message,
    details: removeUndefinedFields({
      type: "APICallError",
      statusCode: apiError.statusCode,
      isRetryable: apiError.isRetryable,
      url: apiError.url,
      responseBody: parseProviderResponseBody(apiError.responseBody),
    }),
  };
}

function findApiCallError(error: unknown): InstanceType<typeof APICallError> | null {
  let current: unknown = error;
  const seen = new Set<unknown>();

  while (current && typeof current === "object" && !seen.has(current)) {
    if (APICallError.isInstance(current)) {
      return current;
    }
    seen.add(current);
    current = "cause" in current ? current.cause : undefined;
  }

  return null;
}

function parseProviderResponseBody(responseBody: string | undefined): unknown {
  if (!responseBody) return undefined;
  try {
    return JSON.parse(responseBody) as unknown;
  } catch {
    return responseBody.length > 2000 ? `${responseBody.slice(0, 2000)}...` : responseBody;
  }
}

function removeUndefinedFields(fields: JsonRecord): JsonRecord {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
}

function sha256(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

export const testInternals = {
  buildContentHash,
  buildLinkedEnglishRepair,
  buildSourceVersion: (item: ContentItemLike) => buildSourceVersion(normalizeSourcePost(item)),
  parseArgs,
  resolveEnglishSlug,
  serializeError,
  shouldRepairEnglishSlug,
  verifyPublishedEnglishTranslation,
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2), process.env).catch((error) => {
    console.error(JSON.stringify({ ok: false, error: formatCliError(error) }));
    process.exit(1);
  });
}
