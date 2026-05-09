import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyEmDashDeploymentPlan,
  buildDeployableState,
  type EmDashDeployApi,
  type ExistingCollectionWithFields,
  planEmDashDeployment,
  type SiteSettings,
} from "./emdashDeploy.ts";

test("buildDeployableState extracts settings and schema while rejecting content writes", () => {
  const desired = buildDeployableState({
    settings: { title: "shuymn.me" },
    collections: [
      {
        slug: "posts",
        label: "Posts",
        supports: ["drafts", "revisions", "search", "seo"],
        fields: [
          { slug: "title", label: "Title", type: "string", required: true, searchable: true },
          { slug: "content", label: "Content", type: "portableText", searchable: true },
        ],
      },
    ],
    content: {
      posts: [],
    },
  });

  assert.equal(desired.settings?.title, "shuymn.me");
  assert.equal(desired.collections[0]?.hasSeo, true);
  assert.deepEqual(
    desired.collections[0]?.fields.map((field) => ({
      slug: field.slug,
      required: field.required,
      searchable: field.searchable,
      translatable: field.translatable,
    })),
    [
      { slug: "title", required: true, searchable: true, translatable: true },
      { slug: "content", required: false, searchable: true, translatable: true },
    ],
  );

  assert.throws(
    () =>
      buildDeployableState({
        collections: [],
        content: {
          posts: [{ slug: "hello", data: { title: "Hello" } }],
        },
      }),
    /content.posts contains 1 item/,
  );
});

test("planEmDashDeployment plans settings, collection, field, and field order changes", async () => {
  const api = new InMemoryDeployApi({
    settings: { title: "Old title" },
    collections: [
      collection("posts", [
        field("content", "portableText", { label: "Body", searchable: false, sortOrder: 0 }),
        field("title", "string", { label: "Old Title", required: false, searchable: false, sortOrder: 1 }),
      ]),
    ],
  });
  const desired = buildDeployableState({
    settings: { title: "shuymn.me" },
    collections: [
      {
        slug: "posts",
        label: "Posts",
        supports: ["drafts", "revisions", "search", "seo"],
        fields: [
          { slug: "title", label: "Title", type: "string", required: true, searchable: true },
          { slug: "content", label: "Content", type: "portableText", searchable: true },
          { slug: "english_generation_status", label: "English Generation Status", type: "string" },
        ],
      },
    ],
  });

  const plan = await planEmDashDeployment(api, desired);

  assert.equal(plan.ok, true);
  assert.deepEqual(
    plan.changes.map((change) => change.action),
    ["settings.update", "collection.update", "field.update", "field.update", "field.create", "field.reorder"],
  );
  assert.equal(plan.summary.total, 6);
  assert.equal(plan.unsupported.length, 0);
});

test("planEmDashDeployment rejects immutable field type changes as unsupported", async () => {
  const api = new InMemoryDeployApi({
    collections: [collection("posts", [field("title", "text", { label: "Title", sortOrder: 0 })])],
  });
  const desired = buildDeployableState({
    collections: [
      {
        slug: "posts",
        label: "Posts",
        fields: [{ slug: "title", label: "Title", type: "string" }],
      },
    ],
  });

  const plan = await planEmDashDeployment(api, desired);

  assert.equal(plan.ok, false);
  assert.equal(plan.changes.length, 0);
  assert.match(plan.unsupported[0]?.reason ?? "", /field type change is not supported/);
});

test("applyEmDashDeploymentPlan writes through the API and verifies idempotency", async () => {
  const api = new InMemoryDeployApi({ settings: { title: "Old title" }, collections: [] });
  const desired = buildDeployableState({
    settings: { title: "shuymn.me" },
    collections: [
      {
        slug: "posts",
        label: "Posts",
        labelSingular: "Post",
        supports: ["drafts", "revisions", "search", "seo"],
        fields: [
          { slug: "title", label: "Title", type: "string", required: true, searchable: true },
          { slug: "content", label: "Content", type: "portableText", searchable: true },
        ],
      },
    ],
  });
  const plan = await planEmDashDeployment(api, desired);

  const result = await applyEmDashDeploymentPlan(api, desired, plan);

  assert.equal(result.ok, true);
  assert.deepEqual(
    api.calls.map((call) => call.action),
    ["updateSettings", "createCollection", "createField", "createField"],
  );

  const rerunPlan = await planEmDashDeployment(api, desired);
  assert.equal(rerunPlan.ok, true);
  assert.equal(rerunPlan.summary.total, 0);
  assert.equal(rerunPlan.changes.length, 0);
});

