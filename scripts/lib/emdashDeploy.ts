import { z } from "zod";

const COLLECTION_SUPPORT_VALUES = ["drafts", "revisions", "preview", "scheduling", "search", "seo"] as const;
const FIELD_TYPE_VALUES = [
  "string",
  "text",
  "url",
  "number",
  "integer",
  "boolean",
  "datetime",
  "select",
  "multiSelect",
  "portableText",
  "image",
  "file",
  "reference",
  "json",
  "slug",
  "repeater",
] as const;
const COLLECTION_SOURCE_SEED = "seed";
const SUPPORTED_TOP_LEVEL_SEED_KEYS = new Set(["$schema", "version", "meta", "settings", "collections", "content"]);
const SETTINGS_KEYS = [
  "title",
  "tagline",
  "logo",
  "favicon",
  "url",
  "postsPerPage",
  "dateFormat",
  "timezone",
  "social",
  "seo",
] as const;
const COLLECTION_UPDATE_KEYS = [
  "label",
  "labelSingular",
  "description",
  "icon",
  "supports",
  "urlPattern",
  "hasSeo",
  "commentsEnabled",
  "commentsModeration",
  "commentsClosedAfterDays",
  "commentsAutoApproveUsers",
] as const;
const FIELD_UPDATE_KEYS = [
  "label",
  "required",
  "unique",
  "defaultValue",
  "validation",
  "widget",
  "options",
  "searchable",
  "translatable",
] as const;

const mediaReferenceSchema = z
  .object({
    mediaId: z.string(),
    alt: z.string().optional(),
  })
  .strict();