class InMemoryDeployApi implements EmDashDeployApi {
  calls: Array<{ action: string; args: unknown[] }> = [];
  private settings: SiteSettings;
  private readonly collections = new Map<string, ExistingCollectionWithFields>();

  constructor(input: { settings?: SiteSettings; collections?: ExistingCollectionWithFields[] }) {
    this.settings = structuredClone(input.settings ?? {});
    for (const collection of input.collections ?? []) {
      this.collections.set(collection.slug, structuredClone(collection));
    }
  }

  async getSettings(): Promise<SiteSettings> {
    return structuredClone(this.settings);
  }

  async updateSettings(settings: SiteSettings): Promise<SiteSettings> {
    this.calls.push({ action: "updateSettings", args: [structuredClone(settings)] });
    this.settings = { ...this.settings, ...structuredClone(settings) };
    return structuredClone(this.settings);
  }

  async listCollections(): Promise<ExistingCollectionWithFields[]> {
    return [...this.collections.values()].map((collection) => structuredClone(collection));
  }

  async getCollection(slug: string): Promise<ExistingCollectionWithFields | null> {
    return structuredClone(this.collections.get(slug) ?? null);
  }

  async createCollection(input: ExistingCollectionWithFields): Promise<ExistingCollectionWithFields> {
    this.calls.push({ action: "createCollection", args: [structuredClone(input)] });
    const created = { ...collection(input.slug, []), ...structuredClone(input), fields: [] };
    this.collections.set(input.slug, created);
    return structuredClone(created);
  }

  async updateCollection(
    slug: string,
    input: Partial<Omit<ExistingCollectionWithFields, "fields" | "slug">>,
  ): Promise<ExistingCollectionWithFields> {
    this.calls.push({ action: "updateCollection", args: [slug, structuredClone(input)] });
    const existing = this.requireCollection(slug);
    const updated = { ...existing, ...structuredClone(input) };
    this.collections.set(slug, updated);
    return structuredClone(updated);
  }

  async createField(collectionSlug: string, input: ExistingCollectionWithFields["fields"][number]): Promise<void> {
    this.calls.push({ action: "createField", args: [collectionSlug, structuredClone(input)] });
    const collection = this.requireCollection(collectionSlug);
    collection.fields.push(structuredClone(input));
    collection.fields.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async updateField(
    collectionSlug: string,
    fieldSlug: string,
    input: Partial<ExistingCollectionWithFields["fields"][number]>,
  ): Promise<void> {
    this.calls.push({ action: "updateField", args: [collectionSlug, fieldSlug, structuredClone(input)] });
    const collection = this.requireCollection(collectionSlug);
    const index = collection.fields.findIndex((existing) => existing.slug === fieldSlug);
    assert.notEqual(index, -1);
    const current = collection.fields[index];
    assert.ok(current);
    collection.fields[index] = { ...current, ...structuredClone(input) };
    collection.fields.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async reorderFields(collectionSlug: string, fieldSlugs: string[]): Promise<void> {
    this.calls.push({ action: "reorderFields", args: [collectionSlug, [...fieldSlugs]] });
    const collection = this.requireCollection(collectionSlug);
    const order = new Map(fieldSlugs.map((slug, index) => [slug, index]));
    for (const field of collection.fields) {
      field.sortOrder = order.get(field.slug) ?? field.sortOrder;
    }
    collection.fields.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private requireCollection(slug: string): ExistingCollectionWithFields {
    const collection = this.collections.get(slug);
    assert.ok(collection, `Missing collection ${slug}`);
    return collection;
  }
}

function collection(slug: string, fields: ExistingCollectionWithFields["fields"]): ExistingCollectionWithFields {
  return {
    slug,
    label: slug,
    supports: [],
    hasSeo: false,
    commentsEnabled: false,
    fields,
  };
}

function field(
  slug: string,
  type: ExistingCollectionWithFields["fields"][number]["type"],
  overrides: Partial<ExistingCollectionWithFields["fields"][number]> = {},
): ExistingCollectionWithFields["fields"][number] {
  return {
    slug,
    label: slug,
    type,
    required: false,
    unique: false,
    searchable: false,
    translatable: true,
    sortOrder: 0,
    ...overrides,
  };
}