const settingsSchema = z
  .object({
    title: z.string().optional(),
    tagline: z.string().optional(),
    logo: mediaReferenceSchema.optional(),
    favicon: mediaReferenceSchema.optional(),
    url: z.string().optional(),
    postsPerPage: z.number().int().min(1).max(100).optional(),
    dateFormat: z.string().optional(),
    timezone: z.string().optional(),
    social: z
      .object({
        twitter: z.string().optional(),
        github: z.string().optional(),
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        linkedin: z.string().optional(),
        youtube: z.string().optional(),
      })
      .strict()
      .optional(),
    seo: z
      .object({
        titleSeparator: z.string().max(10).optional(),
        defaultOgImage: mediaReferenceSchema.optional(),
        robotsTxt: z.string().max(5000).optional(),
        googleVerification: z.string().max(100).optional(),
        bingVerification: z.string().max(100).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
const repeaterSubFieldSchema = z
  .object({
    slug: z.string().min(1),
    type: z.enum(["string", "text", "url", "number", "integer", "boolean", "datetime", "select"]),
    label: z.string().min(1),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
  })
  .strict();
const fieldValidationSchema = z
  .object({
    required: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(0).optional(),
    pattern: z.string().optional(),
    options: z.array(z.string()).optional(),
    subFields: z.array(repeaterSubFieldSchema).min(1).optional(),
    minItems: z.number().int().min(0).optional(),
    maxItems: z.number().int().min(1).optional(),
  })
  .strict();
const seedFieldSchema = z
  .object({
    slug: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(FIELD_TYPE_VALUES),
    required: z.boolean().optional(),
    unique: z.boolean().optional(),
    defaultValue: z.unknown().optional(),
    validation: fieldValidationSchema.optional(),
    widget: z.string().optional(),
    options: z.record(z.string(), z.unknown()).optional(),
    searchable: z.boolean().optional(),
    translatable: z.boolean().optional(),
  })
  .strict();
const seedCollectionSchema = z
  .object({
    slug: z.string().min(1),
    label: z.string().min(1),
    labelSingular: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    supports: z.array(z.enum(COLLECTION_SUPPORT_VALUES)).optional(),
    urlPattern: z.string().optional(),
    hasSeo: z.boolean().optional(),
    commentsEnabled: z.boolean().optional(),
    commentsModeration: z.enum(["all", "first_time", "none"]).optional(),
    commentsClosedAfterDays: z.number().int().min(0).optional(),
    commentsAutoApproveUsers: z.boolean().optional(),
    fields: z.array(seedFieldSchema),
  })
  .strict();
const seedSchema = z
  .object({
    $schema: z.string().optional(),
    version: z.string().optional(),
    meta: z.unknown().optional(),
    settings: settingsSchema.optional(),
    collections: z.array(seedCollectionSchema).default([]),
    content: z.record(z.string(), z.array(z.unknown())).optional(),
  })
  .catchall(z.unknown());

type CollectionSupport = (typeof COLLECTION_SUPPORT_VALUES)[number];
type FieldType = (typeof FIELD_TYPE_VALUES)[number];
type JsonRecord = Record<string, unknown>;

export type SiteSettings = z.infer<typeof settingsSchema>;

export type DesiredField = {
  slug: string;
  label: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  defaultValue?: unknown;
  validation?: unknown;
  widget?: string;
  options?: unknown;
  searchable: boolean;
  translatable: boolean;
  sortOrder: number;
};

export type DesiredCollection = {
  slug: string;
  label: string;
  labelSingular?: string;
  description?: string;
  icon?: string;
  supports: CollectionSupport[];
  urlPattern?: string;
  hasSeo: boolean;
  commentsEnabled?: boolean;
  commentsModeration?: "all" | "first_time" | "none";
  commentsClosedAfterDays?: number;
  commentsAutoApproveUsers?: boolean;
  fields: DesiredField[];
};

export type ExistingField = DesiredField & {
  id?: string;
  collectionId?: string;
  columnType?: string;
  createdAt?: string;
};

export type ExistingCollection = Omit<DesiredCollection, "fields"> & {
  id?: string;
  source?: string;
  commentsEnabled: boolean;
  commentsModeration?: "all" | "first_time" | "none";
  commentsClosedAfterDays?: number;
  commentsAutoApproveUsers?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ExistingCollectionWithFields = ExistingCollection & {
  fields: ExistingField[];
};

export type DeployableState = {
  settings?: SiteSettings;
  collections: DesiredCollection[];
};

export type UnsupportedDeployOperation = {
  target: string;
  reason: string;
};

export type DeployChange =
  | {
      action: "settings.update";
      before: SiteSettings;
      after: SiteSettings;
    }
  | {
      action: "collection.create";
      collection: string;
      after: DesiredCollection;
    }
  | {
      action: "collection.update";
      collection: string;
      before: Partial<ExistingCollection>;
      after: Partial<DesiredCollection>;
    }
  | {
      action: "field.create";
      collection: string;
      field: string;
      after: DesiredField;
    }
  | {
      action: "field.update";
      collection: string;
      field: string;
      before: Partial<ExistingField>;
      after: Partial<DesiredField>;
    }
  | {
      action: "field.reorder";
      collection: string;
      before: string[];
      after: string[];
    };

export type DeploymentPlan = {
  ok: boolean;
  changes: DeployChange[];
  unsupported: UnsupportedDeployOperation[];
  summary: DeploymentSummary;
};

export type DeploymentSummary = {
  total: number;
  byAction: Record<string, number>;
};

export type DeploymentApplyResult = DeploymentPlan & {
  applied: boolean;
  verification: DeploymentPlan;
};

export type EmDashDeployApi = {
  getSettings(): Promise<SiteSettings>;
  updateSettings(settings: SiteSettings): Promise<SiteSettings>;
  listCollections(): Promise<ExistingCollection[]>;
  getCollection(slug: string): Promise<ExistingCollectionWithFields | null>;
  createCollection(input: DesiredCollection): Promise<ExistingCollectionWithFields>;
  updateCollection(
    slug: string,
    input: Partial<Omit<ExistingCollection, "slug">>,
  ): Promise<ExistingCollectionWithFields>;
  createField(collectionSlug: string, input: DesiredField): Promise<void>;
  updateField(collectionSlug: string, fieldSlug: string, input: Partial<DesiredField>): Promise<void>;
  reorderFields(collectionSlug: string, fieldSlugs: string[]): Promise<void>;
};

export type JsonEmDashApiClient = {
  request<T>(method: string, path: string, body?: unknown): Promise<T>;
};

export class UnsupportedDeployableStateError extends Error {
  readonly unsupported: UnsupportedDeployOperation[];

  constructor(unsupported: UnsupportedDeployOperation[]) {
    super(unsupported.map((item) => `${item.target}: ${item.reason}`).join("; "));
    this.name = "UnsupportedDeployableStateError";
    this.unsupported = unsupported;
  }
}

export function buildDeployableState(seedInput: unknown): DeployableState {
  const seed = seedSchema.parse(seedInput);
  const unsupported = findUnsupportedSeedSections(seed);
  if (unsupported.length > 0) {
    throw new UnsupportedDeployableStateError(unsupported);
  }

  return {
    ...(seed.settings ? { settings: seed.settings } : {}),
    collections: seed.collections.map((collection) => ({
      ...removeUndefinedFields({
        slug: collection.slug,
        label: collection.label,
        labelSingular: collection.labelSingular,
        description: collection.description,
        icon: collection.icon,
        supports: collection.supports ?? [],
        urlPattern: collection.urlPattern,
        hasSeo: collection.hasSeo ?? collection.supports?.includes("seo") ?? false,
        commentsEnabled: collection.commentsEnabled,
        commentsModeration: collection.commentsModeration,
        commentsClosedAfterDays: collection.commentsClosedAfterDays,
        commentsAutoApproveUsers: collection.commentsAutoApproveUsers,
      }),
      fields: collection.fields.map((field, index) => ({
        ...removeUndefinedFields({
          slug: field.slug,
          label: field.label,
          type: field.type,
          required: field.required ?? false,
          unique: field.unique ?? false,
          defaultValue: field.defaultValue,
          validation: field.validation,
          widget: field.widget,
          options: field.options,
          searchable: field.searchable ?? false,
          translatable: field.translatable ?? true,
          sortOrder: index,
        }),
      })),
    })),
  };
}

export async function planEmDashDeployment(api: EmDashDeployApi, desired: DeployableState): Promise<DeploymentPlan> {
  const changes: DeployChange[] = [];
  const unsupported: UnsupportedDeployOperation[] = [];
  if (desired.settings) {
    const currentSettings = await api.getSettings();
    const settingsChange = buildSettingsChange(currentSettings, desired.settings);
    if (settingsChange) changes.push(settingsChange);
  }

  const existingCollections = new Map((await api.listCollections()).map((collection) => [collection.slug, collection]));
  for (const desiredCollection of desired.collections) {
    if (!existingCollections.has(desiredCollection.slug)) {
      changes.push({
        action: "collection.create",
        collection: desiredCollection.slug,
        after: desiredCollection,
      });
      for (const field of desiredCollection.fields) {
        changes.push({
          action: "field.create",
          collection: desiredCollection.slug,
          field: field.slug,
          after: field,
        });
      }
      continue;
    }

    const existingCollection = await api.getCollection(desiredCollection.slug);
    if (!existingCollection) {
      unsupported.push({
        target: `collection.${desiredCollection.slug}`,
        reason: "collection disappeared while building the deployment plan",
      });
      continue;
    }

    const collectionChange = buildCollectionChange(existingCollection, desiredCollection);
    if (collectionChange) changes.push(collectionChange);

    const existingFields = new Map(existingCollection.fields.map((field) => [field.slug, field]));
    for (const desiredField of desiredCollection.fields) {
      const existingField = existingFields.get(desiredField.slug);
      if (!existingField) {
        changes.push({
          action: "field.create",
          collection: desiredCollection.slug,
          field: desiredField.slug,
          after: desiredField,
        });
        continue;
      }
      if (existingField.type !== desiredField.type) {
        unsupported.push({
          target: `collection.${desiredCollection.slug}.field.${desiredField.slug}`,
          reason: `field type change is not supported through this script (${existingField.type} -> ${desiredField.type})`,
        });
        continue;
      }
      const fieldChange = buildFieldChange(desiredCollection.slug, existingField, desiredField);
      if (fieldChange) changes.push(fieldChange);
    }

    const reorderChange = buildFieldReorderChange(existingCollection, desiredCollection);
    if (reorderChange) changes.push(reorderChange);
  }

  if (unsupported.length > 0) {
    return { ok: false, changes: [], unsupported, summary: summarizeChanges([]) };
  }
  return { ok: true, changes, unsupported: [], summary: summarizeChanges(changes) };
}

export async function applyEmDashDeploymentPlan(
  api: EmDashDeployApi,
  desired: DeployableState,
  plan: DeploymentPlan,
): Promise<DeploymentApplyResult> {
  if (!plan.ok) {
    return {
      ...plan,
      applied: false,
      verification: plan,
    };
  }

  for (const change of plan.changes) {
    await applyDeployChange(api, change);
  }

  const verification = await planEmDashDeployment(api, desired);
  return {
    ok: verification.ok && verification.changes.length === 0,
    changes: plan.changes,
    unsupported: verification.unsupported,
    summary: summarizeChanges(plan.changes),
    applied: true,
    verification,
  };
}

export function createEmDashDeployApi(client: JsonEmDashApiClient): EmDashDeployApi {
  return {
    getSettings: () => client.request<SiteSettings>("GET", "/settings"),
    updateSettings: (settings) => client.request<SiteSettings>("POST", "/settings", settings),
    async listCollections() {
      const response = await client.request<{ items: ExistingCollection[] }>("GET", "/schema/collections");
      return response.items;
    },
    async getCollection(slug) {
      try {
        const response = await client.request<{ item: ExistingCollectionWithFields }>(
          "GET",
          `/schema/collections/${encodeURIComponent(slug)}?includeFields=true`,
        );
        return response.item;
      } catch (error) {
        if (isNotFoundError(error)) return null;
        throw error;
      }
    },
    async createCollection(input) {
      const response = await client.request<{ item: ExistingCollectionWithFields }>("POST", "/schema/collections", {
        ...collectionMutationInput(input),
        source: COLLECTION_SOURCE_SEED,
      });
      return { ...response.item, fields: [] };
    },
    async updateCollection(slug, input) {
      const response = await client.request<{ item: ExistingCollectionWithFields }>(
        "PUT",
        `/schema/collections/${encodeURIComponent(slug)}`,
        input,
      );
      return { ...response.item, fields: [] };
    },
    async createField(collectionSlug, input) {
      await client.request<{ item: ExistingField }>(
        "POST",
        `/schema/collections/${encodeURIComponent(collectionSlug)}/fields`,
        fieldMutationInput(input),
      );
    },
    async updateField(collectionSlug, fieldSlug, input) {
      await client.request<{ item: ExistingField }>(
        "PUT",
        `/schema/collections/${encodeURIComponent(collectionSlug)}/fields/${encodeURIComponent(fieldSlug)}`,
        fieldMutationInput(input),
      );
    },
    async reorderFields(collectionSlug, fieldSlugs) {
      await client.request<{ success: boolean }>(
        "POST",
        `/schema/collections/${encodeURIComponent(collectionSlug)}/fields/reorder`,
        { fieldSlugs },
      );
    },
  };
}

function buildSettingsChange(current: SiteSettings, desired: SiteSettings): DeployChange | null {
  const before: SiteSettings = {};
  const after: SiteSettings = {};
  for (const key of SETTINGS_KEYS) {
    if (!(key in desired)) continue;
    if (!deepEqual(current[key], desired[key])) {
      before[key] = current[key] as never;
      after[key] = desired[key] as never;
    }
  }
  return Object.keys(after).length > 0
    ? {
        action: "settings.update",
        before: stripUndefined(before) as SiteSettings,
        after: stripUndefined(after) as SiteSettings,
      }
    : null;
}

function buildCollectionChange(
  current: ExistingCollection,
  desired: DesiredCollection,
): Extract<DeployChange, { action: "collection.update" }> | null {
  const before: Partial<ExistingCollection> = {};
  const after: Partial<DesiredCollection> = {};
  const normalizedCurrent = normalizeCollectionForCompare(current);
  const normalizedDesired = normalizeCollectionForCompare(desired);
  for (const key of COLLECTION_UPDATE_KEYS) {
    if (!(key in normalizedDesired)) continue;
    if (!deepEqual(normalizedCurrent[key], normalizedDesired[key])) {
      before[key] = normalizedCurrent[key] as never;
      after[key] = normalizedDesired[key] as never;
    }
  }
  return Object.keys(after).length > 0
    ? { action: "collection.update", collection: desired.slug, before, after }
    : null;
}

function buildFieldChange(
  collection: string,
  current: ExistingField,
  desired: DesiredField,
): Extract<DeployChange, { action: "field.update" }> | null {
  const before: Partial<ExistingField> = {};
  const after: Partial<DesiredField> = {};
  const normalizedCurrent = normalizeFieldForCompare(current);
  const normalizedDesired = normalizeFieldForCompare(desired);
  for (const key of FIELD_UPDATE_KEYS) {
    if (!deepEqual(normalizedCurrent[key], normalizedDesired[key])) {
      before[key] = normalizedCurrent[key] as never;
      after[key] = normalizedDesired[key] as never;
    }
  }
  return Object.keys(after).length > 0
    ? { action: "field.update", collection, field: desired.slug, before, after }
    : null;
}

function buildFieldReorderChange(
  current: ExistingCollectionWithFields,
  desired: DesiredCollection,
): Extract<DeployChange, { action: "field.reorder" }> | null {
  const desiredSlugs = desired.fields.map((field) => field.slug);
  const desiredSet = new Set(desiredSlugs);
  const remoteOnlySlugs = current.fields
    .filter((field) => !desiredSet.has(field.slug))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((field) => field.slug);
  const after = [...desiredSlugs, ...remoteOnlySlugs];
  const before = [...current.fields].sort((a, b) => a.sortOrder - b.sortOrder).map((field) => field.slug);
  return arrayEqual(before, after) ? null : { action: "field.reorder", collection: desired.slug, before, after };
}

async function applyDeployChange(api: EmDashDeployApi, change: DeployChange): Promise<void> {
  switch (change.action) {
    case "settings.update":
      await api.updateSettings(change.after);
      break;
    case "collection.create":
      await api.createCollection(change.after);
      break;
    case "collection.update":
      await api.updateCollection(change.collection, change.after);
      break;
    case "field.create":
      await api.createField(change.collection, change.after);
      break;
    case "field.update":
      await api.updateField(change.collection, change.field, change.after);
      break;
    case "field.reorder":
      await api.reorderFields(change.collection, change.after);
      break;
  }
}

function findUnsupportedSeedSections(seed: z.infer<typeof seedSchema>): UnsupportedDeployOperation[] {
  const unsupported: UnsupportedDeployOperation[] = [];
  for (const [collection, items] of Object.entries(seed.content ?? {})) {
    if (items.length > 0) {
      unsupported.push({
        target: `content.${collection}`,
        reason: `content.${collection} contains ${items.length} item(s); content deployment is not in the supported API surface for this script`,
      });
    }
  }

  const seedRecord = seed as JsonRecord;
  for (const [key, value] of Object.entries(seedRecord)) {
    if (SUPPORTED_TOP_LEVEL_SEED_KEYS.has(key)) continue;
    if (!isEmptySeedSection(value)) {
      unsupported.push({
        target: key,
        reason: `top-level seed section "${key}" is not supported by this deployment script yet`,
      });
    }
  }
  return unsupported;
}

function isEmptySeedSection(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function collectionMutationInput(collection: DesiredCollection): Partial<DesiredCollection> & { slug: string } {
  return removeUndefinedFields({
    slug: collection.slug,
    label: collection.label,
    labelSingular: collection.labelSingular,
    description: collection.description,
    icon: collection.icon,
    supports: collection.supports,
    urlPattern: collection.urlPattern,
    hasSeo: collection.hasSeo,
    commentsEnabled: collection.commentsEnabled,
    commentsModeration: collection.commentsModeration,
    commentsClosedAfterDays: collection.commentsClosedAfterDays,
    commentsAutoApproveUsers: collection.commentsAutoApproveUsers,
  });
}

function fieldMutationInput(field: Partial<DesiredField>): Partial<DesiredField> {
  return removeUndefinedFields({
    slug: field.slug,
    label: field.label,
    type: field.type,
    required: field.required,
    unique: field.unique,
    defaultValue: field.defaultValue,
    validation: field.validation,
    widget: field.widget,
    options: field.options,
    searchable: field.searchable,
    translatable: field.translatable,
    sortOrder: field.sortOrder,
  });
}

function normalizeCollectionForCompare(collection: ExistingCollection | DesiredCollection): Partial<DesiredCollection> {
  return removeUndefinedFields({
    label: collection.label,
    labelSingular: collection.labelSingular,
    description: collection.description,
    icon: collection.icon,
    supports: [...collection.supports].sort(),
    urlPattern: collection.urlPattern,
    hasSeo: collection.hasSeo,
    commentsEnabled: collection.commentsEnabled,
    commentsModeration: collection.commentsModeration,
    commentsClosedAfterDays: collection.commentsClosedAfterDays,
    commentsAutoApproveUsers: collection.commentsAutoApproveUsers,
  });
}

function normalizeFieldForCompare(
  field: ExistingField | DesiredField,
): Omit<DesiredField, "slug" | "type" | "sortOrder"> {
  return removeUndefinedFields({
    label: field.label,
    required: field.required,
    unique: field.unique,
    defaultValue: field.defaultValue,
    validation: field.validation,
    widget: field.widget,
    options: field.options,
    searchable: field.searchable,
    translatable: field.translatable,
  }) as Omit<DesiredField, "slug" | "type" | "sortOrder">;
}

function summarizeChanges(changes: DeployChange[]): DeploymentSummary {
  return {
    total: changes.length,
    byAction: changes.reduce<Record<string, number>>((summary, change) => {
      summary[change.action] = (summary[change.action] ?? 0) + 1;
      return summary;
    }, {}),
  };
}

function isNotFoundError(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "status" in error && (error as { status?: unknown }).status === 404,
  );
}

function arrayEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function deepEqual(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right);
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefined(item)]),
    );
  }
  return value;
}

function removeUndefinedFields<T extends JsonRecord>(fields: T): T {
  return stripUndefined(fields) as T;
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
